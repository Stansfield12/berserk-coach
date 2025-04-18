import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreateHabitScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Создание новой привычки</Text>
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