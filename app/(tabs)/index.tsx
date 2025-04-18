import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

// Заглушки для данных (в реальном приложении будут из Redux или Context)
import { useDashboardData } from '@/hooks/useDashboardData';
import { useColorScheme } from '@/hooks/useColorScheme';

// Константы для дизайн-системы
const COLORS = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    text: '#1A1A1A',
    secondaryText: '#6E6E6E',
    primary: '#E53935',
    success: '#4CAF50',
    warning: '#FF9800',
    separator: '#E0E0E0',
  },
  dark: {
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#F5F5F5',
    secondaryText: '#AAAAAA',
    primary: '#FF5252',
    success: '#66BB6A',
    warning: '#FFA726',
    separator: '#333333',
  },
};

// Базовые компоненты
const Card = ({ children, style }: { children: React.ReactNode, style?: any }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <View style={[
      styles.card, 
      { backgroundColor: colors.cardBackground },
      style
    ]}>
      {children}
    </View>
  );
};

const ProgressCircle = ({ 
  progress, 
  size = 80, 
  strokeWidth = 8,
  label
}: { 
  progress: number, 
  size?: number, 
  strokeWidth?: number,
  label: string
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <View style={styles.progressContainer}>
      <View style={styles.progressCircleWrapper}>
        <View style={[styles.backgroundCircle, { width: size, height: size }]} />
        <View style={styles.progressCircleContainer}>
          <View style={{ transform: [{ rotateZ: '-90deg' }] }}>
            <Svg width={size} height={size}>
              <Circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                stroke={colors.primary}
                strokeWidth={strokeWidth}
                strokeDasharray={`${circumference} ${circumference}`}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <View style={styles.progressTextContainer}>
            <Text style={[styles.progressText, { color: colors.text }]}>
              {`${Math.round(progress)}%`}
            </Text>
          </View>
        </View>
      </View>
      <Text style={[styles.progressLabel, { color: colors.secondaryText }]}>
        {label}
      </Text>
    </View>
  );
};

// Компоненты для секций Dashboard
const TaskItem = ({ 
  task, 
  onToggle 
}: { 
  task: { id: string, title: string, completed: boolean }, 
  onToggle: (id: string) => void 
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <TouchableOpacity 
      style={styles.taskItem}
      onPress={() => onToggle(task.id)}
      activeOpacity={0.8}
    >
      <View style={[
        styles.checkbox, 
        { borderColor: task.completed ? colors.success : colors.secondaryText }
      ]}>
        {task.completed && (
          <Ionicons 
            name="checkmark" 
            size={18} 
            color={colors.success} 
          />
        )}
      </View>
      <Text 
        style={[
          styles.taskText, 
          { 
            color: colors.text,
            textDecorationLine: task.completed ? 'line-through' : 'none',
            opacity: task.completed ? 0.7 : 1,
          }
        ]}
      >
        {task.title}
      </Text>
    </TouchableOpacity>
  );
};

// Моковая реализация SVG для демонстрации (в реальном приложении используйте react-native-svg)
const Svg = ({ children, width, height }: any) => (
  <View style={{ width, height }}>
    {children}
  </View>
);

const Circle = ({ cx, cy, r, stroke, strokeWidth, strokeDasharray, strokeDashoffset }: any) => (
  <View
    style={{
      width: r * 2,
      height: r * 2,
      borderRadius: r,
      borderWidth: strokeWidth,
      borderColor: stroke,
      position: 'absolute',
      top: cy - r,
      left: cx - r,
    }}
  />
);

const InsightCard = ({ title, text }: { title: string, text: string }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <Card style={styles.insightCard}>
      <View style={styles.insightHeader}>
        <Ionicons name="bulb-outline" size={20} color={colors.primary} />
        <Text style={[styles.insightTitle, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[styles.insightText, { color: colors.secondaryText }]}>
        {text}
      </Text>
    </Card>
  );
};

