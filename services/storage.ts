import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'berserk-history';

export async function saveMessage(msg: string) {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    const data: string[] = raw ? JSON.parse(raw) : [];
    data.unshift(msg); // Добавляем в начало
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Ошибка сохранения:', err);
  }
}

export async function getMessages(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Ошибка чтения:', err);
    return [];
  }
}

export async function clearMessages() {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Ошибка очистки:', err);
  }
}
