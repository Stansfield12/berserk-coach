import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Goal, GoalStatus, GoalMetric } from '@/types/app';
import { userProfileEngine } from '../ai/userProfileEngine';

// API Keys should be stored securely
const API_KEY = process.env.OPENAI_API_KEY || '';

/**
 * Goal Planning Service manages the creation, transformation, and breakdown of goals
 */
class GoalPlanningService {
  private static instance: GoalPlanningService;
  private goalsKey = 'user_goals';
  
  private constructor() {
    // Initialize service
  }
  
  public static getInstance(): GoalPlanningService {
    if (!GoalPlanningService.instance) {
      GoalPlanningService.instance = new GoalPlanningService();
    }
    return GoalPlanningService.instance;
  }
  
  /**
   * Gets all goals
   */
  public async getAllGoals(): Promise<Goal[]> {
    try {
      const goalsData = await AsyncStorage.getItem(this.goalsKey);
      
      if (goalsData) {
        return JSON.parse(goalsData);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get goals:', error);
      return [];
    }
  }
  
  /**
   * Gets goal by ID
   * @param goalId Goal identifier
   */
  public async getGoalById(goalId: string): Promise<Goal | null> {
    try {
      const goals = await this.getAllGoals();
      return goals.find(goal => goal.id === goalId) || null;
    } catch (error) {
      console.error(`Failed to get goal ${goalId}:`, error);
      return null;
    }
  }
  
  /**
   * Creates a new goal
   * @param goalData Goal data
   */
  public async createGoal(goalData: Partial<Goal>): Promise<Goal> {
    try {
      const now = new Date().toISOString();
      
      const newGoal: Goal = {
        id: `goal_${Date.now()}`,
        title: goalData.title || '',
        description: goalData.description || '',
        status: goalData.status || 'not_started',
        progress: goalData.progress || 0,
        parentId: goalData.parentId || null,
        children: goalData.children || [],
        category: goalData.category || null,
        tags: goalData.tags || [],
        metrics: goalData.metrics || [],
        createdAt: now,
        updatedAt: now
      };
      
      // If this is a subgoal, update parent
      if (newGoal.parentId) {
        await this.addChildToParent(newGoal.parentId, newGoal.id);
      }
      
      // Save the goal
      const goals = await this.getAllGoals();
      goals.push(newGoal);
      await AsyncStorage.setItem(this.goalsKey, JSON.stringify(goals));
      
      return newGoal;
    } catch (error) {
      console.error('Failed to create goal:', error);
      throw new Error('Failed to create goal');
    }
  }
  
  /**
   * Updates an existing goal
   * @param goalId Goal identifier
   * @param updates Updates to apply
   */
  public async updateGoal(goalId: string, updates: Partial<Goal>): Promise<Goal> {
    try {
      const goals = await this.getAllGoals();
      const goalIndex = goals.findIndex(goal => goal.id === goalId);
      
      if (goalIndex === -1) {
        throw new Error(`Goal ${goalId} not found`);
      }
      
      const updatedGoal: Goal = {
        ...goals[goalIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      
      goals[goalIndex] = updatedGoal;
      await AsyncStorage.setItem(this.goalsKey, JSON.stringify(goals));
      
      return updatedGoal;
    } catch (error) {
      console.error(`Failed to update goal ${goalId}:`, error);
      throw new Error('Failed to update goal');
    }
  }
  
  /**
   * Deletes a goal
   * @param goalId Goal identifier
   */
  public async deleteGoal(goalId: string): Promise<void> {
    try {
      const goals = await this.getAllGoals();
      
      // Find the goal to delete
      const goalToDelete = goals.find(goal => goal.id === goalId);
      
      if (!goalToDelete) {
        throw new Error(`Goal ${goalId} not found`);
      }
      
      // If this is a subgoal, update parent
      if (goalToDelete.parentId) {
        await this.removeChildFromParent(goalToDelete.parentId, goalId);
      }
      
      // Delete any children recursively
      if (goalToDelete.children && goalToDelete.children.length > 0) {
        for (const childId of goalToDelete.children) {
          await this.deleteGoal(childId);
        }
      }
      
      // Remove the goal
      const updatedGoals = goals.filter(goal => goal.id !== goalId);
      await AsyncStorage.setItem(this.goalsKey, JSON.stringify(updatedGoals));
    } catch (error) {
      console.error(`Failed to delete goal ${goalId}:`, error);
      throw new Error('Failed to delete goal');
    }
  }
  
  /**
   * Updates goal progress based on children
   * @param goalId Goal identifier
   */
  public async updateGoalProgress(goalId: string): Promise<number> {
    try {
      const goals = await this.getAllGoals();
      const goal = goals.find(g => g.id === goalId);
      
      if (!goal) {
        throw new Error(`Goal ${goalId} not found`);
      }
      
      // If no children, return current progress
      if (!goal.children || goal.children.length === 0) {
        return goal.progress;
      }
      
      // Get all child goals
      const childGoals = goals.filter(g => goal.children?.includes(g.id));
      
      // Calculate progress based on children
      let totalProgress = 0;
      
      if (childGoals.length > 0) {
        // Sum up child progress
        const childProgressSum = childGoals.reduce((sum, child) => sum + child.progress, 0);
        totalProgress = childProgressSum / childGoals.length;
      }
      
      // Update goal progress
      await this.updateGoal(goalId, { progress: totalProgress });
      
      // If this goal has a parent, update parent progress too
      if (goal.parentId) {
        await this.updateGoalProgress(goal.parentId);
      }
      
      return totalProgress;
    } catch (error) {
      console.error(`Failed to update goal progress for ${goalId}:`, error);
      return -1;
    }
  }
  
  /**
   * Adds a child goal to a parent
   * @param parentId Parent goal ID
   * @param childId Child goal ID
   */
  private async addChildToParent(parentId: string, childId: string): Promise<void> {
    try {
      const goals = await this.getAllGoals();
      const parentIndex = goals.findIndex(goal => goal.id === parentId);
      
      if (parentIndex === -1) {
        throw new Error(`Parent goal ${parentId} not found`);
      }
      
      // Add child to parent
      if (!goals[parentIndex].children) {
        goals[parentIndex].children = [];
      }
      
      if (!goals[parentIndex].children.includes(childId)) {
        goals[parentIndex].children.push(childId);
        goals[parentIndex].updatedAt = new Date().toISOString();
      }
      
      await AsyncStorage.setItem(this.goalsKey, JSON.stringify(goals));
    } catch (error) {
      console.error(`Failed to add child ${childId} to parent ${parentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Removes a child goal from a parent
   * @param parentId Parent goal ID
   * @param childId Child goal ID
   */
  private async removeChildFromParent(parentId: string, childId: string): Promise<void> {
    try {
      const goals = await this.getAllGoals();
      const parentIndex = goals.findIndex(goal => goal.id === parentId);
      
      if (parentIndex === -1) {
        throw new Error(`Parent goal ${parentId} not found`);
      }
      
      // Remove child from parent
      if (goals[parentIndex].children && goals[parentIndex].children.includes(childId)) {
        goals[parentIndex].children = goals[parentIndex].children.filter(id => id !== childId);
        goals[parentIndex].updatedAt = new Date().toISOString();
      }
      
      await AsyncStorage.setItem(this.goalsKey, JSON.stringify(goals));
    } catch (error) {
      console.error(`Failed to remove child ${childId} from parent ${parentId}:`, error);
      throw error;
    }
  }
  
  /**
   * Transforms a high-level aspirational goal into achievable goals
   * @param aspirationalGoal The high-level goal text
   */
  public async transformAspirationalGoal(aspirationalGoal: string): Promise<Goal[]> {
    try {
      // Get user profile for context
      const userProfile = await userProfileEngine.getCurrentProfile();
      
      // Prepare prompt for analysis
      const analysisPrompt = `
        You are an expert goal-setting and planning system. Your job is to transform a high-level aspirational goal into a structured set of SMART goals (Specific, Measurable, Achievable, Relevant, Time-bound).
        
        User Profile:
        ${JSON.stringify(userProfile, null, 2)}
        
        Aspirational Goal: "${aspirationalGoal}"
        
        Break this down into:
        1. One main goal that captures the essence of the aspiration
        2. 3-5 sub-goals that contribute to achieving the main goal
        
        For each goal and sub-goal, provide:
        - A clear, specific title
        - A detailed description
        - Measurable metrics for tracking progress
        - A realistic status (should usually be "not_started" for new goals)
        - Appropriate tags or categories
        
        Format your response as a JSON object with this structure:
        {
          "mainGoal": {
            "title": "",
            "description": "",
            "metrics": [{"name": "", "target": 0, "unit": "", "isPositive": true}],
            "status": "not_started",
            "tags": [],
            "category": ""
          },
          "subGoals": [
            {
              "title": "",
              "description": "",
              "metrics": [{"name": "", "target": 0, "unit": "", "isPositive": true}],
              "status": "not_started", 
              "tags": [],
              "category": ""
            }
          ]
        }
        
        Return ONLY valid JSON without explanation.
      `;
      
      // Call AI for analysis
      const analysisResponse = await this.callOpenAI(analysisPrompt);
      
      // Parse response
      try {
        const goalStructure = JSON.parse(analysisResponse);
        
        // Create main goal
        const mainGoal = await this.createGoal({
          title: goalStructure.mainGoal.title,
          description: goalStructure.mainGoal.description,
          status: goalStructure.mainGoal.status as GoalStatus,
          metrics: goalStructure.mainGoal.metrics as GoalMetric[],
          tags: goalStructure.mainGoal.tags,
          category: goalStructure.mainGoal.category
        });
        
        // Create sub-goals
        const subGoals: Goal[] = [];
        
        for (const subGoalData of goalStructure.subGoals) {
          const subGoal = await this.createGoal({
            title: subGoalData.title,
            description: subGoalData.description,
            status: subGoalData.status as GoalStatus,
            metrics: subGoalData.metrics as GoalMetric[],
            tags: subGoalData.tags,
            category: subGoalData.category,
            parentId: mainGoal.id
          });
          
          subGoals.push(subGoal);
        }
        
        return [mainGoal, ...subGoals];
      } catch (e) {
        console.error('Failed to parse goal structure:', e);
        throw new Error('Failed to parse AI response');
      }
    } catch (error) {
      console.error('Failed to transform aspirational goal:', error);
      throw new Error('Failed to transform goal');
    }
  }
  
  /**
   * Recommends next steps for a goal
   * @param goalId Goal identifier
   * @param count Number of steps to recommend
   */
  public async recommendNextSteps(goalId: string, count: number = 3): Promise<any[]> {
    try {
      const goal = await this.getGoalById(goalId);
      
      if (!goal) {
        throw new Error(`Goal ${goalId} not found`);
      }
      
      // Get user profile for context
      const userProfile = await userProfileEngine.getCurrentProfile();
      
      // Get existing child goals
      const allGoals = await this.getAllGoals();
      const childGoals = allGoals.filter(g => g.parentId === goalId);
      
      // Prepare prompt for recommendations
      const recommendationPrompt = `
        You are an expert goal-setting and planning system. Your job is to recommend the next steps for achieving a specific goal.
        
        User Profile:
        ${JSON.stringify(userProfile, null, 2)}
        
        Goal:
        ${JSON.stringify(goal, null, 2)}
        
        Existing Sub-goals:
        ${JSON.stringify(childGoals, null, 2)}
        
        Based on the goal, existing sub-goals, and user profile, recommend ${count} actionable next steps.
        
        Each step should be:
        - Concrete and immediately applicable
        - Linked to progress towards the main goal
        - Brief and clear

        Format response as a JSON array of objects:
        [
          {
            "title": "",
            "description": "",
            "reason": ""
          }
        ]

        Return ONLY valid JSON without any explanations.
      `;

      // Call OpenAI API
      const aiResponse = await this.callOpenAI(recommendationPrompt);

      // Parse and return
      try {
        const steps = JSON.parse(aiResponse);
        return steps;
      } catch (error) {
        console.error('Failed to parse recommended steps:', error);
        throw new Error('AI response was not valid JSON');
      }

    } catch (error) {
      console.error(`Failed to recommend next steps for goal ${goalId}:`, error);
      throw new Error('Failed to recommend next steps');
    }
  }

  /**
   * Internal method for making OpenAI API calls
   * @param prompt Prompt for GPT
   */
  private async callOpenAI(prompt: string): Promise<string> {
    try {
      const response = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4',
          messages: [
            { role: 'system', content: 'You are a goal-planning assistant.' },
            { role: 'user', content: prompt }
          ],
          temperature: 0.7
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${API_KEY}`
          }
        }
      );

      const message = response.data.choices?.[0]?.message?.content;
      if (!message) throw new Error('No message from OpenAI');
      return message.trim();
    } catch (error) {
      console.error('OpenAI API error:', error);
      throw new Error('AI generation failed');
    }
  }
}

export const goalPlanningService = GoalPlanningService.getInstance();
