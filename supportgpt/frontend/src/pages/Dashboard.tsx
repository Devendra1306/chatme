import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { dashboardApi } from '../services/api'
import StatCard from '../components/StatCard'
import {
  RiFileTextLine,
  RiChatAiLine,
  RiTeamLine,
  RiQuestionLine,
  RiUploadCloud2Line,
  RiArrowRightLine,
  RiTimeLine,
} from 'react-icons/ri'
import { formatDistanceToNow } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'

interface DashboardData {
  stats?: {
    totalDocuments?: number
    totalChats?: number
    totalUsers?: number
    totalQuestions?: number
    documentChange?: number
    chatChange?: number
    userChange?: number
    questionChange?: number
  }
  recentDocuments?: Array<{ id: string; filename?: string; original_filename?: string; createdAt?: string; status?: string }>
  recentChats?: Array<{ id: string; title?: string; createdAt?: string; message_count?: number }>
}

export default function Dashboard() {
  const { isAdmin } = useAuth()
  const [data, setData] = useState<DashboardData>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    dashboardApi.getDashboard()
      .then((res) => {
        const dbData = res.data?.dashboard ?? {}
        setData({
          stats: {
            totalDocuments: dbData.totalDocuments ?? 0,
            totalChats: dbData.totalChats ?? 0,
            totalUsers: dbData.totalUsers ?? 0,
            totalQuestions: dbData.totalQuestions ?? 0,
            documentChange: 0,
            chatChange: 0,
            userChange: 0,
            questionChange: 0,
          },
          recentDocuments: (dbData.recentDocuments ?? []).map((d: any) => ({
            ...d,
            id: d.id ?? d._id,
            filename: d.originalName ?? d.name ?? 'Document',
          })),
          recentChats: (dbData.recentChats ?? []).map((c: any) => ({
            ...c,
            id: c.id ?? c._id,
          })),
        })
      })
      .catch(() => setData({}))
      .finally(() => setLoading(false))
  }, [])

  const stats = data.stats ?? {}

  const statCards = [
    {
      icon: <RiFileTextLine className="text-blue-600 text-2xl" />,
      value: stats.totalDocuments ?? 0,
      label: 'Total Documents',
      change: stats.documentChange,
      iconBg: 'bg-blue-50',
    },
    {
      icon: <RiChatAiLine className="text-emerald-600 text-2xl" />,
      value: stats.totalChats ?? 0,
      label: 'Total Chats',
      change: stats.chatChange,
      iconBg: 'bg-emerald-50',
    },
    ...(isAdmin
      ? [{
          icon: <RiTeamLine className="text-violet-600 text-2xl" />,
          value: stats.totalUsers ?? 0,
          label: 'Total Users',
          change: stats.userChange,
          iconBg: 'bg-violet-50',
        }]
      : []),
    {
      icon: <RiQuestionLine className="text-amber-600 text-2xl" />,
      value: stats.totalQuestions ?? 0,
      label: 'Total Questions',
      change: stats.questionChange,
      iconBg: 'bg-amber-50',
    },
  ]

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
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of your ChatMe workspace</p>
      </div>

      {/* Stat Cards */}
      <div className={`grid gap-4 mb-8 ${isAdmin ? 'grid-cols-4' : 'grid-cols-3'}`}>
        {statCards.map((card, i) => (
          <StatCard key={i} {...card} />
        ))}
      </div>

      {/* Bottom 3 columns */}
      <div className="grid grid-cols-3 gap-6">
        {/* Recent Documents */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <RiFileTextLine className="text-blue-500" />
              Recent Documents
            </h2>
            <Link to="/documents" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              View all <RiArrowRightLine />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(data.recentDocuments ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                <RiFileTextLine className="text-3xl mx-auto mb-2 text-slate-300" />
                No documents yet
              </div>
            ) : (
              (data.recentDocuments ?? []).slice(0, 5).map((doc) => (
                <div key={doc.id} className="px-5 py-3 flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <RiFileTextLine className="text-red-500 text-sm" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-700 truncate">
                        {doc.filename ?? doc.original_filename ?? 'Document'}
                      </p>
                      <p className="text-xs text-slate-400">
                        {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : ''}
                      </p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium flex-shrink-0 ${
                    doc.status === 'ready' ? 'bg-emerald-50 text-emerald-600' :
                    doc.status === 'processing' ? 'bg-amber-50 text-amber-600' :
                    'bg-red-50 text-red-600'
                  }`}>
                    {doc.status ?? 'ready'}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Chats */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900 flex items-center gap-2">
              <RiChatAiLine className="text-emerald-500" />
              Recent Chats
            </h2>
            <Link to="/chat/new" className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-0.5">
              New chat <RiArrowRightLine />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {(data.recentChats ?? []).length === 0 ? (
              <div className="px-5 py-8 text-center text-slate-400 text-sm">
                <RiChatAiLine className="text-3xl mx-auto mb-2 text-slate-300" />
                No chats yet
              </div>
            ) : (
              (data.recentChats ?? []).slice(0, 5).map((chat) => (
                <Link
                  key={chat.id}
                  to={`/chat/${chat.id}`}
                  className="px-5 py-3 flex items-start gap-3 hover:bg-slate-50 transition-colors block"
                >
                  <div className="w-7 h-7 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5">
                    <RiChatAiLine className="text-emerald-500 text-sm" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-700 truncate">
                      {chat.title ?? 'New Chat'}
                    </p>
                    <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                      <RiTimeLine />
                      {chat.createdAt ? formatDistanceToNow(new Date(chat.createdAt), { addSuffix: true }) : ''}
                    </p>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100">
            <h2 className="font-semibold text-slate-900">Quick Actions</h2>
          </div>
          <div className="p-4 space-y-3">
            <Link
              to="/chat/new"
              className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50 hover:bg-emerald-100 transition-colors group"
            >
              <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center">
                <RiChatAiLine className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Start New Chat</p>
                <p className="text-xs text-slate-500">Ask questions about your docs</p>
              </div>
              <RiArrowRightLine className="ml-auto text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/upload"
              className="flex items-center gap-3 p-3 rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors group"
            >
              <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center">
                <RiUploadCloud2Line className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Upload Document</p>
                <p className="text-xs text-slate-500">Add PDFs to your knowledge base</p>
              </div>
              <RiArrowRightLine className="ml-auto text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/documents"
              className="flex items-center gap-3 p-3 rounded-lg bg-violet-50 hover:bg-violet-100 transition-colors group"
            >
              <div className="w-9 h-9 bg-violet-500 rounded-lg flex items-center justify-center">
                <RiFileTextLine className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">View Documents</p>
                <p className="text-xs text-slate-500">Manage your document library</p>
              </div>
              <RiArrowRightLine className="ml-auto text-violet-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>

            <Link
              to="/analytics"
              className="flex items-center gap-3 p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors group"
            >
              <div className="w-9 h-9 bg-amber-500 rounded-lg flex items-center justify-center">
                <RiQuestionLine className="text-white text-lg" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Analytics</p>
                <p className="text-xs text-slate-500">View usage insights & trends</p>
              </div>
              <RiArrowRightLine className="ml-auto text-amber-500 opacity-0 group-hover:opacity-100 transition-opacity" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
