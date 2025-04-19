import AsyncStorage from '@react-native-async-storage/async-storage';
import { aiCoreService } from './ai/aiCoreService';
import { memoryEngine } from './ai/memoryEngine';

// Journal entry structure
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
  mood?: number; // 1-10 scale
  aiAnalysis?: {
    insights: string[];
    sentiment: number; // -1 to 1
    keywords: string[];
  };
  relatedGoals?: string[];
}

// Keys for storage
const JOURNAL_ENTRIES_KEY = 'berserk_journal_entries';
const JOURNAL_TAGS_KEY = 'berserk_journal_tags';

/**
 * Journal Service for working with user's journal entries
 */
class JournalService {
  private static instance: JournalService;
  
  private constructor() {
    // Initialize service
  }
  
  public static getInstance(): JournalService {
    if (!JournalService.instance) {
      JournalService.instance = new JournalService();
    }
    return JournalService.instance;
  }
  
  /**
   * Get all journal entries
   */
  public async getAllEntries(): Promise<JournalEntry[]> {
    try {
      const entriesData = await AsyncStorage.getItem(JOURNAL_ENTRIES_KEY);
      
      if (entriesData) {
        const entries: JournalEntry[] = JSON.parse(entriesData);
        
        // Sort by timestamp (newest first)
        return entries.sort((a, b) => 
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get journal entries:', error);
      return [];
    }
  }
  
  /**
   * Get a specific journal entry by ID
   */
  public async getEntryById(entryId: string): Promise<JournalEntry | null> {
    try {
      const entries = await this.getAllEntries();
      const entry = entries.find(e => e.id === entryId);
      return entry || null;
    } catch (error) {
      console.error(`Failed to get journal entry ${entryId}:`, error);
      return null;
    }
  }
  
  /**
   * Create a new journal entry
   */
  public async createEntry(entryData: Partial<JournalEntry>): Promise<JournalEntry> {
    try {
      const now = new Date().toISOString();
      
      // Create new entry
      const newEntry: JournalEntry = {
        id: `journal_${Date.now()}`,
        title: entryData.title || `Запись от ${new Date().toLocaleDateString()}`,
        content: entryData.content || '',
        timestamp: now,
        tags: entryData.tags || [],
        mood: entryData.mood,
        relatedGoals: entryData.relatedGoals || []
      };
      
      // If content is long enough, analyze it
      if (newEntry.content.length > 30) {
        const analysis = await this.analyzeEntry(newEntry.content);
        newEntry.aiAnalysis = analysis;
      }
      
      // Add to existing entries
      const entries = await this.getAllEntries();
      entries.unshift(newEntry);
      
      // Save updated entries
      await AsyncStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
      
      // Update tags
      await this.updateTags(newEntry.tags);
      
      // Save to memory engine for context retrieval
      await memoryEngine.saveJournalEntry(newEntry.content, newEntry.tags);
      
      return newEntry;
    } catch (error) {
      console.error('Failed to create journal entry:', error);
      throw new Error('Failed to create journal entry');
    }
  }
  
  /**
   * Update an existing journal entry
   */
  public async updateEntry(entryId: string, updates: Partial<JournalEntry>): Promise<JournalEntry> {
    try {
      const entries = await this.getAllEntries();
      const entryIndex = entries.findIndex(entry => entry.id === entryId);
      
      if (entryIndex === -1) {
        throw new Error(`Journal entry ${entryId} not found`);
      }
      
      // Check if content was updated and is substantial
      const contentChanged = updates.content && 
                             updates.content !== entries[entryIndex].content &&
                             updates.content.length > 30;
      
      // Update the entry
      const updatedEntry = {
        ...entries[entryIndex],
        ...updates,
        // Don't override these fields unless explicitly provided
        id: entryId,
        timestamp: updates.timestamp || entries[entryIndex].timestamp
      };
      
      // If content changed significantly, re-analyze
      if (contentChanged) {
        const analysis = await this.analyzeEntry(updatedEntry.content);
        updatedEntry.aiAnalysis = analysis;
      }
      
      // Update entries array
      entries[entryIndex] = updatedEntry;
      
      // Save updated entries
      await AsyncStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(entries));
      
      // Update tags if they changed
      if (updates.tags) {
        await this.updateTags(this.getAllUniqueTags(entries));
      }
      
      return updatedEntry;
    } catch (error) {
      console.error(`Failed to update journal entry ${entryId}:`, error);
      throw new Error('Failed to update journal entry');
    }
  }
  
  /**
   * Delete a journal entry
   */
  public async deleteEntry(entryId: string): Promise<void> {
    try {
      const entries = await this.getAllEntries();
      const updatedEntries = entries.filter(entry => entry.id !== entryId);
      
      // Save updated entries
      await AsyncStorage.setItem(JOURNAL_ENTRIES_KEY, JSON.stringify(updatedEntries));
      
      // Update tags
      const uniqueTags = this.getAllUniqueTags(updatedEntries);
      await this.updateTags(uniqueTags);
    } catch (error) {
      console.error(`Failed to delete journal entry ${entryId}:`, error);
      throw new Error('Failed to delete journal entry');
    }
  }
  
  /**
   * Get journal entries by tag
   */
  public async getEntriesByTag(tag: string): Promise<JournalEntry[]> {
    try {
      const entries = await this.getAllEntries();
      return entries.filter(entry => entry.tags.includes(tag));
    } catch (error) {
      console.error(`Failed to get entries by tag ${tag}:`, error);
      return [];
    }
  }
  
  /**
   * Get all available tags
   */
  public async getAllTags(): Promise<string[]> {
    try {
      const tagsData = await AsyncStorage.getItem(JOURNAL_TAGS_KEY);
      return tagsData ? JSON.parse(tagsData) : [];
    } catch (error) {
      console.error('Failed to get journal tags:', error);
      return [];
    }
  }
  
  /**
   * Search journal entries
   */
  public async searchEntries(query: string): Promise<JournalEntry[]> {
    try {
      if (!query.trim()) return [];
      
      const entries = await this.getAllEntries();
      const searchTerms = query.toLowerCase().split(' ');
      
      return entries.filter(entry => {
        const titleMatch = entry.title.toLowerCase().includes(query.toLowerCase());
        const contentMatch = entry.content.toLowerCase().includes(query.toLowerCase());
        const tagMatches = entry.tags.some(tag => 
          searchTerms.some(term => tag.toLowerCase().includes(term))
        );
        
        return titleMatch || contentMatch || tagMatches;
      });
    } catch (error) {
      console.error(`Failed to search entries with query "${query}":`, error);
      return [];
    }
  }
  
  /**
   * Get insights about journal entries
   */
  public async getJournalInsights(): Promise<string[]> {
    try {
      const entries = await this.getAllEntries();
      
      if (entries.length < 3) {
        return ['Добавьте больше записей в дневник для получения инсайтов.'];
      }
      
      // Extract content from the 10 most recent entries
      const recentEntries = entries.slice(0, 10);
      const entriesText = recentEntries.map(entry => 
        `Дата: ${new Date(entry.timestamp).toLocaleDateString()}\nНастроение: ${entry.mood || 'не указано'}\n${entry.content}`
      ).join('\n\n---\n\n');
      
      // Prepare message for AI
      const userMessage = `Проанализируй мои последние записи в дневнике и дай 3-5 инсайтов о моих паттернах мышления, эмоциях и возможностях для роста:\n\n${entriesText}`;
      
      // Get AI response
      const response = await aiCoreService.sendMessage(userMessage);
      
      // Parse insights from the response
      const aiText = response.response;
      const lines = aiText.split('\n').filter(line => line.trim().length > 0);
      
      const insights = lines
        .filter(line => line.includes('- ') || line.includes('• ') || /^\d+\./.test(line))
        .map(line => line.replace(/^- |^• |^\d+\.\s*/, ''))
        .filter(line => line.length > 10 && !line.toLowerCase().includes('записей недостаточно'));
      
      return insights.length > 0 ? insights : 
        ['Проанализировав ваши записи, я обнаружил интересные паттерны мышления и области для потенциального роста.'];
    } catch (error) {
      console.error('Failed to get journal insights:', error);
      return ['Не удалось проанализировать записи дневника.'];
    }
  }
  
  /**
   * Get AI reflection on a specific journal entry
   */
  public async getEntryReflection(entryId: string): Promise<string> {
    try {
      const entry = await this.getEntryById(entryId);
      
      if (!entry) {
        throw new Error(`Journal entry ${entryId} not found`);
      }
      
      // Prepare message for AI
      const userMessage = `Это моя запись в дневнике. Пожалуйста, дай глубокую, вдумчивую рефлексию на неё, выдели ключевые моменты и предложи конструктивные идеи для дальнейшего размышления:\n\n${entry.content}`;
      
      // Get AI response
      const response = await aiCoreService.sendMessage(userMessage);
      
      return response.response;
    } catch (error) {
      console.error(`Failed to get reflection for entry ${entryId}:`, error);
      return 'Не удалось создать рефлексию для этой записи.';
    }
  }
  
  /**
   * Analyze a journal entry's content
   */
  private async analyzeEntry(content: string): Promise<JournalEntry['aiAnalysis']> {
    try {
      // Default analysis in case API call fails
      const defaultAnalysis = {
        insights: [],
        sentiment: 0,
        keywords: []
      };
      
      // Prepare message for AI
      const userMessage = `Проанализируй эту запись и предоставь:
1. 2-3 ключевых инсайта (что можно извлечь из этой записи)
2. Общий эмоциональный тон от -1 (очень негативный) до 1 (очень позитивный)
3. 5-7 ключевых слов или фраз

Запись: ${content}

Пожалуйста, верни результаты в формате JSON с полями "insights", "sentiment" и "keywords".`;
      
      // Get AI response
      const response = await aiCoreService.sendMessage(userMessage);
      
      // Try to parse JSON response
      try {
        // Look for JSON structure in the response
        const jsonMatch = response.response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const analysis = JSON.parse(jsonMatch[0]);
          
          // Validate structure
          if (Array.isArray(analysis.insights) && 
              typeof analysis.sentiment === 'number' && 
              Array.isArray(analysis.keywords)) {
            return {
              insights: analysis.insights.slice(0, 3),
              sentiment: Math.max(-1, Math.min(1, analysis.sentiment)), // Clamp between -1 and 1
              keywords: analysis.keywords.slice(0, 7)
            };
          }
        }
        
        // If no valid JSON found, extract information manually
        const lines = response.response.split('\n');
        const insights = lines
          .filter(line => line.includes('инсайт') || line.includes('insight'))
          .map(line => line.replace(/.*:\s*/, '').trim())
          .filter(line => line.length > 5)
          .slice(0, 3);
        
        const sentimentLine = lines.find(line => /sentiment|тон|эмоциональный/i.test(line));
        let sentiment = 0;
        if (sentimentLine) {
          const sentimentMatch = sentimentLine.match(/(-?\d+(\.\d+)?)/);
          if (sentimentMatch) {
            sentiment = Math.max(-1, Math.min(1, parseFloat(sentimentMatch[1])));
          }
        }
        
        const keywordsLine = lines.find(line => /keywords|ключевые слова/i.test(line));
        let keywords: string[] = [];
        if (keywordsLine) {
          keywords = keywordsLine
            .replace(/.*:\s*/, '')
            .split(/,|;/)
            .map(word => word.trim())
            .filter(word => word.length > 0)
            .slice(0, 7);
        }
        
        return {
          insights,
          sentiment,
          keywords
        };
      } catch (error) {
        console.error('Failed to parse AI analysis:', error);
        return defaultAnalysis;
      }
    } catch (error) {
      console.error('Failed to analyze journal entry:', error);
      return {
        insights: [],
        sentiment: 0,
        keywords: []
      };
    }
  }
  
  /**
   * Update tags in storage
   */
  private async updateTags(newTags: string[]): Promise<void> {
    try {
      // Get existing tags
      const existingTagsData = await AsyncStorage.getItem(JOURNAL_TAGS_KEY);
      const existingTags: string[] = existingTagsData ? JSON.parse(existingTagsData) : [];
      
      // Merge and deduplicate tags
      const mergedTags = Array.from(new Set([...existingTags, ...newTags]));
      
      // Save updated tags
      await AsyncStorage.setItem(JOURNAL_TAGS_KEY, JSON.stringify(mergedTags));
    } catch (error) {
      console.error('Failed to update journal tags:', error);
    }
  }
  
  /**
   * Extract all unique tags from entries
   */
  private getAllUniqueTags(entries: JournalEntry[]): string[] {
    const allTags = entries.flatMap(entry => entry.tags);
    return Array.from(new Set(allTags));
  }
}

export const journalService = JournalService.getInstance();