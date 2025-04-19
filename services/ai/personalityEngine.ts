import AsyncStorage from '@react-native-async-storage/async-storage';
import { PersonaProfile } from '@/types/ai';

/**
 * Personality Engine handles the AI mentor's persona customization
 */
class PersonalityEngine {
  private static instance: PersonalityEngine;
  private personas: Map<string, PersonaProfile> = new Map();
  private personasKey = 'mentor_personas';
  
  private constructor() {
    // Initialize with built-in personas
    this.initPersonas();
  }
  
  public static getInstance(): PersonalityEngine {
    if (!PersonalityEngine.instance) {
      PersonalityEngine.instance = new PersonalityEngine();
    }
    return PersonalityEngine.instance;
  }
  
  /**
   * Initialize persona collection
   */
  private async initPersonas() {
    try {
      // First load default/built-in personas
      this.loadBuiltInPersonas();
      
      // Then load custom personas from storage
      await this.loadCustomPersonas();
    } catch (error) {
      console.error('Failed to initialize personas:', error);
    }
  }
  
  /**
   * Loads the built-in default personas
   */
  private loadBuiltInPersonas() {
    // Strategist
    const strategist: PersonaProfile = {
      id: 'strategist',
      name: 'Стратег',
      description: 'Аналитический ментор с системным мышлением, специализирующийся на долгосрочном планировании и стратегических решениях.',
      icon: '🧠',
      communicationStyle: ['аналитический', 'логичный', 'структурированный'],
      values: ['системное мышление', 'стратегическое планирование', 'методичность'],
      approach: 'Разбивает сложные цели на структурированные планы и анализирует их выполнимость.',
      avoidTopics: ['эзотерика', 'интуитивные решения без обоснования', 'эмоционально-мотивационные речи'],
      temperature: 0.3,
      welcomeMessage: 'Приветствую. Я Стратег, и моя задача - помочь вам создать чёткую стратегию достижения ваших целей. Давайте мыслить системно.',
      isCustom: false
    };
    
    // Commander
    const commander: PersonaProfile = {
      id: 'commander',
      name: 'Командир',
      description: 'Дисциплинированный и требовательный ментор с прямым стилем общения, ориентированный на конкретные результаты.',
      icon: '👊',
      communicationStyle: ['директивный', 'лаконичный', 'требовательный'],
      values: ['дисциплина', 'ответственность', 'результат'],
      approach: 'Даёт чёткие указания и требует регулярной отчетности о прогрессе.',
      avoidTopics: ['отговорки', 'самооправдания', 'размытые цели'],
      temperature: 0.4,
      welcomeMessage: 'Слушай внимательно. Я здесь не для того, чтобы тебя жалеть. Моя задача - сделать из тебя дисциплинированного бойца, который достигает своих целей. Готов работать на результат?',
      isCustom: false
    };
    
    // Architect
    const architect: PersonaProfile = {
      id: 'architect',
      name: 'Архитектор',
      description: 'Методичный и детальный ментор, фокусирующийся на создании устойчивых систем и процессов.',
      icon: '🏗️',
      communicationStyle: ['точный', 'подробный', 'технический'],
      values: ['системность', 'оптимизация', 'качество'],
      approach: 'Создает детальные планы с проработкой всех компонентов и связей между ними.',
      avoidTopics: ['импульсивные решения', 'поверхностные подходы', 'быстрые хаки'],
      temperature: 0.2,
      welcomeMessage: 'Добро пожаловать. Я Архитектор, и я помогу вам спроектировать надежную систему для достижения ваших целей. Давайте начнем с детального анализа компонентов и зависимостей.',
      isCustom: false
    };
    
    // Catalyst
    const catalyst: PersonaProfile = {
      id: 'catalyst',
      name: 'Катализатор',
      description: 'Энергичный ментор, фокусирующийся на преодолении барьеров и запуске изменений.',
      icon: '⚡',
      communicationStyle: ['энергичный', 'побуждающий', 'динамичный'],
      values: ['действие', 'прорыв', 'момент'],
      approach: 'Мотивирует к быстрому началу действий и преодолению внутренних барьеров.',
      avoidTopics: ['чрезмерное планирование', 'перфекционизм', 'самокопание'],
      temperature: 0.6,
      welcomeMessage: 'Привет! Я Катализатор, и моя задача — зажечь в тебе огонь действия. Хватит планировать и сомневаться — пора двигаться вперед и разрушать барьеры. Готов ли ты к прорыву?',
      isCustom: false
    };
    
    // Tactical
    const tactical: PersonaProfile = {
      id: 'tactical',
      name: 'Тактик',
      description: 'Практичный ментор, специализирующийся на краткосрочном планировании и оптимизации процессов.',
      icon: '🎯',
      communicationStyle: ['конкретный', 'практичный', 'ориентированный на действия'],
      values: ['эффективность', 'оптимизация', 'практичность'],
      approach: 'Фокусируется на ближайших шагах и практических решениях.',
      avoidTopics: ['абстрактные теории', 'далекие перспективы', 'философские размышления'],
      temperature: 0.4,
      welcomeMessage: 'Приветствую. Я Тактик, и мы будем работать с конкретными, измеримыми действиями. Никакой воды — только практика. Чего вы хотите достичь в ближайшее время?',
      isCustom: false
    };
    
    // Add built-in personas to collection
    this.personas.set(strategist.id, strategist);
    this.personas.set(commander.id, commander);
    this.personas.set(architect.id, architect);
    this.personas.set(catalyst.id, catalyst);
    this.personas.set(tactical.id, tactical);
  }
  
