import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { documentsApi } from '../services/api'
import GlassCard from '../components/GlassCard'
import toast from 'react-hot-toast'
import { formatDistanceToNow } from 'date-fns'
import {
  RiFileTextLine,
  RiDeleteBin6Line,
  RiSearchLine,
  RiLoader4Line,
  RiCheckboxCircleLine,
  RiTimeLine,
  RiChatAiLine,
  RiArrowRightLine,
  RiUploadCloud2Line,
} from 'react-icons/ri'
import { Link, useNavigate } from 'react-router-dom'

interface Document {
  id: string
  filename?: string
  originalName?: string
  name?: string
  createdAt?: string
  status?: string
  size?: number
  chunkCount?: number
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const cardVariant = {
  hidden: { opacity: 0, y: 20, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 180, damping: 22 } },
}

function formatBytes(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Documents() {
  const navigate = useNavigate()
  const [docs, setDocs] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [hovered, setHovered] = useState<string | null>(null)

  const fetchDocs = () => {
    documentsApi.getAll()
      .then((res: any) => {
        const list = res.data?.documents ?? res.data ?? []
        setDocs(
          (Array.isArray(list) ? list : []).map((d: any) => ({
            ...d,
            id: d.id ?? d._id,
            filename: d.originalName ?? d.original_filename ?? d.filename ?? d.name ?? 'Document',
          }))
        )
      })
      .catch(() => setDocs([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => { fetchDocs() }, [])

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await documentsApi.deleteDoc(id)
      setDocs(prev => prev.filter(d => d.id !== id))
      toast.success('Document deleted')
    } catch {
      toast.error('Failed to delete document')
    }
  }

  const filtered = docs.filter(d =>
    (d.filename ?? '').toLowerCase().includes(search.toLowerCase())
  )

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }} style={{ fontSize: 32, color: '#6366f1' }}>
          <RiLoader4Line />
        </motion.div>
      </div>
    )
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 1280, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 28 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          <div>
            <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f0f0ff', marginBottom: 4 }}>Knowledge Base</h1>
            <p style={{ fontSize: 14, color: '#6d6b98' }}>
              {docs.length} document{docs.length !== 1 ? 's' : ''} in your personal library
            </p>
          </div>
          <Link to="/upload" style={{ textDecoration: 'none' }}>
            <motion.button
              whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
              whileTap={{ scale: 0.97 }}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                border: 'none', borderRadius: 10, color: '#fff',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                boxShadow: '0 0 16px rgba(99,102,241,0.25)',
              }}
            >
              <RiUploadCloud2Line style={{ fontSize: 16 }} /> Upload Document
            </motion.button>
          </Link>
        </div>
      </motion.div>

      {/* Search */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        style={{ position: 'relative', marginBottom: 28, maxWidth: 400 }}
      >
        <RiSearchLine style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#4d4b72', fontSize: 16 }} />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search documents..."
          style={{
            width: '100%', padding: '11px 16px 11px 40px',
            background: 'rgba(13,13,26,0.72)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(99,102,241,0.15)',
            borderRadius: 10, color: '#f0f0ff',
            fontSize: 14, outline: 'none', fontFamily: 'inherit',
          }}
        />
      </motion.div>

      {/* Empty state */}
      {filtered.length === 0 && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 16 }}
        >
          <div style={{ fontSize: 64, opacity: 0.2 }}>📄</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#4d4b72' }}>
            {search ? 'No documents found' : 'No documents yet'}
          </div>
          <div style={{ fontSize: 14, color: '#2e2c52' }}>
            {search ? 'Try a different search term' : 'Upload a PDF to start building your knowledge base'}
          </div>
          {!search && (
            <Link to="/upload">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  background: 'rgba(99,102,241,0.15)',
                  border: '1px solid rgba(99,102,241,0.30)',
                  borderRadius: 10, color: '#818cf8',
                  fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  marginTop: 8,
                }}
              >
                <RiUploadCloud2Line /> Upload your first document
              </motion.button>
            </Link>
          )}
        </motion.div>
      )}

      {/* Document grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}
      >
        {filtered.map((doc) => (
          <motion.div key={doc.id} variants={cardVariant}
            onMouseEnter={() => setHovered(doc.id)}
            onMouseLeave={() => setHovered(null)}
          >
            <GlassCard
              glow={hovered === doc.id}
              style={{ padding: 0, overflow: 'hidden', cursor: 'default', position: 'relative' }}
            >
              {/* Status bar top */}
              <div style={{
                height: 3,
                background: doc.status === 'ready'
                  ? 'linear-gradient(90deg, #34d399, #059669)'
                  : 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              }} />

              <div style={{ padding: '20px 20px 16px' }}>
                {/* Icon + actions row */}
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: 'rgba(248,113,113,0.15)',
                    border: '1px solid rgba(248,113,113,0.25)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 22, color: '#f87171',
                  }}>
                    <RiFileTextLine />
                  </div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <motion.button
                      whileHover={{ background: 'rgba(248,113,113,0.2)' }}
                      whileTap={{ scale: 0.9 }}
                      onClick={e => handleDelete(doc.id, e)}
                      style={{
                        background: 'rgba(248,113,113,0.10)',
                        border: '1px solid rgba(248,113,113,0.20)',
                        borderRadius: 7, padding: '6px 8px',
                        color: '#f87171', fontSize: 14, cursor: 'pointer',
                      }}
                    >
                      <RiDeleteBin6Line />
                    </motion.button>
                  </div>
                </div>

                {/* Filename */}
                <div style={{
                  fontSize: 14, fontWeight: 700, color: '#e0e0f8',
                  marginBottom: 6,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                  lineHeight: 1.4,
                }}>
                  {doc.filename}
                </div>

                {/* Meta row */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: '#6d6b98', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <RiTimeLine />
                    {doc.createdAt ? formatDistanceToNow(new Date(doc.createdAt), { addSuffix: true }) : ''}
                  </span>
                  {doc.size && (
                    <span style={{ fontSize: 11, color: '#6d6b98' }}>{formatBytes(doc.size)}</span>
                  )}
                  <span style={{
                    fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                    background: doc.status === 'ready' ? 'rgba(52,211,153,0.15)' : 'rgba(251,191,36,0.15)',
                    color: doc.status === 'ready' ? '#34d399' : '#fbbf24',
                    letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 3,
                  }}>
                    <RiCheckboxCircleLine />
                    {(doc.status ?? 'ready').toUpperCase()}
                  </span>
                </div>

                {/* Ask button (slides in on hover) */}
                <AnimatePresence>
                  {hovered === doc.id && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.18 }}
                    >
                      <button
                        onClick={() => navigate('/chat/new')}
                        style={{
                          width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                          padding: '8px', borderRadius: 8,
                          background: 'linear-gradient(135deg, rgba(99,102,241,0.25), rgba(129,140,248,0.25))',
                          border: '1px solid rgba(99,102,241,0.35)',
                          color: '#818cf8', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                        }}
                      >
                        <RiChatAiLine /> Ask questions about this doc
                        <RiArrowRightLine />
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </GlassCard>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
