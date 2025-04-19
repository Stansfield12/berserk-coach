import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { memoryEngine } from './memoryEngine';

// API Keys should be stored securely
const API_KEY = process.env.OPENAI_API_KEY || '';

// User profile interface
interface UserProfile {
  id: string;
  name: string;
  // Core traits (scores from 0-10)
  traits: {
    extraversion: number;    // Общительность vs замкнутость
    conscientiousness: number; // Организованность vs неорганизованность
    openness: number;        // Открытость опыту vs консервативность
    agreeableness: number;   // Дружелюбность vs критичность
    neuroticism: number;     // Тревожность vs эмоциональная стабильность
    
    // Additional customized traits
    riskTolerance: number;   // Отношение к риску
    shortTermFocus: number;  // Фокус на краткосрочных vs долгосрочных целях
    resilience: number;      // Устойчивость к неудачам
    autonomy: number;        // Самостоятельность vs потребность в поддержке
    growthMindset: number;   // Установка на рост vs фиксированное мышление
  };
  
  // Goals, priorities and values
  goals: {
    id: string;
    text: string;
    importance: number; // 1-10
    category: string;
  }[];
  
  values: string[]; // Core values identified
  
  // Communication preferences
  communicationPreferences: {
    verbosityLevel: 'concise' | 'moderate' | 'detailed';
    feedbackStyle: 'direct' | 'constructive' | 'gentle';
    learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading/writing';
    responsePreference: 'quick solutions' | 'detailed analysis' | 'guided discovery';
  };
  
  // Work and productivity patterns
  workPatterns: {
    productiveTimes: string[]; // e.g. "morning", "evening"
    focusDuration: number; // Average focus time in minutes
    primaryBarriers: string[]; // e.g. "procrastination", "distractions"
    motivationTriggers: string[]; // What motivates this person
  };
  
  // Tracked progress markers
  progressMarkers: {
    consistencyScore: number; // 0-10
    adaptabilityScore: number; // 0-10
    reflectionFrequency: number; // Days between reflections
  };
  
  // Timestamps
  created: string;
  lastUpdated: string;
  
  // Analysis insights from AI
  aiInsights: {
    date: string;
    text: string;
  }[];
}

/**
 * User Profile Engine handles creating, updating, and analyzing user psychological profiles
 */
class UserProfileEngine {
  private static instance: UserProfileEngine;
  private currentProfile: UserProfile | null = null;
  private profileKey = 'user_profile';
  
  private constructor() {
    // Initialize by loading or creating profile
    this.loadProfile();
  }
  
  public static getInstance(): UserProfileEngine {
    if (!UserProfileEngine.instance) {
      UserProfileEngine.instance = new UserProfileEngine();
    }
    return UserProfileEngine.instance;
  }
  
  /**
   * Loads the user profile from storage or creates a default one
   */
  private async loadProfile(): Promise<void> {
    try {
      const storedProfile = await AsyncStorage.getItem(this.profileKey);
      
      if (storedProfile) {
        this.currentProfile = JSON.parse(storedProfile);
      } else {
        // Create a default profile if none exists
        this.currentProfile = this.createDefaultProfile();
        await this.saveProfile();
      }
    } catch (error) {
      console.error('Failed to load user profile:', error);
      this.currentProfile = this.createDefaultProfile();
    }
  }
  
  /**
   * Creates a default user profile with baseline values
   */
  private createDefaultProfile(): UserProfile {
    const now = new Date().toISOString();
    
    return {
      id: `profile_${Date.now()}`,
      name: 'User',
      traits: {
        extraversion: 5,
        conscientiousness: 5,
        openness: 5,
        agreeableness: 5,
        neuroticism: 5,
        riskTolerance: 5,
        shortTermFocus: 5,
        resilience: 5,
        autonomy: 5,
        growthMindset: 5
      },
      goals: [],
      values: [],
      communicationPreferences: {
        verbosityLevel: 'moderate',
        feedbackStyle: 'constructive',
        learningStyle: 'reading/writing',
        responsePreference: 'guided discovery'
      },
      workPatterns: {
        productiveTimes: ['morning'],
        focusDuration: 30,
        primaryBarriers: ['procrastination'],
        motivationTriggers: ['achievement']
      },
      progressMarkers: {
        consistencyScore: 5,
        adaptabilityScore: 5,
        reflectionFrequency: 7
      },
      created: now,
      lastUpdated: now,
      aiInsights: []
    };
  }
  
