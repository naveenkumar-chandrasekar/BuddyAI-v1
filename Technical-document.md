# Buddi — Technical Document
> *Your smart daily companion*

> **Version:** 1.0  
> **Platform:** Android  
> **Date:** February 2026  
> **Status:** Planning & Design Phase

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [App Overview & Features](#2-app-overview--features)
3. [Tech Stack](#3-tech-stack)
4. [System Architecture](#4-system-architecture)
5. [Database Schema](#5-database-schema)
6. [Chatbot Intent & Action Design](#6-chatbot-intent--action-design)
7. [Screen by Screen UI Flow](#7-screen-by-screen-ui-flow)
8. [Notification & Background Task Design](#8-notification--background-task-design)
9. [Missed Item Handling](#9-missed-item-handling)
10. [Security Design](#10-security-design)
11. [Folder Structure](#11-folder-structure)
12. [Brand Identity](#12-brand-identity)
13. [Development Roadmap & Milestones](#13-development-roadmap--milestones)

---

## 1. Executive Summary

This document describes the technical design of **Buddi**, a personal productivity mobile application built for a single user on Android. Buddi is designed to help the user manage their personal relationships, daily tasks, todos, and reminders through a conversational AI chatbot interface, supplemented by traditional UI screens.

The app runs entirely on-device with no dependency on external AI services. All data is encrypted locally using AES-256 and optionally synced to Firebase Firestore for backup. The AI chatbot is powered by Llama 3.2 3B, a lightweight open-source language model that runs fully on the device, ensuring privacy and offline capability.

Key highlights of Buddi are as follows. The entire tech stack is free and open source. All AI inference is on-device with zero network calls. All data is encrypted at rest using AES-256. The chatbot supports multiple languages. Background tasks handle daily summaries, birthday reminders, and missed item re-notifications. The app targets Android 10 and above.

---

## 2. App Overview & Features

### 2.1 People & Relationships

Buddi allows the user to add people with the following attributes: name, relationship type (family, college, school, office, other, or custom), associated place (existing or newly created), priority level (high, medium, or low), birthday, phone number, and personal notes. Places can be of type college, school, office, or custom, and the user can create new places on the fly while adding a person.

### 2.2 Tasks, Todos & Reminders

The app supports three distinct item types. A **Task** is a structured item with a title, description, due date, due time, priority, status, and an optional link to a person with a relationship type (for, with, or on). A **Todo** is a lightweight checklist item with a title, priority, optional due date, and optional person link. A **Reminder** is a time-based alert with a title, description, specific reminder datetime, optional recurrence (daily, weekly, or monthly), priority, and optional person link.

### 2.3 Chatbot Interface

The chatbot is the primary interface for all operations in Buddi. The user can type natural language messages to create, update, delete, or query people, tasks, todos, reminders, and settings. The chatbot is powered by Llama 3.2 3B running fully on-device. Chat history is stored in the local encrypted database and injected as context into every new AI prompt, allowing the chatbot to maintain conversational continuity. The chatbot supports multiple languages and always responds in the same language the user writes in.

### 2.4 Daily Notification & Chat Sessions

The user configures a daily notification time during onboarding (configurable later in settings). At that time, a notification fires containing a summary of the day — missed items, today's tasks, todos, reminders, and upcoming birthdays. Tapping the notification opens a chat session for that day, where the AI greets the user with a structured daily summary and the user can chat naturally from there.

### 2.5 Birthday Reminders

Each person's birthday reminder timing is determined by their priority level. The default thresholds are 14 days before for high priority, 7 days before for medium priority, and 2 days before for low priority. These thresholds are fully configurable by the user in settings.

### 2.6 Missed Item Re-reminders

Any task, todo, or reminder that is overdue and unresolved is treated as a missed item. Missed items are re-reminded based on their priority: high priority items are re-reminded daily, medium priority every 2 days, and low priority every 7 days. Missed items are included both in the daily summary notification and in a separate notification at the scheduled re-remind time. Missed items never auto-close — only the user can resolve or dismiss them.

---

## 3. Tech Stack

### 3.1 Complete Stack

| Layer | Technology | Purpose | Cost |
|---|---|---|---|
| Framework | React Native (TypeScript) | Cross-platform mobile development | Free |
| Navigation | React Navigation | Screen navigation | Free |
| State Management | Zustand | UI state and cached data | Free |
| UI Components | React Native Paper | Material Design components | Free |
| Main Database | WatermelonDB + SQLCipher | Encrypted local relational database | Free |
| Settings Store | MMKV (encrypted) | Fast key-value settings storage | Free |
| Secure Key Storage | Android Keystore | Encryption key management | Free |
| AI Model | Llama 3.2 3B | On-device language model | Free |
| AI Runtime | llama.cpp | Llama model inference engine | Free |
| Cloud Sync | Firebase Firestore | Encrypted backup and sync | Free tier |
| Authentication | Firebase Auth | Single-user authentication | Free tier |
| Notifications | Notifee | Local notification scheduling | Free |
| Background Tasks | react-native-background-fetch | Periodic background processing | Free |
| Deployment | Direct signed APK | Android direct install | Free |
| CI/CD | GitHub Actions | Automated builds | Free tier |

**Total Cost: $0**

### 3.2 Why These Choices

**React Native** was chosen over Flutter for its JavaScript/TypeScript ecosystem, mature library support, and wide developer familiarity. **WatermelonDB** was chosen over plain SQLite for its React Native-optimized lazy loading and better performance as data grows. **Llama 3.2 3B** was chosen for its best-in-class quality among lightweight models, strong multilingual support, and open-source licensing. **Firebase Firestore** was chosen for its built-in offline support, generous free tier, and easy React Native integration. **Zustand** was chosen over Redux for its minimal boilerplate and simplicity, which is appropriate for Buddi as a single-user personal app.

### 3.3 Minimum Requirements

| Requirement | Value |
|---|---|
| Minimum Android Version | Android 10 (API 29) |
| Target Android Version | Android 14 (API 34) |
| Minimum RAM | 3 GB |
| Storage for model | ~2 GB (Llama 3.2 3B) |
| Storage for app data | ~200 MB |

---

## 4. System Architecture

### 4.1 Architecture Pattern

The app follows a **3-layer Clean Architecture** pattern to ensure separation of concerns, testability, and maintainability.

```
┌─────────────────────────────────┐
│         Presentation Layer       │
│   Screens, Components, Hooks     │
├─────────────────────────────────┤
│          Domain Layer            │
│   Use Cases, Business Logic      │
├─────────────────────────────────┤
│           Data Layer             │
│   Database, Firebase, AI Model   │
└─────────────────────────────────┘
```

The **Presentation Layer** contains all UI screens, reusable components, and custom hooks. It reads data from Zustand stores and calls domain use cases in response to user actions. It has no direct knowledge of the database or AI model.

The **Domain Layer** contains all business logic as use cases. Each use case performs a single operation (e.g., AddPersonUseCase, GetTodaysTasksUseCase). Use cases interact with repositories via interfaces, making the data layer swappable.

The **Data Layer** contains repository implementations, WatermelonDB models, Firebase sync logic, and the AI inference service. It is the only layer that knows about specific storage technologies.

### 4.2 Data Flow — Chat Message

The following describes the full flow when a user sends a chat message:

```
User types message in ChatScreen
        ↓
useChat.ts hook receives input
        ↓
SendMessageUseCase.ts (Domain)
        ↓
PromptBuilder.ts builds context
  (injects people, tasks, chat history)
        ↓
LlamaService.ts runs on-device inference
        ↓
IntentParser.ts parses JSON response
        ↓
ActionExecutor.ts executes the action
        ↓
Repository called (e.g. TaskRepository)
        ↓
WatermelonDB updated locally
        ↓
FirebaseService syncs to cloud (encrypted)
        ↓
Zustand store updated
        ↓
ChatScreen re-renders with AI response
```

### 4.3 Data Flow — Daily Notification

```
Background fetch runs periodically
        ↓
MissedItemChecker evaluates overdue items
        ↓
BirthdayChecker evaluates upcoming birthdays
        ↓
DailyNotificationChecker checks configured time
        ↓
Notifee fires daily summary notification
        ↓
User taps notification
        ↓
App opens → ChatScreen for today's session
        ↓
AI generates daily summary message
        ↓
User chats naturally from here
```

---

## 5. Database Schema

All tables are stored in WatermelonDB with SQLCipher AES-256 encryption. Soft deletes are used throughout (via `is_deleted` flag) to preserve data for AI chat history context. All timestamps are stored as Unix integers.

### 5.1 places

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| name | TEXT | Place name (e.g. "TCS Office") |
| type | TEXT | college / school / office / custom |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |
| is_deleted | INTEGER | 0 = active, 1 = deleted |

### 5.2 people

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| name | TEXT | Person's name |
| relationship_type | TEXT | family / college / school / office / other / custom |
| custom_relation | TEXT (nullable) | Custom relationship label |
| place_id | TEXT (nullable, FK) | References places.id |
| priority | INTEGER | 1 = high, 2 = medium, 3 = low |
| birthday | TEXT (nullable) | Format: YYYY-MM-DD |
| phone | TEXT (nullable) | Phone number |
| notes | TEXT (nullable) | Free-text notes |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |
| is_deleted | INTEGER | 0 = active, 1 = deleted |

### 5.3 tasks

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| title | TEXT | Task title |
| description | TEXT (nullable) | Task details |
| due_date | INTEGER (nullable) | Unix timestamp |
| due_time | INTEGER (nullable) | Unix timestamp |
| priority | INTEGER | 1 = high, 2 = medium, 3 = low |
| status | TEXT | pending / in_progress / completed / cancelled |
| person_id | TEXT (nullable, FK) | References people.id |
| relation_type | TEXT (nullable) | for / with / on |
| is_missed | INTEGER | 0 = not missed, 1 = missed |
| missed_at | INTEGER (nullable) | When it became missed |
| next_remind_at | INTEGER (nullable) | Next re-remind time |
| remind_count | INTEGER | Number of times re-reminded |
| is_dismissed | INTEGER | 0 = active, 1 = dismissed |
| dismissed_at | INTEGER (nullable) | When user dismissed |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |
| completed_at | INTEGER (nullable) | Unix timestamp |
| is_deleted | INTEGER | 0 = active, 1 = deleted |

### 5.4 todos

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| title | TEXT | Todo title |
| is_completed | INTEGER | 0 = pending, 1 = completed |
| priority | INTEGER | 1 = high, 2 = medium, 3 = low |
| person_id | TEXT (nullable, FK) | References people.id |
| relation_type | TEXT (nullable) | for / with / on |
| due_date | INTEGER (nullable) | Unix timestamp |
| is_missed | INTEGER | 0 = not missed, 1 = missed |
| missed_at | INTEGER (nullable) | When it became missed |
| next_remind_at | INTEGER (nullable) | Next re-remind time |
| remind_count | INTEGER | Number of times re-reminded |
| is_dismissed | INTEGER | 0 = active, 1 = dismissed |
| dismissed_at | INTEGER (nullable) | When user dismissed |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |
| completed_at | INTEGER (nullable) | Unix timestamp |
| is_deleted | INTEGER | 0 = active, 1 = deleted |

### 5.5 reminders

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| title | TEXT | Reminder title |
| description | TEXT (nullable) | Additional details |
| remind_at | INTEGER | Unix timestamp |
| is_recurring | INTEGER | 0 = one-time, 1 = recurring |
| recurrence | TEXT (nullable) | daily / weekly / monthly |
| is_done | INTEGER | 0 = pending, 1 = done |
| person_id | TEXT (nullable, FK) | References people.id |
| relation_type | TEXT (nullable) | for / with / on |
| priority | INTEGER | 1 = high, 2 = medium, 3 = low |
| is_missed | INTEGER | 0 = not missed, 1 = missed |
| missed_at | INTEGER (nullable) | When it became missed |
| next_remind_at | INTEGER (nullable) | Next re-remind time |
| remind_count | INTEGER | Number of times re-reminded |
| is_dismissed | INTEGER | 0 = active, 1 = dismissed |
| dismissed_at | INTEGER (nullable) | When user dismissed |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |
| is_deleted | INTEGER | 0 = active, 1 = deleted |

### 5.6 chat_sessions

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| session_date | TEXT | Format: YYYY-MM-DD |
| title | TEXT (nullable) | e.g. "Monday Summary" |
| summary | TEXT (nullable) | AI-generated end-of-day summary |
| is_daily | INTEGER | 1 = triggered by notification |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |

### 5.7 chat_messages

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| session_id | TEXT (FK) | References chat_sessions.id |
| sender | TEXT | user / ai |
| message | TEXT | Message content |
| message_type | TEXT | text / action / summary / notification |
| action_type | TEXT (nullable) | e.g. CREATE_TASK |
| action_payload | TEXT (nullable) | JSON string of action data |
| is_processed | INTEGER | 0 = pending, 1 = processed |
| created_at | INTEGER | Unix timestamp |

### 5.8 chat_session_people / tasks / todos / reminders

Four junction tables link chat sessions to related entities discussed during the session. Each table contains `id`, `session_id` (FK), the respective entity `id` (FK), and `created_at`.

### 5.9 notification_config

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier (single row) |
| daily_notif_time | TEXT | Format: HH:MM (24hr) |
| daily_notif_enabled | INTEGER | Default: 1 |
| birthday_notif_enabled | INTEGER | Default: 1 |
| task_notif_enabled | INTEGER | Default: 1 |
| reminder_notif_enabled | INTEGER | Default: 1 |
| missed_notif_enabled | INTEGER | Default: 1 |
| high_priority_days | INTEGER | Birthday remind days (default: 14) |
| medium_priority_days | INTEGER | Birthday remind days (default: 7) |
| low_priority_days | INTEGER | Birthday remind days (default: 2) |
| missed_high_interval | INTEGER | Re-remind days (default: 1) |
| missed_medium_interval | INTEGER | Re-remind days (default: 2) |
| missed_low_interval | INTEGER | Re-remind days (default: 7) |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |

### 5.10 birthday_reminders

| Column | Type | Description |
|---|---|---|
| id | TEXT (UUID, PK) | Unique identifier |
| person_id | TEXT (FK) | References people.id |
| birthday_date | TEXT | This year's birthday (YYYY-MM-DD) |
| remind_on | TEXT | Calculated remind date (YYYY-MM-DD) |
| days_before | INTEGER | Based on person priority |
| is_notified | INTEGER | 0 = pending, 1 = notified |
| is_dismissed | INTEGER | 0 = active, 1 = dismissed |
| created_at | INTEGER | Unix timestamp |
| updated_at | INTEGER | Unix timestamp |

### 5.11 Entity Relationship Overview

```
places ──────────────── people
                           │
              ┌────────────┼────────────┐
              │            │            │
           tasks         todos      reminders
              │            │            │
              └────────────┼────────────┘
                           │
                    chat_sessions
                           │
                    chat_messages
                           │
         ┌─────────────────┼──────────────────┐
         │                 │                  │
chat_session_people  chat_session_tasks  chat_session_todos
                                              │
                                    chat_session_reminders

notification_config ──── birthday_reminders ──── people
```

---

## 6. Chatbot Intent & Action Design

### 6.1 How the Chatbot Works

Every user message goes through a 4-step pipeline. First, **PromptBuilder** assembles a context-rich prompt by injecting today's tasks, todos, reminders, upcoming birthdays, the last 10 chat messages, and the current date and time. Second, **LlamaService** runs on-device inference using Llama 3.2 3B via llama.cpp and returns a structured JSON response. Third, **IntentParser** parses the JSON response into a typed intent and action. Fourth, **ActionExecutor** calls the appropriate repository method, logs the action as a chat message, and triggers a Firebase sync.

### 6.2 Prompt Structure

```
[SYSTEM PROMPT]
You are Buddi, a friendly personal assistant app.
You help manage people, tasks, todos, and reminders.
Today's date is {date}. Current time is {time}.

User's people: {people_summary}
Today's tasks: {tasks_summary}
Today's todos: {todos_summary}
Today's reminders: {reminders_summary}
Upcoming birthdays: {birthdays_summary}
Recent chat history: {last_10_messages}

Detect the language of the user's message.
Always respond in the same language.
The JSON structure must always be in English.
Only the "message" field should be in the user's language.

Always respond ONLY in this JSON format:
{
  "intent": "INTENT_TYPE",
  "action": "ACTION_TYPE",
  "message": "Conversational response in user's language",
  "data": { }
}

[USER MESSAGE]
{user_message}
```

### 6.3 Intent & Action Reference

**PEOPLE_INTENT** covers CREATE_PERSON, UPDATE_PERSON, DELETE_PERSON, GET_PERSON, LIST_PEOPLE, and ADD_BIRTHDAY. Example: "Add John as a friend from office" triggers CREATE_PERSON.

**TASK_INTENT** covers CREATE_TASK, UPDATE_TASK, COMPLETE_TASK, DELETE_TASK, LIST_TASKS, and LIST_TASKS_FOR_PERSON. Example: "Create a task to buy a gift for John by Friday" triggers CREATE_TASK.

**TODO_INTENT** covers CREATE_TODO, COMPLETE_TODO, DELETE_TODO, LIST_TODOS, and LIST_TODOS_FOR_PERSON. Example: "Add call Sarah to my todo list" triggers CREATE_TODO.

**REMINDER_INTENT** covers CREATE_REMINDER, UPDATE_REMINDER, DELETE_REMINDER, LIST_REMINDERS, and CREATE_RECURRING. Example: "Remind me to call Mom tomorrow at 9am" triggers CREATE_REMINDER.

**QUERY_INTENT** covers QUERY_TODAY, QUERY_UPCOMING, QUERY_BIRTHDAYS, QUERY_OVERDUE, QUERY_PERSON_SUMMARY, and QUERY_PRIORITY. Example: "What do I have today?" triggers QUERY_TODAY.

**MISSED_INTENT** covers DISMISS_MISSED_ITEM, LIST_MISSED_ITEMS, and SNOOZE_MISSED_ITEM. Example: "Dismiss the gift task reminder" triggers DISMISS_MISSED_ITEM.

**SUMMARY_INTENT** covers DAILY_SUMMARY, GENERATE_SUMMARY, and PERSON_SUMMARY.

**SETTINGS_INTENT** covers UPDATE_NOTIF_TIME, UPDATE_BIRTHDAY_THRESHOLD, and TOGGLE_NOTIFICATIONS.

**CONVERSATION_INTENT** covers GENERAL_CHAT and UNKNOWN as a fallback for unrecognized inputs.

### 6.4 Example AI Response

User message: "Add John as office friend, high priority"

```json
{
  "intent": "PEOPLE_INTENT",
  "action": "CREATE_PERSON",
  "message": "I've added John as a high priority office friend! Would you like to add his birthday or phone number?",
  "data": {
    "name": "John",
    "relationship_type": "office",
    "priority": 1,
    "place_id": null
  }
}
```

---

## 7. Screen by Screen UI Flow

### 7.1 App Launch Flow

On first launch, the user is directed to the Onboarding flow. On subsequent launches, the user goes directly to the Main App.

### 7.2 Onboarding Flow

The onboarding consists of 5 screens: a welcome screen with the app name and logo, a name input screen asking what to call the user, a daily notification time picker, a notification permissions request screen, and a ready screen with quick feature highlights before entering the main app.

### 7.3 Navigation Structure

```
RootNavigator (Stack)
├── OnboardingNavigator (Stack)
│   ├── OnboardingWelcomeScreen
│   ├── OnboardingNameScreen
│   ├── OnboardingNotifScreen
│   ├── OnboardingPermissionScreen
│   └── OnboardingReadyScreen
│
└── MainNavigator (Bottom Tab)
    ├── ChatTab (Stack)
    │   ├── ChatHistoryScreen
    │   └── ChatScreen
    │
    ├── PeopleTab (Stack)
    │   ├── PeopleListScreen
    │   ├── PersonDetailScreen
    │   └── AddEditPersonScreen
    │
    ├── TasksTab (Stack)
    │   ├── TasksTabScreen (Top Tab)
    │   │   ├── TasksListScreen
    │   │   ├── TodosListScreen
    │   │   └── RemindersListScreen
    │   └── AddEditTaskScreen
    │
    └── SettingsTab (Stack)
        ├── SettingsScreen
        ├── NotificationSettingsScreen
        ├── BirthdayThresholdsScreen
        ├── SyncSettingsScreen
        └── LanguageSettingsScreen
```

### 7.4 Chat Tab

**ChatHistoryScreen** shows a list of past chat sessions grouped by date. Each session displays the date, AI-generated summary if available, and number of actions performed. Tapping a session opens ChatScreen. A FAB button starts a new chat session.

**ChatScreen** shows the chat for the selected session. User messages are right-aligned and AI messages are left-aligned. Action messages appear centered and highlighted. Summary messages appear as full-width cards. Quick action chips at the bottom offer shortcuts for "What's today?", "Add task", "Add person", and "Upcoming birthdays". A text input with a send button is at the bottom.

### 7.5 People Tab

**PeopleListScreen** shows a searchable, filterable list of people with filter chips for All, Family, College, School, Office, and Custom. Cards show name, avatar initials, relationship badge, priority indicator, and upcoming birthday days. A FAB opens AddEditPersonScreen.

**PersonDetailScreen** shows full person details with tabs for their linked Tasks, Todos, Reminders, and Chat History.

**AddEditPersonScreen** is a form with name, relationship type, custom relationship label (if custom), place selector with add-new option, priority selector, birthday picker, phone, and notes.

### 7.6 Tasks Tab

The Tasks tab has a top tab navigator with three sub-screens: Tasks, Todos, and Reminders. Each list supports filter chips and sort options. Tasks and reminders support swipe-left to delete and swipe-right to complete or mark done. A FAB opens the respective add screen. Missed items appear highlighted with a warning indicator.

### 7.7 Settings Tab

**SettingsScreen** shows user name (editable), links to sub-screens, and app theme toggle. Sub-screens cover notification toggles and daily time picker, birthday threshold steppers per priority level, Firebase sync controls with last-synced timestamp, and language selection with auto-detect toggle.

### 7.8 Notification Tap Flow

When the user taps the daily notification, the app opens the ChatScreen for today's session. If no session exists for today, one is created. The AI immediately sends a daily summary message in the following format:

```
Good morning {name}! Here's your day:

⚠️ Missed Items:
  • Buy gift for John — overdue 2 days (High)

📋 Due Today:
  • Team meeting with Sarah (High)

✅ Todos:
  • Review project docs

🔔 Reminders Today:
  • Call Mom at 3pm

🎂 Upcoming Birthdays:
  • John's birthday in 5 days!
```

---

## 8. Notification & Background Task Design

### 8.1 Notification Types

| Type | Trigger | On Tap |
|---|---|---|
| Daily Summary | User-configured time | Open today's chat session |
| Birthday Reminder | Priority-based days before birthday | Open person detail |
| Task Due | Task due date/time | Open task detail |
| Reminder | Reminder datetime | Open reminder detail |
| Missed Item | next_remind_at timestamp | Open chat with context |

### 8.2 Background Processing Flow

react-native-background-fetch runs periodically (minimum every 15 minutes on Android). Each run executes the following rule-based checks in order: MissedItemChecker evaluates all tasks, todos, and reminders for overdue and undismissed items and schedules re-remind notifications. BirthdayChecker evaluates upcoming birthdays against priority thresholds and schedules birthday notifications. DailyNotificationChecker checks whether the current time matches the user's configured daily notification time and fires the daily summary notification if so.

No AI model is used in background processing. All background logic is rule-based to conserve battery and ensure reliability.

### 8.3 Birthday Reminder Generation

On the first app launch of each year (or on January 1st), birthday reminders are regenerated for all people who have a birthday set. The `remind_on` date is calculated as `birthday_date minus days_before`, where `days_before` is determined by the person's priority and the user's configured thresholds in `notification_config`.

---

## 9. Missed Item Handling

### 9.1 Missed Item Definition

A task is considered missed when its `due_date` has passed and its `status` is still pending or in_progress. A todo is missed when its `due_date` has passed and `is_completed` is 0. A reminder is missed when its `remind_at` has passed and `is_done` is 0.

### 9.2 Re-reminder Intervals

| Priority | Re-remind Interval |
|---|---|
| High | Every 1 day |
| Medium | Every 2 days |
| Low | Every 7 days |

These intervals are stored in `notification_config` and are user-configurable.

### 9.3 Missed Item Lifecycle

When MissedItemChecker detects a missed item it sets `is_missed = 1`, records `missed_at`, calculates `next_remind_at` based on priority interval, increments `remind_count`, and schedules a Notifee notification at `next_remind_at`. When that notification fires, the cycle repeats: `next_remind_at` is recalculated and a new notification is scheduled. This continues indefinitely until the user resolves or dismisses the item.

### 9.4 Dismiss Options

The user can dismiss a missed item in three ways: via chat by saying something like "Dismiss the gift task reminder", via swipe gesture on the task/todo/reminder card in the UI, or via a "Dismiss" action button directly on the notification. In all cases, `is_dismissed` is set to 1 and any scheduled future notifications for that item are cancelled.

The AI also tracks `remind_count` and may surface it contextually in the chat, for example: "You've been reminded about this task 5 times. Would you like to reschedule or dismiss it?"

---

## 10. Security Design

### 10.1 Data at Rest

All relational app data is stored in WatermelonDB encrypted with SQLCipher using AES-256. The encryption key is generated on first app launch and stored exclusively in the Android Keystore, which is a hardware-backed secure enclave on supported devices. The key never touches the database or any network. App settings are stored in MMKV with encryption enabled.

### 10.2 Data in Transit

All data synced to Firebase Firestore is encrypted with AES-256 before leaving the device. The Firebase document contains only the encrypted ciphertext. The encryption key remains on-device only and is never sent to Firebase. This means even if the Firebase account is compromised, the data is unreadable without the device's encryption key.

### 10.3 AI Inference Security

Llama 3.2 3B runs entirely on-device via llama.cpp. No user messages, context data, or inference results are sent to any external server. The model file is stored in the app's private data directory, which is inaccessible to other apps on non-rooted devices. On app startup, a SHA-256 checksum of the model file is verified to detect tampering.

### 10.4 Security Summary

| Layer | Protection |
|---|---|
| Local database | SQLCipher AES-256 |
| Encryption key | Android Keystore (hardware-backed) |
| Firebase data | AES-256 encrypted before upload |
| AI inference | 100% on-device, zero network calls |
| Model file | Stored in private app directory, checksum verified |
| App settings | MMKV encrypted |

---

## 11. Folder Structure

The project follows a feature-based clean architecture. Each feature is self-contained with its own screens, components, hooks, and Zustand store. Cross-cutting concerns are isolated in the `core` and `shared` directories.

```
src/
├── app/
│   ├── index.tsx
│   └── navigation/
│       ├── RootNavigator.tsx
│       ├── BottomTabNavigator.tsx
│       └── types.ts
│
├── features/
│   ├── people/
│   │   ├── screens/
│   │   │   ├── PeopleListScreen.tsx
│   │   │   ├── PersonDetailScreen.tsx
│   │   │   └── AddEditPersonScreen.tsx
│   │   ├── components/
│   │   │   ├── PersonCard.tsx
│   │   │   ├── PersonAvatar.tsx
│   │   │   └── PriorityBadge.tsx
│   │   ├── hooks/
│   │   │   └── usePeople.ts
│   │   └── store/
│   │       └── peopleStore.ts
│   │
│   ├── tasks/
│   │   ├── screens/
│   │   │   ├── TasksListScreen.tsx
│   │   │   ├── TodosListScreen.tsx
│   │   │   ├── RemindersListScreen.tsx
│   │   │   └── AddEditTaskScreen.tsx
│   │   ├── components/
│   │   │   ├── TaskCard.tsx
│   │   │   ├── TodoItem.tsx
│   │   │   └── ReminderCard.tsx
│   │   ├── hooks/
│   │   │   └── useTasks.ts
│   │   └── store/
│   │       └── taskStore.ts
│   │
│   ├── chat/
│   │   ├── screens/
│   │   │   ├── ChatScreen.tsx
│   │   │   └── ChatHistoryScreen.tsx
│   │   ├── components/
│   │   │   ├── MessageBubble.tsx
│   │   │   ├── ActionMessage.tsx
│   │   │   ├── SummaryMessage.tsx
│   │   │   └── ChatInput.tsx
│   │   ├── hooks/
│   │   │   └── useChat.ts
│   │   └── store/
│   │       └── chatStore.ts
│   │
│   └── settings/
│       ├── screens/
│       │   ├── SettingsScreen.tsx
│       │   ├── NotificationSettingsScreen.tsx
│       │   ├── BirthdayThresholdsScreen.tsx
│       │   └── SyncSettingsScreen.tsx
│       ├── hooks/
│       │   └── useSettings.ts
│       └── store/
│           └── settingsStore.ts
│
├── domain/
│   ├── usecases/
│   │   ├── people/
│   │   │   ├── AddPersonUseCase.ts
│   │   │   ├── UpdatePersonUseCase.ts
│   │   │   ├── DeletePersonUseCase.ts
│   │   │   └── GetPeopleUseCase.ts
│   │   ├── tasks/
│   │   │   ├── AddTaskUseCase.ts
│   │   │   ├── UpdateTaskUseCase.ts
│   │   │   ├── CompleteTaskUseCase.ts
│   │   │   └── GetTodaysTasksUseCase.ts
│   │   ├── chat/
│   │   │   ├── SendMessageUseCase.ts
│   │   │   ├── ProcessAIResponseUseCase.ts
│   │   │   └── GetChatHistoryUseCase.ts
│   │   └── notifications/
│   │       ├── ScheduleDailyNotifUseCase.ts
│   │       ├── ScheduleBirthdayNotifUseCase.ts
│   │       └── GenerateDailySummaryUseCase.ts
│   ├── models/
│   │   ├── Person.ts
│   │   ├── Place.ts
│   │   ├── Task.ts
│   │   ├── Todo.ts
│   │   ├── Reminder.ts
│   │   ├── ChatSession.ts
│   │   ├── ChatMessage.ts
│   │   └── NotificationConfig.ts
│   └── repositories/
│       ├── IPeopleRepository.ts
│       ├── ITaskRepository.ts
│       ├── ITodoRepository.ts
│       ├── IReminderRepository.ts
│       └── IChatRepository.ts
│
├── data/
│   ├── database/
│   │   ├── schema/
│   │   │   ├── peopleSchema.ts
│   │   │   ├── tasksSchema.ts
│   │   │   ├── chatSchema.ts
│   │   │   └── index.ts
│   │   ├── models/
│   │   │   ├── PersonModel.ts
│   │   │   ├── TaskModel.ts
│   │   │   ├── TodoModel.ts
│   │   │   ├── ReminderModel.ts
│   │   │   └── ChatModel.ts
│   │   └── database.ts
│   ├── repositories/
│   │   ├── PeopleRepository.ts
│   │   ├── TaskRepository.ts
│   │   ├── TodoRepository.ts
│   │   ├── ReminderRepository.ts
│   │   └── ChatRepository.ts
│   ├── firebase/
│   │   ├── FirebaseService.ts
│   │   ├── FirebaseAuth.ts
│   │   └── encryption.ts
│   └── ai/
│       ├── LlamaService.ts
│       ├── IntentParser.ts
│       ├── ActionExecutor.ts
│       └── PromptBuilder.ts
│
├── core/
│   ├── notifications/
│   │   ├── NotifeeService.ts
│   │   └── BackgroundService.ts
│   ├── missed/
│   │   ├── MissedItemChecker.ts
│   │   ├── MissedItemScheduler.ts
│   │   └── MissedItemDismisser.ts
│   ├── security/
│   │   ├── KeystoreService.ts
│   │   └── EncryptionService.ts
│   └── utils/
│       ├── dateUtils.ts
│       ├── priorityUtils.ts
│       ├── birthdayUtils.ts
│       └── syncUtils.ts
│
├── shared/
│   ├── components/
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   ├── Card.tsx
│   │   ├── EmptyState.tsx
│   │   └── LoadingSpinner.tsx
│   ├── theme/
│   │   ├── colors.ts
│   │   ├── typography.ts
│   │   └── spacing.ts
│   └── constants/
│       ├── priorities.ts
│       ├── relationships.ts
│       └── actionTypes.ts
│
└── assets/
    ├── fonts/
    ├── icons/
    └── images/
```

---

---

## 12. Brand Identity

### 13.1 App Name & Tagline

| Attribute | Detail |
|---|---|
| **App Name** | Buddi |
| **Primary Tagline** | Your smart daily companion |
| **Alternate Taglines** | "The buddy who never forgets" · "Your people. Your tasks. Your day." · "Always by your side" |
| **Tone** | Warm, friendly, personal — speaks like a helpful companion, never robotic |

### 13.2 App Icon

The chosen icon concept is **Spark** — a chat bubble with a sparkle star. This captures the AI chatbot as the heart of the app, hinting at smart, conversational interaction. The icon uses a deep purple gradient background (#4C1D95 → #8B5CF6) with a white chat bubble and sparkle, giving it a premium and friendly feel.

### 13.3 Color Palette

**Primary Colors:**

| Name | Hex | Usage |
|---|---|---|
| Indigo | #5B6CF9 | Primary actions, buttons, highlights |
| Violet | #8B5CF6 | Secondary accent, gradients |
| Periwinkle | #A5B4FC | Subtle accents, borders, labels |
| Sky | #38BDF8 | Accent gradient, low priority indicator |

**Background Colors:**

| Name | Hex | Usage |
|---|---|---|
| Midnight | #0F0E2A | Primary background (dark mode) |
| Deep | #1A1845 | Secondary background |
| Card | #201E4A | Card and surface backgrounds |

**Semantic Colors:**

| Name | Hex | Usage |
|---|---|---|
| Success | #22C55E | Completed tasks, done states |
| Warning / Medium Priority | #F59E0B | Medium priority items |
| Danger / High Priority | #EF4444 | High priority items, overdue |
| Low Priority | #38BDF8 | Low priority items |

**Gradients:**
- Primary: `linear-gradient(135deg, #5B6CF9, #8B5CF6)` — used on buttons, icon, key UI elements
- Accent: `linear-gradient(135deg, #A5B4FC, #38BDF8)` — used on highlights and chips

### 13.4 Typography

| Role | Font | Weights | Usage |
|---|---|---|---|
| Display | Nunito | 800, 900 | App name, screen headings, bold labels |
| Body | DM Sans | 300, 400, 500, 600 | All body text, chat messages, descriptions |

### 13.5 UI Design Guidelines

**Corner Radius:** Cards 20–24px · Buttons 14px · Chips 20px · Input fields 14px

**Theme:** Dark mode first. Light mode uses soft lavender white (#F5F4FF) with indigo accents.

**Voice & Tone:** Short sentences, warm and encouraging, always action-oriented. Buddi speaks like a friendly buddy — never robotic or formal.

---

## 13. Development Roadmap & Milestones

### 13.1 Overview

The development is broken into 6 phases. Each phase delivers a working, testable slice of Buddi. Later phases build on top of earlier ones. The goal is to have a fully functional personal app by the end of Phase 6.

| Phase | Name | Focus | Estimated Duration |
|---|---|---|---|
| 1 | Foundation | Project setup, navigation, database | 2 weeks |
| 2 | Core Data | People, tasks, todos, reminders UI | 3 weeks |
| 3 | Notifications | Background tasks, daily notification, birthday reminders | 2 weeks |
| 4 | Chatbot | Llama integration, intent parsing, action execution | 4 weeks |
| 5 | Security & Sync | SQLCipher, Android Keystore, Firebase sync | 2 weeks |
| 6 | Polish | Missed items, multilingual, settings, CI/CD | 2 weeks |

**Total Estimated Duration: ~15 weeks**

---

### 13.2 Phase 1 — Foundation (Weeks 1–2)

The goal of this phase is to get the project skeleton in place with working navigation, an empty but correctly structured database, and the basic screen shells.

**Milestone 1.1 — Project Setup**
- Initialize React Native project with TypeScript
- Configure ESLint, Prettier, and TypeScript strict mode
- Set up GitHub repository and GitHub Actions basic workflow
- Install and configure all core dependencies (React Navigation, Zustand, React Native Paper)
- Configure Android build with correct min/target SDK versions

**Milestone 1.2 — Navigation Shell**
- Implement RootNavigator with onboarding and main app split
- Implement BottomTabNavigator with all 4 tabs (Chat, People, Tasks, Settings)
- Implement all screen placeholders with correct route names and types
- Verify deep linking works for notification tap navigation

**Milestone 1.3 — Database Setup**
- Install and configure WatermelonDB
- Define all 13 table schemas
- Set up database.ts with initialization logic
- Verify database creates correctly on first launch
- Set up MMKV for settings storage

**Deliverable:** App launches, navigates between all screens (empty), and database initializes without errors.

---

### 13.3 Phase 2 — Core Data (Weeks 3–5)

The goal of this phase is to implement full CRUD for people, tasks, todos, and reminders via the traditional UI screens, without the chatbot.

**Milestone 2.1 — People Feature**
- Implement PeopleListScreen with search and filter chips
- Implement AddEditPersonScreen with all fields (name, relationship, place, priority, birthday)
- Implement PersonDetailScreen with linked items tabs
- Implement PeopleRepository with WatermelonDB
- Implement Zustand peopleStore
- Implement AddPersonUseCase, UpdatePersonUseCase, DeletePersonUseCase, GetPeopleUseCase

**Milestone 2.2 — Tasks Feature**
- Implement TasksListScreen with filter and sort
- Implement TodosListScreen with checkbox interactions
- Implement RemindersListScreen
- Implement AddEditTaskScreen covering tasks, todos, and reminders
- Implement TaskRepository, TodoRepository, ReminderRepository
- Implement Zustand taskStore
- Implement all task-related use cases

**Milestone 2.3 — Onboarding**
- Implement all 5 onboarding screens
- Implement name input and MMKV storage
- Implement daily notification time picker
- Implement notification permission request
- Set onboarding_done flag on completion

**Deliverable:** User can complete onboarding, add/edit/delete people and places, create/complete/delete tasks, todos, and reminders entirely through the traditional UI.

---

### 13.4 Phase 3 — Notifications (Weeks 6–7)

The goal of this phase is to implement all notification and background processing logic so the app can remind the user even when it is closed.

**Milestone 3.1 — Notifee Setup**
- Install and configure Notifee
- Create Android notification channels (daily, birthday, task, reminder, missed)
- Implement NotifeeService with scheduling helpers
- Test notification delivery on physical device

**Milestone 3.2 — Daily Notification**
- Implement daily notification scheduling based on user-configured time
- Implement notification tap → navigate to today's ChatScreen
- Create today's chat session on notification tap if not already existing
- Implement GenerateDailySummaryUseCase (rule-based, no AI at this stage)
- Display static daily summary in chat on session open

**Milestone 3.3 — Birthday Reminders**
- Implement birthday reminder generation logic (yearly)
- Implement BirthdayChecker in BackgroundService
- Schedule Notifee notifications for upcoming birthdays based on priority thresholds
- Implement birthday_reminders table population on app launch

**Milestone 3.4 — Background Fetch**
- Install and configure react-native-background-fetch
- Implement BackgroundService orchestrating MissedItemChecker and BirthdayChecker
- Test background execution on physical Android device

**Deliverable:** Daily notification fires at configured time, tapping it opens today's chat with a static summary. Birthday reminders fire at the correct priority-based dates.

---

### 13.5 Phase 4 — Chatbot (Weeks 8–11)

This is the most complex phase. The goal is to integrate Llama 3.2 3B on-device and make all app operations available via natural language chat.

**Milestone 4.1 — Llama Integration**
- Set up llama.cpp React Native binding
- Bundle Llama 3.2 3B model in app's private directory
- Implement LlamaService with inference method
- Implement model checksum verification on startup
- Test basic prompt/response on physical device
- Measure and document inference latency

**Milestone 4.2 — Chat UI**
- Implement ChatHistoryScreen with session list grouped by date
- Implement ChatScreen with message bubbles (user, AI, action, summary types)
- Implement ChatInput with send button
- Implement quick action chips
- Implement ChatRepository and chatStore
- Wire up SendMessageUseCase to UI

**Milestone 4.3 — Prompt & Intent System**
- Implement PromptBuilder with full context injection (people, tasks, chat history, date/time)
- Implement IntentParser to parse Llama JSON responses
- Implement ActionExecutor with handlers for all intent/action combinations
- Handle UNKNOWN intent gracefully with a fallback conversational response
- Log all AI actions as action-type chat messages

**Milestone 4.4 — AI-Powered Daily Summary**
- Replace static daily summary (from Phase 3) with AI-generated summary
- Inject today's tasks, todos, reminders, missed items, and birthdays into prompt
- AI generates a personalized, conversational daily summary message

**Milestone 4.5 — Multilingual Support**
- Add language detection instruction to system prompt
- Test chatbot in at least 3 languages (English, Tamil, Hindi as baseline)
- Verify JSON structure remains in English while message field responds in user's language

**Deliverable:** User can perform all people, task, todo, and reminder operations entirely through natural language chat. Daily summary is AI-generated and personalized.

---

### 13.6 Phase 5 — Security & Sync (Weeks 12–13)

The goal of this phase is to encrypt all local data and set up optional Firebase backup sync.

**Milestone 5.1 — SQLCipher Encryption**
- Integrate SQLCipher with WatermelonDB
- Implement KeystoreService to generate and retrieve AES-256 key from Android Keystore
- Initialize database with encryption key on every app launch
- Verify existing data is encrypted at rest
- Test database access after app reinstall (key recovery)

**Milestone 5.2 — Firebase Setup**
- Set up Firebase project (free tier)
- Configure Firebase Auth (Google sign-in)
- Implement FirebaseAuth.ts for single-user authentication
- Implement EncryptionService for AES-256 encrypt/decrypt before Firebase operations
- Implement FirebaseService with upload and download sync methods

**Milestone 5.3 — Sync Logic**
- Implement sync trigger on app foreground resume
- Implement manual sync button in SyncSettingsScreen
- Store last_sync_timestamp in MMKV
- Handle first-time sync (full upload) vs incremental sync (changed records only)
- Verify Firebase documents contain only encrypted ciphertext

**Deliverable:** All local data is AES-256 encrypted. User can optionally sign in with Google and sync encrypted data to Firebase Firestore. Data is unreadable in Firebase console without the device key.

---

### 13.7 Phase 6 — Polish (Weeks 14–15)

The goal of this phase is to add missed item handling, complete all settings screens, finalize CI/CD, and prepare the app for personal daily use.

**Milestone 6.1 — Missed Item Handling**
- Implement MissedItemChecker, MissedItemScheduler, MissedItemDismisser
- Add missed item fields to tasks, todos, reminders tables
- Implement missed item re-remind notifications (priority-based intervals)
- Add missed items section to daily summary
- Implement DISMISS_MISSED_ITEM and SNOOZE_MISSED_ITEM chatbot intents
- Add swipe-to-dismiss on task/todo/reminder cards
- Add dismiss action button on missed item notifications

**Milestone 6.2 — Settings Completion**
- Implement NotificationSettingsScreen (all toggles + time picker)
- Implement BirthdayThresholdsScreen (stepper inputs per priority)
- Implement LanguageSettingsScreen (language list + auto-detect)
- Implement SyncSettingsScreen (Firebase toggle, last synced, manual sync)
- Wire all settings to notification_config in database and MMKV

**Milestone 6.3 — CI/CD**
- Set up GitHub Actions workflow for automated APK build on push to main
- Configure signing keystore as GitHub Actions secret
- Upload signed APK as build artifact for direct download
- Add basic lint check to CI pipeline

**Milestone 6.4 — Final QA**
- Test full user journey end to end on physical Android device
- Test all chatbot intents with varied natural language inputs
- Test background fetch and notifications with app closed
- Test offline usage (no internet) for all core features
- Test Firebase sync after offline period
- Verify encryption — inspect database file directly to confirm ciphertext

**Deliverable:** Fully functional personal productivity app ready for daily use. Signed APK available for direct install via GitHub Actions artifact.

---

### 13.8 Milestone Summary

| Milestone | Description | Phase | Week |
|---|---|---|---|
| 1.1 | Project setup & dependencies | 1 | 1 |
| 1.2 | Navigation shell | 1 | 1 |
| 1.3 | Database setup | 1 | 2 |
| 2.1 | People feature | 2 | 3 |
| 2.2 | Tasks, todos, reminders feature | 2 | 4 |
| 2.3 | Onboarding flow | 2 | 5 |
| 3.1 | Notifee setup | 3 | 6 |
| 3.2 | Daily notification | 3 | 6 |
| 3.3 | Birthday reminders | 3 | 7 |
| 3.4 | Background fetch | 3 | 7 |
| 4.1 | Llama integration | 4 | 8 |
| 4.2 | Chat UI | 4 | 9 |
| 4.3 | Prompt & intent system | 4 | 10 |
| 4.4 | AI-powered daily summary | 4 | 10 |
| 4.5 | Multilingual support | 4 | 11 |
| 5.1 | SQLCipher encryption | 5 | 12 |
| 5.2 | Firebase setup | 5 | 12 |
| 5.3 | Sync logic | 5 | 13 |
| 6.1 | Missed item handling | 6 | 14 |
| 6.2 | Settings completion | 6 | 14 |
| 6.3 | CI/CD | 6 | 15 |
| 6.4 | Final QA | 6 | 15 |

---

### 13.9 Risk & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Llama 3.2 3B too slow on older devices | Medium | High | Test on Android 10 device early in Phase 4. Fall back to Phi-3 Mini if needed. |
| llama.cpp React Native binding instability | Medium | High | Spike test in Phase 1 before committing full architecture. |
| Background fetch unreliable on aggressive battery-saving ROMs (Xiaomi, OPPO) | High | Medium | Document known limitations. Use Notifee exact alarms as fallback. |
| Firebase free tier limits exceeded | Low | Low | Single user app — well within free tier. Monitor usage in Firebase console. |
| SQLCipher key loss on app uninstall | Medium | High | Document backup strategy. Warn user before uninstall. Offer Firebase recovery path. |
| Prompt token limit exceeded with large context | Medium | Medium | Implement token budget in PromptBuilder. Cap chat history to last 10 messages. Summarize older history. |

---

*End of Buddi Technical Document — v1.0*
