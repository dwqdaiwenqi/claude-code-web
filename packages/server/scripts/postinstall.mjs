import { chmodSync, readdirSync, existsSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
// 支持通过环境变量覆盖 node-pty 路径（供 monorepo 根目录调用）
const prebuildsDir = process.env.NODE_PTY_PATH
  ? resolve(process.env.NODE_PTY_PATH, 'prebuilds')
  : join(__dirname, '..', 'node_modules', 'node-pty', 'prebuilds')

console.log('prebuildsDir', prebuildsDir)
if (existsSync(prebuildsDir)) {
  for (const platform of readdirSync(prebuildsDir)) {
    const spawnHelper = join(prebuildsDir, platform, 'spawn-helper')
    if (existsSync(spawnHelper)) {
      chmodSync(spawnHelper, 0o777)
      console.log(`chmod 777 ${spawnHelper}`)
    }
  }
}
