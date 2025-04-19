import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message, PersonaProfile, SystemIntent } from '@/types/ai';
import { AppAction } from '@/types/app';
import { memoryEngine } from './memoryEngine';
import { actionInterpreter } from './actionInterpreter';
import { personalityEngine } from './personalityEngine';
import { userProfileEngine } from './userProfileEngine';

// API Keys should be stored securely in environment variables or secure storage
const API_KEY = process.env.OPENAI_API_KEY || '';

class AICoreService {
  private static instance: AICoreService;
  private currentPersona: PersonaProfile | null = null;
  private conversationId: string | null = null;
  private contextWindow: Message[] = [];
  private systemInstructions: string = '';

  private constructor() {
    // Initialize with default persona
    this.loadPersona('default');
    this.initConversation();
  }

  public static getInstance(): AICoreService {
    if (!AICoreService.instance) {
      AICoreService.instance = new AICoreService();
    }
    return AICoreService.instance;
  }

  /**
   * Initializes or loads an existing conversation
   */
  public async initConversation(): Promise<void> {
    try {
      // Generate or retrieve conversation ID
      const storedId = await AsyncStorage.getItem('current_conversation_id');
      
      if (storedId) {
        this.conversationId = storedId;
        // Load context window from memory engine
        this.contextWindow = await memoryEngine.getRecentMessages(storedId, 10);
      } else {
        this.conversationId = `conv_${Date.now()}`;
        await AsyncStorage.setItem('current_conversation_id', this.conversationId);
      }
      
      // Build system instructions based on current persona
      this.buildSystemInstructions();
      
    } catch (error) {
      console.error('Failed to initialize conversation:', error);
      throw new Error('Conversation initialization failed');
    }
  }

