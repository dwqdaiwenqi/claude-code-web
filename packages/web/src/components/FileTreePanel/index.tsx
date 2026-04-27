import { Tree, Typography } from 'antd'
import { FolderOutlined } from '@ant-design/icons'
import type { TreeDataNode } from 'antd'
import type { FileTreeNode } from '@/http/index'

const { Text } = Typography

const C = {
  bg0: '#f7f7f8',
  bg1: '#ffffff',
  bg3: '#e8e8ec',
  text1: '#888888',
  text2: '#bbb',
  text0: '#1a1a1a',
}

function getFileEmoji(name: string): string {
  const ext = name.slice(name.lastIndexOf('.')).toLowerCase()
  const map: Record<string, string> = {
    '.html': '🌐',
    '.htm': '🌐',
    '.vue': '💚',
    '.svelte': '🟠',
    '.css': '🎨',
    '.scss': '🎨',
    '.sass': '🎨',
    '.less': '🎨',
    '.js': '🟨',
    '.mjs': '🟨',
    '.cjs': '🟨',
    '.ts': '🔷',
    '.mts': '🔷',
    '.cts': '🔷',
    '.tsx': '⚛️',
    '.jsx': '⚛️',
    '.json': '📋',
    '.yaml': '📋',
    '.yml': '📋',
    '.toml': '📋',
    '.md': '📝',
    '.mdx': '📝',
    '.txt': '📄',
    '.pdf': '📕',
    '.png': '🖼️',
    '.jpg': '🖼️',
    '.jpeg': '🖼️',
    '.gif': '🖼️',
    '.webp': '🖼️',
    '.svg': '🖼️',
    '.ico': '🖼️',
    '.mp3': '🎵',
    '.wav': '🎵',
    '.ogg': '🎵',
    '.m4a': '🎵',
    '.mp4': '🎬',
    '.mov': '🎬',
    '.avi': '🎬',
    '.webm': '🎬',
    '.py': '🐍',
    '.go': '🐹',
    '.rs': '🦀',
    '.java': '☕',
    '.sh': '🐚',
    '.bash': '🐚',
    '.zsh': '🐚',
    '.sql': '🗄️',
  }
  return map[ext] ?? '📄'
}

export function toTreeData(nodes: FileTreeNode[]): TreeDataNode[] {
  return nodes.map((n) => ({
    key: n.path,
    title: n.name,
    icon:
      n.type === 'dir' ? (
        <FolderOutlined style={{ color: '#e8b84b' }} />
      ) : (
        <span style={{ fontSize: 13 }}>{getFileEmoji(n.name)}</span>
      ),
    isLeaf: n.type === 'file',
    children: n.children ? toTreeData(n.children) : undefined,
  }))
}

function filterTree(nodes: TreeDataNode[], kw: string): TreeDataNode[] {
  if (!kw) return nodes
  const lower = kw.toLowerCase()
  const result: TreeDataNode[] = []
  for (const node of nodes) {
    const title = String(node.title ?? '').toLowerCase()
    if (node.isLeaf) {
      if (title.includes(lower)) result.push(node)
    } else {
      const children = filterTree((node.children ?? []) as TreeDataNode[], kw)
      if (children.length > 0 || title.includes(lower)) result.push({ ...node, children })
    }
  }
  return result
}

export function FileTreePanel({
  fileTree,
  treeSearch,
  onSearchChange,
  onSelectFile,
}: {
  fileTree: TreeDataNode[]
  treeSearch: string
  onSearchChange: (v: string) => void
  onSelectFile: (path: string) => void
}) {
  return (
    <>
      <div style={{ padding: '7px 12px', borderBottom: `1px solid ${C.bg3}`, flexShrink: 0 }}>
        <Text
          style={{
            fontSize: 12,
            color: C.text1,
            textTransform: 'uppercase',
            letterSpacing: 0.8,
            fontWeight: 600,
          }}
        >
          文件
        </Text>
      </div>
      <div
        style={{
          padding: '4px 8px 4px',
          position: 'relative',
          width: '90%',
          margin: '0 auto',
          marginTop: '8px',
        }}
      >
        <input
          value={treeSearch}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="搜索…"
          style={{
            width: '100%',
            fontSize: 12,
            padding: '4px 24px 4px 8px',
            border: `1px solid ${C.bg3}`,
            borderRadius: 5,
            outline: 'none',
            background: C.bg1,
            color: C.text0,
            boxSizing: 'border-box',
          }}
        />
        {treeSearch && (
          <span
            onClick={() => onSearchChange('')}
            style={{
              position: 'absolute',
              right: 14,
              top: '50%',
              transform: 'translateY(-50%)',
              cursor: 'pointer',
              color: C.text2,
              fontSize: 13,
              lineHeight: 1,
            }}
          >
            ✕
          </span>
        )}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {fileTree.length === 0 ? (
          <div style={{ color: C.text2, fontSize: 12, textAlign: 'center', marginTop: 40 }}>
            加载中…
          </div>
        ) : (
          <Tree
            showIcon
            treeData={filterTree(fileTree, treeSearch)}
            defaultExpandAll={!!treeSearch}
            onSelect={(_, { node }) => {
              if (node.isLeaf) onSelectFile(node.key as string)
            }}
            style={{ fontSize: 12, background: 'transparent' }}
          />
        )}
      </div>
    </>
  )
}
