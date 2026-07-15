import { useEffect, useState } from 'react'
import { analyticsApi } from '../services/api'
import StatCard from '../components/StatCard'
import {
  LineChart, Line, BarChart, Bar, AreaChart, Area, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import {
  RiQuestionLine,
  RiFileTextLine,
  RiUserLine,
  RiTimeLine,
} from 'react-icons/ri'

interface AnalyticsData {
  summary?: {
    totalQuestions?: number
    totalDocuments?: number
    totalUsers?: number
    avgResponseTime?: number
    questionChange?: number
    documentChange?: number
    userChange?: number
  }
  dailyQuestions?: Array<{ date: string; count: number; questions?: number }>
  dailyUploads?: Array<{ date: string; count: number; uploads?: number }>
  userGrowth?: Array<{ date: string; count: number; users?: number }>
  documentStatus?: Array<{ status: string; count: number }>
}

const PIE_COLORS = ['#10b981', '#f59e0b', '#ef4444', '#3b82f6', '#8b5cf6']

const customTooltipStyle = {
  backgroundColor: '#1e293b',
  border: 'none',
  borderRadius: '8px',
  color: '#f8fafc',
  fontSize: '12px',
  padding: '8px 12px',
}

export default function Analytics() {
  const [data, setData] = useState<AnalyticsData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    analyticsApi.getAnalytics()
      .then((res) => setData(res.data))
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  const summary = data.summary ?? {}

  const dailyQuestions = (data.dailyQuestions ?? []).map((d) => ({
    date: d.date,
    Questions: d.count ?? d.questions ?? 0,
  }))

  const dailyUploads = (data.dailyUploads ?? []).map((d) => ({
    date: d.date,
    Uploads: d.count ?? d.uploads ?? 0,
  }))

  const userGrowth = (data.userGrowth ?? []).map((d) => ({
    date: d.date,
    Users: d.count ?? d.users ?? 0,
  }))

  const docStatus = (data.documentStatus ?? []).map((d) => ({
    name: d.status,
    value: d.count,
  }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <div key={i} className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
        <p className="text-slate-500 text-sm mt-1">Usage insights and trends for your ChatMe workspace</p>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <StatCard
          icon={<RiQuestionLine className="text-emerald-600 text-2xl" />}
          value={summary.totalQuestions ?? 0}
          label="Total Questions"
          change={summary.questionChange}
          iconBg="bg-emerald-50"
        />
        <StatCard
          icon={<RiFileTextLine className="text-blue-600 text-2xl" />}
          value={summary.totalDocuments ?? 0}
          label="Total Documents"
          change={summary.documentChange}
          iconBg="bg-blue-50"
        />
        <StatCard
          icon={<RiUserLine className="text-violet-600 text-2xl" />}
          value={summary.totalUsers ?? 0}
          label="Total Users"
          change={summary.userChange}
          iconBg="bg-violet-50"
        />
        <StatCard
          icon={<RiTimeLine className="text-amber-600 text-2xl" />}
          value={summary.avgResponseTime ? `${summary.avgResponseTime.toFixed(1)}s` : '—'}
          label="Avg Response Time"
          iconBg="bg-amber-50"
        />
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-2 gap-6">
        {/* Daily Questions LineChart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm">Daily Questions (Last 30 Days)</h3>
          {dailyQuestions.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={dailyQuestions}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Line type="monotone" dataKey="Questions" stroke="#10b981" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Daily Uploads BarChart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm">Daily Uploads (Last 30 Days)</h3>
          {dailyUploads.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={dailyUploads}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <Bar dataKey="Uploads" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* User Growth AreaChart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm">User Growth</h3>
          {userGrowth.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={userGrowth}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={customTooltipStyle} />
                <defs>
                  <linearGradient id="userGrowthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="Users" stroke="#8b5cf6" strokeWidth={2} fill="url(#userGrowthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Document Status PieChart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-6">
          <h3 className="font-semibold text-slate-800 mb-4 text-sm">Document Status Breakdown</h3>
          {docStatus.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-slate-400 text-sm">No data available</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={docStatus}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {docStatus.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={customTooltipStyle} />
                <Legend
                  formatter={(value) => <span className="text-xs text-slate-600 capitalize">{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
