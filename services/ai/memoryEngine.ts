import AsyncStorage from '@react-native-async-storage/async-storage';
import { Message } from '@/types/ai';

/**
 * Memory Engine handles storage and retrieval of conversation history,
 * with semantic search capabilities for retrieving relevant context.
 */
class MemoryEngine {
  private static instance: MemoryEngine;
  private conversationKeyPrefix = 'conv_';
  private memoryKeyPrefix = 'memory_';
  
  private constructor() {
    // Initialize memory engine
    this.init();
  }

  public static getInstance(): MemoryEngine {
    if (!MemoryEngine.instance) {
      MemoryEngine.instance = new MemoryEngine();
    }
    return MemoryEngine.instance;
  }

  /**
   * Initialize the memory engine
   */
  private async init(): Promise<void> {
    try {
      // Any initialization logic here
      console.log('Memory Engine initialized');
    } catch (error) {
      console.error('Failed to initialize memory engine:', error);
    }
  }

  /**
   * Saves a message to the conversation history
   * @param conversationId Conversation identifier
   * @param message Message to save
   */
  public async saveMessage(conversationId: string, message: Message): Promise<void> {
    try {
      const key = `${this.conversationKeyPrefix}${conversationId}`;
      let messages: Message[] = [];
      
      // Get existing messages
      const existingData = await AsyncStorage.getItem(key);
      if (existingData) {
        messages = JSON.parse(existingData);
      }
      
      // Add new message
      messages.push(message);
      
      // Save updated messages
      await AsyncStorage.setItem(key, JSON.stringify(messages));
      
      // Store for semantic search if it's meaningful
      if (message.content.trim().length > 10) {
        await this.indexMessageForSearch(conversationId, message);
      }
    } catch (error) {
      console.error('Failed to save message:', error);
      throw new Error('Failed to save message');
    }
  }

