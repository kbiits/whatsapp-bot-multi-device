# Project Instructions

WhatsApp bot (Baileys multi-device) with reminders, roles, Google Calendar sync, n8n AI webhook, and a small HTTP API. Full guide: `docs/ONBOARDING.md`.

## Tech Stack
TypeScript (CommonJS, `tsc`), Node 18+, `baileys` 6.7, MongoDB/`mongoose` 6, `agenda` 4 for scheduled jobs, `pino` logging, pnpm.

## Security
- Never read, print, or commit `.env` or the `auth/` directory (WhatsApp session credentials). Use `.env.example` for variable names.
- When adding an env var, add a placeholder to `.env.example`.

## Code Style
- Handlers are curried `ResolverFunctionCarry`: `(matches) => async (message, jid, isFromGroup, participant) => ResolverResult`.
- Register prefixed commands as regex keys in `src/constants/commands.ts` (first match wins, so order matters); prefix-less triggers in `src/constants/commandsWithoutPrefix.ts`. Add new commands to `helps` in `src/handlers/help.ts`.
- Sender JID = `isFromGroup ? participant : jid`. Strip device suffix with `regexCleanParticipant`.
- Reply with `{ destinationId: jid, message: { text }, options: { quoted: message } }`.
- Use `logger` (pino) over `console.log` in new code. Catch errors in handlers and reply with a friendly message.
- camelCase filenames for handlers/utils; PascalCase for models/providers.

## Testing
- No test suite. Verify with `pnpm build` (type-check) and a manual run against a test WhatsApp account.

## Build & Run
- Install: `pnpm install`
- Build: `pnpm build`
- Run: `pnpm start` (scan QR on first run)
- Deploy: `./deploy.sh` (rsync + systemd `wa-bot.service`)

## Project Structure
- `src/index.ts` bootstrap · `src/sock.ts` Baileys socket · `src/handle.ts` message pipeline (blacklist, read receipts, prefix, dispatch)
- `src/handlers/` command implementations · `src/models/` mongoose models · `src/jobs/` + `src/agendas/` scheduled jobs
- `src/providers/` external APIs · `src/utils/` helpers · `src/api/` HTTP endpoints

## Conventions
- Commits: short lowercase imperative (`add ...`, `update ...`), directly on `main`.
- Developer-only features check `DEVELOPER_WHATSAPP_NUMBER` via `isDeveloper` in `src/utils/isDeveloper.ts`.
- Blacklisted senders are dropped in `src/handle.ts` before `readMessages` — keep that check first.