  /**
   * Sends a message to the AI and gets a response
   * @param userMessage User's message text
   * @returns AI response and any system actions
   */
  public async sendMessage(userMessage: string): Promise<{
    response: string;
    actions?: AppAction[];
  }> {
    try {
      if (!this.conversationId) {
        await this.initConversation();
      }

      // Create user message object
      const message: Message = {
        id: `msg_${Date.now()}`,
        role: 'user',
        content: userMessage,
        timestamp: new Date().toISOString()
      };

      // Add to context window
      this.contextWindow.push(message);
      
      // Save to memory
      await memoryEngine.saveMessage(this.conversationId!, message);

      // Get relevant memories
      const relevantMemories = await memoryEngine.retrieveRelevantContext(userMessage, 3);
      
      // Get user profile insights
      const userProfile = await userProfileEngine.getCurrentProfile();
      
      // Build messages array for API request
      const messages = this.buildMessagePayload(relevantMemories, userProfile);
      
      // Call OpenAI API
      const response = await this.callOpenAI(messages);
      
      // Parse system intents if any
      const { text, intents } = this.parseResponse(response);
      
      // Process any system intents
      const actions = await this.processSystemIntents(intents);
      
      // Create AI message
      const aiMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: text,
        timestamp: new Date().toISOString()
      };
      
      // Add to context window
      this.contextWindow.push(aiMessage);
      
      // Save to memory
      await memoryEngine.saveMessage(this.conversationId!, aiMessage);
      
      // Update user profile with new insights
      await userProfileEngine.updateFromInteraction(userMessage, text);
      
      return {
        response: text,
        actions: actions
      };
    } catch (error) {
      console.error('Error sending message to AI:', error);
      return {
        response: 'Извините, произошла ошибка при обработке вашего сообщения. Пожалуйста, попробуйте еще раз.'
      };
    }
  }

  /**
   * Loads a persona profile by ID
   * @param personaId Persona identifier
   */
  public async loadPersona(personaId: string): Promise<void> {
    try {
      this.currentPersona = await personalityEngine.getPersona(personaId);
      this.buildSystemInstructions();
    } catch (error) {
      console.error(`Failed to load persona ${personaId}:`, error);
      throw new Error('Failed to load persona');
    }
  }

  /**
   * Creates or updates a custom persona
   * @param persona Persona profile to save
   */
  public async savePersona(persona: PersonaProfile): Promise<void> {
    try {
      await personalityEngine.savePersona(persona);
      
      // If this is the current persona, refresh it
      if (this.currentPersona && this.currentPersona.id === persona.id) {
        this.currentPersona = persona;
        this.buildSystemInstructions();
      }
    } catch (error) {
      console.error('Failed to save persona:', error);
      throw new Error('Failed to save persona');
    }
  }

  /**
   * Clears the current conversation and starts a new one
   */
  public async clearConversation(): Promise<void> {
    try {
      this.contextWindow = [];
      this.conversationId = `conv_${Date.now()}`;
      await AsyncStorage.setItem('current_conversation_id', this.conversationId);
      
      // Add system message to start conversation
      const welcomeMessage: Message = {
        id: `msg_${Date.now()}`,
        role: 'assistant',
        content: this.currentPersona?.welcomeMessage || 'Как я могу помочь вам сегодня?',
        timestamp: new Date().toISOString()
      };
      
      this.contextWindow.push(welcomeMessage);
      await memoryEngine.saveMessage(this.conversationId, welcomeMessage);
      
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      throw new Error('Failed to clear conversation');
    }
  }

  /**
   * Builds the system instructions based on the current persona
   */
  private buildSystemInstructions(): void {
    if (!this.currentPersona) {
      this.systemInstructions = `
        Ты - AI-ментор, который помогает пользователю достигать его целей и развиваться.
        Твой стиль общения прагматичный, конкретный и направленный на результат.
        Не предлагай медитации, релаксации, не касайся политических и общественных предрассудков.
        Фокусируйся на конкретных действиях и измеримых результатах.
        Разбивай сложные задачи на конкретные шаги.
        Давай аргументированные рекомендации.
      `;
      return;
    }

    // Build custom instructions based on persona
    this.systemInstructions = `
      Ты - AI-ментор по имени ${this.currentPersona.name}.
      ${this.currentPersona.description}
      
      Твой тон общения: ${this.currentPersona.communicationStyle.join(', ')}.
      Твои ключевые ценности: ${this.currentPersona.values.join(', ')}.
      Твой подход: ${this.currentPersona.approach}
      
      Категорически избегай: ${this.currentPersona.avoidTopics.join(', ')}.
      
      Ты должен помогать пользователю достигать конкретных целей с помощью практических советов и шагов.
      Всегда предлагай конкретные, измеримые действия с четкими критериями успеха.
      
      Ты можешь управлять приложением, используя системные команды внутри тегов <system></system>.
      Например, чтобы создать задачу: <system>create_task: {"title": "Название задачи", "priority": "high"}</system>
      
      ${this.currentPersona.customInstructions || ''}
    `;
  }

  /**
   * Builds the message payload for the API request
   */
  private buildMessagePayload(relevantMemories: string, userProfile: any): any[] {
    const messages = [
      { role: 'system', content: this.systemInstructions },
      { 
        role: 'system', 
        content: `
          Информация о пользователе:
          ${JSON.stringify(userProfile, null, 2)}
          
          Релевантный контекст из предыдущих разговоров:
          ${relevantMemories}
          
          Текущая дата и время: ${new Date().toLocaleString('ru-RU')}
        `
      }
    ];
    
    // Add conversation context (limited to last N messages)
    this.contextWindow.slice(-10).forEach(msg => {
      messages.push({
        role: msg.role,
        content: msg.content
      });
    });
    
    return messages;
  }

  /**
   * Makes the API call to OpenAI
   */
  private async callOpenAI(messages: any[]): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',
          messages: messages,
          temperature: this.currentPersona?.temperature || 0.7,
          max_tokens: 1000
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content;
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error('Failed to get response from AI');
    }
  }

  /**
   * Parses the AI response for system intents
   */
  private parseResponse(response: string): { text: string; intents: SystemIntent[] } {
    const systemIntentRegex = /<system>(.*?)<\/system>/gs;
    const intents: SystemIntent[] = [];
    let cleanText = response;
    
    let match;
    while ((match = systemIntentRegex.exec(response)) !== null) {
      try {
        const intentText = match[1].trim();
        const [action, dataStr] = intentText.split(':', 2);
        const data = dataStr ? JSON.parse(dataStr.trim()) : {};
        
        intents.push({
          action: action.trim(),
          data
        });
        
        // Remove the system intent from the clean text
        cleanText = cleanText.replace(match[0], '');
      } catch (e) {
        console.error('Failed to parse system intent:', match[1], e);
      }
    }
    
    return {
      text: cleanText.trim(),
      intents
    };
  }

  /**
   * Processes system intents and converts them to app actions
   */
  private async processSystemIntents(intents: SystemIntent[]): Promise<AppAction[]> {
    const actions: AppAction[] = [];
    
    for (const intent of intents) {
      try {
        const action = await actionInterpreter.interpretIntent(intent);
        if (action) {
          actions.push(action);
        }
      } catch (error) {
        console.error('Failed to process system intent:', intent, error);
      }
    }
    
    return actions;
  }
}

export const aiCoreService = AICoreService.getInstance();