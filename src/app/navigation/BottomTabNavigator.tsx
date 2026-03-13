import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import type {
  MainTabParamList,
  ChatStackParamList,
  PersonStackParamList,
  TasksStackParamList,
  SettingsStackParamList,
} from './types';
import { Colors } from '../../shared/theme/theme';

import ChatHistoryScreen from '../../features/chat/screens/ChatHistoryScreen';
import ChatScreen from '../../features/chat/screens/ChatScreen';

import PersonListScreen from '../../features/people/screens/PersonListScreen';
import PersonDetailScreen from '../../features/people/screens/PersonDetailScreen';
import AddEditPersonScreen from '../../features/people/screens/AddEditPersonScreen';

import TasksTopTabNavigator from './TasksTopTabNavigator';
import AddEditTaskScreen from '../../features/tasks/screens/AddEditTaskScreen';
import AddEditTodoScreen from '../../features/tasks/screens/AddEditTodoScreen';
import AddEditReminderScreen from '../../features/tasks/screens/AddEditReminderScreen';

import SettingsScreen from '../../features/settings/screens/SettingsScreen';
import NotificationSettingsScreen from '../../features/settings/screens/NotificationSettingsScreen';
import BirthdayThresholdsScreen from '../../features/settings/screens/BirthdayThresholdsScreen';
import SyncSettingsScreen from '../../features/settings/screens/SyncSettingsScreen';
import LanguageSettingsScreen from '../../features/settings/screens/LanguageSettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const ChatStack = createNativeStackNavigator<ChatStackParamList>();
const PersonStack = createNativeStackNavigator<PersonStackParamList>();
const TasksStack = createNativeStackNavigator<TasksStackParamList>();
const SettingsStack = createNativeStackNavigator<SettingsStackParamList>();

const STACK_SCREEN_OPTIONS = {
  headerStyle: { backgroundColor: Colors.surface },
  headerTintColor: Colors.primary,
  headerTitleStyle: { color: Colors.onSurface, fontWeight: '600' as const },
  headerShadowVisible: false,
  contentStyle: { backgroundColor: Colors.background },
};

function ChatNavigator() {
  return (
    <ChatStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <ChatStack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: 'BuddyAI' }} />
      <ChatStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </ChatStack.Navigator>
  );
}

function PersonNavigator() {
  return (
    <PersonStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <PersonStack.Screen name="PersonList" component={PersonListScreen} options={{ title: 'People' }} />
      <PersonStack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: '' }} />
      <PersonStack.Screen name="AddEditPerson" component={AddEditPersonScreen} options={{ title: 'Add Person' }} />
    </PersonStack.Navigator>
  );
}

function TasksNavigator() {
  return (
    <TasksStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <TasksStack.Screen name="TasksTab" component={TasksTopTabNavigator} options={{ title: 'Tasks' }} />
      <TasksStack.Screen name="AddTask" component={AddEditTaskScreen} options={{ title: 'New Task' }} />
      <TasksStack.Screen name="AddTodo" component={AddEditTodoScreen} options={{ title: 'New Todo' }} />
      <TasksStack.Screen name="AddReminder" component={AddEditReminderScreen} options={{ title: 'New Reminder' }} />
    </TasksStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator screenOptions={STACK_SCREEN_OPTIONS}>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
      <SettingsStack.Screen name="BirthdayThresholds" component={BirthdayThresholdsScreen} options={{ title: 'Birthday Reminders' }} />
      <SettingsStack.Screen name="SyncSettings" component={SyncSettingsScreen} options={{ title: 'Backup & Sync' }} />
      <SettingsStack.Screen name="LanguageSettings" component={LanguageSettingsScreen} options={{ title: 'Language' }} />
    </SettingsStack.Navigator>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textMuted,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
      }}
    >
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'robot' : 'robot-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="PersonTab"
        component={PersonNavigator}
        options={{
          title: 'People',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'account-group' : 'account-group-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksNavigator}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'clipboard-check' : 'clipboard-check-outline'} color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <Icon name={focused ? 'tune-variant' : 'tune-variant'} color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 0,
    elevation: 12,
    shadowColor: Colors.primary,
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: -4 },
    shadowRadius: 12,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
  tabItem: {
    borderRadius: 12,
  },
});
