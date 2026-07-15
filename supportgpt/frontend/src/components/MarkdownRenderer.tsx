import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

interface MarkdownRendererProps {
  content: string
}

export default function MarkdownRenderer({ content }: MarkdownRendererProps) {
  return (
    <div className="prose prose-sm max-w-none text-slate-800">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Code blocks
          code({ className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            const isInline = !match && !(props as { node?: { type: string } }).node

            if (match) {
              return (
                <SyntaxHighlighter
                  style={oneDark}
                  language={match[1]}
                  PreTag="div"
                  className="!rounded-lg !text-sm !my-3"
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              )
            }

            return (
              <code
                className={`${isInline ? 'bg-slate-100 text-emerald-700 px-1.5 py-0.5 rounded text-sm font-mono' : ''} ${className || ''}`}
                {...props}
              >
                {children}
              </code>
            )
          },

          // Tables
          table({ children }) {
            return (
              <div className="overflow-x-auto my-3 rounded-lg border border-slate-200">
                <table className="w-full text-sm">{children}</table>
              </div>
            )
          },
          thead({ children }) {
            return <thead className="bg-slate-50">{children}</thead>
          },
          th({ children }) {
            return <th className="px-4 py-2.5 text-left font-semibold text-slate-700 border-b border-slate-200">{children}</th>
          },
          td({ children }) {
            return <td className="px-4 py-2 text-slate-600 border-b border-slate-100">{children}</td>
          },

          // Blockquote
          blockquote({ children }) {
            return (
              <blockquote className="border-l-4 border-emerald-400 pl-4 py-1 my-3 bg-emerald-50 rounded-r-lg text-slate-600 italic">
                {children}
              </blockquote>
            )
          },

          // Lists
          ul({ children }) {
            return <ul className="list-disc list-inside space-y-1 my-2 text-slate-700">{children}</ul>
          },
          ol({ children }) {
            return <ol className="list-decimal list-inside space-y-1 my-2 text-slate-700">{children}</ol>
          },
          li({ children }) {
            return <li className="text-slate-700">{children}</li>
          },

          // Headings
          h1({ children }) {
            return <h1 className="text-xl font-bold text-slate-900 mt-4 mb-2">{children}</h1>
          },
          h2({ children }) {
            return <h2 className="text-lg font-bold text-slate-900 mt-3 mb-2">{children}</h2>
          },
          h3({ children }) {
            return <h3 className="text-base font-semibold text-slate-900 mt-3 mb-1">{children}</h3>
          },

          // Paragraph
          p({ children }) {
            return <p className="text-slate-800 leading-relaxed mb-2">{children}</p>
          },

          // Links
          a({ href, children }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-600 hover:text-emerald-700 underline"
              >
                {children}
              </a>
            )
          },

          // Horizontal rule
          hr() {
            return <hr className="border-slate-200 my-4" />
          },

          // Strong / Bold
          strong({ children }) {
            return <strong className="font-semibold text-slate-900">{children}</strong>
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
