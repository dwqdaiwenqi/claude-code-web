# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

A monorepo that wraps the `@anthropic-ai/claude-agent-sdk` as a REST/SSE HTTP service (`packages/server`) with a React web UI (`packages/web`). The server exposes Claude Code as an HTTP API; the built frontend is embedded into the server's `public/` directory for serving.

**Prerequisite**: Claude Code CLI must be installed and logged in (`claude` command available).

## Commands

### Root (monorepo)

```bash
pnpm dev           # Run both server and web in parallel (watch mode)
pnpm dev:server    # Server only (tsx watch)
pnpm dev:web       # Web only (vite --host)
pnpm build         # Build both packages, then copy web/dist → server/public
pnpm start         # Run the built server
```

### packages/server

```bash
pnpm --filter @claude-web/server dev        # tsx watch src/cli.ts start
pnpm --filter @claude-web/server build      # tsup
pnpm --filter @claude-web/server typecheck  # tsc --noEmit
```

### packages/web

```bash
pnpm --filter @claude-web/ui dev    # vite --host (default port 5173)
pnpm --filter @claude-web/ui build  # tsc -b && vite build
```

### Release

```bash
pnpm release:server   # bump patch, build, npm publish @claude-web/server
pnpm release:ui       # bump patch, build, npm publish @claude-web/ui
```

## Architecture

### packages/server

Fastify HTTP server with these layers:

- **`src/cli.ts`** — Commander CLI (`claude-web start / link / unlink`)
- **`src/server.ts`** — Fastify setup: CORS, WebSocket, static files, Swagger, route registration
- **`src/agent.ts`** — Core logic. Wraps `@anthropic-ai/claude-agent-sdk`'s `query()` in two modes:
  - `runAgent()` — blocking, waits for completion
  - `runAgentStream()` — SSE streaming, emits `part` / `done` / `error` / `ask_user` events
- **`src/store.ts`** — In-memory runtime session map + `~/.claude/projects` path helpers. Sessions persist via Claude CLI's native JSONL format; runtime state (status, abort controller) lives in memory only.
- **`src/routes/`** — Three route files:
  - `project.ts` — list, link, unlink projects; file tree; file read
  - `session.ts` — create/delete sessions, message history, send message (blocking or SSE)
  - `terminal.ts` — WebSocket PTY via `node-pty`

**Data storage**: Uses Claude CLI's native `~/.claude/projects/<dirName>/` directory. Project IDs are derived from the filesystem path (slashes → dashes). No separate database.

**Session flow**: A new session has `sessionId: null` until the SDK's first `system` message provides a real UUID via `assignSessionId()`. The `resume` option is passed on subsequent queries to continue the same conversation.

**Tool permissions**: `bypassPermissions: true` by default. `AskUserQuestion` tool is intercepted — in stream mode it emits an `ask_user` SSE event and waits for the client to POST a decision back.

### packages/web

React 19 + Vite SPA with Ant Design, routing via react-router-dom v7.

- **`src/http/index.ts`** — All API calls to the server. SSE handled with `EventSource`-style fetch + `ReadableStream`.
- **`src/pages/HomePage/`** — Lists linked projects
- **`src/pages/ProjectPage/`** — Three-panel layout: file tree (left), chat (center), file viewer / terminal (right)
- **`src/components/ChatPanel/`** — SSE message rendering; handles `part`, `done`, `ask_user` events; tool call/result display
- **`src/components/ChatInput/`** — `react-mentions` for `@file` and `/command` completions, paste-to-image support
- **`src/components/Terminal/`** — xterm.js terminal connected to the WebSocket PTY
- **`src/components/FileViewer/`** — shiki syntax-highlighted file viewer

In development (`pnpm dev:web`), Vite proxies `/api` to `http://localhost:8003`. In production, the built files are served directly by the Fastify static plugin.

## Key env vars (server)

| Variable | Default | Effect |
|----------|---------|--------|
| `LOG_LEVEL` | `debug` | `trace`/`debug`/`info`/`warn`/`error` |
| `NODE_ENV` | — | `production` → JSON log format (pino) |
