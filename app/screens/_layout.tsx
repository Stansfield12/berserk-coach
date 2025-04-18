import { Stack } from 'expo-router';

export default function ScreensLayout() {
  return (
    <Stack>
      <Stack.Screen name="create-goal" options={{ title: 'Создание цели' }} />
      <Stack.Screen name="create-task" options={{ title: 'Создание задачи' }} />
      <Stack.Screen name="create-habit" options={{ title: 'Создание привычки' }} />
    </Stack>
  );
}