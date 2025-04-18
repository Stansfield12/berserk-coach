import { useState, useEffect } from 'react';

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

interface Task {
  id: string;
  title: string;
  completed: boolean;
}

interface DashboardData {
  weeklyProgress: WeeklyProgress;
  dailyFocus: DailyFocus;
  tasks: Task[];
  mentorInsight?: string;
}

// Моковые данные для разработки
const mockDashboardData: DashboardData = {
  weeklyProgress: {
    tasks: 65,
    habits: 80,
    focus: 45
  },
  dailyFocus: {
    title: 'Прагматичная дисциплина',
    description: 'Сегодня фокусируемся на планировании и выполнении самых важных задач без отвлечений'
  },
  tasks: [
    {
      id: '1',
      title: 'Составить архитектуру MVP',
      completed: true
    },
    {
      id: '2',
      title: 'Разработать основные экраны',
      completed: false
    },
    {
      id: '3',
      title: 'Подготовить документацию по API',
      completed: false
    },
    {
      id: '4',
      title: 'Тренировка силы 30 минут',
      completed: false
    },
    {
      id: '5',
      title: 'Прочитать главу книги по архитектуре ПО',
      completed: false
    }
  ],
  mentorInsight: 'Ваша продуктивность повысилась на 15% после внедрения принципа "две ключевые задачи в день". Сохраните эту стратегию и в следующей неделе.'
};

export function useDashboardData() {
  const [dashboardData, setDashboardData] = useState<DashboardData>(mockDashboardData);
  const [loading, setLoading] = useState(false);
  
  // Симуляция загрузки данных при первом рендере
  useEffect(() => {
    setLoading(true);
    
    // Имитация задержки сети
    const timer = setTimeout(() => {
      setDashboardData(mockDashboardData);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Функция для отметки задачи как выполненной/невыполненной
  const toggleTask = (taskId: string): void => {
    setDashboardData(prevData => {
      const updatedTasks = prevData.tasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      );
      
      return {
        ...prevData,
        tasks: updatedTasks
      };
    });
  };
  
  // Функция обновления данных (pull-to-refresh)
  const refreshData = async (): Promise<void> => {
    setLoading(true);
    
    // Имитация задержки сети
    return new Promise((resolve) => {
      setTimeout(() => {
        setDashboardData(mockDashboardData);
        setLoading(false);
        resolve();
      }, 1500);
    });
  };
  
  return {
    dashboardData,
    loading,
    toggleTask,
    refreshData
  };
}