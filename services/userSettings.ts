import AsyncStorage from '@react-native-async-storage/async-storage';

const STYLE_KEY = 'berserk-style';

export async function setUserStyle(styleId: string) {
  await AsyncStorage.setItem(STYLE_KEY, styleId);
}

export async function getUserStyle(): Promise<string> {
  const raw = await AsyncStorage.getItem(STYLE_KEY);
  return raw || 'military'; // по умолчанию
}
