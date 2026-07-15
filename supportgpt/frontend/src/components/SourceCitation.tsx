import { useState } from 'react'
import { RiArrowDownSLine, RiArrowUpSLine, RiFileTextLine } from 'react-icons/ri'

interface Source {
  document_name?: string
  filename?: string
  page?: number
  page_number?: number
  score?: number
  confidence?: number
  content?: string
}

interface SourceCitationProps {
  sources: Source[]
}

export default function SourceCitation({ sources }: SourceCitationProps) {
  const [open, setOpen] = useState(false)

  if (!sources || sources.length === 0) return null

  return (
    <div className="mt-2 border border-slate-200 rounded-lg overflow-hidden text-sm">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-between w-full px-3 py-2 bg-slate-50 hover:bg-slate-100 transition-colors text-slate-600 font-medium"
      >
        <div className="flex items-center gap-2">
          <RiFileTextLine className="text-emerald-500" />
          <span>{sources.length} source{sources.length > 1 ? 's' : ''} cited</span>
        </div>
        {open ? (
          <RiArrowUpSLine className="text-slate-400" />
        ) : (
          <RiArrowDownSLine className="text-slate-400" />
        )}
      </button>

      {open && (
        <div className="divide-y divide-slate-100">
          {sources.map((src, i) => {
            const name = src.document_name ?? src.filename ?? `Document ${i + 1}`
            const page = src.page ?? src.page_number
            const score = src.score ?? src.confidence ?? 0
            const pct = Math.round(score * 100)

            return (
              <div key={i} className="px-3 py-2.5 bg-white">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-2">
                    <span className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                      <RiFileTextLine className="text-xs" />
                      {name}
                    </span>
                    {page && (
                      <span className="text-xs text-slate-500">Page {page}</span>
                    )}
                  </div>
                  <span className="text-xs font-semibold text-emerald-600">{pct}%</span>
                </div>

                {/* Confidence bar */}
                <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>

                {src.content && (
                  <p className="text-xs text-slate-500 mt-2 line-clamp-2">{src.content}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
