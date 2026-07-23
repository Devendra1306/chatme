import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { chatApi } from '../services/api'
import MarkdownRenderer from '../components/MarkdownRenderer'
import SourceCitation from '../components/SourceCitation'
import ThinkingDots from '../components/ThinkingDots'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import {
  RiSendPlaneFill,
  RiAddLine,
  RiDeleteBin6Line,
  RiRobot2Line,
  RiSearchLine,
  RiChatAiLine,
  RiFileCopy2Line,
  RiCheckLine,
  RiSparklingLine,
  RiLoader4Line,
} from 'react-icons/ri'
import { formatDistanceToNow } from 'date-fns'

interface ChatMessage {
  id?: string
  role: 'user' | 'assistant'
  content: string
  sources?: Source[]
  createdAt?: string
}

interface Source {
  document_name?: string
  documentName?: string
  filename?: string
  page?: number
  page_number?: number
  score?: number
  confidence?: number
}

interface ChatItem {
  id: string
  title?: string
  createdAt?: string
  message_count?: number
}

const EXAMPLE_PROMPTS = [
  'What are the main topics covered in my documents?',
  'Summarize the key policies from uploaded files',
  'What are the troubleshooting steps for common issues?',
  'Find information about pricing and plans',
]

export default function Chat() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const isNew = id === 'new'

  const [chats, setChats] = useState<ChatItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const fetchHistory = useCallback(async () => {
    try {
      const res = await chatApi.getHistory()
      const items = res.data?.chats ?? res.data ?? []
      const normalized = Array.isArray(items)
        ? items.map((c: Record<string, unknown>) => ({ ...c, id: (c.id ?? c._id) as string }))
        : []
      setChats(normalized)
    } catch {
      setChats([])
    }
  }, [])

  useEffect(() => { fetchHistory() }, [fetchHistory])

  useEffect(() => {
    if (!id || isNew) { setMessages([]); return }
    setLoadingMessages(true)
    chatApi.getMessages(id)
      .then((res) => {
        const msgs = res.data?.messages ?? res.data ?? []
        setMessages(Array.isArray(msgs) ? msgs : [])
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false))
  }, [id, isNew])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`
    }
  }, [input])

  const createNewChat = async (firstMessage?: string) => {
    try {
      const res = await chatApi.createChat(firstMessage?.slice(0, 60))
      const newChat = res.data?.chat ?? res.data
      await fetchHistory()
      return (newChat?.id ?? newChat?._id) as string
    } catch {
      toast.error('Failed to create chat')
      throw new Error('create failed')
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return
    setInput('')
    setLoading(true)

    let chatId = isNew ? null : id
    if (!chatId) {
      try { chatId = await createNewChat(trimmed) }
      catch { setLoading(false); return }
    }

    const userMsg: ChatMessage = { role: 'user', content: trimmed, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])

    try {
      const res = await chatApi.sendMessage(chatId!, trimmed)
      const reply = res.data?.message ?? res.data
      const aiMsg: ChatMessage = {
        role: 'assistant',
        content: reply?.content ?? reply?.response ?? 'No response.',
        sources: reply?.sources ?? [],
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, aiMsg])
      if (isNew && chatId) navigate(`/chat/${chatId}`, { replace: true })
    } catch {
      toast.error('Failed to send message')
      setMessages((prev) => prev.filter((m) => m !== userMsg))
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend() }
  }

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await chatApi.deleteChat(chatId)
      await fetchHistory()
      if (id === chatId) navigate('/chat/new')
    } catch { toast.error('Failed to delete') }
  }

  const handleCopy = (content: string, msgId: string) => {
    navigator.clipboard.writeText(content)
    setCopiedId(msgId)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredChats = chats.filter(c =>
    (c.title ?? '').toLowerCase().includes(searchQuery.toLowerCase())
  )

  const currentChat = chats.find(c => c.id === id)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>

      {/* ─── Left panel: chat list ─── */}
      <div style={{
        width: 240, flexShrink: 0, height: '100%',
        background: 'rgba(7,7,17,0.6)',
        backdropFilter: 'blur(16px)',
        borderRight: '1px solid rgba(99,102,241,0.10)',
        display: 'flex', flexDirection: 'column',
      }}>
        {/* New chat button */}
        <div style={{ padding: '16px 12px 8px' }}>
          <motion.button
            whileHover={{ scale: 1.02, boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate('/chat/new')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              padding: '10px 16px', borderRadius: 10,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              border: 'none', color: '#fff', fontSize: 13, fontWeight: 600, cursor: 'pointer',
              boxShadow: '0 0 16px rgba(99,102,241,0.25)',
            }}
          >
            <RiAddLine style={{ fontSize: 16 }} /> New Chat
          </motion.button>
        </div>

        {/* Search */}
        <div style={{ padding: '0 12px 8px' }}>
          <div style={{ position: 'relative' }}>
            <RiSearchLine style={{
              position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
              color: '#4d4b72', fontSize: 14,
            }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              style={{
                width: '100%', padding: '8px 10px 8px 32px',
                background: 'rgba(99,102,241,0.08)',
                border: '1px solid rgba(99,102,241,0.12)',
                borderRadius: 8, color: '#f0f0ff', fontSize: 12,
                outline: 'none',
              }}
            />
          </div>
        </div>

        {/* Chat list */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px 12px' }}>
          {filteredChats.length === 0 && (
            <div style={{ padding: '24px 12px', textAlign: 'center', color: '#4d4b72', fontSize: 12 }}>
              No conversations yet
            </div>
          )}
          <AnimatePresence>
            {filteredChats.map((chat) => (
              <motion.div
                key={chat.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                onClick={() => navigate(`/chat/${chat.id}`)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '9px 10px', borderRadius: 8, marginBottom: 2,
                  cursor: 'pointer',
                  background: id === chat.id ? 'rgba(99,102,241,0.18)' : 'transparent',
                  border: id === chat.id ? '1px solid rgba(99,102,241,0.28)' : '1px solid transparent',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (id !== chat.id) e.currentTarget.style.background = 'rgba(99,102,241,0.08)' }}
                onMouseLeave={e => { if (id !== chat.id) e.currentTarget.style.background = 'transparent' }}
              >
                <RiChatAiLine style={{ fontSize: 14, color: id === chat.id ? '#818cf8' : '#4d4b72', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: id === chat.id ? '#e0e0f8' : '#9896bb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {chat.title ?? 'New Chat'}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDelete(chat.id, e)}
                  style={{
                    background: 'none', border: 'none', color: '#4d4b72',
                    fontSize: 13, cursor: 'pointer', padding: '2px', borderRadius: 4,
                    opacity: 0, transition: 'opacity 0.15s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.color = '#f87171'; e.currentTarget.style.opacity = '1' }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#4d4b72'; e.currentTarget.style.opacity = '0' }}
                >
                  <RiDeleteBin6Line />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Main chat area ─── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}>

        {/* Header */}
        <div style={{
          padding: '14px 24px',
          borderBottom: '1px solid rgba(99,102,241,0.10)',
          background: 'rgba(7,7,17,0.5)',
          backdropFilter: 'blur(12px)',
          display: 'flex', alignItems: 'center', gap: 12,
          flexShrink: 0,
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 8,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16,
            boxShadow: '0 0 12px rgba(99,102,241,0.4)',
          }}>
            <RiRobot2Line style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0ff' }}>
              {isNew ? 'New Conversation' : (currentChat?.title ?? 'ChatMe AI')}
            </div>
            <div style={{ fontSize: 11, color: '#6d6b98', display: 'flex', alignItems: 'center', gap: 4 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              AI ready · responds from your knowledge base
            </div>
          </div>
        </div>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: 20 }}>

          {loadingMessages ? (
            <div style={{ display: 'flex', justifyContent: 'center', paddingTop: 60 }}>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 28, color: '#6366f1' }}>
                <RiLoader4Line />
              </motion.div>
            </div>
          ) : messages.length === 0 ? (
            /* Empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, gap: 24, paddingBottom: 60 }}
            >
              <motion.div
                animate={{ boxShadow: ['0 0 20px rgba(99,102,241,0.4)', '0 0 40px rgba(99,102,241,0.7)', '0 0 20px rgba(99,102,241,0.4)'] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                style={{
                  width: 72, height: 72, borderRadius: 20,
                  background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36,
                }}
              >
                <RiSparklingLine style={{ color: '#fff' }} />
              </motion.div>
              <div style={{ textAlign: 'center' }}>
                <h2 style={{ fontSize: 24, fontWeight: 800, color: '#f0f0ff', marginBottom: 8 }}>How can I help?</h2>
                <p style={{ fontSize: 14, color: '#6d6b98', maxWidth: 380 }}>
                  Ask anything about your uploaded documents. I'll find the most relevant information and cite my sources.
                </p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, maxWidth: 500, width: '100%' }}>
                {EXAMPLE_PROMPTS.map((prompt, i) => (
                  <motion.button
                    key={i}
                    whileHover={{ y: -2, borderColor: 'rgba(99,102,241,0.35)' }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => { setInput(prompt); textareaRef.current?.focus() }}
                    style={{
                      background: 'rgba(99,102,241,0.08)',
                      border: '1px solid rgba(99,102,241,0.15)',
                      borderRadius: 10, padding: '10px 14px',
                      color: '#9896bb', fontSize: 12, fontWeight: 500,
                      cursor: 'pointer', textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    {prompt}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, i) => {
                const isUser = msg.role === 'user'
                const msgKey = msg.id ?? `msg-${i}`
                return (
                  <motion.div
                    key={msgKey}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 26 }}
                    style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexDirection: isUser ? 'row-reverse' : 'row' }}
                  >
                    {/* Avatar */}
                    <div style={{
                      width: 34, height: 34, borderRadius: isUser ? 10 : 10,
                      flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: isUser ? 12 : 18, fontWeight: 700,
                      background: isUser
                        ? 'linear-gradient(135deg, #818cf8, #6366f1)'
                        : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                      color: '#fff',
                      boxShadow: `0 0 12px rgba(99,102,241,${isUser ? '0.3' : '0.4'})`,
                    }}>
                      {isUser ? initials : <RiRobot2Line />}
                    </div>

                    {/* Bubble */}
                    <div style={{ maxWidth: '70%', display: 'flex', flexDirection: 'column', gap: 6, alignItems: isUser ? 'flex-end' : 'flex-start' }}>
                      {isUser ? (
                        <div style={{
                          background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                          borderRadius: '16px 4px 16px 16px',
                          padding: '11px 16px',
                          color: '#fff', fontSize: 14, lineHeight: 1.6,
                          boxShadow: '0 4px 16px rgba(99,102,241,0.25)',
                        }}>
                          {msg.content}
                        </div>
                      ) : (
                        <div style={{
                          background: 'rgba(13,13,26,0.72)',
                          backdropFilter: 'blur(20px)',
                          border: '1px solid rgba(99,102,241,0.15)',
                          borderRadius: '4px 16px 16px 16px',
                          padding: '14px 18px',
                          boxShadow: '0 4px 20px rgba(0,0,0,0.25)',
                          fontSize: 14, lineHeight: 1.7, color: '#e0e0f8',
                          position: 'relative',
                        }}>
                          <MarkdownRenderer content={msg.content} />

                          {msg.sources && msg.sources.length > 0 && (
                            <div style={{ marginTop: 12, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                              <SourceCitation sources={msg.sources} />
                            </div>
                          )}

                          {/* Copy button */}
                          <button
                            onClick={() => handleCopy(msg.content, msgKey)}
                            style={{
                              position: 'absolute', top: 10, right: 10,
                              background: 'rgba(99,102,241,0.12)',
                              border: '1px solid rgba(99,102,241,0.2)',
                              borderRadius: 6, padding: '4px 8px',
                              color: '#9896bb', fontSize: 12, cursor: 'pointer',
                              display: 'flex', alignItems: 'center', gap: 4,
                            }}
                          >
                            {copiedId === msgKey ? <RiCheckLine style={{ color: '#34d399' }} /> : <RiFileCopy2Line />}
                          </button>
                        </div>
                      )}

                      {/* Timestamp */}
                      <div style={{ fontSize: 10, color: '#4d4b72', paddingLeft: 4 }}>
                        {msg.createdAt ? formatDistanceToNow(new Date(msg.createdAt), { addSuffix: true }) : ''}
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </AnimatePresence>
          )}

          {/* Thinking indicator */}
          <AnimatePresence>
            {loading && (
              <motion.div
                key="thinking"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 12 }}
                style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 10, flexShrink: 0,
                  background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, color: '#fff',
                  boxShadow: '0 0 14px rgba(99,102,241,0.5)',
                }}>
                  <RiRobot2Line />
                </div>
                <div style={{
                  background: 'rgba(13,13,26,0.72)',
                  backdropFilter: 'blur(20px)',
                  border: '1px solid rgba(99,102,241,0.18)',
                  borderRadius: '4px 16px 16px 16px',
                  padding: '14px 18px',
                }}>
                  <ThinkingDots />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />
        </div>

        {/* ─── Input bar ─── */}
        <div style={{
          padding: '16px 24px 20px',
          background: 'rgba(7,7,17,0.7)',
          backdropFilter: 'blur(16px)',
          borderTop: '1px solid rgba(99,102,241,0.10)',
          flexShrink: 0,
        }}>
          <div style={{
            display: 'flex', alignItems: 'flex-end', gap: 10,
            background: 'rgba(13,13,26,0.72)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(99,102,241,0.18)',
            borderRadius: 14,
            padding: '10px 10px 10px 16px',
            boxShadow: '0 0 0 1px rgba(99,102,241,0.08), 0 8px 32px rgba(0,0,0,0.25)',
            transition: 'border-color 0.2s, box-shadow 0.2s',
          }}
            onFocus={() => {}}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask anything about your documents..."
              rows={1}
              style={{
                flex: 1, resize: 'none', background: 'transparent',
                border: 'none', outline: 'none',
                color: '#f0f0ff', fontSize: 14, lineHeight: 1.6,
                fontFamily: 'inherit',
                maxHeight: 200, overflowY: 'auto',
              }}
            />
            <motion.button
              whileHover={input.trim() ? { scale: 1.08, boxShadow: '0 0 20px rgba(99,102,241,0.5)' } : {}}
              whileTap={input.trim() ? { scale: 0.94 } : {}}
              onClick={handleSend}
              disabled={!input.trim() || loading}
              style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: input.trim() ? 'linear-gradient(135deg, #6366f1, #818cf8)' : 'rgba(99,102,241,0.15)',
                border: 'none', cursor: input.trim() ? 'pointer' : 'default',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: '#fff',
                transition: 'background 0.2s',
              }}
            >
              <RiSendPlaneFill />
            </motion.button>
          </div>
          <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: '#2e2c52' }}>
            Enter to send · Shift+Enter for new line
          </div>
        </div>
      </div>
    </div>
  )
}
