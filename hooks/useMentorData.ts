import { useState, useEffect } from 'react';
import { aiCoreService } from '@/services/ai/aiCoreService';
import { personalityEngine } from '@/services/ai/personalityEngine';
import { Message, PersonaProfile } from '@/types/ai';

export enum MessageType {
  User = 'user',
  Mentor = 'mentor',
  System = 'system',
}

export interface MentorMessage {
  id: string;
  text: string;
  type: MessageType;
  timestamp: number;
  attachedData?: any;
}

/**
 * Hook for interacting with the AI mentor
 */
export function useMentorData() {
  const [messages, setMessages] = useState<MentorMessage[]>([]);
  const [personas, setPersonas] = useState<PersonaProfile[]>([]);
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>('commander');
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize data on component mount
  useEffect(() => {
    const initMentor = async () => {
      try {
        setLoading(true);
        
        // Load all personas
        const availablePersonas = await personalityEngine.getAllPersonas();
        setPersonas(availablePersonas);
        
        // Load current persona
        const currentPersona = await aiCoreService.getCurrentPersona();
        if (currentPersona) {
          setSelectedPersonaId(currentPersona.id);
        }
        
        // Load message history
        const history = await aiCoreService.getMessageHistory();
        const formattedMessages = transformMessages(history);
        setMessages(formattedMessages);
      } catch (error) {
        console.error('Failed to initialize mentor data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    initMentor();
  }, []);

  /**
   * Transform message format from AI service to UI format
   */
  const transformMessages = (messages: Message[]): MentorMessage[] => {
    return messages.map(msg => ({
      id: msg.id,
      text: msg.content,
      type: msg.role === 'user' ? MessageType.User : 
            msg.role === 'system' ? MessageType.System : MessageType.Mentor,
      timestamp: new Date(msg.timestamp).getTime(),
    }));
  };

  /**
   * Send a message to the AI mentor
   */
  const sendMessage = async (text: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Add user message to UI immediately
      const userMessage: MentorMessage = {
        id: `msg_${Date.now()}`,
        text,
        type: MessageType.User,
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, userMessage]);
      
      // Send to AI service and get response
      const response = await aiCoreService.sendMessage(text);
      
      // Add AI response to UI
      const aiMessage: MentorMessage = {
        id: `msg_${Date.now() + 1}`,
        text: response.response,
        type: MessageType.Mentor,
        timestamp: Date.now() + 1
      };
      
      setMessages(prevMessages => [...prevMessages, aiMessage]);
      
      // Process any actions returned
      if (response.actions && response.actions.length > 0) {
        // In a full implementation, we would dispatch these actions to Redux
        // For now, we'll just log them
        console.log('Actions to perform:', response.actions);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      const errorMessage: MentorMessage = {
        id: `msg_${Date.now() + 1}`,
        text: 'Произошла ошибка при обработке сообщения. Пожалуйста, попробуйте еще раз.',
        type: MessageType.System,
        timestamp: Date.now() + 1
      };
      
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Change the mentor's persona
   */
  const setPersona = async (personaId: string): Promise<void> => {
    try {
      setLoading(true);
      
      // Find the persona
      const persona = personas.find(p => p.id === personaId);
      if (!persona) {
        throw new Error(`Persona ${personaId} not found`);
      }
      
      // Update selected persona state
      setSelectedPersonaId(personaId);
      
      // Update in AI service
      await aiCoreService.loadPersona(personaId);
      
      // Add system message about persona change
      const systemMessage: MentorMessage = {
        id: `msg_${Date.now()}`,
        text: `Персона ментора изменена на "${persona.name}"`,
        type: MessageType.System,
        timestamp: Date.now()
      };
      
      setMessages(prevMessages => [...prevMessages, systemMessage]);
      
      // Add welcome message from new persona
      const welcomeMessage: MentorMessage = {
        id: `msg_${Date.now() + 1}`,
        text: persona.welcomeMessage,
        type: MessageType.Mentor,
        timestamp: Date.now() + 1
      };
      
      setMessages(prevMessages => [...prevMessages, welcomeMessage]);
    } catch (error) {
      console.error('Error changing persona:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Clear the conversation history
   */
  const clearConversation = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Clear conversation in AI service
      await aiCoreService.clearConversation();
      
      // Get the initial welcome message
      const history = await aiCoreService.getMessageHistory();
      const formattedMessages = transformMessages(history);
      
      // Update messages state
      setMessages(formattedMessages);
    } catch (error) {
      console.error('Error clearing conversation:', error);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Functions for voice input (placeholder implementations)
   */
  const startVoiceInput = (): void => {
    // In a real implementation, this would start recording and transcribing voice
    console.log('Voice recording started');
  };

  const stopVoiceInput = (): void => {
    // In a real implementation, this would stop recording, finalize transcription,
    // and send the transcribed message to the mentor
    console.log('Voice recording stopped');
    
    // Simulate voice input by sending a placeholder message
    setTimeout(() => {
      sendMessage('Это сообщение от голосового ввода');
    }, 1000);
  };

  return {
    messages,
    personas,
    selectedPersonaId,
    loading,
    sendMessage,
    setPersona,
    startVoiceInput,
    stopVoiceInput,
    clearConversation
  };
}