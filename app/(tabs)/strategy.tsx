import React, { useState, useEffect } from 'react';
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

// Заглушки для данных (в реальном приложении будут из Redux или Context)
import { useStrategicData } from '@/hooks/useStrategicData';
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
    neutral: '#607D8B',
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
    neutral: '#78909C',
    separator: '#333333',
  },
};

// Типы данных для целей
interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk';
  progress: number;
  dueDate?: string;
  children?: Goal[];
}

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

// Компонент для отображения прогресс-бара
const ProgressBar = ({ 
  progress, 
  width = 200,
  height = 8,
  color
}: { 
  progress: number, 
  width?: number,
  height?: number,
  color?: string
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Определяем цвет на основе прогресса, если не указан явно
  const barColor = color || (
    progress >= 75 ? colors.success :
    progress >= 25 ? colors.neutral :
    colors.primary
  );
  
  return (
    <View 
      style={[
        styles.progressBarContainer, 
        { 
          width, 
          height,
          backgroundColor: `${barColor}30`, // Полупрозрачный фон
        }
      ]}
    >
      <View 
        style={[
          styles.progressBar, 
          { 
            width: `${progress}%`,
            height,
            backgroundColor: barColor
          }
        ]}
      />
    </View>
  );
};

// Компонент для отображения статуса цели
const StatusBadge = ({ status }: { status: Goal['status'] }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  let badgeColor;
  let statusText;
  
  switch (status) {
    case 'not_started':
      badgeColor = colors.neutral;
      statusText = 'Не начата';
      break;
    case 'in_progress':
      badgeColor = colors.primary;
      statusText = 'В процессе';
      break;
    case 'completed':
      badgeColor = colors.success;
      statusText = 'Завершена';
      break;
    case 'at_risk':
      badgeColor = colors.warning;
      statusText = 'Под угрозой';
      break;
    default:
      badgeColor = colors.neutral;
      statusText = 'Неизвестно';
  }
  
  return (
    <View style={[styles.statusBadge, { backgroundColor: badgeColor }]}>
      <Text style={styles.statusText}>{statusText}</Text>
    </View>
  );
};

// Компонент для отображения отдельной цели
const GoalItem = ({ 
  goal, 
  onPress,
  isExpanded = false,
  level = 0
}: { 
  goal: Goal, 
  onPress: (goal: Goal) => void,
  isExpanded?: boolean,
  level?: number
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const hasChildren = goal.children && goal.children.length > 0;
  const [expanded, setExpanded] = useState(isExpanded);
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  return (
    <View style={{ marginLeft: level * 20 }}>
      <TouchableOpacity 
        style={[
          styles.goalItem,
          { borderLeftColor: getStatusColor(goal.status, colorScheme) }
        ]}
        onPress={() => onPress(goal)}
        activeOpacity={0.7}
      >
        <View style={styles.goalHeader}>
          <Text style={[styles.goalTitle, { color: colors.text }]}>
            {goal.title}
          </Text>
          <StatusBadge status={goal.status} />
        </View>
        
        <Text 
          style={[styles.goalDescription, { color: colors.secondaryText }]}
          numberOfLines={expanded ? undefined : 2}
        >
          {goal.description}
        </Text>
        
        <View style={styles.goalFooter}>
          <View style={styles.progressSection}>
            <Text style={[styles.progressText, { color: colors.secondaryText }]}>
              {`${Math.round(goal.progress)}%`}
            </Text>
            <ProgressBar progress={goal.progress} width={120} />
          </View>
          
          {hasChildren && (
            <TouchableOpacity
              style={styles.expandButton}
              onPress={toggleExpand}
            >
              <Ionicons 
                name={expanded ? 'chevron-up' : 'chevron-down'} 
                size={20} 
                color={colors.secondaryText} 
              />
            </TouchableOpacity>
          )}
        </View>
      </TouchableOpacity>
      
      {expanded && hasChildren && (
        <View style={styles.childrenContainer}>
          {goal.children!.map(childGoal => (
            <GoalItem 
              key={childGoal.id}
              goal={childGoal}
              onPress={onPress}
              level={level + 1}
            />
          ))}
        </View>
      )}
    </View>
  );
};

// Хелпер для определения цвета статуса
const getStatusColor = (status: Goal['status'], colorScheme: 'light' | 'dark' | null) => {
  const colors = COLORS[colorScheme || 'dark'];
  
  switch (status) {
    case 'not_started':
      return colors.neutral;
    case 'in_progress':
      return colors.primary;
    case 'completed':
      return colors.success;
    case 'at_risk':
      return colors.warning;
    default:
      return colors.neutral;
  }
};

// Главный компонент Strategy
// Стили для компонентов
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
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  screenTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  analyzeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
  },
  loader: {
    marginVertical: 20,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  createButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  goalsList: {
    gap: 12,
  },
  goalItem: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    marginBottom: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
  },
  goalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  goalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '500',
  },
  progressBarContainer: {
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    borderRadius: 4,
  },
  expandButton: {
    padding: 4,
  },
  childrenContainer: {
    marginTop: 4,
  },
  detailCard: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  detailDescription: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 16,
  },
  progressDetails: {
    marginBottom: 16,
  },
  progressLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressPercent: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  dueDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  dueDateLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 8,
  },
  dueDateValue: {
    fontSize: 14,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 8,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  insightsList: {
    gap: 12,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  insightText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
});

