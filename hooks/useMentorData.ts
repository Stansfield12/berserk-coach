import { useState, useEffect } from 'react';

// Типы данных для ментора
export enum MessageType {
  User = 'user',
  Mentor = 'mentor',
  System = 'system',
}

export interface Message {
  id: string;
  text: string;
  type: MessageType;
  timestamp: number;
  attachedData?: any;
}

export interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Моковые данные для разработки
const mockPersonas: Persona[] = [
  {
    id: 'commander',
    name: 'Командир',
    description: 'Жесткий, структурированный ментор с фокусом на дисциплину и результаты',
    icon: '👊'
  },
  {
    id: 'strategist',
    name: 'Стратег',
    description: 'Аналитический подход с долгосрочным видением и системным мышлением',
    icon: '🧠'
  },
  {
    id: 'catalyst',
    name: 'Катализатор',
    description: 'Энергичный, мотивирующий подход для преодоления барьеров',
    icon: '⚡'
  },
  {
    id: 'architect',
    name: 'Архитектор',
    description: 'Методичный, детализированный подход для сложных проектов',
    icon: '🏗️'
  }
];

const mockMessages: Message[] = [
  {
    id: '1',
    text: 'Привет! Я твой AI-ментор. Расскажи, над какими целями ты сейчас работаешь?',
    type: MessageType.Mentor,
    timestamp: Date.now() - 86400000
  },
  {
    id: '2',
    text: 'Я работаю над MVP для своего приложения и хочу улучшить дисциплину',
    type: MessageType.User,
    timestamp: Date.now() - 86000000
  },
  {
    id: '3',
    text: 'Хорошо. Для MVP важно сосредоточиться на ключевых функциях и четко структурировать процесс разработки. Что касается дисциплины, предлагаю начать с небольших, но ежедневных обязательств. Какие конкретные шаги ты уже предпринял?',
    type: MessageType.Mentor,
    timestamp: Date.now() - 85800000
  }
];

export function useMentorData() {
  const [messages, setMessages] = useState<Message[]>(mockMessages);
  const [personas, setPersonas] = useState<Persona[]>(mockPersonas);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('commander');
  const [loading, setLoading] = useState(false);
  
  // Симуляция загрузки данных при первом рендере
  useEffect(() => {
    setLoading(true);
    
    // Имитация задержки сети
    const timer = setTimeout(() => {
      setMessages(mockMessages);
      setPersonas(mockPersonas);
      setLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Функция для отправки сообщения ментору
  const sendMessage = (text: string): void => {
    // Добавляем сообщение пользователя
    const userMessage: Message = {
      id: Date.now().toString(),
      text,
      type: MessageType.User,
      timestamp: Date.now()
    };
    
    setMessages(prevMessages => [...prevMessages, userMessage]);
    
    // Имитируем ответ ментора
    setLoading(true);
    
    setTimeout(() => {
      const mentorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: generateMentorResponse(text, selectedPersonaId),
        type: MessageType.Mentor,
        timestamp: Date.now() + 1
      };
      
      setMessages(prevMessages => [...prevMessages, mentorMessage]);
      setLoading(false);
    }, 1500);
  };
  
  // Функция для выбора персоны ментора
  const setPersona = (personaId: string): void => {
    setSelectedPersonaId(personaId);
    
    const selectedPersona = personas.find(p => p.id === personaId);
    if (selectedPersona) {
      const systemMessage: Message = {
        id: Date.now().toString(),
        text: `Персона ментора изменена на "${selectedPersona.name}"`,
        type: MessageType.System,
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, systemMessage]);
    }
  };
  
  // Функция для начала голосового ввода
  const startVoiceInput = (): void => {
    // В реальном приложении здесь был бы код для записи голоса
    console.log('Начало записи голоса');
  };
  
  // Функция для завершения голосового ввода
  const stopVoiceInput = (): void => {
    // В реальном приложении здесь был бы код для обработки записи
    console.log('Завершение записи голоса');
    
    // Имитация распознавания речи
    setTimeout(() => {
      sendMessage('Это сообщение от голосового ввода');
    }, 1000);
  };
  
  // Функция для очистки диалога
  const clearConversation = (): void => {
    // Оставляем только приветственное сообщение
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      text: 'Диалог очищен. Чем я могу помочь?',
      type: MessageType.Mentor,
      timestamp: Date.now()
    };
    
    setMessages([welcomeMessage]);
  };
  
  // Вспомогательная функция для генерации ответа ментора
  const generateMentorResponse = (userText: string, personaId: string): string => {
    // В реальном приложении здесь был бы запрос к AI API
    
    // Простая имитация разных типов ответов в зависимости от персоны
    const responses: Record<string, string[]> = {
      'commander': [
        'Конкретизируй цель. Какие точные показатели успеха?',
        'Дисциплина — это действие, а не состояние. Какой первый шаг ты сделаешь сегодня?',
        'Четкий план освобождает ресурсы для действий. Разбей задачу на конкретные этапы.'
      ],
      'strategist': [
        'Давай рассмотрим это системно. Какие факторы влияют на ситуацию?',
        'Эта задача вписывается в твои долгосрочные цели? Как именно?',
        'Интересно проанализировать, как это решение повлияет на другие аспекты проекта.'
      ],
      'catalyst': [
        'Что именно блокирует твой прогресс сейчас? Давай это преодолеем!',
        'Отличный момент для рывка! Какие ресурсы тебе нужны для ускорения?',
        'Энергия следует за фокусом. На чем нужно сконцентрироваться сегодня?'
      ],
      'architect': [
        'Давай детализируем структуру. Какие компоненты требуют проработки?',
        'Качество архитектуры определяет скорость разработки. Где могут быть узкие места?',
        'Предлагаю составить детальную схему этапов с конкретными критериями завершенности.'
      ]
    };
    
    // Выбираем случайный ответ из массива для выбранной персоны
    const personaResponses = responses[personaId] || responses['commander'];
    const randomIndex = Math.floor(Math.random() * personaResponses.length);
    
    return personaResponses[randomIndex];
  };
  
  return {
    messages,
    personas,
    selectedPersonaId,
    loading,
    sendMessage,
    setPersona,
    startVoiceInput,
    stopVoiceInput,
    clearConversation
  };
}