#!/usr/bin/env node
import { Command } from 'commander'
import { createRequire } from 'module'
import { startServer } from './server'

const { version } = createRequire(import.meta.url)('../package.json')

const program = new Command()

program.name('claude-web').description('HTTP API server for Claude Code Agent SDK').version(version)

program
  .command('start')
  .description('Start the API server')
  .option('-p, --port <number>', 'Port to listen on', '8003')
  .option('-H, --hostname <string>', 'Hostname to bind', '0.0.0.0')
  .action(async (opts) => {
    await startServer({
      port: parseInt(opts.port),
      hostname: opts.hostname,
    })
  })

program.parse()
