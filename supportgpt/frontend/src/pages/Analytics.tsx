import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { analyticsApi } from '../services/api'
import GlassCard from '../components/GlassCard'
import PremiumStatCard from '../components/PremiumStatCard'
import {
  RiBarChartBoxLine,
  RiChatAiLine,
  RiFileTextLine,
  RiQuestionLine,
  RiSparklingLine,
  RiLoader4Line,
  RiArrowUpLine,
} from 'react-icons/ri'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts'

interface AnalyticsData {
  totalChats?: number
  totalMessages?: number
  totalDocuments?: number
  totalUsers?: number
  avgConfidence?: number
  chatsByDay?: Array<{ date: string; count: number }>
  topQuestions?: Array<{ question: string; count: number }>
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{
      background: 'rgba(13,13,26,0.95)', backdropFilter: 'blur(20px)',
      border: '1px solid rgba(99,102,241,0.25)', borderRadius: 8,
      padding: '8px 14px', fontSize: 12, color: '#e0e0f8',
    }}>
      <div style={{ color: '#9896bb', marginBottom: 4 }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, fontWeight: 600 }}>{p.name}: {p.value}</div>
      ))}
    </div>
  )
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.getAnalytics()
      .then((res) => {
        const d = res.data?.analytics ?? res.data ?? {}
        setData(d)
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: '#6366f1' }}>
          <RiLoader4Line />
        </motion.div>
      </div>
    )
  }

  const chartData = (data.chatsByDay ?? []).length > 0
    ? data.chatsByDay
    : [
        { date: 'Mon', count: 0 },
        { date: 'Tue', count: 0 },
        { date: 'Wed', count: 0 },
        { date: 'Thu', count: 0 },
        { date: 'Fri', count: 0 },
        { date: 'Sat', count: 0 },
        { date: 'Sun', count: 0 },
      ]

  const topQs = data.topQuestions ?? []
  const confidence = data.avgConfidence ?? 0

  const statCards = [
    { icon: <RiChatAiLine />,    value: data.totalChats ?? 0,    label: 'Total Chats',    change: 12, color: '#6366f1' },
    { icon: <RiQuestionLine />,  value: data.totalMessages ?? 0, label: 'Total Messages', change: 18, color: '#818cf8' },
    { icon: <RiFileTextLine />,  value: data.totalDocuments ?? 0,label: 'Documents',      change: 5,  color: '#34d399' },
    { icon: <RiArrowUpLine />,   value: Math.round(confidence * 100), label: 'Avg Confidence', change: 8, color: '#fbbf24', suffix: '%' },
  ]

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f0f0ff', marginBottom: 4 }}>Analytics</h1>
        <p style={{ fontSize: 14, color: '#6d6b98' }}>Insight into your AI workspace performance</p>
      </motion.div>

      {/* AI insight banner */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} style={{ marginBottom: 24 }}>
        <GlassCard hover={false} style={{
          padding: '16px 24px',
          background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(13,13,26,0.72) 70%)',
          borderColor: 'rgba(99,102,241,0.25)',
          display: 'flex', alignItems: 'center', gap: 14,
        }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10, flexShrink: 0,
            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20, boxShadow: '0 0 16px rgba(99,102,241,0.4)',
          }}>
            <RiSparklingLine style={{ color: '#fff' }} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#f0f0ff', marginBottom: 2 }}>AI Workspace Insight</div>
            <div style={{ fontSize: 13, color: '#9896bb' }}>
              {data.totalChats
                ? `You've had ${data.totalChats} conversation${data.totalChats !== 1 ? 's' : ''} powered by your ${data.totalDocuments ?? 0} document${(data.totalDocuments ?? 0) !== 1 ? 's' : ''}.`
                : 'Upload documents and start chatting — your analytics will appear here as you use ChatMe.'}
            </div>
          </div>
        </GlassCard>
      </motion.div>

      {/* Stat cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 28 }}>
        {statCards.map((card, i) => (
          <PremiumStatCard
            key={i}
            icon={card.icon}
            value={card.value}
            label={card.label}
            change={card.change}
            accentColor={card.color}
            suffix={(card as any).suffix}
            delay={i * 0.07}
          />
        ))}
      </div>

      {/* Charts row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20, marginBottom: 20 }}>

        {/* Activity chart */}
        <motion.div initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}>
          <GlassCard hover={false} style={{ padding: '20px 24px' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiBarChartBoxLine style={{ color: '#6366f1' }} /> Chat Activity
            </div>
            <div style={{ fontSize: 12, color: '#6d6b98', marginBottom: 20 }}>Conversations over the past week</div>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={chartData} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
                <defs>
                  <linearGradient id="chatGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#6366f1" stopOpacity={0.35} />
                    <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.08)" />
                <XAxis dataKey="date" tick={{ fill: '#6d6b98', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6d6b98', fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone" dataKey="count" name="Chats"
                  stroke="#6366f1" strokeWidth={2}
                  fill="url(#chatGrad)"
                  dot={{ fill: '#6366f1', strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </GlassCard>
        </motion.div>

        {/* Top questions */}
        <motion.div initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.35 }}>
          <GlassCard hover={false} style={{ padding: '20px 24px', height: '100%' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: '#f0f0ff', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 8 }}>
              <RiQuestionLine style={{ color: '#818cf8' }} /> Top Questions
            </div>
            <div style={{ fontSize: 12, color: '#6d6b98', marginBottom: 20 }}>Most asked by your users</div>
            {topQs.length === 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 40, gap: 8 }}>
                <div style={{ fontSize: 32, opacity: 0.2 }}>💬</div>
                <div style={{ fontSize: 13, color: '#4d4b72' }}>No questions yet</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {topQs.slice(0, 5).map((q, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: '#6366f1', width: 18, flexShrink: 0 }}>#{i + 1}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, color: '#e0e0f8', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {q.question}
                      </div>
                    </div>
                    <span style={{
                      fontSize: 11, fontWeight: 600, flexShrink: 0,
                      background: 'rgba(99,102,241,0.15)', color: '#818cf8',
                      padding: '1px 8px', borderRadius: 99,
                    }}>
                      {q.count}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </GlassCard>
        </motion.div>
      </div>
    </div>
  )
}