// Главный компонент Dashboard
export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const [refreshing, setRefreshing] = useState(false);
  
  // Получение данных (в реальном приложении из Redux)
  const { 
    dashboardData, 
    toggleTask, 
    loading, 
    refreshData 
  } = useDashboardData();
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };
  
  const navigateToMentor = () => {
    router.push('/(tabs)/mentor');
  };
  
  const navigateToOperations = () => {
    router.push('/(tabs)/operations');
  };

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        paddingTop: insets.top,
        paddingBottom: insets.bottom + 70, // Учитываем tab bar
      }
    ]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* Заголовок и аватар */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.text }]}>
              Привет, Берсерк
            </Text>
            <Text style={[styles.date, { color: colors.secondaryText }]}>
              {new Date().toLocaleDateString('ru-RU', { 
                weekday: 'long', 
                day: 'numeric', 
                month: 'long' 
              })}
            </Text>
          </View>
          
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => {/* Navigate to profile */}}
          >
            <LinearGradient
              colors={['#E53935', '#D32F2F']}
              style={styles.profileButtonGradient}
            >
              <Text style={styles.profileButtonText}>Б</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
        
        {/* Прогресс за неделю */}
        <Card>
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            Прогресс за неделю
          </Text>
          <View style={styles.progressRow}>
            <ProgressCircle 
              progress={dashboardData.weeklyProgress.tasks} 
              label="Задачи" 
            />
            <ProgressCircle 
              progress={dashboardData.weeklyProgress.habits} 
              label="Привычки" 
            />
            <ProgressCircle 
              progress={dashboardData.weeklyProgress.focus} 
              label="Фокус" 
            />
          </View>
        </Card>
        
        {/* Фокус дня */}
        <Card>
          <View style={styles.focusHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Фокус дня
            </Text>
            <TouchableOpacity 
              style={styles.infoButton}
              onPress={() => {/* Show focus info */}}
            >
              <Ionicons name="information-circle-outline" size={22} color={colors.secondaryText} />
            </TouchableOpacity>
          </View>
          <Text style={[styles.focusTitle, { color: colors.primary }]}>
            {dashboardData.dailyFocus.title}
          </Text>
          <Text style={[styles.focusDescription, { color: colors.secondaryText }]}>
            {dashboardData.dailyFocus.description}
          </Text>
          <View style={[styles.separator, { backgroundColor: colors.separator }]} />
          <TouchableOpacity 
            style={styles.mentorButton}
            onPress={navigateToMentor}
          >
            <Ionicons name="chatbubbles-outline" size={20} color={colors.primary} />
            <Text style={[styles.mentorButtonText, { color: colors.primary }]}>
              Обсудить с ментором
            </Text>
          </TouchableOpacity>
        </Card>
        
        {/* Задачи на сегодня */}
        <Card>
          <View style={styles.tasksHeader}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>
              Задачи на сегодня
            </Text>
            <TouchableOpacity 
              style={styles.viewAllButton}
              onPress={navigateToOperations}
            >
              <Text style={[styles.viewAllText, { color: colors.primary }]}>
                Все задачи
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
          
          {loading ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : dashboardData.tasks.length > 0 ? (
            <View style={styles.tasksList}>
              {dashboardData.tasks.slice(0, 5).map(task => (
                <TaskItem 
                  key={task.id} 
                  task={task} 
                  onToggle={toggleTask} 
                />
              ))}
              
              {dashboardData.tasks.length > 5 && (
                <TouchableOpacity
                  style={styles.moreTasksButton}
                  onPress={navigateToOperations}
                >
                  <Text style={[styles.moreTasksText, { color: colors.secondaryText }]}>
                    Ещё {dashboardData.tasks.length - 5} задач
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
              Нет задач на сегодня. Добавьте их в разделе "Операции".
            </Text>
          )}
        </Card>
        
        {/* Инсайт от ментора */}
        {dashboardData.mentorInsight && (
          <InsightCard
            title="Инсайт от ментора"
            text={dashboardData.mentorInsight}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 14,
    marginTop: 4,
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  profileButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressCircleWrapper: {
    position: 'relative',
    width: 80,
    height: 80,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundCircle: {
    position: 'absolute',
    borderRadius: 40,
    opacity: 0.1,
  },
  progressCircleContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressTextContainer: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  progressLabel: {
    marginTop: 8,
    fontSize: 12,
  },
  focusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoButton: {
    padding: 4,
  },
  focusTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  focusDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  separator: {
    height: 1,
    marginVertical: 12,
  },
  mentorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  mentorButtonText: {
    marginLeft: 8,
    fontWeight: '500',
  },
  tasksHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loader: {
    marginVertical: 16,
  },
  tasksList: {
    marginTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 16,
    flex: 1,
  },
  moreTasksButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  moreTasksText: {
    fontSize: 14,
  },
  emptyText: {
    textAlign: 'center',
    marginVertical: 16,
    fontStyle: 'italic',
  },
  insightCard: {
    borderLeftWidth: 4,
    borderLeftColor: COLORS.light.primary,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  insightText: {
    fontSize: 14,
    lineHeight: 20,
  },
});