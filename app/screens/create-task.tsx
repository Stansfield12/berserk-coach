import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function CreateTaskScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Создание новой задачи</Text>
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