  /**
   * Saves the current profile to storage
   */
  private async saveProfile(): Promise<void> {
    try {
      if (this.currentProfile) {
        this.currentProfile.lastUpdated = new Date().toISOString();
        await AsyncStorage.setItem(this.profileKey, JSON.stringify(this.currentProfile));
      }
    } catch (error) {
      console.error('Failed to save user profile:', error);
    }
  }
  
  /**
   * Gets the current user profile
   */
  public async getCurrentProfile(): Promise<UserProfile> {
    if (!this.currentProfile) {
      await this.loadProfile();
    }
    return this.currentProfile!;
  }
  
  /**
   * Updates the user profile with new information
   * @param profileUpdate Partial profile update
   */
  public async updateProfile(profileUpdate: Partial<UserProfile>): Promise<void> {
    try {
      if (!this.currentProfile) {
        await this.loadProfile();
      }
      
      // Merge the update with current profile
      this.currentProfile = {
        ...this.currentProfile!,
        ...profileUpdate,
        // Make sure these fields are properly handled
        traits: {
          ...this.currentProfile!.traits,
          ...(profileUpdate.traits || {})
        },
        communicationPreferences: {
          ...this.currentProfile!.communicationPreferences,
          ...(profileUpdate.communicationPreferences || {})
        },
        workPatterns: {
          ...this.currentProfile!.workPatterns,
          ...(profileUpdate.workPatterns || {})
        },
        progressMarkers: {
          ...this.currentProfile!.progressMarkers,
          ...(profileUpdate.progressMarkers || {})
        }
      };
      
      // Handle arrays specially to avoid complete overwrite if empty
      if (profileUpdate.goals && profileUpdate.goals.length > 0) {
        this.currentProfile.goals = profileUpdate.goals;
      }
      
      if (profileUpdate.values && profileUpdate.values.length > 0) {
        this.currentProfile.values = profileUpdate.values;
      }
      
      if (profileUpdate.aiInsights && profileUpdate.aiInsights.length > 0) {
        this.currentProfile.aiInsights = [
          ...this.currentProfile.aiInsights,
          ...profileUpdate.aiInsights
        ];
      }
      
      await this.saveProfile();
    } catch (error) {
      console.error('Failed to update user profile:', error);
      throw new Error('Failed to update user profile');
    }
  }
  
  /**
   * Analyzes an interaction to update the user profile
   * @param userMessage User's message
   * @param aiResponse AI's response
   */
  public async updateFromInteraction(userMessage: string, aiResponse: string): Promise<void> {
    try {
      // Skip for very short messages
      if (userMessage.length < 10) return;
      
      // For performance reasons, only do deep analysis periodically
      // Here we use a simple rule: analyze every 10th interaction
      const interactionCount = await this.getInteractionCount();
      if (interactionCount % 10 !== 0) {
        await this.incrementInteractionCount();
        return;
      }
      
      // Get recent interactions for context
      const recentInteractions = await memoryEngine.retrieveRelevantContext(userMessage, 5);
      
      // Prepare prompt for analysis
      const analysisPrompt = `
        You are a psychological profiling system. Analyze this interaction and previous relevant context to extract insights about the user.
        Update their psychological profile based on this new data.
        
        User Profile:
        ${JSON.stringify(this.currentProfile, null, 2)}
        
        Recent Context:
        ${recentInteractions}
        
        Latest Interaction:
        User: ${userMessage}
        AI: ${aiResponse}
        
        Provide updates to the user profile in JSON format. Include only fields that should be updated.
        Focus on identifying:
        1. Personality traits and how they manifest
        2. Goals and values expressed explicitly or implicitly
        3. Communication preferences and learning style
        4. Work patterns and productivity insights
        5. Any other significant psychological insights
        
        Return ONLY valid JSON without explanation.
      `;
      
      // Call AI for analysis
      const analysisResponse = await this.callOpenAI(analysisPrompt);
      
      // Parse and apply updates
      try {
        const profileUpdates = JSON.parse(analysisResponse);
        
        // Add analysis timestamp if we have insights
        if (profileUpdates.aiInsights) {
          profileUpdates.aiInsights = profileUpdates.aiInsights.map((insight: any) => ({
            ...insight,
            date: new Date().toISOString()
          }));
        }
        
        await this.updateProfile(profileUpdates);
        await this.incrementInteractionCount();
      } catch (e) {
        console.error('Failed to parse profile updates:', e);
      }
    } catch (error) {
      console.error('Failed to update profile from interaction:', error);
      // Still increment the count even if analysis fails
      await this.incrementInteractionCount();
    }
  }
  
