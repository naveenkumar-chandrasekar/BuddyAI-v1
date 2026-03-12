import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { MaterialTopTabScreenProps } from '@react-navigation/material-top-tabs';
import type { CompositeScreenProps } from '@react-navigation/native';

// ─── Root ────────────────────────────────────────────────────────────────────

export type RootStackParamList = {
  Onboarding: undefined;
  ModelDownload: undefined;
  Main: undefined;
};

// ─── Onboarding ──────────────────────────────────────────────────────────────

export type OnboardingStackParamList = {
  OnboardingWelcome: undefined;
  OnboardingName: undefined;
  OnboardingProfile: undefined;
  OnboardingNotif: undefined;
  OnboardingPermission: undefined;
  OnboardingReady: undefined;
};

// ─── Bottom Tabs ─────────────────────────────────────────────────────────────

export type MainTabParamList = {
  ChatTab: undefined;
  PersonTab: undefined;
  TasksTab: undefined;
  SettingsTab: undefined;
};

// ─── Chat Stack ───────────────────────────────────────────────────────────────

export type ChatStackParamList = {
  ChatHistory: undefined;
  Chat: { sessionId?: string; openToday?: boolean };
};

// ─── People Stack ─────────────────────────────────────────────────────────────

export type PersonStackParamList = {
  PersonList: undefined;
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

export type PersonListScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PersonStackParamList, 'PersonList'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type PersonDetailScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PersonStackParamList, 'PersonDetail'>,
  BottomTabScreenProps<MainTabParamList>
>;

export type AddEditPersonScreenProps = CompositeScreenProps<
  NativeStackScreenProps<PersonStackParamList, 'AddEditPerson'>,
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
