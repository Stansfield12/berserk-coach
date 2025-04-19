import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useOperationsData } from './useOperationsData';
import { useStrategicData } from './useStrategicData';

// Типы данных для дашборда
interface WeeklyProgress {
  tasks: number;
  habits: number;
  focus: number;
}

interface DailyFocus {
  title: string;
  description: string;
}

interface DashboardData {
  weeklyProgress: WeeklyProgress;
  dailyFocus: DailyFocus;
  tasks: {
    id: string;
    title: string;
    completed: boolean;
  }[];
  mentorInsight?: string;
}

// Ключи для хранения данных
const WEEKLY_PROGRESS_KEY = 'berserk_weekly_progress';
const DAILY_FOCUS_KEY = 'berserk_daily_focus';
const LAST_INSIGHT_KEY = 'berserk_last_insight';

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    weeklyProgress: {
      tasks: 0,
      habits: 0,
      focus: 0
    },
    dailyFocus: {
      title: '',
      description: ''
    },
    tasks: []
  });
  
  const [loading, setLoading] = useState<boolean>(true);
  
  // Получаем данные из других хуков
  const { tasks } = useOperationsData();
  const { insights } = useStrategicData();
  
  // Загрузка данных при первом рендере
  useEffect(() => {
    loadData();
    
    // Настройка автоматического обновления еженедельного прогресса
    updateWeeklyProgress();
    
    // Настройка автоматического обновления ежедневного фокуса
    checkAndUpdateDailyFocus();
  }, [tasks, insights]);
  
  // Загрузка всех данных
  const loadData = async () => {
    setLoading(true);
    try {
      // Загрузка еженедельного прогресса
      const weeklyProgressData = await AsyncStorage.getItem(WEEKLY_PROGRESS_KEY);
      const weeklyProgress = weeklyProgressData ? JSON.parse(weeklyProgressData) : {
        tasks: 0,
        habits: 0,
        focus: 0
      };
      
      // Загрузка ежедневного фокуса
      const dailyFocusData = await AsyncStorage.getItem(DAILY_FOCUS_KEY);
      const storedDailyFocus = dailyFocusData ? JSON.parse(dailyFocusData) : null;
      
      // Загрузка последнего инсайта
      const lastInsightData = await AsyncStorage.getItem(LAST_INSIGHT_KEY);
      const lastInsight = lastInsightData || '';
      
      // Форматирование данных для дашборда
      const todaysTasks = formatTasks(tasks);
      
      // Формирование ежедневного фокуса
      const dailyFocus = storedDailyFocus && isToday(storedDailyFocus.date) 
        ? storedDailyFocus
        : await generateDailyFocus();
      
      // Обновление состояния
      setDashboardData({
        weeklyProgress,
        dailyFocus,
        tasks: todaysTasks,
        mentorInsight: lastInsight || (insights.length > 0 ? insights[0] : undefined)
      });
    } catch (error) {
      console.error('Ошибка загрузки данных дашборда:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // Проверка и обновление ежедневного фокуса при необходимости
  const checkAndUpdateDailyFocus = async () => {
    try {
      const dailyFocusData = await AsyncStorage.getItem(DAILY_FOCUS_KEY);
      
      if (dailyFocusData) {
        const storedDailyFocus = JSON.parse(dailyFocusData);
        
        // Если фокус дня не для сегодняшнего дня, генерируем новый
        if (!isToday(storedDailyFocus.date)) {
          const newDailyFocus = await generateDailyFocus();
          
          setDashboardData(prevData => ({
            ...prevData,
            dailyFocus: newDailyFocus
          }));
        }
      } else {
        // Если нет сохраненного фокуса, генерируем новый
        const newDailyFocus = await generateDailyFocus();
        
        setDashboardData(prevData => ({
          ...prevData,
          dailyFocus: newDailyFocus
        }));
      }
    } catch (error) {
      console.error('Ошибка обновления ежедневного фокуса:', error);
    }
  };
  
  // Генерация ежедневного фокуса
  const generateDailyFocus = async (): Promise<DailyFocus> => {
    // Массив возможных фокусов
    const possibleFocuses = [
      {
        title: 'Прагматичная дисциплина',
        description: 'Сегодня фокусируемся на планировании и выполнении самых важных задач без отвлечений'
      },
      {
        title: 'Стратегическое мышление',
        description: 'Сегодня уделите время анализу своих долгосрочных целей и проверьте, насколько ваши текущие действия соответствуют им'
      },
      {
        title: 'Эффективная реализация',
        description: 'Сегодня сосредоточьтесь на завершении уже начатых задач и проектов, минимизируя многозадачность'
      },
      {
        title: 'Оптимизация процессов',
        description: 'Найдите и устраните узкие места в своих рабочих процессах, автоматизируйте рутинные задачи'
      },
      {
        title: 'Физическая энергия',
        description: 'Сегодня уделите особое внимание своему физическому состоянию: тренировка, качественное питание и достаточный отдых'
      }
    ];
    
    // Выбираем случайный фокус
    const randomFocus = possibleFocuses[Math.floor(Math.random() * possibleFocuses.length)];
    
    // Сохраняем фокус с датой
    const focusWithDate = {
      ...randomFocus,
      date: new Date().toISOString().split('T')[0] // Формат YYYY-MM-DD
    };
    
    await AsyncStorage.setItem(DAILY_FOCUS_KEY, JSON.stringify(focusWithDate));
    
    return randomFocus;
  };
  
  // Проверка, является ли дата сегодняшней
  const isToday = (dateString: string): boolean => {
    const today = new Date().toISOString().split('T')[0];
    return dateString === today;
  };
  
  // Форматирование задач для дашборда
  const formatTasks = (allTasks: any[]): { id: string; title: string; completed: boolean }[] => {
    // Фильтрация задач на сегодня (в реальном приложении здесь была бы логика фильтрации по дате)
    // Для прототипа просто берем первые 5 задач
    return allTasks.slice(0, 5).map(task => ({
      id: task.id,
      title: task.title,
      completed: task.completed
    }));
  };
  
  // Обновление еженедельного прогресса
  const updateWeeklyProgress = async () => {
    try {
      // В реальном приложении здесь был бы расчет прогресса на основе выполненных задач и привычек за неделю
      // Для прототипа используем приблизительные данные
      
      // Рассчитываем прогресс по задачам
      const completedTasks = tasks.filter(task => task.completed).length;
      const totalTasks = tasks.length || 1; // Избегаем деления на ноль
      const tasksProgress = Math.round((completedTasks / totalTasks) * 100);
      
      // Для привычек и фокуса используем моковые данные
      // В реальном приложении это было бы рассчитано на основе реальных данных
      const habitsProgress = Math.min(Math.max(tasksProgress + Math.floor(Math.random() * 20) - 10, 0), 100);
      const focusProgress = Math.min(Math.max(tasksProgress + Math.floor(Math.random() * 30) - 15, 0), 100);
      
      const newProgress = {
        tasks: tasksProgress,
        habits: habitsProgress,
        focus: focusProgress
      };
      
      // Сохраняем прогресс в AsyncStorage
      await AsyncStorage.setItem(WEEKLY_PROGRESS_KEY, JSON.stringify(newProgress));
      
      // Обновляем состояние
      setDashboardData(prevData => ({
        ...prevData,
        weeklyProgress: newProgress
      }));
    } catch (error) {
      console.error('Ошибка обновления еженедельного прогресса:', error);
    }
  };
  
  // Функция для отметки задачи как выполненной/невыполненной
  const toggleTask = async (taskId: string): Promise<void> => {
    // Обновляем локальное состояние
    setDashboardData(prevData => {
      const updatedTasks = prevData.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      return {
        ...prevData,
        tasks: updatedTasks
      };
    });
    
    // В реальном приложении здесь был бы вызов функции из useOperationsData
    // Для прототипа эта функция обновляет только локальное состояние
  };
  
  // Функция обновления данных (pull-to-refresh)
  const refreshData = async (): Promise<void> => {
    await loadData();
  };
  
  return {
    dashboardData,
    loading,
    toggleTask,
    refreshData
  };
}