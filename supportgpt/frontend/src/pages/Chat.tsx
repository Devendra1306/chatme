import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { chatApi } from '../services/api'
import MarkdownRenderer from '../components/MarkdownRenderer'
import SourceCitation from '../components/SourceCitation'
import LoadingDots from '../components/LoadingDots'
import toast from 'react-hot-toast'
import {
  RiSendPlaneFill,
  RiAddLine,
  RiDeleteBin6Line,
  RiRobot2Line,
  RiUserLine,
  RiSearchLine,
  RiChatAiLine,
  RiFileCopy2Line,
  RiCheckLine,
  RiEditLine,
  RiMoreLine,
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
  filename?: string
  page?: number
  page_number?: number
  score?: number
  confidence?: number
  content?: string
}

interface ChatItem {
  id: string
  title?: string
  createdAt?: string
  message_count?: number
  updated_at?: string
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
  const isNew = id === 'new'

  const [chats, setChats] = useState<ChatItem[]>([])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [renamingId, setRenamingId] = useState<string | null>(null)
  const [renameValue, setRenameValue] = useState('')
  const [hoverChatId, setHoverChatId] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // Fetch chat history
  const fetchHistory = useCallback(async () => {
    try {
      const res = await chatApi.getHistory()
      const items = res.data?.chats ?? res.data ?? []
      // Normalize MongoDB _id to id
      const normalized = Array.isArray(items)
        ? items.map((c: Record<string, unknown>) => ({ ...c, id: (c.id ?? c._id) as string }))
        : []
      setChats(normalized)
    } catch {
      setChats([])
    }
  }, [])

  useEffect(() => {
    fetchHistory()
  }, [fetchHistory])

