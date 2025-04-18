import { useState, useEffect } from 'react';

// Типы данных для работы со стратегическими целями
export interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'at_risk';
  progress: number;
  dueDate?: string;
  children?: Goal[];
  parentId?: string;
}

// Моковые данные для разработки
const mockGoals: Goal[] = [
  {
    id: '1',
    title: 'Запустить MVP проекта',
    description: 'Разработать и запустить первую версию приложения с ключевыми функциями',
    status: 'in_progress',
    progress: 65,
    dueDate: '2025-06-30',
    children: [
      {
        id: '1-1',
        title: 'Завершить архитектуру',
        description: 'Определить основные компоненты и их взаимодействие',
        status: 'completed',
        progress: 100,
        parentId: '1'
      },
      {
        id: '1-2',
        title: 'Реализовать основные экраны',
        description: 'Разработать и протестировать интерфейс для ключевых функций',
        status: 'in_progress',
        progress: 70,
        parentId: '1'
      },
      {
        id: '1-3',
        title: 'Интеграция с AI API',
        description: 'Настроить взаимодействие с OpenAI API для функций ментора',
        status: 'not_started',
        progress: 0,
        parentId: '1'
      }
    ]
  },
  {
    id: '2',
    title: 'Сформировать привычку раннего подъема',
    description: 'Научиться регулярно вставать в 6:00 для повышения продуктивности',
    status: 'at_risk',
    progress: 30,
    dueDate: '2025-05-15',
    children: [
      {
        id: '2-1',
        title: 'Анализ текущего режима',
        description: 'Отследить текущие паттерны сна в течение недели',
        status: 'completed',
        progress: 100,
        parentId: '2'
      },
      {
        id: '2-2',
        title: 'Корректировка режима сна',
        description: 'Постепенное смещение времени отхода ко сну',
        status: 'at_risk',
        progress: 20,
        parentId: '2'
      }
    ]
  }
];

// Моковые инсайты от AI
const mockInsights = [
  'Структура цели "Запустить MVP проекта" хорошо сбалансирована, но стоит добавить подцель по тестированию с реальными пользователями.',
  'Для цели "Сформировать привычку раннего подъема" не хватает конкретных действий — рекомендуется добавить триггеры для закрепления привычки.'
];

export function useStrategicData() {
  const [goals, setGoals] = useState<Goal[]>(mockGoals);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Симуляция загрузки данных при первом рендере
  useEffect(() => {
    // В реальном приложении здесь был бы API-запрос
    setLoading(true);
    
    // Имитация задержки сети
    const timer = setTimeout(() => {
      setGoals(mockGoals);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Функция обновления данных (pull-to-refresh)
  const refreshData = async (): Promise<void> => {
    setLoading(true);
    
    // Имитация задержки сети
    return new Promise((resolve) => {
      setTimeout(() => {
        setGoals(mockGoals);
        setLoading(false);
        resolve();
      }, 1500);
    });
  };
  
  // Функция для AI-анализа структуры целей
  const analyzeGoals = async (): Promise<void> => {
    setLoading(true);
    
    // Имитация API-запроса на анализ
    return new Promise((resolve) => {
      setTimeout(() => {
        setInsights(mockInsights);
        setLoading(false);
        resolve();
      }, 2000);
    });
  };
  
  return {
    goals,
    insights,
    loading,
    refreshData,
    analyzeGoals
  };
}