export default function StrategyScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const [refreshing, setRefreshing] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  
  // Получение данных (в реальном приложении из Redux)
  const { 
    goals, 
    insights, 
    loading, 
    refreshData,
    analyzeGoals
  } = useStrategicData();
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };
  
  const handleGoalPress = (goal: Goal) => {
    setSelectedGoal(goal);
  };
  
  const handleCreateGoal = () => {
    router.push('/screens/create-goal');
  };
  
  const handleAiAnalysis = async () => {
    await analyzeGoals();
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
      <View style={styles.header}>
        <Text style={[styles.screenTitle, { color: colors.text }]}>
          Стратегический центр
        </Text>
        
        <TouchableOpacity
          style={[styles.analyzeButton, { backgroundColor: colors.primary }]}
          onPress={handleAiAnalysis}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="analytics-outline" size={16} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>AI-анализ</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
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
        {/* Главные цели */}
        <Card>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Глобальные цели
            </Text>
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleCreateGoal}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.addButtonText, { color: colors.primary }]}>
                Добавить
              </Text>
            </TouchableOpacity>
          </View>
          
          {loading && goals.length === 0 ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : goals.length > 0 ? (
            <View style={styles.goalsList}>
              {goals.map(goal => (
                <GoalItem 
                  key={goal.id} 
                  goal={goal} 
                  onPress={handleGoalPress}
                  isExpanded={false}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="flag-outline" size={40} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Нет глобальных целей
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Создайте вашу первую стратегическую цель, и ИИ-ментор поможет разбить ее на достижимые шаги.
              </Text>
              <TouchableOpacity 
                style={[styles.createButton, { backgroundColor: colors.primary }]}
                onPress={handleCreateGoal}
              >
                <Text style={styles.createButtonText}>Создать цель</Text>
              </TouchableOpacity>
            </View>
          )}
        </Card>
        
        {/* Детальная информация о выбранной цели */}
        {selectedGoal && (
          <Card style={styles.detailCard}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: colors.text }]}>
                {selectedGoal.title}
              </Text>
              <StatusBadge status={selectedGoal.status} />
            </View>
            
            <Text style={[styles.detailDescription, { color: colors.secondaryText }]}>
              {selectedGoal.description}
            </Text>
            
            <View style={styles.progressDetails}>
              <Text style={[styles.progressLabel, { color: colors.text }]}>
                Прогресс
              </Text>
              <View style={styles.progressRow}>
                <ProgressBar 
                  progress={selectedGoal.progress} 
                  width={200}
                  color={getStatusColor(selectedGoal.status, colorScheme)}
                />
                <Text style={[styles.progressPercent, { color: colors.text }]}>
                  {`${Math.round(selectedGoal.progress)}%`}
                </Text>
              </View>
            </View>
            
            {selectedGoal.dueDate && (
              <View style={styles.dueDate}>
                <Text style={[styles.dueDateLabel, { color: colors.text }]}>
                  Срок:
                </Text>
                <Text style={[styles.dueDateValue, { color: colors.secondaryText }]}>
                  {new Date(selectedGoal.dueDate).toLocaleDateString()}
                </Text>
              </View>
            )}
            
            <View style={styles.actionButtons}>
              <TouchableOpacity 
                style={[styles.actionButton, { borderColor: colors.primary }]}
                onPress={() => {/* edit goal */}}
              >
                <Ionicons name="create-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Редактировать
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.actionButton, { borderColor: colors.primary }]}
                onPress={() => {/* add subtask */}}
              >
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={[styles.actionButtonText, { color: colors.primary }]}>
                  Добавить подцель
                </Text>
              </TouchableOpacity>
            </View>
          </Card>
        )}
        
        {/* AI Инсайты */}
        {insights.length > 0 && (
          <Card>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              AI-анализ целей
            </Text>
            <View style={styles.insightsList}>
              {insights.map((insight, index) => (
                <View key={index} style={styles.insightItem}>
                  <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                  <Text style={[styles.insightText, { color: colors.secondaryText }]}>
                    {insight}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}
      </ScrollView>
      
      {/* FAB для быстрого создания целей */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={handleCreateGoal}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
}