import { useCallback } from 'react'
import { theme } from 'antd'
import { MentionsInput, Mention, type SuggestionDataItem } from 'react-mentions'
import { api } from '@/http/index'

interface Props {
  value: string
  onChange: (value: string) => void
  onSend: () => void
  onPasteImage?: (file: File) => void
  disabled?: boolean
  activeProjectID: string | null
}

const COMMANDS: SuggestionDataItem[] = [
  { id: 'init', display: 'init（分析项目结构，生成CLAUDE.md）' },
  { id: 'cost', display: 'cost（当前会话的 Token 消耗量与预估）' },
  { id: 'context', display: 'context（可视化上下文窗口使用量）' },
  { id: 'clear', display: 'clear（清除当前会话的全部消息）' },
]

type FileSuggestion = SuggestionDataItem & { size?: number }

function flattenTree(nodes: Awaited<ReturnType<typeof api.getFileTree>>): FileSuggestion[] {
  const result: FileSuggestion[] = []
  for (const node of nodes) {
    if (node.type === 'file') {
      result.push({ id: node.path, display: node.path, size: node.size })
    } else if (node.children) {
      result.push(...flattenTree(node.children))
    }
  }
  return result
}

function formatSize(bytes?: number): string {
  if (bytes == null) return ''
  if (bytes < 1024) return `${bytes}B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
  return `${(bytes / 1024 / 1024).toFixed(1)}MB`
}

export default function ChatInput({
  value,
  onChange,
  onSend,
  onPasteImage,
  disabled,
  activeProjectID,
}: Props) {
  const { token } = theme.useToken()
  const fetchFiles = useCallback(
    async (query: string, callback: (data: SuggestionDataItem[]) => void) => {
      if (!activeProjectID) return callback([])
      try {
        const tree = await api.getFileTree(activeProjectID)
        const all = flattenTree(tree)
        const filtered = query
          ? all.filter((f) => (f.display ?? '').toLowerCase().includes(query.toLowerCase()))
          : all

        console.log('all', all, 'filtered', filtered.slice(0, 20))
        callback(filtered)
      } catch {
        callback([])
      }
    },
    [activeProjectID]
  )

  function handlePaste(e: React.ClipboardEvent) {
    const items = Array.from(e.clipboardData.items)
    const imageItem = items.find((item) => item.type.startsWith('image/'))
    if (imageItem) {
      e.preventDefault()
      const file = imageItem.getAsFile()
      if (file) {
        onPasteImage?.(file)
      }
    }
  }

  return (
    <div style={{ flex: 1, position: 'relative', opacity: disabled ? 0.5 : 1 }}>
      <MentionsInput
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onPaste={handlePaste}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            e.preventDefault()
            onSend()
          }
        }}
        disabled={disabled}
        placeholder="输入消息… (Enter 发送，Shift+Enter 换行，粘贴图片，@ 引用文件，/ 使用命令)"
        style={{
          '&multiLine': {
            control: { minHeight: 64, maxHeight: 200, overflowY: 'auto' },
            highlighter: { padding: '8px 12px', border: '1px solid transparent' },
            input: {
              padding: '8px 12px',
              border: '1px solid #d9d9d9',
              borderRadius: 8,
              outline: 'none',
              resize: 'none',
              minHeight: 64,
              maxHeight: 200,
              overflowY: 'auto',
              fontFamily: 'inherit',
              fontSize: 14,
              lineHeight: '1.5',
              wordBreak: 'break-all',
            },
          },
          suggestions: {
            zIndex: 100,
            bottom: '100%',
            top: 'unset',
            width: '100%',
            marginBottom: 8,
            list: {
              background: '#fff',
              border: '1px solid #e8e8e8',
              borderRadius: 8,
              boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
              fontSize: 13,
              maxHeight: 220,
              overflowY: 'auto',
              width: '100%',
            },
            item: {
              padding: '6px 12px',
              cursor: 'pointer',
              '&focused': { background: '#e6f4ff' },
            },
          },
        }}
      >
        <Mention
          trigger="@"
          data={fetchFiles}
          displayTransform={(_id, display) => `@${display}`}
          markup="@[__display__](__id__)"
          style={{ backgroundColor: '#e6f4ff', borderRadius: 3 }}
          renderSuggestion={(suggestion) => {
            const s = suggestion as FileSuggestion
            const name = String(s.display).split('/').pop() ?? ''
            return (
              <div style={{ width: '100%', display: 'flex' }}>
                <span style={{ fontWeight: 'bold', paddingRight: '8px' }}>{name}</span>
                <span
                  style={{
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                    minWidth: 0,
                    color: token.colorTextLabel,
                  }}
                >
                  {s.display}
                </span>
                <span style={{ paddingLeft: '8px', color: token.colorTextLabel, flexShrink: 0 }}>
                  {formatSize(s.size)}
                </span>
              </div>
            )
          }}
        />
        <Mention
          trigger="/"
          data={COMMANDS}
          displayTransform={(_id) => `/${_id}`}
          markup="/__id__"
          style={{ backgroundColor: '#f6ffed', borderRadius: 3 }}
        />
      </MentionsInput>
    </div>
  )
}
