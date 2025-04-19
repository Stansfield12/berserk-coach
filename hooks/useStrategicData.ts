import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiCoreService } from '@/services/ai/aiCoreService';

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

// Ключи для хранения данных
const GOALS_STORAGE_KEY = 'berserk_goals';
const INSIGHTS_STORAGE_KEY = 'berserk_insights';

export function useStrategicData() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [insights, setInsights] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Загрузка данных при первом рендере
  useEffect(() => {
    loadData();
  }, []);

  // Загрузка всех данных
  const loadData = async () => {
    setLoading(true);
    try {
      // Загрузка целей
      const goalsData = await AsyncStorage.getItem(GOALS_STORAGE_KEY);
      if (goalsData) {
        setGoals(JSON.parse(goalsData));
      }

      // Загрузка инсайтов
      const insightsData = await AsyncStorage.getItem(INSIGHTS_STORAGE_KEY);
      if (insightsData) {
        setInsights(JSON.parse(insightsData));
      }
    } catch (error) {
      console.error('Ошибка загрузки стратегических данных:', error);
    } finally {
      setLoading(false);
    }
  };

  // Сохранение целей в AsyncStorage
  const saveGoals = async (updatedGoals: Goal[]) => {
    try {
      await AsyncStorage.setItem(GOALS_STORAGE_KEY, JSON.stringify(updatedGoals));
      setGoals(updatedGoals);
    } catch (error) {
      console.error('Ошибка сохранения целей:', error);
    }
  };

  // Сохранение инсайтов в AsyncStorage
  const saveInsights = async (updatedInsights: string[]) => {
    try {
      await AsyncStorage.setItem(INSIGHTS_STORAGE_KEY, JSON.stringify(updatedInsights));
      setInsights(updatedInsights);
    } catch (error) {
      console.error('Ошибка сохранения инсайтов:', error);
    }
  };

  // Функция обновления данных (pull-to-refresh)
  const refreshData = async (): Promise<void> => {
    await loadData();
  };

  // CRUD операции для целей

  // Получение цели по ID
  const getGoalById = (goalId: string): Goal | undefined => {
    // Поиск цели в плоском списке
    const goal = goals.find(g => g.id === goalId);
    if (goal) return goal;

    // Поиск в дочерних целях
    for (const parentGoal of goals) {
      if (parentGoal.children) {
        const childGoal = parentGoal.children.find(child => child.id === goalId);
        if (childGoal) return childGoal;
      }
    }

    return undefined;
  };

  // Добавление цели
  const addGoal = async (goalData: Partial<Goal>): Promise<Goal> => {
    const newGoal: Goal = {
      id: Date.now().toString(),
      title: goalData.title || 'Новая цель',
      description: goalData.description || '',
      status: goalData.status || 'not_started',
      progress: goalData.progress || 0,
      dueDate: goalData.dueDate,
      parentId: goalData.parentId,
      children: []
    };

    // Если это подцель, добавляем её к родительской цели
    if (goalData.parentId) {
      const updatedGoals = goals.map(goal => {
        if (goal.id === goalData.parentId) {
          return {
            ...goal,
            children: [...(goal.children || []), newGoal]
          };
        }
        return goal;
      });
      await saveGoals(updatedGoals);
    } else {
      // Иначе добавляем как главную цель
      await saveGoals([...goals, newGoal]);
    }

    return newGoal;
  };

  // Обновление цели
  const updateGoal = async (goalId: string, updates: Partial<Goal>): Promise<void> => {
    // Функция для обновления цели в дереве
    const updateGoalInTree = (goalsList: Goal[]): Goal[] => {
      return goalsList.map(goal => {
        // Если это искомая цель, обновляем её
        if (goal.id === goalId) {
          return { ...goal, ...updates };
        }
        
        // Если у цели есть дочерние элементы, рекурсивно обновляем их
        if (goal.children && goal.children.length > 0) {
          return {
            ...goal,
            children: updateGoalInTree(goal.children)
          };
        }
        
        return goal;
      });
    };

    const updatedGoals = updateGoalInTree(goals);
    await saveGoals(updatedGoals);
  };

  // Удаление цели
  const deleteGoal = async (goalId: string): Promise<void> => {
    // Функция для удаления цели из дерева
    const removeGoalFromTree = (goalsList: Goal[]): Goal[] => {
      // Фильтруем цели верхнего уровня
      const filteredGoals = goalsList.filter(goal => goal.id !== goalId);
      
      // Обрабатываем дочерние цели
      return filteredGoals.map(goal => {
        if (goal.children && goal.children.length > 0) {
          return {
            ...goal,
            children: removeGoalFromTree(goal.children)
          };
        }
        return goal;
      });
    };

    const updatedGoals = removeGoalFromTree(goals);
    await saveGoals(updatedGoals);
  };

  // Обновление прогресса цели
  const updateGoalProgress = async (goalId: string, progress: number): Promise<void> => {
    await updateGoal(goalId, { progress });
    
    // Если это подцель, обновляем прогресс родительской цели
    const goal = getGoalById(goalId);
    if (goal && goal.parentId) {
      await updateParentProgress(goal.parentId);
    }
  };

  // Обновление прогресса родительской цели на основе прогресса подцелей
  const updateParentProgress = async (parentId: string): Promise<void> => {
    const parent = getGoalById(parentId);
    if (!parent || !parent.children || parent.children.length === 0) return;

    // Вычисляем средний прогресс всех подцелей
    const totalProgress = parent.children.reduce((sum, child) => sum + child.progress, 0);
    const averageProgress = totalProgress / parent.children.length;
    
    // Обновляем прогресс родительской цели
    await updateGoal(parentId, { progress: averageProgress });
    
    // Если родительская цель имеет своего родителя, обновляем и его
    if (parent.parentId) {
      await updateParentProgress(parent.parentId);
    }
  };

  // AI-анализ целей
  const analyzeGoals = async (): Promise<void> => {
    setLoading(true);
    try {
      // Если нет целей, нечего анализировать
      if (goals.length === 0) {
        setInsights(['Добавьте цели для получения AI-анализа.']);
        await saveInsights(['Добавьте цели для получения AI-анализа.']);
        return;
      }

      // Подготовка данных для отправки
      const userMessage = `Проанализируй мои стратегические цели и дай рекомендации по их улучшению и реализации. Вот мои текущие цели: ${JSON.stringify(goals, null, 2)}`;
      
      // Отправка запроса к AI
      const response = await aiCoreService.sendMessage(userMessage);
      
      // Обработка ответа
      const aiText = response.response;
      
      // Простая обработка текста для выделения инсайтов
      // В реальном приложении можно использовать более сложную логику или парсинг структурированного формата
      const lines = aiText.split('\n').filter(line => line.trim().length > 0);
      const processedInsights = lines
        .filter(line => line.includes('- ') || line.includes('• ') || /^\d+\./.test(line))
        .map(line => line.replace(/^- |^• |^\d+\.\s*/, ''))
        .filter(line => line.length > 10);
      
      // Если не удалось выделить инсайты, используем весь текст
      const newInsights = processedInsights.length > 0 
        ? processedInsights 
        : [aiText.substring(0, 200) + '...'];
      
      await saveInsights(newInsights);
    } catch (error) {
      console.error('Ошибка AI-анализа целей:', error);
      setInsights(['Произошла ошибка при анализе целей. Пожалуйста, попробуйте позже.']);
    } finally {
      setLoading(false);
    }
  };

  // Получение рекомендаций для новых целей
  const getGoalRecommendations = async (): Promise<Partial<Goal>[]> => {
    try {
      setLoading(true);
      
      // Подготовка данных для отправки
      const userMessage = "Предложи три стратегические цели, которые могли бы быть полезны для развития. Учти мои существующие цели и интересы.";
      
      // Отправка запроса к AI
      const response = await aiCoreService.sendMessage(userMessage);
      
      // Обрабатываем ответ, чтобы извлечь структурированные рекомендации
      const aiText = response.response;
      
      // Разбиваем текст на отдельные рекомендации
      const recommendations: Partial<Goal>[] = [];
      
      // Простой парсинг: ищем заголовки и описания целей
      const lines = aiText.split('\n');
      let currentGoal: Partial<Goal> | null = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Начало новой цели
        if (trimmedLine.match(/^\d+\.|^-\s+|^•\s+/) && trimmedLine.length > 5) {
          // Если у нас уже была цель, добавляем её в список
          if (currentGoal && currentGoal.title) {
            recommendations.push(currentGoal);
          }
          
          // Начинаем новую цель
          const titleText = trimmedLine.replace(/^\d+\.|^-\s+|^•\s+/, '').trim();
          currentGoal = {
            title: titleText,
            description: '',
            status: 'not_started',
            progress: 0
          };
        } 
        // Добавляем текст к описанию текущей цели
        else if (currentGoal && trimmedLine.length > 0) {
          currentGoal.description += (currentGoal.description ? '\n' : '') + trimmedLine;
        }
      }
      
      // Добавляем последнюю цель
      if (currentGoal && currentGoal.title) {
        recommendations.push(currentGoal);
      }
      
      // Если не удалось выделить рекомендации, создаем базовые
      if (recommendations.length === 0) {
        recommendations.push(
          {
            title: 'Улучшение профессиональных навыков',
            description: 'Развитие ключевых компетенций в вашей профессиональной области.',
            status: 'not_started',
            progress: 0
          },
          {
            title: 'Укрепление физического здоровья',
            description: 'Регулярные тренировки, правильное питание и достаточный отдых.',
            status: 'not_started',
            progress: 0
          },
          {
            title: 'Развитие эмоционального интеллекта',
            description: 'Улучшение навыков управления эмоциями и взаимодействия с другими людьми.',
            status: 'not_started',
            progress: 0
          }
        );
      }
      
      return recommendations;
    } catch (error) {
      console.error('Ошибка получения рекомендаций для целей:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Трансформация высокоуровневой цели в структурированный план
  const transformAspirationalGoal = async (aspirationalText: string): Promise<Goal> => {
    try {
      setLoading(true);
      
      // Подготовка данных для отправки
      const userMessage = `Помоги трансформировать мою высокоуровневую цель "${aspirationalText}" в структурированный план с измеримыми подцелями.`;
      
      // Отправка запроса к AI
      const response = await aiCoreService.sendMessage(userMessage);
      
      // Создаем главную цель
      const mainGoal: Goal = {
        id: Date.now().toString(),
        title: aspirationalText,
        description: 'Цель создана на основе вашего запроса и разбита на конкретные шаги.',
        status: 'not_started',
        progress: 0,
        children: []
      };
      
      // Обрабатываем ответ, чтобы извлечь подцели
      const aiText = response.response;
      const lines = aiText.split('\n');
      
      // Простой алгоритм извлечения подцелей
      const subGoals: Goal[] = [];
      let currentSubGoal: Partial<Goal> | null = null;
      
      for (const line of lines) {
        const trimmedLine = line.trim();
        
        // Идентифицируем заголовки подцелей
        if ((trimmedLine.match(/^\d+\.|^-\s+|^•\s+/) || trimmedLine.match(/^Подцель \d+:/i)) && trimmedLine.length > 5) {
          // Если у нас уже была подцель, добавляем её в список
          if (currentSubGoal && currentSubGoal.title) {
            subGoals.push({
              id: Date.now().toString() + subGoals.length,
              title: currentSubGoal.title,
              description: currentSubGoal.description || '',
              status: 'not_started',
              progress: 0,
              parentId: mainGoal.id
            });
          }
          
          // Начинаем новую подцель
          const titleText = trimmedLine
            .replace(/^\d+\.|^-\s+|^•\s+|^Подцель \d+:/i, '')
            .trim();
          
          currentSubGoal = {
            title: titleText,
            description: ''
          };
        } 
        // Добавляем текст к описанию текущей подцели
        else if (currentSubGoal && trimmedLine.length > 0 && !trimmedLine.startsWith('Главная цель:')) {
          currentSubGoal.description += (currentSubGoal.description ? '\n' : '') + trimmedLine;
        }
      }
      
      // Добавляем последнюю подцель
      if (currentSubGoal && currentSubGoal.title) {
        subGoals.push({
          id: Date.now().toString() + subGoals.length,
          title: currentSubGoal.title,
          description: currentSubGoal.description || '',
          status: 'not_started',
          progress: 0,
          parentId: mainGoal.id
        });
      }
      
      // Если не удалось выделить подцели, создаем базовые
      if (subGoals.length === 0) {
        subGoals.push(
          {
            id: Date.now().toString() + '1',
            title: 'Исследовать детали и требования цели',
            description: 'Определить конкретные критерии успеха и необходимые ресурсы.',
            status: 'not_started',
            progress: 0,
            parentId: mainGoal.id
          },
          {
            id: Date.now().toString() + '2',
            title: 'Разработать план действий',
            description: 'Определить конкретные шаги и временные рамки для достижения цели.',
            status: 'not_started',
            progress: 0,
            parentId: mainGoal.id
          },
          {
            id: Date.now().toString() + '3',
            title: 'Начать реализацию и отслеживать прогресс',
            description: 'Приступить к выполнению плана и регулярно оценивать продвижение.',
            status: 'not_started',
            progress: 0,
            parentId: mainGoal.id
          }
        );
      }
      
      // Добавляем подцели к главной цели
      mainGoal.children = subGoals;
      
      // Сохраняем новую структуру целей
      const updatedGoals = [...goals, mainGoal];
      await saveGoals(updatedGoals);
      
      return mainGoal;
    } catch (error) {
      console.error('Ошибка трансформации цели:', error);
      throw new Error('Не удалось преобразовать цель в структурированный план.');
    } finally {
      setLoading(false);
    }
  };

  return {
    goals,
    insights,
    loading,
    refreshData,
    getGoalById,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalProgress,
    analyzeGoals,
    getGoalRecommendations,
    transformAspirationalGoal
  };
}