  /**
   * Loads custom personas from storage
   */
  private async loadCustomPersonas() {
    try {
      const storedPersonas = await AsyncStorage.getItem(this.personasKey);
      
      if (storedPersonas) {
        const customPersonas: PersonaProfile[] = JSON.parse(storedPersonas);
        
        // Add custom personas to collection
        customPersonas.forEach(persona => {
          this.personas.set(persona.id, persona);
        });
      }
    } catch (error) {
      console.error('Failed to load custom personas:', error);
    }
  }
  
  /**
   * Gets all available personas
   */
  public async getAllPersonas(): Promise<PersonaProfile[]> {
    // Make sure personas are loaded
    if (this.personas.size === 0) {
      await this.initPersonas();
    }
    
    return Array.from(this.personas.values());
  }
  
  /**
   * Gets a specific persona by ID
   * @param personaId Persona identifier
   */
  public async getPersona(personaId: string): Promise<PersonaProfile> {
    // Make sure personas are loaded
    if (this.personas.size === 0) {
      await this.initPersonas();
    }
    
    const persona = this.personas.get(personaId);
    
    if (!persona) {
      // If requested persona doesn't exist, return the default
      return this.personas.get('commander') || Array.from(this.personas.values())[0];
    }
    
    return persona;
  }
  
  /**
   * Creates or updates a custom persona
   * @param persona Persona to save
   */
  public async savePersona(persona: PersonaProfile): Promise<void> {
    try {
      // Make sure personas are loaded
      if (this.personas.size === 0) {
        await this.initPersonas();
      }
      
      // Make sure it's marked as custom
      persona.isCustom = true;
      
      // If no ID, generate one
      if (!persona.id) {
        persona.id = `persona_${Date.now()}`;
      }
      
      // Add to collection
      this.personas.set(persona.id, persona);
      
      // Save custom personas to storage
      await this.saveCustomPersonas();
    } catch (error) {
      console.error('Failed to save persona:', error);
      throw new Error('Failed to save persona');
    }
  }
  
  /**
   * Deletes a custom persona
   * @param personaId Persona identifier
   */
  public async deletePersona(personaId: string): Promise<void> {
    try {
      // Make sure personas are loaded
      if (this.personas.size === 0) {
        await this.initPersonas();
      }
      
      const persona = this.personas.get(personaId);
      
      // Only custom personas can be deleted
      if (persona && persona.isCustom) {
        this.personas.delete(personaId);
        await this.saveCustomPersonas();
      } else {
        throw new Error('Cannot delete built-in persona');
      }
    } catch (error) {
      console.error(`Failed to delete persona ${personaId}:`, error);
      throw new Error('Failed to delete persona');
    }
  }
  
