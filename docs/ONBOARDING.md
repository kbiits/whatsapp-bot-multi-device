# Onboarding Guide: wa-bot-md (WhatsApp Bot Multi Device)

## Overview
A self-hosted WhatsApp bot built on [Baileys](https://github.com/WhiskeySockets/Baileys) (WhatsApp Web multi-device protocol). It answers prefixed chat commands (`/bot <command>`) and a few prefix-less triggers (`@everyone`, `@role`), schedules reminders (optionally synced to Google Calendar), manages group roles, forwards `AI ...` prompts to an n8n webhook, and exposes a tiny HTTP API for sending messages.

## Tech Stack
| Layer | Technology | Version |
|-------|-----------|---------|
| Language | TypeScript → CommonJS (`tsc`) | 5.8 |
| Runtime | Node.js | 18+ (prod uses v24 via nvm, see `start-app.sh`) |
| WhatsApp client | `baileys` | 6.7.18 |
| Database | MongoDB via `mongoose` | 6.x |
| Job scheduler | `agenda` (separate Mongo DB) | 4.x |
| Date parsing | `chrono-node` | 2.x |
| Logging | `pino` + `pino-pretty` | 7.x |
| Media | `sharp`, `fluent-ffmpeg`, `wa-sticker-formatter` | - |
| Integrations | `googleapis` (Calendar), `axios` (n8n, RapidAPI, Reddit) | - |
| Package manager | pnpm | - |
| Testing | none configured | - |

## Architecture
```
                ┌──────────────┐  messages.upsert   ┌─────────────┐
WhatsApp ◀────▶ │ src/sock.ts  │ ─────────────────▶ │ src/handle.ts│
                │ (Baileys)    │                    └──────┬──────┘
                └──────▲───────┘                           │ getResolver / getResolverWithoutPrefix
                       │ sendMessage                       ▼
   ┌───────────────────┴──────┐            ┌────────────────────────────┐
   │ src/api (POST /send-msg) │            │ src/constants/commands*.ts │  regex → handler
   │ src/jobs/sendReminder.ts │            └────────────┬───────────────┘
   └───────────▲──────────────┘                         ▼
               │ Agenda (Mongo)              src/handlers/** → ResolverResult
       src/agendas/index.ts  ◀── schedule ── reminders handlers
```
- **Single process, monolith.** `src/index.ts` connects Mongo, starts the Baileys socket, then the HTTP API. SIGINT/SIGTERM shut all three down gracefully.
- **Socket singleton** (`src/sock.ts`): auth state lives in `./auth/` (git-ignored). A QR code is printed to the terminal on first login. Reconnects automatically unless logged out.
- **Agenda** (`src/agendas/index.ts`) uses its own Mongo URI and polls every 3 minutes; it's imported lazily via `src/worker.ts`.

## Key Entry Points
- **App bootstrap**: `src/index.ts`
- **WhatsApp connection**: `src/sock.ts`
- **Message pipeline**: `src/handle.ts`
- **Command registry**: `src/constants/commands.ts` (prefixed) and `src/constants/commandsWithoutPrefix.ts`
- **HTTP API**: `src/api/index.ts` — `POST /send-message` with `{ "to": "<jid>", "message": "<text>" }`
- **Scheduled jobs**: `src/jobs/sendReminder.ts`

## Directory Map
```
src/agendas/     Agenda instance + job registration
src/api/         Minimal http.createServer router
src/constants/   Command regex maps, agenda job names, mimetypes, timezone
src/exceptions/  Custom Error classes
src/handlers/    One file per command (grouped by feature: reminders/, roles/, gcal/, mentions/, prefix/, n8n/)
src/jobs/        Agenda job definitions
src/models/      Mongoose models (Prefix, Role, GcalConfig, Blacklist)
src/providers/   External data sources (Reddit, quotes, Google Calendar)
src/types/       Shared .d.ts types (ResolverFunction, CommandMap, reminder data)
src/utils/       Helpers (prefix check, media download, sender parsing, ...)
```

## Request Lifecycle (incoming chat message)
1. Baileys emits `messages.upsert` → `sock.ts` calls `handle(msgs, sock)`.
2. `handle.ts`, per message: skips blacklisted senders (no read receipt), marks the message read, drops empty / own messages, extracts text from `conversation`, `extendedTextMessage`, or image/video captions.
3. `checkPrefix` (`src/utils/checkPrefix.ts`) compares the first word to `/<prefix>` — per-group prefix from `PrefixModel`, else `/${DEFAULT_PREFIX}`.
4. Prefixed → strip prefix, `getResolver` loops `commands` regex keys (first match wins, case-insensitive) or falls back to `wrongCommands`. Not prefixed → `getResolverWithoutPrefix` (no fallback).
5. Development guard: when `IS_DEVELOPMENT` + `MUTE_BOT_WHEN_DEVELOPMENT`, only developer numbers get answers.
6. The handler returns a `ResolverResult { destinationId, message, options }`, which `handle.ts` sends with `sock.sendMessage`.

## Conventions
- **Handlers are curried**: `ResolverFunctionCarry = (matches) => (message, jid, isFromGroup, participant) => ResolverResult`. Regex capture groups arrive as `matches`.
- **`jid`** is the chat (group or DM); **`participant`** is the sender inside a group (device suffix `:NN` stripped via `regexCleanParticipant`). Sender = `isFromGroup ? participant : jid`.
- **Errors**: handlers `try/catch` and reply with a user-facing text (often `quoted: message`); logging is a mix of `logger` (pino) and `console.log` — prefer `logger` in new code.
- **Config** via `process.env`, read at module load (top of file). JSON arrays in env are `JSON.parse`d (e.g. `DEVELOPER_WHATSAPP_NUMBER`).
- **Files**: camelCase for handlers/utils, PascalCase for models/providers. Mongoose model files export `default` the model.
- **User-facing strings** mix English and Indonesian.
- **Git**: short lowercase imperative commit messages (`add ...`, `update ...`, `replace ...`) on `main`.
- **Tests**: none exist. Verify with `pnpm build` (type-check) and a manual run.

## Common Tasks
- **Install**: `pnpm install` (needs ffmpeg on PATH for media features)
- **Configure**: copy `.env.example` → `.env` and fill in values (never commit `.env`)
- **Build / type-check**: `pnpm build`
- **Run locally**: `pnpm start` (builds then runs `dist/`); scan the QR printed in the terminal
- **Debug**: `.vscode/launch.json`
- **Deploy**: `./deploy.sh` — builds, rsyncs `dist/` + manifests to the server, installs deps, (re)links `wa-bot.service` into systemd and restarts it

## Where to Look
| I want to... | Look at... |
|--------------|-----------|
| Add a prefixed command | handler in `src/handlers/`, register its regex in `src/constants/commands.ts`, add to `helps` in `src/handlers/help.ts` |
| Add a prefix-less trigger | `src/constants/commandsWithoutPrefix.ts` |
| Change message filtering / read receipts | `src/handle.ts` |
| Add a collection | `src/models/` |
| Add a scheduled job | `src/jobs/` + register in `src/agendas/index.ts`, name in `src/constants/agenda.ts` |
| Add an HTTP endpoint | `simpleRouter` in `src/api/index.ts` (key = `METHOD:/path`) |
| Block / unblock a number | `blacklist` commands — see "Blacklist" below |

## Environment Variables
All listed in `.env.example` (names only here — see that file for format):
`HTTP_PORT`, `MONGODB_URI`, `AGENDA_MONGO_URI`, `DEFAULT_PREFIX`, `DEVELOPER_WHATSAPP_NUMBER`, `IS_DEVELOPMENT`, `MUTE_BOT_WHEN_DEVELOPMENT`, `SEND_WARN_IF_IN_DEVELOPMENT`, `ENVIRONMENT`, `LOGGER_LEVEL`, `BOT_TIMEZONE`, `ENABLE_HELP_COMMAND`, `JODOHKU_FEATURE_ACTIVE`, `JODOHKU_MUTED_JIDS`, `LOVE_CALCULATOR_RAPID_API_*`, `REDDIT_*` (Reddit API is now paid; jokes/memes may not work), `N8N_WEBHOOK_URL`, `N8N_AUTH_*`, `GOOGLE_CALENDAR_*`, `DEPLOY_SCRIPT_*`.

## Blacklist
Messages from blacklisted phone numbers are dropped at the very top of `handle.ts` — no command processing and **no read receipt** (the blue ticks never appear for them). Applies in DMs and groups.

- Storage: `Blacklist` Mongo collection (`src/models/Blacklist.ts`), cached in memory (`src/utils/blacklist.ts`) and loaded once at startup.
- Management (developer numbers only, works in any chat):
  - `/bot blacklist add <number> [<number> ...]` — digits with country code, e.g. `6281234567890`; or mention users in a group
  - `/bot blacklist remove <number|mention> ...`
  - `/bot blacklist list`
- WhatsApp may address senders by LID (`<digits>@lid`) instead of phone number. When a number is added, its LID is looked up with `sock.onWhatsApp` and stored next to it; messages are matched against both. `blacklist list` shows `lid unknown` if the lookup failed. Re-add the number while the bot is connected to retry, or blacklist by mention.
- The same LID issue applies to `DEVELOPER_WHATSAPP_NUMBER`: put both the phone number and the LID digits in it. A denied developer command logs the sender ID (`Denied developer-only command ... from sender <id>`).

## Unknowns / Gotchas
- No test runner, linter, or CI is configured.
- `n8n` handler calls `process.exit(1)` if `N8N_WEBHOOK_URL` is unset and an `AI ...` message arrives.
- `handle.ts` and several handlers `JSON.parse` env values at import time; a missing/invalid value crashes startup.
