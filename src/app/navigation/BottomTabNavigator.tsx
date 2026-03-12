import React from 'react';
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

import ChatHistoryScreen from '../../features/chat/screens/ChatHistoryScreen';
import ChatScreen from '../../features/chat/screens/ChatScreen';

import PersonListScreen from '../../features/people/screens/PersonListScreen';
import PersonDetailScreen from '../../features/people/screens/PersonDetailScreen';
import AddEditPersonScreen from '../../features/people/screens/AddEditPersonScreen';

import TasksTopTabNavigator from './TasksTopTabNavigator';
import AddEditTaskScreen from '../../features/tasks/screens/AddEditTaskScreen';

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

function ChatNavigator() {
  return (
    <ChatStack.Navigator>
      <ChatStack.Screen name="ChatHistory" component={ChatHistoryScreen} options={{ title: 'Chats' }} />
      <ChatStack.Screen name="Chat" component={ChatScreen} options={{ title: 'Chat' }} />
    </ChatStack.Navigator>
  );
}

function PersonNavigator() {
  return (
    <PersonStack.Navigator>
      <PersonStack.Screen name="PersonList" component={PersonListScreen} options={{ title: 'People' }} />
      <PersonStack.Screen name="PersonDetail" component={PersonDetailScreen} options={{ title: 'Person' }} />
      <PersonStack.Screen name="AddEditPerson" component={AddEditPersonScreen} options={{ title: 'Add Person' }} />
    </PersonStack.Navigator>
  );
}

function TasksNavigator() {
  return (
    <TasksStack.Navigator>
      <TasksStack.Screen name="TasksTab" component={TasksTopTabNavigator} options={{ title: 'Tasks' }} />
      <TasksStack.Screen name="AddEditTask" component={AddEditTaskScreen} options={{ title: 'Add Task' }} />
    </TasksStack.Navigator>
  );
}

function SettingsNavigator() {
  return (
    <SettingsStack.Navigator>
      <SettingsStack.Screen name="Settings" component={SettingsScreen} options={{ title: 'Settings' }} />
      <SettingsStack.Screen name="NotificationSettings" component={NotificationSettingsScreen} options={{ title: 'Notifications' }} />
      <SettingsStack.Screen name="BirthdayThresholds" component={BirthdayThresholdsScreen} options={{ title: 'Birthday Reminders' }} />
      <SettingsStack.Screen name="SyncSettings" component={SyncSettingsScreen} options={{ title: 'Sync' }} />
      <SettingsStack.Screen name="LanguageSettings" component={LanguageSettingsScreen} options={{ title: 'Language' }} />
    </SettingsStack.Navigator>
  );
}

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="ChatTab"
        component={ChatNavigator}
        options={{
          title: 'Chat',
          tabBarIcon: ({ color, size }) => <Icon name="chat-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="PersonTab"
        component={PersonNavigator}
        options={{
          title: 'People',
          tabBarIcon: ({ color, size }) => <Icon name="account-group-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="TasksTab"
        component={TasksNavigator}
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => <Icon name="checkbox-marked-circle-outline" color={color} size={size} />,
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SettingsNavigator}
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => <Icon name="cog-outline" color={color} size={size} />,
        }}
      />
    </Tab.Navigator>
  );
}
