import type { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify'
import fs from 'fs'
import path from 'path'
import { getSessionInfo, getSessionMessages, renameSession } from '@anthropic-ai/claude-agent-sdk'
import { logger } from '@/logger'
import {
  CLAUDE_PROJECTS_DIR,
  getProjectDirName,
  getSessionFile,
  getOrCreateRuntime,
  getRuntimeSession,
  deleteRuntimeSession,
  createPendingRuntime,
  resolvePendingApproval,
} from '@/store'
import { runAgent, runAgentStream, type IncomingBlock } from '@/agent'

export async function sessionRoutes(api: FastifyInstance) {
  // ── 获取 Session 信息 ────────────────────────────────────
  api.get('/session/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const runtime = getRuntimeSession(id)

    const info = await getSessionInfo(id, runtime?.cwd ? { dir: runtime.cwd } : undefined)
    if (!info) return reply.code(404).send({ error: 'Session not found' })

    return {
      id: info.sessionId,
      title: info.summary,
      cwd: info.cwd ?? runtime?.cwd,
      status: runtime?.status ?? 'idle',
      lastModified: info.lastModified,
      gitBranch: info.gitBranch,
    }
  })

  // ── 删除 Session（直接删 .jsonl 文件）───────────────────
  api.delete('/session/:id', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const runtime = getRuntimeSession(id)

    runtime?.abort?.abort()
    deleteRuntimeSession(id)

    let deleted = false
    if (runtime?.cwd) {
      const dirName = getProjectDirName(runtime.cwd)
      const file = getSessionFile(dirName, id)
      if (fs.existsSync(file)) {
        fs.rmSync(file, { force: true })
        deleted = true
      }
    } else {
      if (fs.existsSync(CLAUDE_PROJECTS_DIR)) {
        for (const entry of fs.readdirSync(CLAUDE_PROJECTS_DIR, { withFileTypes: true })) {
          if (!entry.isDirectory()) continue
          const file = path.join(CLAUDE_PROJECTS_DIR, entry.name, `${id}.jsonl`)
          if (fs.existsSync(file)) {
            fs.rmSync(file, { force: true })
            deleted = true
            break
          }
        }
      }
    }

    if (!deleted) return reply.code(404).send({ error: 'Session not found' })
    logger.info({ sessionId: id }, 'session deleted')
    return { ok: true }
  })

  // ── 重命名 Session ──────────────────────────────────────
  api.patch('/session/:id', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as { title?: string }
    if (typeof body.title !== 'string') return _reply.code(400).send({ error: 'title is required' })

    const runtime = getRuntimeSession(id)
    await renameSession(id, body.title.trim(), runtime?.cwd ? { dir: runtime.cwd } : undefined)
    return { ok: true }
  })

  // ── 消息历史 ────────────────────────────────────────────
  api.get('/session/:id/message', async (req: FastifyRequest, _reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const runtime = getRuntimeSession(id)
    const q = req.query as { limit?: string; offset?: string }
    // const limit = parseInt(q.limit ?? '200')
    const offset = parseInt(q.offset ?? '0')

    const messages = await getSessionMessages(id, {
      dir: runtime?.cwd,
      // limit,
      offset,
    })
    return messages
  })

  // ── 回答 AskUserQuestion（human-in-the-loop）───────────
  api.post('/session/:id/message/resolve', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const body = (req.body ?? {}) as { answers?: Record<string, string> }
    if (!body.answers || typeof body.answers !== 'object') {
      return reply.code(400).send({ error: 'answers is required' })
    }
    const ok = resolvePendingApproval(id, { behavior: 'allow', updatedInput: body.answers })
    if (!ok) return reply.code(409).send({ error: 'No pending question for this session' })
    return { ok: true }
  })

  // ── 发送消息（阻塞 or SSE 流式）────────────────────────
  // id = 已有 session UUID，或 'new'（新建 session，需要 body.cwd）
  api.post('/session/:id/message', async (req: FastifyRequest, reply: FastifyReply) => {
    const { id } = req.params as { id: string }
    const isNew = id === 'new'

    const body = (req.body ?? {}) as {
      prompt?: string
      content?: IncomingBlock[]
      cwd?: string
      bypassPermissions?: boolean
    }

    let runtime
    if (isNew) {
      // 新建 session：需要 cwd
      if (!body.cwd) return reply.code(400).send({ error: 'cwd is required for new sessions' })
      runtime = createPendingRuntime(body.cwd)
    } else {
      // 已有 session：从 runtime 获取，若内存中没有则用 SDK 查询 cwd
      let cwd = body.cwd
      if (!cwd) {
        const existing = getRuntimeSession(id)
        cwd = existing?.cwd
        if (!cwd) {
          const info = await getSessionInfo(id)
          cwd = info?.cwd
        }
      }
      if (!cwd) return reply.code(400).send({ error: 'cwd not found for session' })
      runtime = getOrCreateRuntime(id, cwd)
    }

    if (runtime.status === 'busy') {
      logger.warn({ sessionId: id }, 'session busy, rejected')
      return reply.code(409).send({ error: 'Session is busy' })
    }

    const bypassPermissions = body.bypassPermissions !== false

    let content: IncomingBlock[]
    if (body.content?.length) {
      content = body.content
    } else {
      const prompt = (body.prompt ?? '').trim()
      if (!prompt) return reply.code(400).send({ error: 'prompt is required' })
      content = [{ type: 'text', text: prompt }]
    }

    const plainText = content
      .filter((b) => b.type === 'text')
      .map((b) => (b as { type: 'text'; text: string }).text)
      .join(' ')

    const wantsStream =
      req.headers['accept'] === 'text/event-stream' || (req.query as any).stream === '1'

    if (wantsStream) {
      logger.info({ sessionId: id, isNew }, 'starting agent in stream mode')
      await runAgentStream(runtime, content, plainText, reply, bypassPermissions)
      return reply
    }
    return runAgent(runtime, content, plainText, bypassPermissions)
  })
}
