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

> Planning & Design Phase — February 2026

| Phase | Name | Status |
|---|---|---|
| 1 | Foundation | Pending |
| 2 | Core Data | Pending |
| 3 | Notifications | Pending |
| 4 | Chatbot | Pending |
| 5 | Security & Sync | Pending |
| 6 | Polish | Pending |

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
