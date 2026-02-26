import React from 'react';
import { createMaterialTopTabNavigator } from '@react-navigation/material-top-tabs';
import type { TasksTopTabParamList } from './types';
import TasksListScreen from '../../features/tasks/screens/TasksListScreen';
import TodosListScreen from '../../features/tasks/screens/TodosListScreen';
import RemindersListScreen from '../../features/tasks/screens/RemindersListScreen';

const Tab = createMaterialTopTabNavigator<TasksTopTabParamList>();

export default function TasksTopTabNavigator() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="TasksList" component={TasksListScreen} options={{ title: 'Tasks' }} />
      <Tab.Screen name="TodosList" component={TodosListScreen} options={{ title: 'Todos' }} />
      <Tab.Screen name="RemindersList" component={RemindersListScreen} options={{ title: 'Reminders' }} />
    </Tab.Navigator>
  );
}
