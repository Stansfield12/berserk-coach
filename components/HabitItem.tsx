import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Habit } from '@/hooks/useOperationsData';

// Константы для дизайн-системы
const COLORS = {
  light: {
    background: '#FFFFFF',
    cardBackground: '#F5F5F5',
    text: '#1A1A1A',
    secondaryText: '#6E6E6E',
    primary: '#E53935',
    success: '#4CAF50',
    warning: '#FF9800',
    neutral: '#607D8B',
    separator: '#E0E0E0',
    completed: 'rgba(76, 175, 80, 0.15)',
  },
  dark: {
    background: '#121212',
    cardBackground: '#1E1E1E',
    text: '#F5F5F5',
    secondaryText: '#AAAAAA',
    primary: '#FF5252',
    success: '#66BB6A',
    warning: '#FFA726',
    neutral: '#78909C',
    separator: '#333333',
    completed: 'rgba(102, 187, 106, 0.15)',
  },
};

interface HabitItemProps {
  habit: Habit;
  onComplete: (id: string) => void;
  onEdit: (habit: Habit) => void;
}

export const HabitItem: React.FC<HabitItemProps> = ({ 
  habit, 
  onComplete,
  onEdit
}) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // Проверяем, выполнена ли привычка сегодня
  const isCompletedToday = () => {
    const today = new Date().toISOString().split('T')[0];
    return habit.completedDates.includes(today);
  };
  
  const handleComplete = () => {
    onComplete(habit.id);
  };
  
  return (
    <View style={[styles.habitItem, { backgroundColor: colors.cardBackground }]}>
      <View style={styles.habitContent}>
        <Text style={[styles.habitTitle, { color: colors.text }]}>
          {habit.title}
        </Text>
        
        {habit.description && (
          <Text 
            style={[styles.habitDescription, { color: colors.secondaryText }]}
            numberOfLines={2}
          >
            {habit.description}
          </Text>
        )}
        
        <View style={styles.habitMeta}>
          <View style={styles.streakContainer}>
            <Ionicons name="flame" size={14} color={colors.warning} />
            <Text style={[styles.streakText, { color: colors.secondaryText }]}>
              {habit.streak} дней подряд
            </Text>
          </View>
          
          {habit.category && (
            <View 
              style={[
                styles.categoryPill, 
                { backgroundColor: `${colors.neutral}30` }
              ]}
            >
              <Text 
                style={[styles.categoryText, { color: colors.neutral }]}
                numberOfLines={1}
              >
                {habit.category}
              </Text>
            </View>
          )}
        </View>
      </View>
      
      <View style={styles.habitActions}>
        <TouchableOpacity 
          style={styles.editHabitButton}
          onPress={() => onEdit(habit)}
        >
          <Ionicons name="create-outline" size={18} color={colors.secondaryText} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.completeHabitButton,
            { 
              backgroundColor: isCompletedToday() ? colors.success : 'transparent',
              borderColor: colors.success,
            }
          ]}
          onPress={handleComplete}
        >
          {isCompletedToday() ? (
            <Ionicons name="checkmark" size={18} color="#FFFFFF" />
          ) : (
            <Text style={[styles.completeButtonText, { color: colors.success }]}>
              Отметить
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  habitItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderRadius: 8,
    marginBottom: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  habitContent: {
    flex: 1,
  },
  habitTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  habitDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  habitMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  streakContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  streakText: {
    fontSize: 12,
  },
  categoryPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  habitActions: {
    justifyContent: 'space-between',
    paddingLeft: 12,
  },
  editHabitButton: {
    padding: 8,
  },
  completeHabitButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completeButtonText: {
    fontSize: 12,
    fontWeight: '500',
  },
});