import { useColorScheme as useNativeColorScheme } from 'react-native';

// Расширяем тип ColorScheme, чтобы он мог быть 'light', 'dark' или null, но не undefined
export type ColorSchemeType = 'light' | 'dark' | null;

export function useColorScheme(): ColorSchemeType {
  // Приводим тип из react-native к нашему типу
  const colorScheme = useNativeColorScheme();
  
  // Если colorScheme равен undefined, то возвращаем null
  return colorScheme === undefined ? null : colorScheme;
}