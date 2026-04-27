import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Spin, App as AntdApp } from 'antd'
import { FolderOpenOutlined, BranchesOutlined } from '@ant-design/icons'
import { api, type ProjectInfo } from '@/http/index'
import TerminalPanel from '@/components/Terminal/index.tsx'
import FullSpin from '@/components/FullSpin'
import './index.less'

function timeAgo(ts: number): string {
  const diff = Date.now() - ts
  const m = Math.floor(diff / 60000)
  if (m < 1) return '刚刚'
  if (m < 60) return `${m} 分钟前`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h} 小时前`
  return `${Math.floor(h / 24)} 天前`
}

function ProjectCard({ project, onClick }: { project: ProjectInfo; onClick: () => void }) {
  const name = project.cwd.split('/').pop() || project.cwd
  const parentPath = project.cwd.split('/').slice(0, -1).join('/')

  return (
    <div className="projectCard" onClick={onClick}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="projectCard-icon">
          <FolderOpenOutlined style={{ color: '#1677ff', fontSize: 16 }} />
        </div>
        <div style={{ overflow: 'hidden', paddingRight: 8 }}>
          <div className="projectCard-name">{name}</div>
          <div className="projectCard-path">{parentPath}</div>
        </div>
      </div>

      <div className="projectCard-meta">
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <BranchesOutlined style={{ fontSize: 11 }} />
          <span>{project.sessionCount} 个会话</span>
        </div>
        <div className="projectCard-time">
          {project.updatedAt ? timeAgo(project.updatedAt) : '从未'}
        </div>
      </div>
    </div>
  )
}

export default function HomePage() {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<ProjectInfo[]>([])
  const [loading, setLoading] = useState(true)
  const { message: _msg } = AntdApp.useApp()

  async function load(showLoading = false) {
    if (showLoading) setLoading(true)
    try {
      setProjects([...((await api.listProjects()) || [])])
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    load(true)
  }, [])

  return (
    <div className="homePage">
      {loading && <FullSpin />}

      {!loading && (
        <>
          <div className="homePage-content">
            <div className="homePage-header">
              <div className="homePage-header-title">Claude Web</div>
              <div className="homePage-header-title"></div>

              <div className="homePage-header-subtitle">
                当前有 {projects?.length} 个 Claude 项目
              </div>
              <div className="homePage-header-divider" />
            </div>

            <div className="homePage-grid">
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
                  <Spin size="large" />
                </div>
              ) : projects.length === 0 ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    paddingTop: 60,
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 40 }}>📁</div>
                  <div style={{ fontSize: 15, fontWeight: 600, color: '#555' }}>暂无项目</div>
                  <div style={{ fontSize: 12, color: '#aaa' }}>
                    使用{' '}
                    <code style={{ background: '#eee', padding: '1px 5px', borderRadius: 3 }}>
                      claude
                    </code>{' '}
                    命令行工具与某个目录交互后，项目会自动出现在这里
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                    gap: 12,
                  }}
                >
                  {projects.map((p) => (
                    <ProjectCard
                      key={p.id}
                      project={p}
                      onClick={() => navigate(`/project/${p.id}`)}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="homePage-divider" />

          <div className="homePage-terminal">
            <TerminalPanel
              welcomeMessage={[
                '\x1b[1;36m╔══════════════════════════════════════════════════╗\x1b[0m\r\n',
                '\x1b[1;36m║         欢迎使用 Claude Web  🤖                  ║\x1b[0m\r\n',
                '\x1b[1;36m╚══════════════════════════════════════════════════╝\x1b[0m\r\n',
                '\r\n',
              ].join('')}
            />
          </div>
        </>
      )}
    </div>
  )
}
