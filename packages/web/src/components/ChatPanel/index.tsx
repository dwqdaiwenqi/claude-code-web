import { useRef, useEffect, useState } from 'react'
import { Typography, Spin, Button, Card, Space, Tag, Badge, Switch, Tooltip } from 'antd'
import { ArrowUpOutlined } from '@ant-design/icons'
import type { AskUserQuestion, SsePart } from '@/http/index'
import type { SessionMessage } from '@/http/index'

interface DisplayMessage {
  id: string
  role: 'user' | 'assistant'
  sdkMessages: SessionMessage[]
  error?: string
  cost?: number
}
import ChatInput from '@/components/ChatInput/index.tsx'
import { MessageBubble } from '@/components/MessageBubble/index.tsx'

function AskUserCard({
  questions,
  onResolve,
}: {
  questions: AskUserQuestion[]
  onResolve: (answers: Record<string, string>) => void
}) {
  const [selected, setSelected] = useState<Record<string, string[]>>(() =>
    Object.fromEntries(questions.map((q) => [q.question, []]))
  )

  function toggle(question: string, label: string, multi: boolean) {
    setSelected((prev) => {
      const cur = prev[question] ?? []
      if (multi) {
        return {
          ...prev,
          [question]: cur.includes(label) ? cur.filter((l) => l !== label) : [...cur, label],
        }
      }
      return { ...prev, [question]: [label] }
    })
  }

  function submit() {
    const answers: Record<string, string> = {}
    for (const q of questions) {
      answers[q.question] = (selected[q.question] ?? []).join(', ')
    }
    onResolve(answers)
  }

  const allAnswered = questions.every((q) => (selected[q.question] ?? []).length > 0)

  return (
    <Card
      size="small"
      style={{ margin: '8px 0', borderColor: '#1677ff33', background: '#f0f5ff' }}
      title={<span style={{ fontSize: 12, color: '#1677ff' }}>Claude 需要您的输入</span>}
    >
      <Space direction="vertical" style={{ width: '100%' }} size={12}>
        {questions.map((q) => (
          <div key={q.question}>
            <div style={{ fontSize: 12, fontWeight: 500, marginBottom: 6 }}>
              {q.header}: {q.question}
            </div>
            <Space size={6} wrap>
              {q.options.map((opt) => {
                const isSelected = (selected[q.question] ?? []).includes(opt.label)
                return (
                  <Tag
                    key={opt.label}
                    color={isSelected ? 'blue' : 'default'}
                    style={{ cursor: 'pointer', userSelect: 'none', fontSize: 12 }}
                    onClick={() => toggle(q.question, opt.label, q.multiSelect)}
                    title={opt.description}
                  >
                    {opt.label}
                  </Tag>
                )
              })}
            </Space>
          </div>
        ))}
        <Button type="primary" size="small" disabled={!allAnswered} onClick={submit}>
          提交
        </Button>
      </Space>
    </Card>
  )
}

const { Text } = Typography

const C = {
  bg0: '#f7f7f8',
  bg1: '#ffffff',
  bg3: '#e8e8ec',
  text0: '#1a1a1a',
  text2: '#bbb',
}

function ChatContent({
  activeId,
  msgLoading,
  messages,
  loading,
}: {
  activeId: string | null
  msgLoading: boolean
  messages: DisplayMessage[]
  loading: boolean
}) {
  if (!activeId) {
    return (
      <div style={{ color: C.text2, fontSize: 13, textAlign: 'center', marginTop: 80 }}>
        选择或新建一个会话
      </div>
    )
  }
  if (msgLoading) {
    return (
      <Spin
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />
    )
  }
  return (
    <>
      {messages.map((msg) => (
        <MessageBubble key={msg.id} msg={msg} pending={loading && msg.id === 'tmp_asst'} />
      ))}
    </>
  )
}

interface ChatPanelProps {
  activeId: string | null
  sessionTitle: string | undefined
  messages: DisplayMessage[]
  msgLoading: boolean
  loading: boolean
  input: string
  onInputChange: (v: string) => void
  onSend: () => void
  onPasteImage: (file: File) => void
  activeProjectID: string | null
  pendingQuestion: AskUserQuestion[] | null
  onResolve: (answers: Record<string, string>) => void
  bypassPermissions: boolean
  onBypassPermissionsChange: (v: boolean) => void
}

export default function ChatPanel({
  activeId,
  sessionTitle,
  messages,
  msgLoading,
  loading,
  input,
  onInputChange,
  onSend,
  onPasteImage,
  activeProjectID,
  pendingQuestion,
  onResolve,
  bypassPermissions,
  onBypassPermissionsChange,
}: ChatPanelProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    bottomRef.current?.scrollIntoView()
  }, [messages])

  return (
    <>
      <div
        style={{
          padding: '6px 16px',
          borderBottom: `1px solid ${C.bg3}`,
          background: C.bg1,
          flexShrink: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <Text style={{ fontSize: 13, color: C.text0, fontWeight: 500 }}>
          {sessionTitle ?? '选择或新建一个会话'}
        </Text>
      </div>

      <div style={{ position: 'relative', display: 'flex', flex: 1, height: 0 }}>
        <div
          style={{
            position: 'relative',
            flex: 1,
            overflowY: 'auto',
            padding: '16px 16px',
            paddingBottom: '92px',
          }}
        >
          <ChatContent
            activeId={activeId}
            msgLoading={msgLoading}
            messages={messages}
            loading={loading}
          />
          {pendingQuestion && <AskUserCard questions={pendingQuestion} onResolve={onResolve} />}

          <div ref={bottomRef} />
        </div>

        <div
          style={{
            position: 'absolute',
            left: 22,
            bottom: 14,
            border: `1px solid ${C.bg3}`,
            background: 'white',
            transition: '1s',
            opacity: loading ? 1 : 0,
            borderRadius: 12,
            color: C.text0,
            padding: '2px 12px',
          }}
        >
          <Badge status="processing" style={{ marginRight: '6px' }} />
          Thinking...
        </div>
      </div>
      <div
        style={{
          padding: '8px 12px',
          paddingBottom: '53px',
          borderTop: `1px solid ${C.bg3}`,
          background: C.bg1,
          display: 'flex',
          gap: 8,
          alignItems: 'flex-end',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <ChatInput
          value={input}
          onChange={onInputChange}
          onPasteImage={(file) => {
            onPasteImage?.(file)
          }}
          onSend={onSend}
          disabled={!activeId || loading}
          activeProjectID={activeProjectID}
        />
        <div style={{ position: 'absolute', right: 12, bottom: 8 }}>
          <Space size={6}>
            <Tooltip
              title={
                !bypassPermissions ? '关闭后 Claude 不会询问用户权限' : '开启后主动进行权限询问'
              }
            >
              <Space size={6}>
                <Text style={{ fontSize: 11, color: C.text2 }}>Human-in-loop</Text>
                <Switch
                  size="small"
                  checked={!bypassPermissions}
                  onChange={(v) => onBypassPermissionsChange(!v)}
                />
              </Space>
            </Tooltip>

            <Button
              color="primary"
              variant="filled"
              icon={<ArrowUpOutlined />}
              onClick={onSend}
              loading={loading}
              disabled={!activeId || !input.trim()}
            />
          </Space>
        </div>
      </div>
    </>
  )
}
