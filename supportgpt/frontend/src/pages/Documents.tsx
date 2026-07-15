import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { documentsApi } from '../services/api'
import toast from 'react-hot-toast'
import {
  RiFileTextLine,
  RiDeleteBin6Line,
  RiUploadCloud2Line,
  RiSearchLine,
  RiRefreshLine,
} from 'react-icons/ri'
import { formatDistanceToNow } from 'date-fns'

interface DocItem {
  id: string
  filename?: string
  original_filename?: string
  file_size?: number
  size?: number
  pages?: number
  page_count?: number
  status?: 'processing' | 'ready' | 'error' | string
  createdAt?: string
  created_at?: string
}

function formatSize(bytes?: number) {
  if (!bytes) return 'Unknown'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documents() {
  const [docs, setDocs] = useState<DocItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleting, setDeleting] = useState<string | null>(null)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await documentsApi.getAll()
      const items = res.data?.documents ?? res.data ?? []
      const normalized = Array.isArray(items)
        ? items.map((doc: any) => ({
            ...doc,
            id: doc.id ?? doc._id,
            filename: doc.originalName ?? doc.name ?? 'Document',
            size: doc.size ?? doc.file_size,
            pages: doc.pages ?? doc.page_count,
            createdAt: doc.createdAt ?? doc.created_at,
          }))
        : []
      setDocs(normalized)
    } catch {
      toast.error('Failed to load documents')
      setDocs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchDocs() }, [])

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"? This cannot be undone.`)) return
    setDeleting(id)
    try {
      await documentsApi.deleteDoc(id)
      setDocs((prev) => prev.filter((d) => d.id !== id))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    } finally {
      setDeleting(null)
    }
  }

  const filtered = docs.filter((d) => {
    const name = d.filename ?? d.original_filename ?? ''
    return !search || name.toLowerCase().includes(search.toLowerCase())
  })

  const statusBadge = (status?: string) => {
    switch (status) {
      case 'ready':
        return <span className="px-2.5 py-1 bg-emerald-50 text-emerald-700 text-xs font-medium rounded-full">Ready</span>
      case 'processing':
        return <span className="px-2.5 py-1 bg-amber-50 text-amber-700 text-xs font-medium rounded-full">Processing</span>
      case 'error':
        return <span className="px-2.5 py-1 bg-red-50 text-red-700 text-xs font-medium rounded-full">Error</span>
      default:
        return <span className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs font-medium rounded-full">{status ?? 'Unknown'}</span>
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Documents</h1>
          <p className="text-slate-500 text-sm mt-1">{docs.length} document{docs.length !== 1 ? 's' : ''} in your knowledge base</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={fetchDocs}
            className="flex items-center gap-2 px-3 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <RiRefreshLine className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <Link
            to="/upload"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <RiUploadCloud2Line />
            Upload PDF
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6 max-w-sm">
        <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents..."
          className="w-full pl-9 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent"
        />
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-3 h-3 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 150}ms` }} />
            ))}
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mb-4">
            <RiFileTextLine className="text-slate-400 text-3xl" />
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">
            {search ? 'No documents found' : 'No documents yet'}
          </h3>
          <p className="text-slate-500 text-sm mb-5">
            {search ? 'Try a different search term' : 'Upload your first PDF to get started'}
          </p>
          {!search && (
            <Link
              to="/upload"
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <RiUploadCloud2Line />
              Upload Document
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((doc) => {
            const name = doc.filename ?? doc.original_filename ?? 'Document'
            const size = doc.file_size ?? doc.size
            const pages = doc.pages ?? doc.page_count
            const date = doc.createdAt ?? doc.created_at

            return (
              <div
                key={doc.id}
                className="bg-white rounded-xl border border-slate-100 shadow-sm p-5 hover:shadow-md transition-shadow group"
              >
                <div className="flex items-start gap-3 mb-4">
                  {/* PDF icon */}
                  <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center flex-shrink-0">
                    <RiFileTextLine className="text-red-500 text-xl" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate" title={name}>{name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {statusBadge(doc.status)}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 mb-4 text-xs text-slate-500">
                  <div>
                    <span className="text-slate-400">Size</span>
                    <p className="font-medium text-slate-700">{formatSize(size)}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Pages</span>
                    <p className="font-medium text-slate-700">{pages ?? '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-400">Uploaded</span>
                    <p className="font-medium text-slate-700">
                      {date ? formatDistanceToNow(new Date(date), { addSuffix: true }) : '—'}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => handleDelete(doc.id, name)}
                  disabled={deleting === doc.id}
                  className="flex items-center gap-1.5 text-xs text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-all disabled:opacity-50"
                >
                  <RiDeleteBin6Line />
                  {deleting === doc.id ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