  // Fetch messages when chat id changes
  useEffect(() => {
    if (!id || isNew) {
      setMessages([])
      return
    }
    setLoadingMessages(true)
    chatApi.getMessages(id)
      .then((res) => {
        const msgs = res.data?.messages ?? res.data ?? []
        setMessages(Array.isArray(msgs) ? msgs : [])
      })
      .catch(() => setMessages([]))
      .finally(() => setLoadingMessages(false))
  }, [id, isNew])

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // Auto-resize textarea
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
      // MongoDB returns _id; normalize
      return (newChat?.id ?? newChat?._id) as string
    } catch (err) {
      toast.error('Failed to create chat')
      throw err
    }
  }

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || loading) return

    setInput('')
    setLoading(true)

    // Determine chat ID
    let chatId = isNew ? null : id
    let isCreating = false

    if (!chatId) {
      isCreating = true
      try {
        chatId = await createNewChat(trimmed)
      } catch {
        setLoading(false)
        return
      }
    }

    // Optimistic user message
    const userMsg: ChatMessage = { role: 'user', content: trimmed, createdAt: new Date().toISOString() }
    setMessages((prev) => [...prev, userMsg])

    if (isCreating && chatId) {
      navigate(`/chat/${chatId}`, { replace: true })
    }

    try {
      const res = await chatApi.sendMessage(chatId!, trimmed)
      const respData = res.data
      // Backend returns: { success, message: { content, sources }, sources, userMessage }
      const assistantContent =
        respData.message?.content ??
        respData.answer ??
        respData.response ??
        respData.content ??
        ''
      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: assistantContent,
        sources: respData.sources ?? respData.message?.sources ?? [],
        createdAt: new Date().toISOString(),
      }
      setMessages((prev) => [...prev, assistantMsg])
      fetchHistory() // refresh titles
    } catch (err: unknown) {
      const errMsg =
        (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        'Failed to get response'
      toast.error(errMsg)
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: `Sorry, I encountered an error: ${errMsg}`, createdAt: new Date().toISOString() },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleDelete = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    e.preventDefault()
    if (!confirm('Delete this chat?')) return
    try {
      await chatApi.deleteChat(chatId)
      setChats((prev) => prev.filter((c) => c.id !== chatId))
      if (id === chatId) navigate('/chat/new')
      toast.success('Chat deleted')
    } catch {
      toast.error('Failed to delete chat')
    }
  }

  const handleRename = async (chatId: string) => {
    if (!renameValue.trim()) {
      setRenamingId(null)
      return
    }
    try {
      await chatApi.renameChat(chatId, renameValue.trim())
      setChats((prev) => prev.map((c) => c.id === chatId ? { ...c, title: renameValue.trim() } : c))
      setRenamingId(null)
      toast.success('Chat renamed')
    } catch {
      toast.error('Failed to rename chat')
    }
  }

  const handleCopy = async (content: string, msgIndex: number) => {
    await navigator.clipboard.writeText(content)
    setCopiedId(String(msgIndex))
    setTimeout(() => setCopiedId(null), 2000)
  }

  const filteredChats = chats.filter((c) =>
    !searchQuery || (c.title ?? 'New Chat').toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="flex h-full overflow-hidden bg-slate-50">
      {/* ── Chat Sidebar ── */}
      <div className="w-64 flex-shrink-0 bg-slate-900 flex flex-col border-r border-slate-700">
        {/* New Chat button */}
        <div className="p-3">
          <button
            onClick={() => navigate('/chat/new')}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <RiAddLine className="text-lg" />
            New Chat
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats..."
              className="w-full pl-8 pr-3 py-2 bg-slate-800 text-slate-200 placeholder-slate-500 text-sm rounded-lg border border-slate-700 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>
        </div>

        {/* Chat list */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5">
          {filteredChats.length === 0 && (
            <div className="text-center text-slate-500 text-xs py-8">
              {searchQuery ? 'No chats found' : 'No chats yet'}
            </div>
          )}

          {filteredChats.map((chat) => {
            const isActive = id === chat.id
            const isRenaming = renamingId === chat.id
            const isHovered = hoverChatId === chat.id

            return (
              <div
                key={chat.id}
                onMouseEnter={() => setHoverChatId(chat.id)}
                onMouseLeave={() => setHoverChatId(null)}
                className={`group relative flex items-center rounded-lg px-3 py-2.5 cursor-pointer transition-all ${
                  isActive ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
                onClick={() => !isRenaming && navigate(`/chat/${chat.id}`)}
              >
                <RiChatAiLine className="text-sm flex-shrink-0 mr-2.5 text-slate-400" />
                {isRenaming ? (
                  <input
                    autoFocus
                    value={renameValue}
                    onChange={(e) => setRenameValue(e.target.value)}
                    onBlur={() => handleRename(chat.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRename(chat.id)
                      if (e.key === 'Escape') setRenamingId(null)
                    }}
                    className="flex-1 bg-slate-600 text-white text-xs px-2 py-1 rounded outline-none"
                    onClick={(e) => e.stopPropagation()}
                  />
                ) : (
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium truncate">{chat.title ?? 'New Chat'}</p>
                    <p className="text-xs text-slate-500 truncate">
                      {chat.createdAt ? formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                )}

                {/* Action buttons on hover */}
                {(isHovered || isActive) && !isRenaming && (
                  <div className="flex items-center gap-0.5 ml-1 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        setRenamingId(chat.id)
                        setRenameValue(chat.title ?? '')
                      }}
                      className="p-1 rounded hover:bg-slate-600 text-slate-400 hover:text-white transition-colors"
                      title="Rename"
                    >
                      <RiEditLine className="text-xs" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(chat.id, e)}
                      className="p-1 rounded hover:bg-red-500/20 text-slate-400 hover:text-red-400 transition-colors"
                      title="Delete"
                    >
                      <RiDeleteBin6Line className="text-xs" />
                    </button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* ── Main Chat Area ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-white">
        {/* No chat / New chat — empty state */}
        {(isNew && messages.length === 0 && !loading) ? (
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
            <div className="w-16 h-16 bg-emerald-500 rounded-2xl flex items-center justify-center mb-5 shadow-lg shadow-emerald-200">
              <RiRobot2Line className="text-white text-3xl" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">How can I help you today?</h2>
            <p className="text-slate-500 text-sm mb-8 text-center max-w-md">
              Ask me anything about your uploaded documents. I'll find relevant information and answer your questions.
            </p>

            {/* Example prompts */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-2xl">
              {EXAMPLE_PROMPTS.map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(prompt)
                    textareaRef.current?.focus()
                  }}
                  className="text-left p-4 rounded-xl border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50 transition-all text-sm text-slate-600 hover:text-slate-900 group"
                >
                  <RiMoreLine className="text-emerald-500 mb-2 text-lg" />
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        ) : (
          /* Messages area */
          <div className="flex-1 overflow-y-auto">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
              </div>
            ) : (
              <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">
                {messages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    {/* Avatar */}
                    <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      msg.role === 'user' ? 'bg-slate-200' : 'bg-emerald-500'
                    }`}>
                      {msg.role === 'user' ? (
                        <RiUserLine className="text-slate-600 text-sm" />
                      ) : (
                        <RiRobot2Line className="text-white text-sm" />
                      )}
                    </div>

                    {/* Bubble */}
                    <div className={`group max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {msg.role === 'user' ? (
                        <div className="bg-slate-100 text-slate-900 px-4 py-3 rounded-2xl rounded-tr-sm text-sm leading-relaxed whitespace-pre-wrap">
                          {msg.content}
                        </div>
                      ) : (
                        <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                          <MarkdownRenderer content={msg.content} />
                          {msg.sources && msg.sources.length > 0 && (
                            <SourceCitation sources={msg.sources} />
                          )}
                        </div>
                      )}

                      {/* Copy button — only for assistant */}
                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => handleCopy(msg.content, i)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded"
                        >
                          {copiedId === String(i) ? (
                            <><RiCheckLine className="text-emerald-500" /> Copied</>
                          ) : (
                            <><RiFileCopy2Line /> Copy</>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {loading && (
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center flex-shrink-0">
                      <RiRobot2Line className="text-white text-sm" />
                    </div>
                    <div className="bg-white border border-slate-200 px-4 py-3 rounded-2xl rounded-tl-sm shadow-sm">
                      <LoadingDots />
                    </div>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        )}

        {/* ── Input bar ── */}
        <div className="border-t border-slate-200 bg-white px-4 py-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-end gap-3 bg-white border border-slate-300 rounded-2xl shadow-sm px-4 py-3 focus-within:border-emerald-400 focus-within:ring-2 focus-within:ring-emerald-100 transition-all">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message ChatMe..."
                rows={1}
                disabled={loading}
                className="flex-1 resize-none bg-transparent text-slate-900 placeholder-slate-400 text-sm focus:outline-none leading-relaxed max-h-48 overflow-y-auto disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || loading}
                className="flex-shrink-0 w-9 h-9 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 rounded-xl flex items-center justify-center transition-colors"
              >
                <RiSendPlaneFill className={`text-lg ${!input.trim() || loading ? 'text-slate-400' : 'text-white'}`} />
              </button>
            </div>
            <p className="text-xs text-slate-400 text-center mt-2">
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