  /**
   * Gets all messages for a conversation
   * @param conversationId Conversation identifier
   * @returns Array of messages
   */
  public async getAllMessages(conversationId: string): Promise<Message[]> {
    try {
      const key = `${this.conversationKeyPrefix}${conversationId}`;
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        return JSON.parse(data);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  /**
   * Gets the most recent N messages from a conversation
   * @param conversationId Conversation identifier
   * @param limit Maximum number of messages to retrieve
   * @returns Array of messages
   */
  public async getRecentMessages(conversationId: string, limit: number = 10): Promise<Message[]> {
    try {
      const messages = await this.getAllMessages(conversationId);
      return messages.slice(-limit);
    } catch (error) {
      console.error('Failed to get recent messages:', error);
      return [];
    }
  }

  /**
   * Clears all messages for a conversation
   * @param conversationId Conversation identifier
   */
  public async clearConversation(conversationId: string): Promise<void> {
    try {
      const key = `${this.conversationKeyPrefix}${conversationId}`;
      await AsyncStorage.removeItem(key);
      
      // Also clear memory entries for this conversation
      await this.clearMemoryForConversation(conversationId);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
      throw new Error('Failed to clear conversation');
    }
  }

  /**
   * Stores a memory item for semantic search
   * @param conversationId Conversation identifier
   * @param message Message to index
   */
  private async indexMessageForSearch(conversationId: string, message: Message): Promise<void> {
    try {
      // For this implementation, we'll use a simplified approach with keywords
      const memoryItem = {
        id: message.id,
        conversationId,
        content: message.content,
        timestamp: message.timestamp,
        role: message.role,
        keywords: this.extractKeywords(message.content)
      };
      
      const key = `${this.memoryKeyPrefix}${message.id}`;
      await AsyncStorage.setItem(key, JSON.stringify(memoryItem));
      
      // Update conversation memory index
      const indexKey = `memory_index_${conversationId}`;
      let memoryIds: string[] = [];
      
      const existingIndex = await AsyncStorage.getItem(indexKey);
      if (existingIndex) {
        memoryIds = JSON.parse(existingIndex);
      }
      
      memoryIds.push(message.id);
      await AsyncStorage.setItem(indexKey, JSON.stringify(memoryIds));
    } catch (error) {
      console.error('Failed to index message for search:', error);
    }
  }

  /**
   * Clears all memory entries for a conversation
   * @param conversationId Conversation identifier
   */
  private async clearMemoryForConversation(conversationId: string): Promise<void> {
    try {
      // Get memory index for conversation
      const indexKey = `memory_index_${conversationId}`;
      const existingIndex = await AsyncStorage.getItem(indexKey);
      
      if (existingIndex) {
        const memoryIds: string[] = JSON.parse(existingIndex);
        
        // Delete each memory item
        for (const id of memoryIds) {
          await AsyncStorage.removeItem(`${this.memoryKeyPrefix}${id}`);
        }
        
        // Clear the index
        await AsyncStorage.removeItem(indexKey);
      }
    } catch (error) {
      console.error('Failed to clear memory for conversation:', error);
    }
  }

  /**
   * Retrieves relevant context based on the query
   * @param query User's query
   * @param limit Maximum number of contexts to retrieve
   * @returns String of relevant contexts
   */
  public async retrieveRelevantContext(query: string, limit: number = 3): Promise<string> {
    try {
      // Simple keyword matching for relevance
      const queryKeywords = this.extractKeywords(query);
      const allMemoryKeys = await this.getAllMemoryKeys();
      const matchedMemories: Array<{ content: string; score: number }> = [];
      
      for (const key of allMemoryKeys) {
        const memoryData = await AsyncStorage.getItem(key);
        if (memoryData) {
          const memory = JSON.parse(memoryData);
          
          // Skip if it's a system message
          if (memory.role === 'system') continue;
          
          const memoryKeywords = memory.keywords || this.extractKeywords(memory.content);
          const matchScore = this.calculateMatchScore(queryKeywords, memoryKeywords);
          
          if (matchScore > 0) {
            matchedMemories.push({
              content: memory.content,
              score: matchScore
            });
          }
        }
      }
      
      // Sort by relevance score
      matchedMemories.sort((a, b) => b.score - a.score);
      
      // Return the top matches as a formatted string
      return matchedMemories
        .slice(0, limit)
        .map(memory => `- ${memory.content}`)
        .join('\n\n');
    } catch (error) {
      console.error('Failed to retrieve relevant context:', error);
      return '';
    }
  }

  /**
   * Extracts keywords from text for simple matching
   * @param text Text to extract keywords from
   * @returns Array of keywords
   */
  private extractKeywords(text: string): string[] {
    // A simplified keyword extraction
    return text
      .toLowerCase()
      .replace(/[^\wа-яё\s]/gi, '') // Remove punctuation (supports Cyrillic)
      .split(/\s+/) // Split by whitespace
      .filter(word => word.length > 3) // Keep only words longer than 3 chars
      .filter(word => !this.isStopWord(word)); // Remove stop words
  }

  /**
   * Checks if a word is a common stop word
   * @param word Word to check
   * @returns Whether it's a stop word
   */
  private isStopWord(word: string): boolean {
    const stopWords = [
      // English
      'and', 'the', 'that', 'this', 'with', 'for', 'from', 'have', 'will', 
      // Russian
      'это', 'как', 'что', 'где', 'когда', 'который', 'для', 'или', 'есть', 'быть'
    ];
    return stopWords.includes(word);
  }

  /**
   * Calculates a simple relevance score between query and memory keywords
   * @param queryKeywords Keywords from query
   * @param memoryKeywords Keywords from memory
   * @returns Match score (higher is more relevant)
   */
  private calculateMatchScore(queryKeywords: string[], memoryKeywords: string[]): number {
    let score = 0;
    
    for (const qWord of queryKeywords) {
      if (memoryKeywords.includes(qWord)) {
        score += 1;
      }
    }
    
    return score;
  }

  /**
   * Gets all memory keys from storage
   * @returns Array of memory keys
   */
  private async getAllMemoryKeys(): Promise<string[]> {
    try {
      const allKeys = await AsyncStorage.getAllKeys();
      return allKeys.filter(key => key.startsWith(this.memoryKeyPrefix));
    } catch (error) {
      console.error('Failed to get memory keys:', error);
      return [];
    }
  }

  /**
   * Saves a journal entry
   * @param journalEntry Journal entry content
   * @param tags Associated tags
   * @returns ID of the saved entry
   */
  public async saveJournalEntry(journalEntry: string, tags: string[] = []): Promise<string> {
    try {
      const entryId = `journal_${Date.now()}`;
      
      const entry = {
        id: entryId,
        content: journalEntry,
        tags,
        timestamp: new Date().toISOString(),
        keywords: this.extractKeywords(journalEntry)
      };
      
      // Save the entry
      await AsyncStorage.setItem(`journal_${entryId}`, JSON.stringify(entry));
      
      // Update journal index
      const indexKey = 'journal_entries';
      let journalIds: string[] = [];
      
      const existingIndex = await AsyncStorage.getItem(indexKey);
      if (existingIndex) {
        journalIds = JSON.parse(existingIndex);
      }
      
      journalIds.push(entryId);
      await AsyncStorage.setItem(indexKey, JSON.stringify(journalIds));
      
      return entryId;
    } catch (error) {
      console.error('Failed to save journal entry:', error);
      throw new Error('Failed to save journal entry');
    }
  }

  /**
   * Retrieves all journal entries
   * @returns Array of journal entries
   */
  public async getAllJournalEntries(): Promise<any[]> {
    try {
      const indexKey = 'journal_entries';
      const journalIndex = await AsyncStorage.getItem(indexKey);
      
      if (!journalIndex) return [];
      
      const journalIds: string[] = JSON.parse(journalIndex);
      const entries: any[] = [];
      
      for (const id of journalIds) {
        const entryData = await AsyncStorage.getItem(`journal_${id}`);
        if (entryData) {
          entries.push(JSON.parse(entryData));
        }
      }
      
      // Sort by timestamp (newest first)
      entries.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      
      return entries;
    } catch (error) {
      console.error('Failed to retrieve journal entries:', error);
      return [];
    }
  }

  /**
   * Retrieves relevant journal entries based on the query
   * @param query User's query
   * @param limit Maximum number of entries to retrieve
   * @returns Array of relevant journal entries
   */
  public async retrieveRelevantJournalEntries(query: string, limit: number = 3): Promise<any[]> {
    try {
      const queryKeywords = this.extractKeywords(query);
      const entries = await this.getAllJournalEntries();
      const matchedEntries: Array<{ entry: any; score: number }> = [];
      
      for (const entry of entries) {
        const entryKeywords = entry.keywords || this.extractKeywords(entry.content);
        const matchScore = this.calculateMatchScore(queryKeywords, entryKeywords);
        
        if (matchScore > 0 || query.length === 0) { // Include all if no query
          matchedEntries.push({
            entry,
            score: matchScore
          });
        }
      }
      
      // Sort by relevance score, then by date (newest first)
      matchedEntries.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        return new Date(b.entry.timestamp).getTime() - new Date(a.entry.timestamp).getTime();
      });
      
      // Return the top matches
      return matchedEntries.slice(0, limit).map(item => item.entry);
    } catch (error) {
      console.error('Failed to retrieve relevant journal entries:', error);
      return [];
    }
  }
}

export const memoryEngine = MemoryEngine.getInstance();