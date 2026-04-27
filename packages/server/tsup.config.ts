import { defineConfig } from "tsup"

export default defineConfig([
  // CLI 入口 — 加 shebang
  {
    entry: { cli: "src/cli.ts" },
    format: ["esm"],
    target: "node20",
    outDir: "dist",
    clean: true,
  },
  // 库入口 — 供外部 import 使用，输出类型声明
  {
    entry: { server: "src/server.ts", store: "src/store.ts" },
    format: ["esm"],
    target: "node20",
    outDir: "dist",
    dts: true,
  },
])