  /**
   * Gets the number of interactions analyzed
   */
  private async getInteractionCount(): Promise<number> {
    try {
      const count = await AsyncStorage.getItem('interaction_count');
      return count ? parseInt(count, 10) : 0;
    } catch (error) {
      console.error('Failed to get interaction count:', error);
      return 0;
    }
  }
  
  /**
   * Increments the interaction count
   */
  private async incrementInteractionCount(): Promise<void> {
    try {
      const count = await this.getInteractionCount();
      await AsyncStorage.setItem('interaction_count', (count + 1).toString());
    } catch (error) {
      console.error('Failed to increment interaction count:', error);
    }
  }
  
  /**
   * Processes initial onboarding questionnaire
   * @param responses User's responses to onboarding questions
   */
  public async processOnboardingResponses(responses: Record<string, any>): Promise<void> {
    try {
      // Start with a fresh profile
      this.currentProfile = this.createDefaultProfile();
      
      // Set the user's name if provided
      if (responses.name) {
        this.currentProfile.name = responses.name;
      }
      
      // Prepare prompt for analysis
      const analysisPrompt = `
        You are a psychological profiling system. Analyze these onboarding questionnaire responses to create an initial profile.
        
        Questions and Answers:
        ${Object.entries(responses)
          .map(([question, answer]) => `${question}: ${answer}`)
          .join('\n')}
        
        Based on these responses, create a detailed psychological profile in JSON format.
        The profile should match this structure:
        ${JSON.stringify(this.createDefaultProfile(), null, 2)}
        
        Return ONLY valid JSON without explanation.
      `;
      
      // Call AI for analysis
      const analysisResponse = await this.callOpenAI(analysisPrompt);
      
      // Parse and apply full profile
      try {
        const profileData = JSON.parse(analysisResponse);
        
        // Ensure required fields are present
        const completeProfile = {
          ...this.currentProfile,
          ...profileData,
          created: new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        this.currentProfile = completeProfile;
        await this.saveProfile();
      } catch (e) {
        console.error('Failed to parse onboarding profile:', e);
        // If parsing fails, just use the basic profile with name
        await this.saveProfile();
      }
    } catch (error) {
      console.error('Failed to process onboarding responses:', error);
      throw new Error('Failed to process onboarding');
    }
  }
  
  /**
   * Generates personalized recommendations based on user profile
   * @param area Area to get recommendations for (goals, habits, etc.)
   * @returns Array of recommendations
   */
  public async getPersonalizedRecommendations(area: string): Promise<any[]> {
    try {
      if (!this.currentProfile) {
        await this.loadProfile();
      }
      
      // Prepare prompt for recommendations
      const recommendationPrompt = `
        Based on this user's psychological profile, generate highly personalized recommendations for ${area}.
        
        User Profile:
        ${JSON.stringify(this.currentProfile, null, 2)}
        
        Provide 3-5 specific recommendations that:
        1. Match their personality traits and work patterns
        2. Align with their core values and goals
        3. Are formatted in their preferred communication style
        4. Take into account their strengths and challenges
        
        Return the recommendations as a JSON array of objects with these properties:
        - title: A concise title for the recommendation
        - description: Detailed explanation, personalized to their traits
        - actionSteps: Array of 2-3 specific action steps to implement
        - reasonForMatch: Why this is a good match for their profile
        
        Return ONLY valid JSON without explanation.
      `;
      
      // Call AI for recommendations
      const recommendationsResponse = await this.callOpenAI(recommendationPrompt);
      
      // Parse recommendations
      try {
        return JSON.parse(recommendationsResponse);
      } catch (e) {
        console.error('Failed to parse recommendations:', e);
        return [];
      }
    } catch (error) {
      console.error('Failed to get personalized recommendations:', error);
      return [];
    }
  }
  
  /**
   * Makes an API call to OpenAI
   * @param prompt The prompt to send
   * @returns The AI response
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are an expert psychological profiling system. Provide detailed, accurate analysis in the requested format.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3, // Low temperature for more predictable, analytical responses
          max_tokens: 1500
        },
        {
          headers: {
            'Authorization': `Bearer ${API_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      return response.data.choices[0].message.content.trim();
    } catch (error) {
      console.error('OpenAI API call failed:', error);
      throw new Error('Failed to analyze profile');
    }
  }
}

export const userProfileEngine = UserProfileEngine.getInstance();