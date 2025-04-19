/**
 * Types related to application functionality
 */

/**
 * Actions that can be performed in the app
 */
export type AppActionType =
  | 'CREATE_TASK'
  | 'UPDATE_TASK'
  | 'DELETE_TASK'
  | 'CREATE_GOAL'
  | 'UPDATE_GOAL'
  | 'CREATE_HABIT'
  | 'COMPLETE_HABIT'
  | 'NAVIGATE'
  | 'CREATE_REFLECTION'
  | 'DISPLAY_MESSAGE'
  | 'TRACK_METRIC';

/**
 * Task priority levels
 */
export type TaskPriority = 'high' | 'medium' | 'low';

/**
 * Task status options
 */
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'canceled';

/**
 * Goal status options
 */
export type GoalStatus = 'not_started' | 'in_progress' | 'completed' | 'at_risk' | 'canceled';

/**
 * Frequency options for habits
 */
export type HabitFrequency = 'daily' | 'weekly' | 'custom';

/**
 * App action structure for Redux
 */
export interface AppAction {
  type: AppActionType;
  payload: any;
}

/**
 * Task structure
 */
export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  category?: string | null;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  related?: {
    goalId?: string;
    habitId?: string;
  };
}

/**
 * Goal structure
 */
export interface Goal {
  id: string;
  title: string;
  description?: string;
  dueDate?: string | null;
  status: GoalStatus;
  progress: number;
  parentId?: string | null;
  children?: string[];
  category?: string | null;
  tags?: string[];
  metrics?: GoalMetric[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Metric for tracking goal progress
 */
export interface GoalMetric {
  id: string;
  name: string;
  target: number;
  current: number;
  unit?: string;
  isPositive: boolean; // Whether higher is better
}

/**
 * Habit structure
 */
export interface Habit {
  id: string;
  title: string;
  description?: string;
  frequency: HabitFrequency;
  timeOfDay?: string | null; // e.g. "morning", "evening", or specific time
  daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
  completedDates: string[];
  streak: number;
  longestStreak: number;
  category?: string | null;
  tags?: string[];
  triggers?: string[];
  obstacles?: string[];
  strategies?: string[];
  createdAt: string;
  updatedAt: string;
}

/**
 * Journal entry structure
 */
export interface Journal {
  id: string;
  title: string;
  content: string;
  tags?: string[];
  mood?: number; // 1-10 scale
  location?: string;
  createdAt: string;
  updatedAt: string;
  relatedGoals?: string[];
  aiAnalysis?: {
    insights: string[];
    sentiment: number; // -1 to 1
    keywords: string[];
  };
}

/**
 * User settings structure
 */
export interface UserSettings {
  id: string;
  name: string;
  email?: string;
  preferredPersonaId: string;
  theme: 'light' | 'dark' | 'system';
  notifications: {
    enabled: boolean;
    reminders: boolean;
    insights: boolean;
    dailySummary: boolean;
  };
  privacy: {
    dataRetention: number; // Days
    dataUsageConsent: boolean;
    anonymizePersonalInfo: boolean;
  };
  workHours: {
    start: number; // Hour of day (0-23)
    end: number;   // Hour of day (0-23)
  };
  daysOfWeek: number[]; // 0-6 for Sunday-Saturday (work days)
  language: string;
}

/**
 * Metric data point
 */
export interface MetricDataPoint {
  id: string;
  name: string;
  value: number;
  timestamp: string;
  category?: string | null;
  notes?: string | null;
}

/**
 * Navigation parameters
 */
export interface NavigationParams {
  screen: string;
  params?: Record<string, any>;
}

/**
 * Message notification
 */
export interface MessageNotification {
  id: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}