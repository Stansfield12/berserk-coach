import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet, View, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GestureResponderEvent } from 'react-native';


// Константы для дизайн-системы
const COLORS = {
  light: {
    background: '#FFFFFF',
    text: '#1A1A1A',
    primary: '#E53935', // Агрессивный красный
    inactive: '#8E8E93',
    tabBarBackground: 'rgba(255, 255, 255, 0.8)',
  },
  dark: {
    background: '#121212',
    text: '#F5F5F5',
    primary: '#FF5252', // Яркий красный для темного режима
    inactive: '#8E8E93',
    tabBarBackground: 'rgba(18, 18, 18, 0.8)',
  },
};

interface CustomTabBarButtonProps {
  active: boolean;
  onPress?: (event: GestureResponderEvent) => void;
  icon: string;
  label: string;
}

// Кастомная кнопка таба с тактильной обратной связью
const CustomTabBarButton = ({ active, onPress, icon, label }: CustomTabBarButtonProps) => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];

  return (
    <Pressable
      onPress={(event) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress && onPress(event);
      }}
      style={({ pressed }) => [
        styles.tabButton,
        { opacity: pressed ? 0.8 : 1 }
      ]}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={icon as any}
          size={24}
          color={active ? colors.primary : colors.inactive}
        />
        {active && <View style={[styles.activeIndicator, { backgroundColor: colors.primary }]} />}
      </View>
    </Pressable>
  );
};

// Кастомный фон для таббара с блюром
const TabBarBackground = () => {
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];
  
  // На iOS используем BlurView для элегантного эффекта
  if (Platform.OS === 'ios') {
    return (
      <BlurView
        tint={colorScheme === 'dark' ? 'dark' : 'light'}
        intensity={90}
        style={StyleSheet.absoluteFillObject}
      />
    );
  }
  
  // На других платформах используем полупрозрачный фон
  return (
    <View 
      style={[
        StyleSheet.absoluteFillObject, 
        { backgroundColor: colors.tabBarBackground }
      ]} 
    />
  );
};

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const colorScheme = useColorScheme();
  const colors = COLORS[colorScheme || 'dark'];

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.inactive,
        tabBarStyle: {
          position: 'absolute',
          borderTopWidth: 0,
          elevation: 0,
          height: 60 + (insets.bottom || 10),
          paddingTop: 5,
          paddingBottom: insets.bottom || 10,
          backgroundColor: 'transparent',
        },
        tabBarBackground: TabBarBackground,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Рабочий стол',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name="home" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              icon="home"
              label="Рабочий стол"
              active={props.accessibilityState?.selected || false}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="strategy"
        options={{
          title: 'Стратегия',
          tabBarIcon: ({ color }) => (
            <Ionicons name="trending-up" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              icon="trending-up"
              label="Стратегия"
              active={props.accessibilityState?.selected || false}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="operations"
        options={{
          title: 'Операции',
          tabBarIcon: ({ color }) => (
            <Ionicons name="list" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              icon="list"
              label="Операции"
              active={props.accessibilityState?.selected || false}
            />
          ),
        }}
      />
      
      <Tabs.Screen
        name="mentor"
        options={{
          title: 'Ментор',
          tabBarIcon: ({ color }) => (
            <Ionicons name="chatbubbles" size={24} color={color} />
          ),
          tabBarButton: (props) => (
            <CustomTabBarButton
              {...props}
              icon="chatbubbles"
              label="Ментор"
              active={props.accessibilityState?.selected || false}
            />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 40,
  },
  activeIndicator: {
    position: 'absolute',
    bottom: -5,
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});