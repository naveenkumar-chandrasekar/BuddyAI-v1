import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { TasksTopTabParamList } from './types';
import { Colors } from '../../shared/theme/theme';
import TasksListScreen from '../../features/tasks/screens/TasksListScreen';
import TodosListScreen from '../../features/tasks/screens/TodosListScreen';
import RemindersListScreen from '../../features/tasks/screens/RemindersListScreen';

const Tab = createMaterialTopTabNavigator<TasksTopTabParamList>();

export default function TasksTopTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarIndicatorStyle: { backgroundColor: Colors.primary, height: 3, borderRadius: 2 },
        tabBarStyle: { backgroundColor: Colors.surface, elevation: 0, shadowOpacity: 0 },
        tabBarLabelStyle: { fontSize: 13, fontWeight: '600', letterSpacing: 0.3, textTransform: 'capitalize' },
        tabBarPressColor: Colors.primaryLight,
      }}
    >
      <Tab.Screen name="TasksList" component={TasksListScreen} options={{ title: 'Tasks' }} />
      <Tab.Screen name="TodosList" component={TodosListScreen} options={{ title: 'Todos' }} />
      <Tab.Screen name="RemindersList" component={RemindersListScreen} options={{ title: 'Reminders' }} />
    </Tab.Navigator>
  );
}
