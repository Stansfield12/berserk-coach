import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { HabitItem } from '@/components/HabitItem';

// Заглушки для данных (в реальном приложении будут из Redux или Context)
import { useOperationsData } from '@/hooks/useOperationsData';
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
    completed: 'rgba(76, 175, 80, 0.15)',
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
    completed: 'rgba(102, 187, 106, 0.15)',
  },
};

// Типы данных
interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  category?: string;
  tags?: string[];
}

interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  completedDates: string[];
  streak: number;
  category?: string;
}

// Компонент задачи с анимацией выполнения
const TaskItem = ({ 
  task, 
  onToggle,
  onDelete,
  onEdit
}: { 
  task: Task, 
  onToggle: (id: string) => void,
  onDelete: (id: string) => void,
  onEdit: (task: Task) => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Анимация для задачи при отметке как выполненной
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  
  const animateCompletion = (completed: boolean) => {
    // Анимация уменьшения и увеличения при отметке
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Анимация прозрачности для выполненных задач
    Animated.timing(opacityAnim, {
      toValue: completed ? 0.7 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };
  
  const handleToggle = () => {
    animateCompletion(!task.completed);
    onToggle(task.id);
  };
  
  const confirmDelete = () => {
    Alert.alert(
      "Удаление задачи",
      "Вы уверены, что хотите удалить эту задачу?",
      [
        { text: "Отмена", style: "cancel" },
        { text: "Удалить", style: "destructive", onPress: () => onDelete(task.id) }
      ]
    );
  };
  
  // Определение цвета приоритета
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high':
        return colors.primary;
      case 'medium':
        return colors.warning;
      case 'low':
        return colors.neutral;
      default:
        return colors.neutral;
    }
  };
  
  return (
    <Animated.View
      style={[
        styles.taskItem,
        { 
          backgroundColor: task.completed ? colors.completed : colors.cardBackground,
          transform: [{ scale: scaleAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <TouchableOpacity 
        style={styles.taskCheckbox}
        onPress={handleToggle}
      >
        <View style={[
          styles.checkbox,
          { 
            borderColor: task.completed ? colors.success : getPriorityColor(),
            backgroundColor: task.completed ? colors.success : 'transparent',
          }
        ]}>
          {task.completed && (
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          )}
        </View>
      </TouchableOpacity>
      
      <View style={styles.taskContent}>
        <Text 
          style={[
            styles.taskTitle, 
            { 
              color: colors.text,
              textDecorationLine: task.completed ? 'line-through' : 'none',
            }
          ]}
        >
          {task.title}
        </Text>
        
        {task.description && (
          <Text 
            style={[
              styles.taskDescription, 
              { 
                color: colors.secondaryText,
                textDecorationLine: task.completed ? 'line-through' : 'none',
              }
            ]}
            numberOfLines={2}
          >
            {task.description}
          </Text>
        )}
        
        <View style={styles.taskMeta}>
          {task.dueDate && (
            <View style={styles.dueDateContainer}>
              <Ionicons name="calendar-outline" size={12} color={colors.secondaryText} />
              <Text style={[styles.dueDate, { color: colors.secondaryText }]}>
                {new Date(task.dueDate).toLocaleDateString()}
              </Text>
            </View>
          )}
          
          {task.category && (
            <View 
              style={[
                styles.categoryPill, 
                { backgroundColor: `${getPriorityColor()}30` }
              ]}
            >
              <Text 
                style={[styles.categoryText, { color: getPriorityColor() }]}
                numberOfLines={1}
              >
                {task.category}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.taskActions}>
        <TouchableOpacity 
          style={styles.taskAction}
          onPress={() => onEdit(task)}
        >
          <Ionicons name="create-outline" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.taskAction}
          onPress={confirmDelete}
        >
          <Ionicons name="trash-outline" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );
};

// Компонент сегментированного переключателя вкладок
const SegmentedControl = ({ 
  segments, 
  selectedIndex, 
  onChange 
}: { 
  segments: string[], 
  selectedIndex: number, 
  onChange: (index: number) => void 
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <View style={[styles.segmentedControl, { backgroundColor: colors.cardBackground }]}>
      {segments.map((segment, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.segment,
            selectedIndex === index && [
              styles.segmentActive,
              { backgroundColor: colors.primary }
            ]
          ]}
          onPress={() => onChange(index)}
        >
          <Text 
            style={[
              styles.segmentText,
              { color: selectedIndex === index ? '#FFFFFF' : colors.secondaryText }
            ]}
          >
            {segment}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

// Фильтр по категориям
const CategoryFilter = ({ 
  categories,
  selectedCategory,
  onSelectCategory
}: {
  categories: string[],
  selectedCategory: string | null,
  onSelectCategory: (category: string | null) => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryFilterContainer}
    >
      <TouchableOpacity
        style={[
          styles.categoryFilterItem,
          !selectedCategory && [
            styles.categoryFilterItemActive,
            { backgroundColor: colors.primary }
          ]
        ]}
        onPress={() => onSelectCategory(null)}
      >
        <Text 
          style={[
            styles.categoryFilterText,
            { color: !selectedCategory ? '#FFFFFF' : colors.secondaryText }
          ]}
        >
          Все
        </Text>
      </TouchableOpacity>
      
      {categories.map((category, index) => (
        <TouchableOpacity
          key={index}
          style={[
            styles.categoryFilterItem,
            selectedCategory === category && [
              styles.categoryFilterItemActive,
              { backgroundColor: colors.primary }
            ]
          ]}
          onPress={() => onSelectCategory(category)}
        >
          <Text 
            style={[
              styles.categoryFilterText,
              { color: selectedCategory === category ? '#FFFFFF' : colors.secondaryText }
            ]}
          >
            {category}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};

// Главный компонент Operations
// Стили для компонентов
const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  generateButtonText: {
    color: '#FFFFFF',
    fontWeight: '500',
    fontSize: 14,
    marginLeft: 4,
  },
  tabContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
  },
  segmentActive: {
    borderRadius: 8,
  },
  segmentText: {
    fontSize: 14,
    fontWeight: '500',
  },
  categoryFilterContainer: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  categoryFilterItem: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  categoryFilterItemActive: {
    borderRadius: 16,
  },
  categoryFilterText: {
    fontSize: 12,
    fontWeight: '500',
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    height: 48,
    borderRadius: 24,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 88,
  },
  taskItem: {
    flexDirection: 'row',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskCheckbox: {
    marginRight: 12,
    alignSelf: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  taskDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  taskMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  dueDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dueDate: {
    fontSize: 12,
  },
  categoryPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  taskActions: {
    justifyContent: 'space-around',
    paddingLeft: 8,
  },
  taskAction: {
    padding: 8,
  },
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
  },
  habitActions: {
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  editHabitButton: {
    padding: 8,
  },
  completeHabitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
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
    marginHorizontal: 32,
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

export default function OperationsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Состояния
  const [activeTab, setActiveTab] = useState(0); // 0 - Tasks, 1 - Habits
  const [refreshing, setRefreshing] = useState(false);
  const [newTaskText, setNewTaskText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  // Получение данных через хуки (в реальном приложении из Redux)
  const { 
    tasks, 
    habits, 
    categories,
    loading, 
    toggleTask,
    deleteTask,
    editTask,
    addTask,
    completeHabit,
    editHabit,
    refreshData,
    generateAITasks
  } = useOperationsData();
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };
  
  const handleAddTask = () => {
    if (newTaskText.trim().length === 0) return;
    
    addTask({
      title: newTaskText.trim(),
      priority: 'medium',
    });
    
    setNewTaskText('');
  };
  
  const handleGenerateAITasks = async () => {
    await generateAITasks();
  };
  
  // Фильтрация задач по категории
  const filteredTasks = selectedCategory
    ? tasks.filter(task => task.category === selectedCategory)
    : tasks;
  
  // Фильтрация привычек по категории
  const filteredHabits = selectedCategory
    ? habits.filter(habit => habit.category === selectedCategory)
    : habits;
  
  // Получение уникальных категорий из задач и привычек
  const allCategories = Array.from(new Set([
    ...tasks.map(task => task.category),
    ...habits.map(habit => habit.category)
  ].filter(Boolean) as string[]));
  
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
          Оперативный центр
        </Text>
        
        <TouchableOpacity
          style={[styles.generateButton, { backgroundColor: colors.primary }]}
          onPress={handleGenerateAITasks}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="flash-outline" size={16} color="#FFFFFF" />
              <Text style={styles.generateButtonText}>AI-план</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
      
      <View style={styles.tabContainer}>
        <SegmentedControl
          segments={['Задачи', 'Привычки']}
          selectedIndex={activeTab}
          onChange={setActiveTab}
        />
      </View>
      
      <CategoryFilter
        categories={allCategories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
      
      {activeTab === 0 ? (
        // Вкладка Задачи
        <>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { 
                backgroundColor: colors.cardBackground,
                color: colors.text,
              }]}
              placeholder="Добавить новую задачу..."
              placeholderTextColor={colors.secondaryText}
              value={newTaskText}
              onChangeText={setNewTaskText}
              onSubmitEditing={handleAddTask}
            />
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddTask}
              disabled={newTaskText.trim().length === 0}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
        
          <FlatList
            data={filteredTasks}
            renderItem={({ item }) => (
              <TaskItem
                task={item}
                onToggle={toggleTask}
                onDelete={deleteTask}
                onEdit={editTask}
              />
            )}
            keyExtractor={item => item.id}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={handleRefresh}
                tintColor={colors.primary}
              />
            }
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="list-outline" size={40} color={colors.secondaryText} />
                <Text style={[styles.emptyTitle, { color: colors.text }]}>
                  Нет активных задач
                </Text>
                <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                  {selectedCategory 
                    ? `Нет задач в категории "${selectedCategory}"`
                    : 'Добавьте новую задачу или используйте AI-план для генерации задач'
                  }
                </Text>
              </View>
            )}
          />
        </>
      ) : (
        // Вкладка Привычки
        <FlatList
          data={filteredHabits}
          renderItem={({ item }) => (
            <HabitItem
              habit={item}
              onComplete={completeHabit}
              onEdit={editHabit}
            />
          )}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={() => (
            <View style={styles.emptyContainer}>
              <Ionicons name="calendar-outline" size={40} color={colors.secondaryText} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Нет отслеживаемых привычек
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                {selectedCategory 
                  ? `Нет привычек в категории "${selectedCategory}"`
                  : 'Добавьте новую привычку для регулярного выполнения'
                }
              </Text>
            </View>
          )}
        />
      )}
      
      {/* FAB для добавления привычек или задач */}
      <TouchableOpacity 
        style={[styles.fab, { backgroundColor: colors.primary }]}
        onPress={() => {
          if (activeTab === 0) {
            router.push('/screens/create-task');
          } else {
            router.push('/screens/create-task');
          }
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );}