import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Image,
  ActivityIndicator,
  ScrollView,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

// Заглушки для данных (в реальном приложении будут из Redux или Context)
import { useMentorData } from '@/hooks/useMentorData';
import { useColorScheme } from '@/hooks/useColorScheme';

// Константы для дизайн-системы
const COLORS = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    text: '#1A1A1A',
    secondaryText: '#6E6E6E',
    primary: '#E53935',
    userBubble: '#E53935',
    mentorBubble: '#F5F5F5',
    userText: '#FFFFFF',
    mentorText: '#1A1A1A',
    separator: '#E0E0E0',
    toolbarBackground: 'rgba(255, 255, 255, 0.95)',
  },
  dark: {
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#F5F5F5',
    secondaryText: '#AAAAAA',
    primary: '#FF5252',
    userBubble: '#FF5252',
    mentorBubble: '#1E1E1E',
    userText: '#FFFFFF',
    mentorText: '#F5F5F5',
    separator: '#333333',
    toolbarBackground: 'rgba(18, 18, 18, 0.95)',
  },
};

// Типы сообщений
enum MessageType {
  User = 'user',
  Mentor = 'mentor',
  System = 'system',
}

interface Message {
  id: string;
  text: string;
  type: MessageType;
  timestamp: number;
  attachedData?: any;
}

interface Persona {
  id: string;
  name: string;
  description: string;
  icon: string;
}

// Компонент пузыря сообщения
const MessageBubble = ({ message }: { message: Message }) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  const isUser = message.type === MessageType.User;
  const isSystem = message.type === MessageType.System;
  
  if (isSystem) {
    return (
      <View style={styles.systemMessageContainer}>
        <Text style={[styles.systemMessageText, { color: colors.secondaryText }]}>
          {message.text}
        </Text>
      </View>
    );
  }
  
  return (
    <View style={[
      styles.messageBubble,
      isUser ? styles.userBubble : styles.mentorBubble,
      { 
        backgroundColor: isUser ? colors.userBubble : colors.mentorBubble,
        alignSelf: isUser ? 'flex-end' : 'flex-start',
      }
    ]}>
      <Text style={[
        styles.messageText,
        { color: isUser ? colors.userText : colors.mentorText }
      ]}>
        {message.text}
      </Text>
      
      <Text style={[
        styles.messageTime,
        { 
          color: isUser ? 'rgba(255, 255, 255, 0.7)' : colors.secondaryText,
          alignSelf: isUser ? 'flex-end' : 'flex-start',
        }
      ]}>
        {new Date(message.timestamp).toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}
      </Text>
    </View>
  );
};

// Компонент панели инструментов чата
const ChatToolbar = ({ 
  onVoiceStart, 
  onVoiceEnd,
  isRecording,
  onAttach,
  onPersonaSelect
}: { 
  onVoiceStart: () => void,
  onVoiceEnd: () => void,
  isRecording: boolean,
  onAttach: () => void,
  onPersonaSelect: () => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <View style={[
      styles.toolbarContainer,
      { backgroundColor: colors.toolbarBackground }
    ]}>
      <TouchableOpacity 
        style={styles.toolbarButton}
        onPress={onAttach}
      >
        <Ionicons name="attach" size={24} color={colors.secondaryText} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={styles.toolbarButton}
        onPress={onPersonaSelect}
      >
        <Ionicons name="person-circle-outline" size={24} color={colors.secondaryText} />
      </TouchableOpacity>
      
      <TouchableOpacity 
        style={[
          styles.voiceButton,
          { backgroundColor: isRecording ? colors.primary : colors.cardBackground }
        ]}
        onPressIn={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          onVoiceStart();
        }}
        onPressOut={onVoiceEnd}
      >
        <Ionicons 
          name={isRecording ? "radio" : "mic-outline"} 
          size={24} 
          color={isRecording ? "#FFFFFF" : colors.primary} 
        />
      </TouchableOpacity>
    </View>
  );
};

// Компонент для выбора персоны ментора
const PersonaSelector = ({ 
  personas, 
  selectedPersonaId, 
  onSelect,
  onClose
}: { 
  personas: Persona[], 
  selectedPersonaId: string, 
  onSelect: (personaId: string) => void,
  onClose: () => void
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  return (
    <View style={[
      styles.personaSelectorContainer,
      { backgroundColor: colors.cardBackground }
    ]}>
      <View style={styles.personaSelectorHeader}>
        <Text style={[styles.personaSelectorTitle, { color: colors.text }]}>
          Выберите персонажа ментора
        </Text>
        <TouchableOpacity onPress={onClose}>
          <Ionicons name="close" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
      
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.personasList}
      >
        {personas.map(persona => (
          <TouchableOpacity
            key={persona.id}
            style={[
              styles.personaItem,
              selectedPersonaId === persona.id && [
                styles.selectedPersonaItem,
                { borderColor: colors.primary }
              ]
            ]}
            onPress={() => onSelect(persona.id)}
          >
            <View style={[
              styles.personaIconContainer,
              { backgroundColor: selectedPersonaId === persona.id ? colors.primary : colors.background }
            ]}>
              <Text style={styles.personaIcon}>{persona.icon}</Text>
            </View>
            <Text style={[styles.personaName, { color: colors.text }]}>
              {persona.name}
            </Text>
            <Text 
              style={[styles.personaDescription, { color: colors.secondaryText }]}
              numberOfLines={2}
            >
              {persona.description}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

// Главный компонент MentorScreen
// Стили для компонентов
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  personaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  personaAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personaAvatarText: {
    fontSize: 20,
  },
  personaTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  personaSubtitle: {
    fontSize: 12,
  },
  headerButton: {
    padding: 8,
  },
  messagesList: {
    padding: 16,
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 12,
    borderRadius: 18,
    marginBottom: 12,
  },
  userBubble: {
    borderTopRightRadius: 4,
  },
  mentorBubble: {
    borderTopLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  messageTime: {
    fontSize: 10,
    marginTop: 4,
  },
  systemMessageContainer: {
    alignItems: 'center',
    marginVertical: 12,
  },
  systemMessageText: {
    fontSize: 12,
    fontStyle: 'italic',
  },
  typingIndicator: {
    position: 'absolute',
    bottom: 70,
    left: 16,
  },
  typingBubble: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 18,
    padding: 12,
    borderTopLeftRadius: 4,
  },
  typingDots: {
    flexDirection: 'row',
    gap: 4,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
  },
  input: {
    flex: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 120,
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolbarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toolbarButton: {
    padding: 8,
    marginRight: 8,
  },
  voiceButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  personaSelectorContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    padding: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  personaSelectorHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  personaSelectorTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  personasList: {
    paddingBottom: 8,
  },
  personaItem: {
    width: 120,
    marginRight: 12,
    padding: 12,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: 'transparent',
    alignItems: 'center',
  },
  selectedPersonaItem: {
    borderWidth: 2,
  },
  personaIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  personaIcon: {
    fontSize: 24,
  },
  personaName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 4,
  },
  personaDescription: {
    fontSize: 10,
    textAlign: 'center',
  },
  emptyChat: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 60,
  },
  welcomePersonaContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E53935',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  welcomePersonaEmoji: {
    fontSize: 40,
  },
  welcomeTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default function MentorScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Реф для списка сообщений (для автоскролла)
  const messagesListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  
  // Состояния
  const [message, setMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [showPersonaSelector, setShowPersonaSelector] = useState(false);
  
  // Получение данных через хуки (в реальном приложении из Redux)
  const { 
    messages, 
    personas,
    selectedPersonaId,
    loading, 
    sendMessage,
    setPersona,
    startVoiceInput,
    stopVoiceInput,
    clearConversation
  } = useMentorData();
  
  useEffect(() => {
    // Прокрутка к последнему сообщению при добавлении нового
    if (messages.length > 0) {
      setTimeout(() => {
        messagesListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);
  
  const handleSend = () => {
    if (message.trim().length === 0) return;
    
    sendMessage(message);
    setMessage('');
    
    // Возвращаем фокус на ввод
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  };
  
  const handleVoiceStart = () => {
    setIsRecording(true);
    startVoiceInput();
  };
  
  const handleVoiceEnd = () => {
    setIsRecording(false);
    stopVoiceInput();
  };
  
  const handleSelectPersona = (personaId: string) => {
    setPersona(personaId);
    setShowPersonaSelector(false);
    
    // Добавляем системное сообщение о смене персоны
    const selectedPersona = personas.find(p => p.id === personaId);
    if (selectedPersona) {
      // В реальном приложении это сообщение добавлялось бы через Redux action
      // но для упрощения делаем это здесь
    }
  };
  
  const handleClearConversation = () => {
    // Добавляем подтверждение
    Alert.alert(
      "Очистить диалог",
      "Вы уверены, что хотите очистить весь диалог?",
      [
        { text: "Отмена", style: "cancel" },
        { 
          text: "Очистить", 
          style: "destructive", 
          onPress: () => clearConversation() 
        }
      ]
    );
  };
  
  // Находим данные о выбранной персоне
  const selectedPersona = personas.find(p => p.id === selectedPersonaId) || personas[0];
  
  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        paddingTop: insets.top,
      }
    ]}>
      {/* Заголовок чата */}
      <View style={[
        styles.header,
        { borderBottomColor: colors.separator }
      ]}>
        <View style={styles.personaInfo}>
          <View style={styles.personaAvatar}>
            <Text style={styles.personaAvatarText}>{selectedPersona.icon}</Text>
          </View>
          <View>
            <Text style={[styles.personaTitle, { color: colors.text }]}>
              {selectedPersona.name}
            </Text>
            <Text style={[styles.personaSubtitle, { color: colors.secondaryText }]}>
              AI-Ментор
            </Text>
          </View>
        </View>
        
        <TouchableOpacity
          style={styles.headerButton}
          onPress={handleClearConversation}
        >
          <Ionicons name="trash-outline" size={24} color={colors.secondaryText} />
        </TouchableOpacity>
      </View>
      
      {/* Список сообщений */}
      <FlatList
        ref={messagesListRef}
        data={messages}
        renderItem={({ item }) => <MessageBubble message={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[
          styles.messagesList,
          { paddingBottom: insets.bottom + 60 }
        ]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyChat}>
            <View style={styles.welcomePersonaContainer}>
              <Text style={styles.welcomePersonaEmoji}>{selectedPersona.icon}</Text>
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
              {`Начните общение с ${selectedPersona.name}`}
            </Text>
            <Text style={[styles.welcomeText, { color: colors.secondaryText }]}>
              Задайте вопрос, обсудите свои цели или получите совет
            </Text>
          </View>
        )}
      />
      
      {/* Индикатор загрузки */}
      {loading && (
        <View style={styles.typingIndicator}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              <View style={[styles.typingDot, { backgroundColor: colors.secondaryText }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.secondaryText }]} />
              <View style={[styles.typingDot, { backgroundColor: colors.secondaryText }]} />
            </View>
          </View>
        </View>
      )}
      
      {/* Селектор персоны (показывается по условию) */}
      {showPersonaSelector && (
        <PersonaSelector
          personas={personas}
          selectedPersonaId={selectedPersonaId}
          onSelect={handleSelectPersona}
          onClose={() => setShowPersonaSelector(false)}
        />
      )}
      
      {/* Ввод сообщения */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        style={[
          styles.inputContainer,
          { backgroundColor: colors.toolbarBackground }
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[
            styles.input,
            { 
              backgroundColor: colors.cardBackground,
              color: colors.text,
            }
          ]}
          placeholder="Сообщение..."
          placeholderTextColor={colors.secondaryText}
          value={message}
          onChangeText={setMessage}
          multiline
          maxLength={1000}
        />
        
        {message.trim().length > 0 ? (
          <TouchableOpacity
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
            onPress={handleSend}
          >
            <Ionicons name="send" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        ) : (
          <ChatToolbar
            onVoiceStart={handleVoiceStart}
            onVoiceEnd={handleVoiceEnd}
            isRecording={isRecording}
            onAttach={() => {/* Добавить логику прикрепления файлов */}}
            onPersonaSelect={() => setShowPersonaSelector(true)}
          />
        )}
      </KeyboardAvoidingView>
    </View>
  );
}