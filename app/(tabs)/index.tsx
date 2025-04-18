import { View, Text, StyleSheet, ScrollView, Button } from 'react-native';
import Screen from '@/components/Screen';

export default function HomeScreen() {
  const name = 'Берсерк'; // позже подгружается из настроек
  const focus = '📌 Фокус дня: дисциплина';
  const goal = '🎯 Цель недели: MVP архитектура';

  return (
    <Screen scroll>
      <Text style={styles.title}>Добро пожаловать, {name} 👊</Text>

      <View style={styles.block}>
        <Text style={styles.label}>{focus}</Text>
        <Text style={styles.label}>{goal}</Text>
      </View>

      <View style={styles.actions}>
        <Button title="💬 Поговорить с ментором" onPress={() => {}} />
        <Button title="🗓 Составить план" onPress={() => {}} />
        <Button title="📓 Сделать запись в дневник" onPress={() => {}} />
      </View>

      <View style={styles.block}>
        <Text style={styles.sectionTitle}>Сегодня:</Text>
        <Text style={styles.item}>- Встать в 6:30</Text>
        <Text style={styles.item}>- Собрать структуру planner.ts</Text>
        <Text style={styles.item}>- Прогуляться 30 минут</Text>
      </View>

      <View style={styles.quote}>
        <Text style={styles.quoteText}>
          “Сила — это не контроль над другими, а над собой.” — GPT-Папа
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
    padding: 20,
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    color: '#0f0',
    fontSize: 16,
    marginBottom: 6,
  },
  block: {
    marginBottom: 20,
  },
  actions: {
    gap: 10,
    marginBottom: 20,
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    marginBottom: 10,
  },
  item: {
    color: '#ccc',
    fontSize: 15,
    marginBottom: 4,
  },
  quote: {
    marginTop: 30,
    padding: 16,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  quoteText: {
    color: '#888',
    fontStyle: 'italic',
    fontSize: 14,
  },
});
