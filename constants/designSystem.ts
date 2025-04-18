// Константы дизайн-системы для всего приложения

export const COLORS = {
    // Основные цвета
    primary: '#E53935', // Основной цвет (красный)
    primaryDark: '#C62828', // Темный вариант основного цвета
    secondary: '#455A64', // Вторичный цвет
    success: '#4CAF50', // Успех
    warning: '#FF9800', // Предупреждение
    error: '#F44336', // Ошибка
    
    // Цвета фона
    background: '#FFFFFF', // Основной фон (светлая тема)
    backgroundDark: '#121212', // Основной фон (темная тема)
    backgroundSecondary: '#F5F5F5', // Вторичный фон (светлая тема)
    backgroundSecondaryDark: '#1E1E1E', // Вторичный фон (темная тема)
    
    // Цвета текста
    text: '#1A1A1A', // Основной текст (светлая тема)
    textDark: '#F5F5F5', // Основной текст (темная тема)
    textSecondary: '#6E6E6E', // Вторичный текст (светлая тема)
    textSecondaryDark: '#AAAAAA', // Вторичный текст (темная тема)
    textTertiary: '#9E9E9E', // Третичный текст (светлая тема)
    textTertiaryDark: '#757575', // Третичный текст (темная тема)
    
    // Другие цвета UI
    border: '#E0E0E0', // Границы (светлая тема)
    borderDark: '#333333', // Границы (темная тема)
    disabled: '#BDBDBD', // Отключенные элементы
    white: '#FFFFFF', // Белый
    black: '#000000', // Черный
    transparent: 'transparent', // Прозрачный
  };
  
  export const FONTS = {
    regular: 'System', // Обычный шрифт (заменить на конкретный, если используется кастомный)
    medium: 'System', // Средний
    semiBold: 'System', // Полужирный
    bold: 'System', // Жирный
  };
  
  export const SHADOWS = {
    small: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    medium: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.2,
      shadowRadius: 4,
      elevation: 4,
    },
    large: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 5 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 8,
    },
  };
  
  export const SPACING = {
    xs: 4,
    s: 8,
    m: 16,
    l: 24,
    xl: 32,
    xxl: 48,
  };
  
  export const BORDER_RADIUS = {
    small: 4,
    medium: 8,
    large: 12,
    xl: 16,
    round: 999, // Для круглых элементов
  };