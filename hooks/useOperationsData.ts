import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiCoreService } from '@/services/ai/aiCoreService';

// Типы данных для операционного центра
export interface Task {
  id: string;
  title: string;
  description?: string;
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
  dueDate?: string;
  category?: string;
  tags?: string[];
}

export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: 'daily' | 'weekly' | 'custom';
  completedDates: string[];
  streak: number;
  category?: string;
}

// Ключи для хранения данных
const TASKS_STORAGE_KEY = 'berserk_tasks';
const HABITS_STORAGE_KEY = 'berserk_habits';
const CATEGORIES_STORAGE_KEY = 'berserk_categories';

export function useOperationsData() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Загрузка данных при первом рендере
  useEffect(() => {
    loadData();
  }, []);

  // Загрузка всех данных
  const loadData = async () => {
    setLoading(true);
    try {
      // Загрузка задач
      const tasksData = await AsyncStorage.getItem(TASKS_STORAGE_KEY);
      if (tasksData) {
        setTasks(JSON.parse(tasksData));
      }

      // Загрузка привычек
      const habitsData = await AsyncStorage.getItem(HABITS_STORAGE_KEY);
      if (habitsData) {
        setHabits(JSON.parse(habitsData));
      }

      // Загрузка категорий
      const categoriesData = await AsyncStorage.getItem(CATEGORIES_STORAGE_KEY);
      if (categoriesData) {
        setCategories(JSON.parse(categoriesData));
      } else {
        // Установка начальных категорий, если они не найдены
        const defaultCategories = ['Работа', 'Здоровье', 'Саморазвитие', 'Личное'];
        await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(defaultCategories));
        setCategories(defaultCategories);
      }
    } catch (error) {
      console.error('Ошибка загрузки данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение задач в AsyncStorage
  const saveTasks = async (updatedTasks: Task[]) => {
    try {
      await AsyncStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(updatedTasks));
      setTasks(updatedTasks);

      // Обновление категорий
      updateCategories([...updatedTasks, ...habits]);
    } catch (error) {
      console.error('Ошибка сохранения задач:', error);
    }
  };

  // Сохранение привычек в AsyncStorage
  const saveHabits = async (updatedHabits: Habit[]) => {
    try {
      await AsyncStorage.setItem(HABITS_STORAGE_KEY, JSON.stringify(updatedHabits));
      setHabits(updatedHabits);

      // Обновление категорий
      updateCategories([...tasks, ...updatedHabits]);
    } catch (error) {
      console.error('Ошибка сохранения привычек:', error);
    }
  };

  // Обновление списка категорий на основе текущих задач и привычек
  const updateCategories = async (items: (Task | Habit)[]) => {
    try {
      const uniqueCategories = Array.from(
        new Set(
          items
            .map(item => item.category)
            .filter((category): category is string => !!category)
        )
      );

      if (uniqueCategories.length > 0) {
        await AsyncStorage.setItem(CATEGORIES_STORAGE_KEY, JSON.stringify(uniqueCategories));
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error('Ошибка обновления категорий:', error);
    }
  };

  // Функция обновления данных (pull-to-refresh)
  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  // CRUD операции для задач

  // Отметка задачи как выполненной/невыполненной
  const toggleTask = async (taskId: string): Promise<void> => {
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, completed: !task.completed } : task
    );
    await saveTasks(updatedTasks);
  };

  // Удаление задачи
  const deleteTask = async (taskId: string): Promise<void> => {
    const updatedTasks = tasks.filter(task => task.id !== taskId);
    await saveTasks(updatedTasks);
  };

  // Редактирование задачи
  const editTask = async (updatedTask: Task): Promise<void> => {
    const updatedTasks = tasks.map(task =>
      task.id === updatedTask.id ? updatedTask : task
    );
    await saveTasks(updatedTasks);
  };

  // Добавление задачи
  const addTask = async (taskData: Partial<Task>): Promise<void> => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description,
      completed: false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      category: taskData.category,
      tags: taskData.tags || []
    };

    const updatedTasks = [newTask, ...tasks];
    await saveTasks(updatedTasks);
  };

  // CRUD операции для привычек

  // Отметка привычки как выполненной сегодня
  const completeHabit = async (habitId: string): Promise<void> => {
    const today = new Date().toISOString().split('T')[0];

    const updatedHabits = habits.map(habit => {
      if (habit.id !== habitId) return habit;

      const isCompletedToday = habit.completedDates.includes(today);
      let newCompletedDates: string[];
      let newStreak: number;

      if (isCompletedToday) {
        // Если уже отмечена, убираем отметку
        newCompletedDates = habit.completedDates.filter(date => date !== today);
        newStreak = Math.max(0, habit.streak - 1);
      } else {
        // Если еще не отмечена, добавляем отметку
        newCompletedDates = [...habit.completedDates, today];
        newStreak = habit.streak + 1;
      }

      return {
        ...habit,
        completedDates: newCompletedDates,
        streak: newStreak
      };
    });

    await saveHabits(updatedHabits);
  };

  // Редактирование привычки
  const editHabit = async (updatedHabit: Habit): Promise<void> => {
    const updatedHabits = habits.map(habit =>
      habit.id === updatedHabit.id ? updatedHabit : habit
    );
    await saveHabits(updatedHabits);
  };

  // Добавление привычки
  const addHabit = async (habitData: Partial<Habit>): Promise<void> => {
    const newHabit: Habit = {
      id: Date.now().toString(),
      title: habitData.title || '',
      description: habitData.description,
      frequency: habitData.frequency || 'daily',
      completedDates: [],
      streak: 0,
      category: habitData.category
    };

    const updatedHabits = [newHabit, ...habits];
    await saveHabits(updatedHabits);
  };

  // Удаление привычки
  const deleteHabit = async (habitId: string): Promise<void> => {
    const updatedHabits = habits.filter(habit => habit.id !== habitId);
    await saveHabits(updatedHabits);
  };

  // Генерация AI-рекомендаций по задачам
  const generateAITasks = async (): Promise<void> => {
    setLoading(true);
    try {
      // Подготовка данных для отправки
      const userMessage = "Проанализируй мои текущие задачи и привычки и предложи 3 новые задачи, которые помогут достичь моих целей эффективнее. Обрати внимание на существующие категории.";
      
      // Отправка запроса к AI
      const response = await aiCoreService.sendMessage(userMessage);
      
      // Проверяем ответ на наличие действий
      if (response.actions && response.actions.length > 0) {
        // Фильтруем только действия по созданию задач
        const createTaskActions = response.actions.filter(action => action.type === 'CREATE_TASK');
        
        if (createTaskActions.length > 0) {
          // Преобразуем действия в задачи
          const newTasks: Task[] = createTaskActions.map(action => ({
            id: Date.now().toString() + Math.random().toString().substring(2, 6),
            title: action.payload.title,
            description: action.payload.description || '',
            completed: false,
            priority: action.payload.priority || 'medium',
            dueDate: action.payload.dueDate || undefined,
            category: action.payload.category || undefined,
            tags: action.payload.tags || []
          }));
          
          // Добавляем новые задачи к существующим
          const updatedTasks = [...newTasks, ...tasks];
          await saveTasks(updatedTasks);
        }
      } else {
        // Если действия не получены, создаем задачи на основе текста ответа
        // Это запасной вариант, если система команд не сработала
        const aiGeneratedTasks: Task[] = [
          {
            id: Date.now().toString() + '1',
            title: '[AI] Проанализировать продуктивность за неделю',
            description: 'Оценить эффективность работы и выявить области для улучшения',
            completed: false,
            priority: 'medium',
            category: 'Саморазвитие'
          },
          {
            id: Date.now().toString() + '2',
            title: '[AI] Уделить 30 минут на изучение новой технологии',
            description: 'Расширение профессиональных навыков',
            completed: false,
            priority: 'high',
            category: 'Работа'
          },
          {
            id: Date.now().toString() + '3',
            title: '[AI] Запланировать день восстановления',
            description: 'Отдых и восстановление физических и умственных ресурсов',
            completed: false,
            priority: 'low',
            category: 'Здоровье'
          }
        ];
        
        const updatedTasks = [...aiGeneratedTasks, ...tasks];
        await saveTasks(updatedTasks);
      }
    } catch (error) {
      console.error('Ошибка генерации AI-задач:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
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
    addHabit,
    deleteHabit,
    refreshData,
    generateAITasks
  };
}