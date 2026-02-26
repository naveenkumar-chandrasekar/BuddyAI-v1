# Contributing

This is a personal project. Notes for future-me or anyone reading this.

## Branch strategy

| Branch | Purpose |
|---|---|
| `main` | Stable, working code |
| `phase-N/milestone-N.N-description` | Feature work per milestone |

Example: `phase-2/milestone-2.1-people-feature`

## Commit style

```
feat: add PeopleListScreen with filter chips
fix: crash when birthday is null in BirthdayChecker
chore: configure ESLint and Prettier
```

Types: `feat`, `fix`, `chore`, `refactor`, `test`, `docs`

## Development phases

Work follows the 6-phase roadmap in [Technical-document.md](Technical-document.md#13-development-roadmap--milestones).

Complete each milestone before starting the next. Each phase has a clear deliverable.

## Physical device testing

All notification, background fetch, and AI inference work **must** be tested on a real Android device, not an emulator.

Minimum spec for testing: Android 10, 3 GB RAM.

## AI model

The Llama 3.2 3B `.gguf` model file is not committed to the repo (too large, in `.gitignore`).

Download from HuggingFace and place in `src/assets/models/` before running Phase 4+.

## Secrets

Never commit:
- `google-services.json`
- `.env` files
- Signing keystore files

Use GitHub Actions secrets for CI builds.
