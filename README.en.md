English | [简体中文](./README.md)

# Claude Web

Wraps the [Claude Code Agent SDK](https://www.npmjs.com/package/@anthropic-ai/claude-agent-sdk) as a REST API service, providing an out-of-the-box Web interface. Any language or platform can call Claude Code via HTTP API, or chat with Claude directly through the Web UI.

> **Prerequisite**: Claude Code CLI is installed and logged in (`claude` command is available)

Basic usage:

<image src="./preview1.gif" style="margin:0 auto;width:900px;"/>

Frontend-friendly, supports clipboard images:

<image src="./preview2.gif" style="margin:0 auto;width:900px;"/>

## Quick Start

**1. Install**

```bash
npm install -g @claude-web/server
```

**2. Start the service**

You can start the service from any directory using `claude-web start`:

```bash
claude-web start

→ server: http://127.0.0.1:8003
→ docs: http://127.0.0.1:8003/docs
```

**3. REST API**

Swagger: http://127.0.0.1:8003/docs

<img src="./image-2.png" style="margin:0 auto;width:700px;"/>

1. List projects

```bash
curl 'http://127.0.0.1:8003/api/project'
# [{"id":"0557d0720cf35f03","cwd":"/Users/daiwenqi/code/echo-bot","sessionCount":0,"updatedAt":0}]
```

2. Create a new session and send the first message (sending a message to `session/new` will automatically create a session; `cwd` is required)

```bash
curl -X POST 'http://127.0.0.1:8003/api/session/new/message' \
  -H 'Content-Type: application/json' \
  -d '{"cwd":"/Users/daiwenqi/code/echo-bot","prompt":"Hello"}'
```

3. Continue sending messages to an existing session (blocking mode; SSE streaming is also supported)

```bash
# Blocking mode: wait for Claude to finish and return the result all at once
curl -X POST 'http://127.0.0.1:8003/api/session/<sessionId>/message' \
  -H 'Content-Type: application/json' \
  -d '{"prompt":"Please list the project structure for me"}'

# SSE streaming: receive Claude's output in real time
curl -X POST 'http://127.0.0.1:8003/api/session/<sessionId>/message' \
  -H 'Content-Type: application/json' \
  -H 'Accept: text/event-stream' \
  -d '{"prompt":"Please list the project structure for me"}'
```

## Web Interface

Visit http://127.0.0.1:8003 to open the page. The home page displays all projects. After clicking a project, you can:

- Have multi-turn conversations with Claude (streaming output)
- View project files (syntax highlighting)
- Open an interactive terminal
- Reference project files via `@`, use `/` for preset commands, or paste images directly

### Project Home

<img src="./image.png" style="margin:0 auto;width:700px;"/>

### Session Page

<img src="./image-1.png" style="margin:0 auto;width:700px;"/>

## Detailed Documentation

- [packages/server/README.md](./packages/server/README.md) REST API Service
- [packages/web/README.md](./packages/web/README.md) Web UI

## License

MIT
