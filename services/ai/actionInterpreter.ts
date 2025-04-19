import { SystemIntent } from '@/types/ai';
import { AppAction, TaskPriority, TaskStatus, GoalStatus } from '@/types/app';

/**
 * Action Interpreter converts system intents from AI into executable app actions
 */
class ActionInterpreter {
  private static instance: ActionInterpreter;
  
  private constructor() {
    // Initialize the interpreter
  }
  
  public static getInstance(): ActionInterpreter {
    if (!ActionInterpreter.instance) {
      ActionInterpreter.instance = new ActionInterpreter();
    }
    return ActionInterpreter.instance;
  }
  
  /**
   * Interprets a system intent and converts it to an app action
   * @param intent System intent from AI
   * @returns App action to be executed by the app
   */
  public async interpretIntent(intent: SystemIntent): Promise<AppAction | null> {
    const { action, data } = intent;
    
    // Map intents to app actions
    switch (action) {
      case 'create_task':
        return this.handleCreateTask(data);
        
      case 'update_task':
        return this.handleUpdateTask(data);
        
      case 'delete_task':
        return this.handleDeleteTask(data);
        
      case 'create_goal':
        return this.handleCreateGoal(data);
        
      case 'update_goal':
        return this.handleUpdateGoal(data);
        
      case 'create_habit':
        return this.handleCreateHabit(data);
        
      case 'complete_habit':
        return this.handleCompleteHabit(data);
        
      case 'navigate':
        return this.handleNavigate(data);
        
      case 'create_reflection':
        return this.handleCreateReflection(data);
        
      case 'display_message':
        return this.handleDisplayMessage(data);
        
      case 'track_metric':
        return this.handleTrackMetric(data);
        
      default:
        console.warn(`Unknown system intent action: ${action}`);
        return null;
    }
  }
  
  /**
   * Handles creating a new task
   */
  private handleCreateTask(data: any): AppAction {
    // Validate required fields
    if (!data.title) {
      throw new Error('Task title is required');
    }
    
    // Parse and validate priority
    let priority: TaskPriority = data.priority || 'medium';
    if (!['high', 'medium', 'low'].includes(priority)) {
      priority = 'medium';
    }
    
    return {
      type: 'CREATE_TASK',
      payload: {
        title: data.title,
        description: data.description || '',
        dueDate: data.dueDate || null,
        priority: priority as TaskPriority,
        category: data.category || null,
        tags: data.tags || [],
        status: data.status || 'pending'
      }
    };
  }
  
  /**
   * Handles updating an existing task
   */
  private handleUpdateTask(data: any): AppAction {
    // Validate required fields
    if (!data.id) {
      throw new Error('Task ID is required');
    }
    
    return {
      type: 'UPDATE_TASK',
      payload: {
        id: data.id,
        updates: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          priority: data.priority as TaskPriority,
          category: data.category,
          tags: data.tags,
          status: data.status as TaskStatus
        }
      }
    };
  }
  
  /**
   * Handles deleting a task
   */
  private handleDeleteTask(data: any): AppAction {
    // Validate required fields
    if (!data.id) {
      throw new Error('Task ID is required');
    }
    
    return {
      type: 'DELETE_TASK',
      payload: {
        id: data.id
      }
    };
  }
  
  /**
   * Handles creating a new goal
   */
  private handleCreateGoal(data: any): AppAction {
    // Validate required fields
    if (!data.title) {
      throw new Error('Goal title is required');
    }
    
    return {
      type: 'CREATE_GOAL',
      payload: {
        title: data.title,
        description: data.description || '',
        dueDate: data.dueDate || null,
        parentId: data.parentId || null,
        status: (data.status as GoalStatus) || 'not_started',
        tags: data.tags || [],
        category: data.category || null,
        metrics: data.metrics || []
      }
    };
  }
  
  /**
   * Handles updating an existing goal
   */
  private handleUpdateGoal(data: any): AppAction {
    // Validate required fields
    if (!data.id) {
      throw new Error('Goal ID is required');
    }
    
    return {
      type: 'UPDATE_GOAL',
      payload: {
        id: data.id,
        updates: {
          title: data.title,
          description: data.description,
          dueDate: data.dueDate,
          status: data.status as GoalStatus,
          progress: data.progress,
          tags: data.tags,
          category: data.category,
          metrics: data.metrics
        }
      }
    };
  }
  
  /**
   * Handles creating a new habit
   */
  private handleCreateHabit(data: any): AppAction {
    // Validate required fields
    if (!data.title) {
      throw new Error('Habit title is required');
    }
    
    return {
      type: 'CREATE_HABIT',
      payload: {
        title: data.title,
        description: data.description || '',
        frequency: data.frequency || 'daily',
        timeOfDay: data.timeOfDay || null,
        category: data.category || null,
        triggers: data.triggers || [],
        obstacles: data.obstacles || [],
        strategies: data.strategies || []
      }
    };
  }
  
  /**
   * Handles marking a habit as complete for today
   */
  private handleCompleteHabit(data: any): AppAction {
    // Validate required fields
    if (!data.id) {
      throw new Error('Habit ID is required');
    }
    
    return {
      type: 'COMPLETE_HABIT',
      payload: {
        id: data.id,
        date: data.date || new Date().toISOString().split('T')[0]
      }
    };
  }
  
  /**
   * Handles navigation to different screens
   */
  private handleNavigate(data: any): AppAction {
    // Validate required fields
    if (!data.screen) {
      throw new Error('Navigation screen is required');
    }
    
    return {
      type: 'NAVIGATE',
      payload: {
        screen: data.screen,
        params: data.params || {}
      }
    };
  }
  
  /**
   * Handles creating a reflection/journal entry
   */
  private handleCreateReflection(data: any): AppAction {
    // Validate required fields
    if (!data.content) {
      throw new Error('Reflection content is required');
    }
    
    return {
      type: 'CREATE_REFLECTION',
      payload: {
        content: data.content,
        title: data.title || `Reflection - ${new Date().toLocaleDateString()}`,
        tags: data.tags || [],
        mood: data.mood || null,
        relatedGoals: data.relatedGoals || []
      }
    };
  }
  
  /**
   * Handles showing a message to the user
   */
  private handleDisplayMessage(data: any): AppAction {
    // Validate required fields
    if (!data.message) {
      throw new Error('Display message is required');
    }
    
    return {
      type: 'DISPLAY_MESSAGE',
      payload: {
        message: data.message,
        type: data.type || 'info',
        duration: data.duration || 3000
      }
    };
  }
  
  /**
   * Handles tracking a metric
   */
  private handleTrackMetric(data: any): AppAction {
    // Validate required fields
    if (!data.name || data.value === undefined) {
      throw new Error('Metric name and value are required');
    }
    
    return {
      type: 'TRACK_METRIC',
      payload: {
        name: data.name,
        value: data.value,
        timestamp: data.timestamp || new Date().toISOString(),
        category: data.category || null,
        notes: data.notes || null
      }
    };
  }
}

export const actionInterpreter = ActionInterpreter.getInstance();