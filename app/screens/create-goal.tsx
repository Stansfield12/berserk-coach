import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams } from 'expo-router';

export default function CreateGoalScreen() {
  // Получаем параметры из навигации
  const { parentGoalId } = useLocalSearchParams<{ parentGoalId: string }>();

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {parentGoalId 
          ? `Создание подцели для цели с ID: ${parentGoalId}` 
          : 'Создание новой цели'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontSize: 16,
  },
});