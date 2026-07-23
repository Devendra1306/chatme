import { useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { documentsApi } from '../services/api'
import GlassCard from '../components/GlassCard'
import toast from 'react-hot-toast'
import {
  RiUploadCloud2Line,
  RiCheckLine,
  RiCloseLine,
  RiFileTextLine,
  RiLoader4Line,
  RiSparklingLine,
} from 'react-icons/ri'
import { Link } from 'react-router-dom'

type UploadState = 'idle' | 'dragging' | 'uploading' | 'success' | 'error'

export default function Upload() {
  const [file, setFile] = useState<File | null>(null)
  const [uploadState, setUploadState] = useState<UploadState>('idle')
  const [progress, setProgress] = useState(0)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFile = (f: File) => {
    if (!f.type.includes('pdf') && !f.name.endsWith('.pdf')) {
      toast.error('Only PDF files are supported')
      return
    }
    if (f.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20 MB')
      return
    }
    setFile(f)
    setUploadState('idle')
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('idle')
    const dropped = e.dataTransfer.files[0]
    if (dropped) handleFile(dropped)
  }, [])

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setUploadState('dragging')
  }
  const handleDragLeave = () => setUploadState('idle')

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const handleUpload = async () => {
    if (!file) return
    setUploadState('uploading')
    setProgress(0)

    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress(p => {
        if (p >= 85) { clearInterval(progressInterval); return p }
        return p + Math.random() * 12
      })
    }, 250)

    try {
      const formData = new FormData()
      formData.append('file', file)
      await documentsApi.upload(formData)
      clearInterval(progressInterval)
      setProgress(100)
      setUploadState('success')
      toast.success(`${file.name} uploaded successfully!`)
    } catch (err: any) {
      clearInterval(progressInterval)
      setUploadState('error')
      const msg = err?.response?.data?.error ?? 'Upload failed. Please try again.'
      setErrorMsg(msg)
      toast.error(msg)
    }
  }

  const reset = () => {
    setFile(null)
    setUploadState('idle')
    setProgress(0)
    setErrorMsg('')
  }

  return (
    <div style={{ padding: '32px 36px', maxWidth: 800, margin: '0 auto' }}>

      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 36 }}>
        <h1 style={{ fontSize: 30, fontWeight: 800, color: '#f0f0ff', marginBottom: 4 }}>Upload Document</h1>
        <p style={{ fontSize: 14, color: '#6d6b98' }}>Add PDFs to your knowledge base. The AI will embed and index them instantly.</p>
      </motion.div>

      {/* Upload card */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
        {uploadState === 'success' ? (
          /* Success state */
          <GlassCard glow hover={false} style={{
            padding: '60px 40px', textAlign: 'center',
            background: 'linear-gradient(135deg, rgba(52,211,153,0.08) 0%, rgba(13,13,26,0.72) 70%)',
            borderColor: 'rgba(52,211,153,0.3)',
          }}>
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200, damping: 18 }}
              style={{
                width: 72, height: 72, borderRadius: '50%', margin: '0 auto 20px',
                background: 'rgba(52,211,153,0.2)',
                border: '2px solid rgba(52,211,153,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 32, color: '#34d399',
                boxShadow: '0 0 32px rgba(52,211,153,0.3)',
              }}
            >
              <RiCheckLine />
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
              style={{ fontSize: 22, fontWeight: 800, color: '#34d399', marginBottom: 8 }}
            >
              Upload Complete!
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
              style={{ fontSize: 14, color: '#6d6b98', marginBottom: 28 }}
            >
              <strong style={{ color: '#e0e0f8' }}>{file?.name}</strong> has been embedded and is ready for AI queries.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              style={{ display: 'flex', gap: 12, justifyContent: 'center' }}
            >
              <Link to="/chat/new" style={{ textDecoration: 'none' }}>
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 24px rgba(99,102,241,0.4)' }}
                  whileTap={{ scale: 0.97 }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    border: 'none', borderRadius: 10, color: '#fff',
                    fontSize: 13, fontWeight: 600, cursor: 'pointer',
                  }}
                >
                  <RiSparklingLine /> Ask AI about it
                </motion.button>
              </Link>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }}
                onClick={reset}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                  background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
                  borderRadius: 10, color: '#818cf8', fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}
              >
                Upload Another
              </motion.button>
            </motion.div>
          </GlassCard>
        ) : (
          <GlassCard hover={false} glow={uploadState === 'dragging'} style={{
            padding: 0, overflow: 'hidden',
            borderColor: uploadState === 'dragging' ? 'rgba(99,102,241,0.45)' : undefined,
            background: uploadState === 'dragging' ? 'rgba(99,102,241,0.08)' : undefined,
          }}>
            {/* Drop zone */}
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              style={{ padding: '52px 40px', textAlign: 'center' }}
            >
              {/* Animated cloud icon */}
              <motion.div
                animate={
                  uploadState === 'dragging'
                    ? { scale: 1.15, y: -8 }
                    : uploadState === 'uploading'
                    ? { rotate: 360 }
                    : { y: [0, -10, 0] }
                }
                transition={
                  uploadState === 'uploading'
                    ? { duration: 1, repeat: Infinity, ease: 'linear' }
                    : uploadState === 'dragging'
                    ? { duration: 0.2 }
                    : { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                }
                style={{
                  width: 80, height: 80, borderRadius: 20, margin: '0 auto 24px',
                  background: uploadState === 'dragging'
                    ? 'linear-gradient(135deg, #6366f1, #818cf8)'
                    : 'rgba(99,102,241,0.15)',
                  border: `2px solid rgba(99,102,241,${uploadState === 'dragging' ? '0.6' : '0.25'})`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 36, color: uploadState === 'dragging' ? '#fff' : '#6366f1',
                  boxShadow: `0 0 ${uploadState === 'dragging' ? '40' : '20'}px rgba(99,102,241,${uploadState === 'dragging' ? '0.45' : '0.2'})`,
                }}
              >
                {uploadState === 'uploading' ? <RiLoader4Line /> : <RiUploadCloud2Line />}
              </motion.div>

              <AnimatePresence mode="wait">
                {file && uploadState !== 'uploading' ? (
                  <motion.div key="file-preview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 10,
                      background: 'rgba(99,102,241,0.12)',
                      border: '1px solid rgba(99,102,241,0.25)',
                      borderRadius: 10, padding: '10px 16px',
                      marginBottom: 16,
                    }}>
                      <RiFileTextLine style={{ color: '#818cf8', fontSize: 20 }} />
                      <div style={{ textAlign: 'left' }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e0f8' }}>{file.name}</div>
                        <div style={{ fontSize: 11, color: '#6d6b98' }}>
                          {(file.size / 1024 / 1024).toFixed(2)} MB · PDF
                        </div>
                      </div>
                      <button onClick={() => { setFile(null); setUploadState('idle') }} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 16 }}>
                        <RiCloseLine />
                      </button>
                    </div>
                  </motion.div>
                ) : uploadState === 'uploading' ? (
                  <motion.div key="uploading" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>
                      Embedding document…
                    </div>
                    <div style={{ fontSize: 13, color: '#6d6b98', marginBottom: 20 }}>
                      Extracting text, generating vectors, indexing knowledge
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div style={{ fontSize: 18, fontWeight: 700, color: '#f0f0ff', marginBottom: 6 }}>
                      {uploadState === 'dragging' ? 'Drop it here!' : 'Drop your PDF here'}
                    </div>
                    <div style={{ fontSize: 14, color: '#6d6b98', marginBottom: 20 }}>
                      or{' '}
                      <label style={{ color: '#818cf8', fontWeight: 600, cursor: 'pointer', borderBottom: '1px solid rgba(129,140,248,0.4)' }}>
                        browse to upload
                        <input type="file" accept=".pdf" onChange={handleInputChange} style={{ display: 'none' }} />
                      </label>
                    </div>
                    <div style={{ fontSize: 12, color: '#4d4b72' }}>PDF only · Max 20 MB</div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Progress bar */}
              {uploadState === 'uploading' && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ marginBottom: 4 }}>
                  <div style={{
                    height: 6, borderRadius: 99,
                    background: 'rgba(99,102,241,0.15)',
                    overflow: 'hidden', margin: '0 auto 8px', maxWidth: 360,
                  }}>
                    <motion.div
                      style={{
                        height: '100%', borderRadius: 99,
                        background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                        boxShadow: '0 0 12px rgba(99,102,241,0.5)',
                        width: `${progress}%`,
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: '#6d6b98' }}>{Math.round(progress)}%</div>
                </motion.div>
              )}
            </div>

            {/* Action row */}
            {file && (uploadState === 'idle' || uploadState === 'error') && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  padding: '16px 40px 28px',
                  display: 'flex', justifyContent: 'center',
                }}
              >
                <motion.button
                  whileHover={{ scale: 1.04, boxShadow: '0 0 28px rgba(99,102,241,0.45)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={handleUpload}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 36px',
                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                    border: 'none', borderRadius: 12,
                    color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer',
                    boxShadow: '0 0 20px rgba(99,102,241,0.30)',
                  }}
                >
                  <RiUploadCloud2Line style={{ fontSize: 18 }} /> Upload to Knowledge Base
                </motion.button>
              </motion.div>
            )}

            {/* Error */}
            {uploadState === 'error' && (
              <div style={{ padding: '0 40px 24px', textAlign: 'center' }}>
                <div style={{ fontSize: 13, color: '#f87171', background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.2)', padding: '10px 16px', borderRadius: 8 }}>
                  {errorMsg}
                </div>
                <button onClick={reset} style={{ marginTop: 10, background: 'none', border: 'none', color: '#818cf8', fontSize: 13, cursor: 'pointer', fontWeight: 600 }}>
                  Try again
                </button>
              </div>
            )}
          </GlassCard>
        )}
      </motion.div>

      {/* Info cards */}
      <motion.div
        initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14, marginTop: 24 }}
      >
        {[
          { icon: '🔍', title: 'Smart Extraction', desc: 'Text extracted across all pages with positional metadata' },
          { icon: '🧠', title: 'Vector Embedding', desc: 'Content embedded into semantic vectors for AI understanding' },
          { icon: '⚡', title: 'Instant Search', desc: 'Query your knowledge base in milliseconds with confidence scores' },
        ].map((item, i) => (
          <GlassCard key={i} size="sm" hover={false} style={{ padding: '16px 18px' }}>
            <div style={{ fontSize: 22, marginBottom: 8 }}>{item.icon}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#e0e0f8', marginBottom: 4 }}>{item.title}</div>
            <div style={{ fontSize: 12, color: '#6d6b98', lineHeight: 1.5 }}>{item.desc}</div>
          </GlassCard>
        ))}
      </motion.div>
    </div>
  )
}
