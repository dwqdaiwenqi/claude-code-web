import { useEffect, useState } from 'react'
import { createHighlighter, type Highlighter } from 'shiki'

const BASE = import.meta.env.MODE === 'development' ? '/api' : `http://${window.location.host}/api`

const IMAGE_EXTS = new Set(['.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.bmp'])
const AUDIO_EXTS = new Set(['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac'])

const EXT_LANG: Record<string, string> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.jsx': 'jsx',
  '.json': 'json',
  '.json5': 'json5',
  '.jsonc': 'json',
  '.css': 'css',
  '.scss': 'scss',
  '.less': 'less',
  '.html': 'html',
  '.htm': 'html',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.py': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.cpp': 'cpp',
  '.h': 'cpp',
  '.cs': 'csharp',
  '.rb': 'ruby',
  '.php': 'php',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.sh': 'bash',
  '.bash': 'bash',
  '.zsh': 'bash',
  '.fish': 'fish',
  '.yaml': 'yaml',
  '.yml': 'yaml',
  '.toml': 'toml',
  '.xml': 'xml',
  '.md': 'markdown',
  '.mdx': 'mdx',
  '.sql': 'sql',
  '.graphql': 'graphql',
  '.dockerfile': 'dockerfile',
  '.env': 'ini',
  '.ini': 'ini',
  '.conf': 'ini',
  '.lock': 'yaml',
}

function getExt(filePath: string): string {
  const base = filePath.split('/').pop() ?? ''
  if (base.toLowerCase() === 'dockerfile') return '.dockerfile'
  const idx = base.lastIndexOf('.')
  return idx >= 0 ? base.slice(idx).toLowerCase() : ''
}

let highlighterPromise: Promise<Highlighter> | null = null

function getHighlighter(): Promise<Highlighter> {
  if (!highlighterPromise) {
    highlighterPromise = createHighlighter({
      themes: ['vitesse-light'],
      langs: Object.values(EXT_LANG).filter((v, i, a) => a.indexOf(v) === i),
    })
  }
  return highlighterPromise
}

interface Props {
  projectID: string
  filePath: string
  content: string
}

export default function FileViewer({ projectID, filePath, content }: Props) {
  const ext = getExt(filePath)
  const rawUrl = `${BASE}/project/${projectID}/file/raw?path=${encodeURIComponent(filePath)}`

  if (IMAGE_EXTS.has(ext)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          padding: 24,
          background: '#ffffff',
          gap: 12,
        }}
      >
        <img
          src={rawUrl}
          alt={filePath}
          style={{
            maxWidth: '100%',
            maxHeight: 'calc(100% - 40px)',
            objectFit: 'contain',
            borderRadius: 4,
            boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          }}
        />
        <span style={{ color: '#666', fontSize: 11 }}>{filePath}</span>
      </div>
    )
  }

  if (AUDIO_EXTS.has(ext)) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100%',
          background: '#ffffff',
          gap: 16,
        }}
      >
        <div style={{ fontSize: 48 }}>🎵</div>
        <span style={{ color: '#ccc', fontSize: 13 }}>{filePath.split('/').pop()}</span>
        <audio controls src={rawUrl} style={{ width: 320 }} />
        <span style={{ color: '#555', fontSize: 11 }}>{filePath}</span>
      </div>
    )
  }

  return <CodeViewer code={content} lang={EXT_LANG[ext]} filePath={filePath} />
}

function CodeViewer({ code, lang, filePath }: { code: string; lang?: string; filePath: string }) {
  const [html, setHtml] = useState<string | null>(null)

  useEffect(() => {
    if (!lang) {
      setHtml(null)
      return
    }
    let cancelled = false
    getHighlighter()
      .then((hl) => {
        if (cancelled) return
        setHtml(hl.codeToHtml(code, { lang, theme: 'vitesse-light' }))
      })
      .catch(() => setHtml(null))
    return () => {
      cancelled = true
    }
  }, [code, lang])

  if (html) {
    return (
      <div
        style={{ position: 'relative', height: '100%', overflow: 'auto', background: '#ffffff' }}
      >
        <div
          style={{
            position: 'absolute',
            top: 8,
            right: 12,
            color: '#aaa',
            fontSize: 10,
            fontFamily: 'monospace',
            userSelect: 'none',
            zIndex: 1,
          }}
        >
          {lang ?? ''} · {filePath.split('/').pop()}
        </div>
        <style>{`.shiki { margin: 0 !important; padding: 12px 0 16px !important; background: #ffffff !important; font-family: "JetBrains Mono","Fira Code","Cascadia Code",monospace !important; font-size: 12.5px !important; line-height: 1 !important; } .shiki .line { display: block; padding: 0 16px; }`}</style>
        <div dangerouslySetInnerHTML={{ __html: html }} />
      </div>
    )
  }

  return <></>
}
