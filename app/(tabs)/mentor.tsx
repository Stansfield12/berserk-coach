import { View, Text, TextInput, StyleSheet, Button, ScrollView } from 'react-native';
import { useState } from 'react';
import { askMentor } from '@/services/mentor/mentor';
import { PersonaConfig } from '@/services/mentor/personaEngine';
import Screen from '@/components/Screen';

export default function MentorScreen() {
  const [input, setInput] = useState('');
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(false);

  const persona: PersonaConfig = {
    tone: 'strict',
    role: 'coach',
    values: ['логика', 'дисциплина', 'цель'],
    avoid: ['политика', 'медитации', 'общие слова'],
  };

  const send = async () => {
    setLoading(true);
    const res = await askMentor(input, persona);
    setReply(res);
    setLoading(false);
  };

  return (
    <Screen scroll>
      <Text style={styles.title}>🧠 AI-Ментор</Text>
      <TextInput
        style={styles.input}
        placeholder="Спроси что угодно..."
        placeholderTextColor="#666"
        value={input}
        onChangeText={setInput}
      />
      <Button title="Отправить" onPress={send} disabled={loading || !input} />
      <ScrollView style={styles.output}>
        <Text style={styles.reply}>{reply}</Text>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#111', padding: 20 },
  title: { color: '#fff', fontSize: 22, marginBottom: 10 },
  input: {
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  output: {
    marginTop: 20,
    backgroundColor: '#1a1a1a',
    padding: 12,
    borderRadius: 8,
    maxHeight: 300,
  },
  reply: {
    color: '#0f0',
    fontSize: 15,
  },
});
