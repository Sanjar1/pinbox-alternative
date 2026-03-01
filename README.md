# Pinbox Alternative

Yandex-first store profile management platform for syncing store data in Yandex Maps with approval-gated writes.

Core principle: compliant-only flow (no review gating), manual approval before every external write, and operator-safe execution.

Current stage: Yandex-only MVP execution.

## Quick Start (Windows)

| Script | Purpose |
|--------|---------|
| `0_SETUP_AND_START.bat` | First-time setup + start app |
| `1_FIRST_TIME_SETUP.bat` | Install + migrate + seed only |
| `2_START_APP.bat` | Start app only |
| `3_IMPORT_TELEGRAM_LOCATIONS.bat` | Import stores from Telegram + audit |

See `DEVELOPMENT.md` for full setup guide.

## Project Documentation

### Status and Tracking
| File | Purpose |
|------|---------|
| `STATUS.md` | Current project snapshot |
| `PROGRESS.md` | Daily progress log |
| `TODO.md` | Prioritized task backlog |
| `ROADMAP.md` | Milestones and direction |
| `CHANGELOG.md` | Version history |

### Architecture and Design
| File | Purpose |
|------|---------|
| `ARCHITECTURE.md` | System structure and data flow |
| `SPECS.md` | Requirements and acceptance criteria |
| `DECISIONS.md` | Architecture and product decisions |
| `GLOSSARY.md` | Domain terms and definitions |

### Operations and Reference
| File | Purpose |
|------|---------|
| `DEVELOPMENT.md` | Dev setup, scripts, project structure |
| `TROUBLESHOOTING.md` | Common issues and fixes |
| `MISTAKES.md` | Lessons learned with root cause |

### Detailed Docs (in `docs/`)
| File | Purpose |
|------|---------|
| `docs/OVERVIEW.md` | Product concept and positioning |
| `docs/FINAL_PLAN.md` | Yandex-only delivery plan |
| `docs/RISKS.md` | Risk register and mitigations |
| `docs/API_ONBOARDING_CHECKLIST.md` | Yandex onboarding checklist |
| `docs/IMPLEMENTATION_VERIFICATION_2026-02-10.md` | Historical verification report (pre-pivot) |
| `docs/SUGGESTION_ANALYSIS.md` | Strategy synthesis and decision rationale |
| `docs/LOCATION_PLATFORM_AUDIT.md` | Imported store and link audit baseline |
| `docs/2GIS_API_CHEATSHEET.md` | 2GIS authenticated endpoint map and response fields |
| `docs/2GIS_OPERATIONS_RUNBOOK.md` | 2GIS cabinet manual operations runbook |
| `docs/2GIS_LOGO_AND_MEDIA_POLICY.md` | 2GIS logo placement limits and media moderation rules |
| `docs/plans/2026-02-25-yandex-only-mvp-implementation.md` | Active Yandex-only implementation plan |
