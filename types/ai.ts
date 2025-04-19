/**
 * Types related to AI system functionality
 */

/**
 * Message roles in conversation
 */
export type MessageRole = 'user' | 'assistant' | 'system';

/**
 * Message structure for conversations
 */
export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

/**
 * System intent parsed from AI responses
 */
export interface SystemIntent {
  action: string;
  data: Record<string, any>;
}

/**
 * Persona profile for AI mentor
 */
export interface PersonaProfile {
  id: string;
  name: string;
  description: string;
  icon: string;
  communicationStyle: string[];
  values: string[];
  approach: string;
  avoidTopics: string[];
  temperature: number;
  welcomeMessage: string;
  customInstructions?: string;
  isCustom?: boolean;
}

/**
 * Onboarding question for user profiling
 */
export interface OnboardingQuestion {
  id: string;
  text: string;
  type: 'text' | 'multiChoice' | 'scale' | 'multiSelect';
  options?: string[];
  minValue?: number;
  maxValue?: number;
  trait?: string;
  required?: boolean;
}

/**
 * User response to onboarding question
 */
export interface OnboardingResponse {
  questionId: string;
  answer: string | number | string[];
}

/**
 * Journal entry for reflection
 */
export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  timestamp: string;
  tags: string[];
  mood?: number; // Scale from 1-10
  aiAnalysis?: string;
  relatedGoals?: string[];
}

/**
 * AI-generated recommendation
 */
export interface Recommendation {
  id: string;
  title: string;
  description: string;
  actionSteps: string[];
  reasonForMatch: string;
  category: string;
  timestamp: string;
  applied?: boolean;
}

/**
 * AI-generated insight about user
 */
export interface AIInsight {
  id: string;
  text: string;
  timestamp: string;
  category: string;
  confidence: number;
  source: 'conversation' | 'journal' | 'behavior' | 'analysis';
}

/**
 * Session with AI mentor
 */
export interface MentorSession {
  id: string;
  startTime: string;
  endTime?: string;
  personaId: string;
  summary?: string;
  keyInsights?: string[];
  actionsGenerated?: string[];
}

/**
 * Settings for AI behavior
 */
export interface AISettings {
  proactiveMode: boolean; // Whether AI can initiate conversations
  notificationSettings: {
    reminders: boolean;
    insights: boolean;
    recommendations: boolean;
    dailySummary: boolean;
  };
  mentorAvailabilityHours: {
    start: number; // Hour of day (0-23)
    end: number;   // Hour of day (0-23)
  };
  privacySettings: {
    dataRetentionDays: number;
    dataUsageConsent: boolean;
    anonymizePersonalInfo: boolean;
  };
}