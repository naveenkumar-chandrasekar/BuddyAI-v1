# BuddyAi — Your Smart Daily Companion

> A personal productivity app powered by on-device AI

BuddyAi helps you manage your personal relationships, daily tasks, todos, and reminders through a conversational AI chatbot. Everything runs on-device — no cloud AI, no data leaks.

## Features

- **Chatbot-first** — manage everything through natural language
- **People & Relationships** — track people with priority, birthday, place, and notes
- **Tasks, Todos & Reminders** — three distinct item types with person linking
- **Daily Summary** — notification at your configured time with a personalized AI briefing
- **Birthday Reminders** — priority-based advance notifications
- **Missed Item Re-reminders** — overdue items resurface on a priority schedule
- **100% On-device AI** — Llama 3.2 3B via llama.cpp, zero network calls
- **Encrypted at rest** — AES-256 via SQLCipher + Android Keystore
- **Multilingual** — chatbot responds in whatever language you write in
- **Optional cloud backup** — Firebase Firestore sync with client-side encryption

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React Native (TypeScript) |
| State | Zustand |
| UI | React Native Paper |
| Database | WatermelonDB + SQLCipher |
| AI Model | Llama 3.2 3B |
| AI Runtime | llama.cpp |
| Cloud Sync | Firebase Firestore (optional) |
| Notifications | Notifee |
| Background | react-native-background-fetch |

**Total infra cost: $0**

## Requirements

| | |
|---|---|
| Platform | Android 10+ (API 29+) |
| RAM | 3 GB minimum |
| Storage | ~2.2 GB (model + app data) |

## Project Status

All 6 phases complete — 233 tests, 0 lint warnings.

## Implementation Timeline

| Phase | Name | What was built | Effort |
|---|---|---|---|
| 1 | Foundation | RN 0.84 scaffold, navigation shell (5-screen onboarding + 4-tab main), WatermelonDB schema & models (13 tables), MMKV singleton, CI baseline | 1 session |
| 2 | Core Data | Domain models, 5 repositories, 9 use cases, Zustand stores, People/Tasks/Onboarding screens with full CRUD | 2 sessions |
| 3 | Notifications | Notifee channels, daily summary scheduler, birthday reminder engine, missed-item re-reminder checker, background-fetch service | 1 session |
| 4 | Chatbot | llama.rn integration, LlamaService, PromptBuilder, IntentParser (7 intent types), ActionExecutor, ChatHistoryScreen, ChatScreen, AI daily summary | 2 sessions |
| 5 | Security & Sync | SQLCipher AES-256, Android Keystore key management, Firebase Auth (Google sign-in), Firestore encrypted sync (upload/incremental/download), SyncSettingsScreen | 1 session |
| 6 | Polish | Missed-item dismiss UI across all 3 task screens, all 4 settings screens wired to DB/MMKV, Notifee background dismiss handler, GitHub Actions APK build job | 1 session |

## Architecture

3-layer Clean Architecture:

```
Presentation  →  Screens, Components, Hooks
Domain        →  Use Cases, Business Logic
Data          →  WatermelonDB, Firebase, Llama
```

See [Technical-document.md](Technical-document.md) for the full design spec.

## Security

- Local DB encrypted with SQLCipher AES-256
- Encryption key stored in Android Keystore (hardware-backed)
- Firebase documents contain only encrypted ciphertext — unreadable without the device key
- Llama model runs fully on-device, no prompts sent externally
- Model integrity verified via SHA-256 checksum on startup

## License

Private — personal use only.