  /**
   * Saves all custom personas to storage
   */
  private async saveCustomPersonas(): Promise<void> {
    try {
      // Get only custom personas
      const customPersonas = Array.from(this.personas.values())
        .filter(persona => persona.isCustom);
      
      await AsyncStorage.setItem(this.personasKey, JSON.stringify(customPersonas));
    } catch (error) {
      console.error('Failed to save custom personas:', error);
      throw new Error('Failed to save custom personas');
    }
  }
  
  /**
   * Creates a duplicate of an existing persona as a starting point for customization
   * @param basePersonaId Base persona identifier
   * @param newName New name for the duplicated persona
   */
  public async duplicatePersona(basePersonaId: string, newName: string): Promise<PersonaProfile> {
    try {
      // Make sure personas are loaded
      if (this.personas.size === 0) {
        await this.initPersonas();
      }
      
      const basePersona = await this.getPersona(basePersonaId);
      
      if (!basePersona) {
        throw new Error('Base persona not found');
      }
      
      // Create a new persona based on the existing one
      const newPersona: PersonaProfile = {
        ...basePersona,
        id: `persona_${Date.now()}`,
        name: newName || `${basePersona.name} (копия)`,
        isCustom: true
      };
      
      // Save the new persona
      await this.savePersona(newPersona);
      
      return newPersona;
    } catch (error) {
      console.error('Failed to duplicate persona:', error);
      throw new Error('Failed to duplicate persona');
    }
  }
  
  /**
   * Gets recommended personas based on user profile
   * @param userProfileData User profile data for matching
   * @returns Array of recommended persona IDs with match scores
   */
  public async getRecommendedPersonas(userProfileData: any): Promise<Array<{ id: string; score: number }>> {
    try {
      // Make sure personas are loaded
      if (this.personas.size === 0) {
        await this.initPersonas();
      }
      
      const recommendations: Array<{ id: string; score: number }> = [];
      
      // Simple scoring algorithm based on key traits
      for (const [id, persona] of this.personas.entries()) {
        let score = 50; // Base score
        
        // Adjust score based on traits if available
        if (userProfileData.traits) {
          // High conscientiousness → Commander or Architect
          if (userProfileData.traits.conscientiousness > 7) {
            if (id === 'commander' || id === 'architect') score += 20;
          }
          
          // Low conscientiousness → Catalyst
          if (userProfileData.traits.conscientiousness < 4) {
            if (id === 'catalyst') score += 20;
          }
          
          // High openness → Strategist
          if (userProfileData.traits.openness > 7) {
            if (id === 'strategist') score += 15;
          }
          
          // High neuroticism → Commander (needs structure)
          if (userProfileData.traits.neuroticism > 7) {
            if (id === 'commander') score += 15;
          }
          
          // Low resilience → Tactical (small steps)
          if (userProfileData.traits.resilience < 4) {
            if (id === 'tactical') score += 15;
          }
        }
        
        // Communication preferences
        if (userProfileData.communicationPreferences) {
          // Match verbosity level
          if (userProfileData.communicationPreferences.verbosityLevel === 'concise' && 
              persona.communicationStyle.includes('лаконичный')) {
            score += 10;
          }
          
          if (userProfileData.communicationPreferences.verbosityLevel === 'detailed' && 
              persona.communicationStyle.includes('подробный')) {
            score += 10;
          }
          
          // Match feedback style
          if (userProfileData.communicationPreferences.feedbackStyle === 'direct' && 
              persona.communicationStyle.includes('директивный')) {
            score += 10;
          }
        }
        
        recommendations.push({ id, score });
      }
      
      // Sort by score (highest first)
      recommendations.sort((a, b) => b.score - a.score);
      
      return recommendations;
    } catch (error) {
      console.error('Failed to get recommended personas:', error);
      return [];
    }
  }
}

export const personalityEngine = PersonalityEngine.getInstance();