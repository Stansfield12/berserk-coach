import { useState, useEffect } from 'react';

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

// Моковые данные для разработки
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Завершить дизайн UI для ключевых экранов',
    description: 'Подготовить макеты в Figma для главных экранов приложения',
    completed: false,
    priority: 'high',
    dueDate: '2025-04-20',
    category: 'Работа'
  },
  {
    id: '2',
    title: 'Написать документацию API',
    description: 'Описать все эндпоинты для взаимодействия с бэкендом',
    completed: false,
    priority: 'medium',
    dueDate: '2025-04-25',
    category: 'Работа'
  },
  {
    id: '3',
    title: 'Тренировка силы',
    description: 'Выполнить комплекс упражнений на силу',
    completed: true,
    priority: 'medium',
    category: 'Здоровье'
  },
  {
    id: '4',
    title: 'Прочитать главу книги по архитектуре ПО',
    completed: false,
    priority: 'low',
    category: 'Саморазвитие'
  }
];

const mockHabits: Habit[] = [
  {
    id: '1',
    title: 'Утренняя тренировка',
    description: 'Зарядка и силовые упражнения',
    frequency: 'daily',
    completedDates: [
      '2025-04-15',
      '2025-04-16',
      '2025-04-17'
    ],
    streak: 3,
    category: 'Здоровье'
  },
  {
    id: '2',
    title: 'Чтение 30 минут',
    description: 'Профессиональная литература',
    frequency: 'daily',
    completedDates: [
      '2025-04-15',
      '2025-04-16'
    ],
    streak: 2,
    category: 'Саморазвитие'
  },
  {
    id: '3',
    title: 'Планирование недели',
    description: 'Стратегическое планирование на следующую неделю',
    frequency: 'weekly',
    completedDates: [
      '2025-04-14'
    ],
    streak: 1,
    category: 'Продуктивность'
  }
];

export function useOperationsData() {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);
  const [habits, setHabits] = useState<Habit[]>(mockHabits);
  const [loading, setLoading] = useState(false);
  
  // Список категорий из задач и привычек
  const categories = Array.from(new Set([
    ...tasks.map(task => task.category),
    ...habits.map(habit => habit.category)
  ].filter(Boolean) as string[]));
  
  // Симуляция загрузки данных при первом рендере
  useEffect(() => {
    setLoading(true);
    
    // Имитация задержки сети
    const timer = setTimeout(() => {
      setTasks(mockTasks);
      setHabits(mockHabits);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Функция для отметки задачи как выполненной/невыполненной
  const toggleTask = (taskId: string): void => {
    setTasks(prevTasks => 
      prevTasks.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };
  
  // Функция для удаления задачи
  const deleteTask = (taskId: string): void => {
    setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId));
  };
  
  // Функция для редактирования задачи
  const editTask = (task: Task): void => {
    setTasks(prevTasks => 
      prevTasks.map(t => t.id === task.id ? task : t)
    );
  };
  
  // Функция для добавления задачи
  const addTask = (taskData: Partial<Task>): void => {
    const newTask: Task = {
      id: Date.now().toString(),
      title: taskData.title || '',
      description: taskData.description,
      completed: false,
      priority: taskData.priority || 'medium',
      dueDate: taskData.dueDate,
      category: taskData.category,
      tags: taskData.tags
    };
    
    setTasks(prevTasks => [newTask, ...prevTasks]);
  };
  
  // Функция для отметки привычки как выполненной сегодня
  const completeHabit = (habitId: string): void => {
    const today = new Date().toISOString().split('T')[0];
    
    setHabits(prevHabits => 
      prevHabits.map(habit => {
        if (habit.id !== habitId) return habit;
        
        const isCompletedToday = habit.completedDates.includes(today);
        
        // Если уже отмечена, убираем отметку
        if (isCompletedToday) {
          return {
            ...habit,
            completedDates: habit.completedDates.filter(date => date !== today),
            streak: Math.max(0, habit.streak - 1)
          };
        }
        
        // Если еще не отмечена, добавляем отметку
        return {
          ...habit,
          completedDates: [...habit.completedDates, today],
          streak: habit.streak + 1
        };
      })
    );
  };
  
  // Функция для редактирования привычки
  const editHabit = (habit: Habit): void => {
    setHabits(prevHabits => 
      prevHabits.map(h => h.id === habit.id ? habit : h)
    );
  };
  
  // Функция обновления данных (pull-to-refresh)
  const refreshData = async (): Promise<void> => {
    setLoading(true);
    
    // Имитация задержки сети
    return new Promise((resolve) => {
      setTimeout(() => {
        setTasks(mockTasks);
        setHabits(mockHabits);
        setLoading(false);
        resolve();
      }, 1500);
    });
  };
  
  // Функция для генерации AI-рекомендаций по задачам
  const generateAITasks = async (): Promise<void> => {
    setLoading(true);
    
    // Имитация API-запроса к AI
    return new Promise((resolve) => {
      setTimeout(() => {
        // Добавляем задачи, "сгенерированные AI"
        const aiGeneratedTasks: Task[] = [
          {
            id: Date.now().toString(),
            title: '[AI] Провести тестирование интерфейса',
            description: 'Проверить удобство и интуитивность нового интерфейса',
            completed: false,
            priority: 'high',
            category: 'Работа'
          },
          {
            id: (Date.now() + 1).toString(),
            title: '[AI] Составить план презентации для заказчика',
            description: 'Подготовить ключевые пункты для демонстрации MVP',
            completed: false,
            priority: 'medium',
            category: 'Работа'
          }
        ];
        
        setTasks(prevTasks => [...aiGeneratedTasks, ...prevTasks]);
        setLoading(false);
        resolve();
      }, 2000);
    });
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
    refreshData,
    generateAITasks
  };
}