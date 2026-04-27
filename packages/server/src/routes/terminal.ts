import type { FastifyInstance } from 'fastify'
import * as pty from 'node-pty'
import os from 'os'
import { logger } from '@/logger'

export async function terminalRoutes(api: FastifyInstance) {
  // ws://<host>/api/terminal?cwd=/some/path
  api.get('/terminal', { websocket: true }, (socket, req) => {
    const q = req.query as { cwd?: string }
    const cwd = q.cwd ?? os.homedir()
    const shell = process.env.SHELL ?? (os.platform() === 'win32' ? 'cmd.exe' : 'bash')
    logger.info({ cwd, shell }, 'terminal open')

    let proc: pty.IPty

    try {
      proc = pty.spawn(shell, [], {
        name: 'xterm-256color',
        cols: 120,
        rows: 30,
        cwd,
        env: process.env as Record<string, string>,
      })

      proc.onData((data) => {
        if (socket.readyState === socket.OPEN) socket.send(data)
      })

      proc.onExit(({ exitCode }) => {
        logger.info({ exitCode }, 'terminal exit')
        if (socket.readyState === socket.OPEN) socket.close()
      })
    } catch (err) {
      logger.error({ err }, 'terminal error')
    }

    socket.on('message', (msg: Buffer | string) => {
      try {
        const parsed = JSON.parse(msg.toString())
        if (parsed.type === 'resize') {
          proc?.resize?.(parsed.cols, parsed.rows)
        }
      } catch {
        proc?.write?.(msg.toString())
      }
    })

    socket.on('close', () => {
      logger.info('terminal ws closed, killing pty')
      proc?.kill?.()
    })
  })
}
