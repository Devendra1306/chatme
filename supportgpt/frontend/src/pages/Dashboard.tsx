import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { dashboardApi } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import PremiumStatCard from '../components/PremiumStatCard'
import GlassCard from '../components/GlassCard'
import {
  RiFileTextLine,
  RiChatAiLine,
  RiTeamLine,
  RiQuestionLine,
  RiUploadCloud2Line,
  RiArrowRightLine,
  RiTimeLine,
  RiSparklingLine,
  RiBarChartBoxLine,
  RiCheckboxCircleLine,
  RiLoader4Line,
} from 'react-icons/ri'
import { formatDistanceToNow } from 'date-fns'

interface DashboardData {
  stats?: {
    totalDocuments?: number
    totalChats?: number
    totalUsers?: number
    totalQuestions?: number
    documentChange?: number
    chatChange?: number
  }
  recentDocuments?: Array<{ id: string; filename?: string; original_filename?: string; createdAt?: string; status?: string }>
  recentChats?: Array<{ id: string; title?: string; createdAt?: string; message_count?: number }>
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } },
}

const rowVariant = {
  hidden: { opacity: 0, x: -12 },
  show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 200, damping: 24 } },
}

const quickActions = [
  { to: '/chat/new',   icon: RiChatAiLine,       label: 'New Chat',       sub: 'Ask your knowledge base',  color: '#6366f1' },
  { to: '/upload',     icon: RiUploadCloud2Line,  label: 'Upload Doc',     sub: 'Add PDFs to knowledge',    color: '#34d399' },
  { to: '/documents',  icon: RiFileTextLine,      label: 'Documents',      sub: 'Manage your library',      color: '#fbbf24' },
  { to: '/analytics',  icon: RiBarChartBoxLine,   label: 'Analytics',      sub: 'View usage insights',      color: '#818cf8' },
]

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getDashboard()
      .then((res) => {
        const d = res.data?.dashboard ?? {}
        setData({
          stats: {
            totalDocuments: d.totalDocuments ?? 0,
            totalChats: d.totalChats ?? 0,
            totalUsers: d.totalUsers ?? 0,
            totalQuestions: d.totalQuestions ?? 0,
            documentChange: 12,
            chatChange: 8,
          },
          recentDocuments: (d.recentDocuments ?? []).map((doc: any) => ({
            ...doc, id: doc.id ?? doc._id,
            filename: doc.originalName ?? doc.name ?? 'Document',
          })),
          recentChats: (d.recentChats ?? []).map((c: any) => ({
            ...c, id: c.id ?? c._id,
          })),
        })
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  const stats = data.stats ?? {}
  const docs = data.recentDocuments ?? []
  const chats = data.recentChats ?? []

  const statCards = [
    { icon: <RiFileTextLine />, value: stats.totalDocuments ?? 0, label: 'Documents', change: stats.documentChange, color: '#6366f1' },
    { icon: <RiChatAiLine />,  value: stats.totalChats ?? 0,     label: 'Chats',     change: stats.chatChange,     color: '#34d399' },
    ...(isAdmin ? [{ icon: <RiTeamLine />, value: stats.totalUsers ?? 0, label: 'Users', change: 5, color: '#818cf8' }] : []),
    { icon: <RiQuestionLine />, value: stats.totalQuestions ?? 0, label: 'Questions', change: 18, color: '#fbbf24' },
  ]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          style={{ fontSize: 32, color: '#6366f1' }}
        >
          <RiLoader4Line />
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1280, margin: '0 auto' }}>

      {/* ── Hero greeting ── */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        style={{ marginBottom: 36 }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <motion.span
            animate={{ rotate: [0, 15, -10, 15, 0] }}
            transition={{ duration: 1.5, delay: 0.5 }}
            style={{ fontSize: 28 }}
          >
            ✨
          </motion.span>
          <h1 style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.1 }}>
            <span style={{ color: '#9896bb' }}>{getGreeting()}, </span>
            <span className="shimmer-text">{user?.name?.split(' ')[0] ?? 'there'}</span>
          </h1>
        </div>
        <p style={{ color: '#6d6b98', fontSize: 15, fontWeight: 500 }}>
          Your AI workspace has{' '}
          <span style={{ color: '#818cf8' }}>{stats.totalDocuments ?? 0} document{stats.totalDocuments !== 1 ? 's' : ''}</span>{' '}
          ready · {stats.totalChats ?? 0} conversations · {stats.totalQuestions ?? 0} questions answered
        </p>
      </motion.div>

      {/* ── Stat cards ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${statCards.length}, 1fr)`,
        gap: 16,
        marginBottom: 28,
      }}>
        {statCards.map((card, i) => (
          <PremiumStatCard
            key={i}
            icon={card.icon}
            value={card.value}
            label={card.label}
            change={card.change}
            accentColor={card.color}
            delay={i * 0.08}
          />
        ))}
      </div>

      {/* ── AI Activity banner ── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
        style={{ marginBottom: 28 }}
      >
        <GlassCard hover={false} style={{
          padding: '18px 24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(13,13,26,0.72) 60%)',
          borderColor: 'rgba(99,102,241,0.25)',
          display: 'flex', alignItems: 'center', gap: 16,
        }}>
          <div style={{
            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 22, boxShadow: '0 0 20px rgba(99,102,241,0.4)',
          }}>
            <RiSparklingLine style={{ color: '#fff' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff', marginBottom: 2 }}>
              AI Knowledge Base Active
            </div>
            <div style={{ fontSize: 13, color: '#9896bb' }}>
              Your assistant is ready. Upload documents to expand its knowledge, then start a conversation.
            </div>
          </div>
          <Link
            to="/chat/new"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 6,
              padding: '8px 18px', borderRadius: 8,
              background: 'linear-gradient(135deg, #6366f1, #818cf8)',
              color: '#fff', fontSize: 13, fontWeight: 600,
              textDecoration: 'none', flexShrink: 0,
              boxShadow: '0 0 20px rgba(99,102,241,0.35)',
            }}
          >
            Ask AI <RiArrowRightLine />
          </Link>
        </GlassCard>
      </motion.div>

      {/* ── Bottom row ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        {/* Recent Chats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.5 }}
        >
          <GlassCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '16px 20px', borderBottom: '1px solid rgba(99,102,241,0.10)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#f0f0ff' }}>
                <RiChatAiLine style={{ color: '#6366f1' }} /> Recent Chats
              </div>
              <Link to="/chat/new" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                New chat <RiArrowRightLine />
              </Link>
            </div>
            {chats.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#4d4b72' }}>
                <RiChatAiLine style={{ fontSize: 36, marginBottom: 8, display: 'block', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 13 }}>No chats yet — start your first conversation</div>
              </div>
            ) : (
              <motion.div variants={containerVariants} initial="hidden" animate="show">
                {chats.slice(0, 5).map((chat) => (
                  <motion.div key={chat.id} variants={rowVariant}>
                    <Link
                      to={`/chat/${chat.id}`}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 20px', textDecoration: 'none',
                        borderBottom: '1px solid rgba(99,102,241,0.06)',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'rgba(99,102,241,0.07)')}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                        background: 'rgba(99,102,241,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 15, color: '#818cf8',
                      }}>
                        <RiChatAiLine />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: '#e0e0f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {chat.title ?? 'New Chat'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6d6b98', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                          <RiTimeLine />
                          {chat.createdAt ? formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true }) : ''}
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </GlassCard>
        </motion.div>

        {/* Right column: Recent Docs + Quick Actions */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Recent Documents */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.5 }}
          >
            <GlassCard hover={false} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '16px 20px', borderBottom: '1px solid rgba(99,102,241,0.10)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 15, fontWeight: 700, color: '#f0f0ff' }}>
                  <RiFileTextLine style={{ color: '#34d399' }} /> Recent Documents
                </div>
                <Link to="/documents" style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#818cf8', textDecoration: 'none', fontWeight: 600 }}>
                  View all <RiArrowRightLine />
                </Link>
              </div>
              {docs.length === 0 ? (
                <div style={{ padding: '28px 20px', textAlign: 'center', color: '#4d4b72', fontSize: 13 }}>
                  No documents yet
                </div>
              ) : (
                <motion.div variants={containerVariants} initial="hidden" animate="show">
                  {docs.slice(0, 3).map((doc) => (
                    <motion.div
                      key={doc.id}
                      variants={rowVariant}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '11px 20px',
                        borderBottom: '1px solid rgba(99,102,241,0.06)',
                      }}
                    >
                      <div style={{
                        width: 30, height: 30, borderRadius: 7, flexShrink: 0,
                        background: 'rgba(248,113,113,0.15)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#f87171',
                      }}>
                        <RiFileTextLine />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#e0e0f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {doc.filename ?? 'Document'}
                        </div>
                        <div style={{ fontSize: 11, color: '#6d6b98' }}>
                          {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : ''}
                        </div>
                      </div>
                      <span style={{
                        fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99, letterSpacing: '0.04em',
                        background: doc.status === 'ready' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                        color: doc.status === 'ready' ? '#34d399' : '#fbbf24',
                      }}>
                        {doc.status === 'ready' ? <><RiCheckboxCircleLine style={{ marginRight: 3 }} />READY</> : 'PROC…'}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </GlassCard>
          </motion.div>

          {/* Quick Actions 2×2 grid */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.5 }}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {quickActions.map((action, i) => (
                <motion.div
                  key={action.to}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.62 + i * 0.07, duration: 0.4 }}
                >
                  <Link to={action.to} style={{ textDecoration: 'none', display: 'block' }}>
                    <GlassCard size="sm" style={{ padding: '14px 16px', cursor: 'pointer' }}>
                      <div style={{
                        width: 36, height: 36, borderRadius: 10, marginBottom: 10,
                        background: `${action.color}20`,
                        border: `1px solid ${action.color}35`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 18, color: action.color,
                        boxShadow: `0 0 12px ${action.color}30`,
                      }}>
                        <action.icon />
                      </div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f0f0ff', marginBottom: 2 }}>{action.label}</div>
                      <div style={{ fontSize: 11, color: '#6d6b98' }}>{action.sub}</div>
                    </GlassCard>
                  </Link>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
