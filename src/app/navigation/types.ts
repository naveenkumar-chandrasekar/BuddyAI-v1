import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ─── Root ────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  Main: undefined;
};

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingName: undefined;
  OnboardingNotif: undefined;
  OnboardingPermission: undefined;
  OnboardingReady: undefined;
};

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────

export type MainTabParamList = {
  ChatTab: undefined;
  PeopleTab: undefined;
  TasksTab: undefined;
  SettingsTab: undefined;
};

// ─── Chat Stack ───────────────────────────────────────────────────────────────

export type ChatStackParamList = {
  ChatHistory: undefined;
  Chat: { sessionId?: string; openToday?: boolean };
};

// ─── People Stack ─────────────────────────────────────────────────────────────

export type PeopleStackParamList = {
  PeopleList: undefined;
  PersonDetail: { personId: string };
  AddEditPerson: { personId?: string };
};

// ─── Tasks Stack ──────────────────────────────────────────────────────────────

export type TasksStackParamList = {
  TasksTab: undefined;
  AddEditTask: { taskId?: string; type?: 'task' | 'todo' | 'reminder' };
};

export type TasksTopTabParamList = {
  TasksList: undefined;
  TodosList: undefined;
  RemindersList: undefined;
};

// ─── Settings Stack ───────────────────────────────────────────────────────────

export type SettingsStackParamList = {
  Settings: undefined;
  NotificationSettings: undefined;
  BirthdayThresholds: undefined;
  SyncSettings: undefined;
  LanguageSettings: undefined;
};

// ─── Convenience screen prop types ───────────────────────────────────────────

export type ChatHistoryScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ChatStackParamList, 'ChatHistory'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type ChatScreenProps = CompositeScreenProps<
  NativeStackScreenProps<ChatStackParamList, 'Chat'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type PeopleListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PeopleStackParamList, 'PeopleList'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type PersonDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PeopleStackParamList, 'PersonDetail'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type AddEditPersonScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PeopleStackParamList, 'AddEditPerson'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type TasksListScreenProps = MaterialTopTabScreenProps<
  TasksTopTabParamList,
  'TasksList'
>;

export type TodosListScreenProps = MaterialTopTabScreenProps<
  TasksTopTabParamList,
  'TodosList'
>;

export type RemindersListScreenProps = MaterialTopTabScreenProps<
  TasksTopTabParamList,
  'RemindersList'
>;

export type SettingsScreenProps = CompositeScreenProps<
  NativeStackScreenProps<SettingsStackParamList, 'Settings'>,
  BottomTabScreenProps<MainTabParamList>
>;
