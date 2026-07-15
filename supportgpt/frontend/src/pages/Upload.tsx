import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { documentsApi } from '../services/api'
import toast from 'react-hot-toast'
import {
  RiUploadCloud2Line,
  RiFileTextLine,
  RiCloseLine,
  RiCheckLine,
  RiAlertLine,
} from 'react-icons/ri'

interface FileItem {
  file: File
  id: string
  progress: number
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function Upload() {
  const navigate = useNavigate()
  const [files, setFiles] = useState<FileItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = useCallback((newFiles: File[]) => {
    const pdfs = newFiles.filter((f) => f.type === 'application/pdf')
    if (pdfs.length < newFiles.length) {
      toast.error('Only PDF files are supported')
    }
    const items: FileItem[] = pdfs.map((f) => ({
      file: f,
      id: `${f.name}-${Date.now()}-${Math.random()}`,
      progress: 0,
      status: 'pending',
    }))
    setFiles((prev) => [...prev, ...items])
  }, [])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const dropped = Array.from(e.dataTransfer.files)
    addFiles(dropped)
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files))
    e.target.value = ''
  }

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const simulateProgress = (id: string, onComplete: () => void) => {
    let progress = 0
    const interval = setInterval(() => {
      progress += Math.random() * 25 + 10
      if (progress >= 90) {
        clearInterval(interval)
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress: 90 } : f))
        onComplete()
      } else {
        setFiles((prev) => prev.map((f) => f.id === id ? { ...f, progress: Math.min(progress, 90) } : f))
      }
    }, 300)
  }

  const handleUpload = async () => {
    const pending = files.filter((f) => f.status === 'pending')
    if (pending.length === 0) {
      toast.error('No files to upload')
      return
    }

    setUploading(true)
    let allSuccess = true

    for (const item of pending) {
      setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'uploading', progress: 0 } : f))

      try {
        await new Promise<void>((resolve, reject) => {
          simulateProgress(item.id, async () => {
            try {
              const formData = new FormData()
              formData.append('file', item.file)
              await documentsApi.upload(formData)
              setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'done', progress: 100 } : f))
              resolve()
            } catch (err: unknown) {
              const errMsg =
                (err as { response?: { data?: { error?: string; message?: string } } })?.response?.data?.error ||
                (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                'Upload failed'
              setFiles((prev) => prev.map((f) => f.id === item.id ? { ...f, status: 'error', progress: 0, error: errMsg } : f))
              allSuccess = false
              reject(err)
            }
          })
        })
      } catch {
        allSuccess = false
      }
    }

    setUploading(false)

    if (allSuccess) {
      toast.success('All files uploaded successfully!')
      setTimeout(() => navigate('/documents'), 1000)
    } else {
      toast.error('Some files failed to upload')
    }
  }

  const pendingCount = files.filter((f) => f.status === 'pending').length

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload Documents</h1>
        <p className="text-slate-500 text-sm mt-1">Upload PDF files to expand your knowledge base</p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-emerald-400 bg-emerald-50'
            : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50 bg-white'
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <div className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center mb-4 transition-colors ${
          dragging ? 'bg-emerald-500' : 'bg-slate-100'
        }`}>
          <RiUploadCloud2Line className={`text-3xl transition-colors ${dragging ? 'text-white' : 'text-slate-400'}`} />
        </div>
        <p className="text-lg font-semibold text-slate-700 mb-1">
          {dragging ? 'Drop your PDFs here' : 'Drag & drop PDFs here'}
        </p>
        <p className="text-slate-500 text-sm">or <span className="text-emerald-600 font-medium">click to browse</span></p>
        <p className="text-slate-400 text-xs mt-2">PDF files only · Max 50MB per file</p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          {files.map((item) => (
            <div key={item.id} className="bg-white rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-9 h-9 bg-red-50 rounded-lg flex items-center justify-center flex-shrink-0">
                  <RiFileTextLine className="text-red-500 text-lg" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.file.name}</p>
                  <p className="text-xs text-slate-400">{formatSize(item.file.size)}</p>
                </div>

                {/* Status icons */}
                <div className="flex-shrink-0">
                  {item.status === 'done' && (
                    <div className="w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center">
                      <RiCheckLine className="text-white text-sm" />
                    </div>
                  )}
                  {item.status === 'error' && (
                    <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center">
                      <RiAlertLine className="text-white text-sm" />
                    </div>
                  )}
                  {item.status === 'pending' && (
                    <button
                      onClick={() => removeFile(item.id)}
                      className="w-7 h-7 hover:bg-slate-100 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 transition-colors"
                    >
                      <RiCloseLine />
                    </button>
                  )}
                </div>
              </div>

              {/* Progress bar */}
              {(item.status === 'uploading' || item.status === 'done') && (
                <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      item.status === 'done' ? 'bg-emerald-500' : 'bg-blue-500'
                    }`}
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {item.status === 'error' && item.error && (
                <p className="text-xs text-red-500 mt-1">{item.error}</p>
              )}

              {item.status === 'uploading' && (
                <p className="text-xs text-blue-500 mt-1">Uploading... {Math.round(item.progress)}%</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload button */}
      {files.length > 0 && (
        <div className="mt-5 flex items-center gap-3">
          <button
            onClick={handleUpload}
            disabled={uploading || pendingCount === 0}
            className="flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-200 disabled:text-slate-400 text-white font-semibold rounded-lg text-sm transition-colors"
          >
            {uploading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Uploading...
              </>
            ) : (
              <>
                <RiUploadCloud2Line />
                Upload {pendingCount} File{pendingCount !== 1 ? 's' : ''}
              </>
            )}
          </button>
          <button
            onClick={() => setFiles([])}
            disabled={uploading}
            className="px-4 py-2.5 text-slate-500 hover:text-slate-700 text-sm transition-colors"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  )
}
