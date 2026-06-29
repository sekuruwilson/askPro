import ReactMarkdown from 'react-markdown'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import NisrLogo from '../ui/NisrLogo'

export default function ChatMessage({ message }) {
  const [showSources, setShowSources] = useState(false)
  const isUser = message.role === 'user'
  const sources = message.sources
    ? (typeof message.sources === 'string'
        ? JSON.parse(message.sources)
        : message.sources)
    : null

  if (isUser) {
    return (
      <div className="flex justify-end mb-4 animate-fade-in">
        <div className="max-w-[75%] bg-navy-800 text-white rounded-2xl rounded-tr-sm
                        px-4 py-3 text-sm leading-relaxed">
          {message.content}
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 mb-4 animate-slide-up">
      {/* Avatar */}
      <div className="flex-shrink-0 mt-1">
        <NisrLogo size={32} dark />
      </div>

      <div className="flex-1 min-w-0">
        {/* Answer */}
        <div
          className={clsx(
            'text-sm text-slate-800 leading-relaxed prose-chat',
            message.isError && 'text-red-600'
          )}
        >
          <ReactMarkdown>{message.content}</ReactMarkdown>
        </div>

        {/* Sources */}
        {sources && sources.length > 0 && (
          <div className="mt-3">
            <button
              onClick={() => setShowSources(v => !v)}
              className="flex items-center gap-1.5 text-xs text-slate-500
                         hover:text-navy-700 transition-colors font-medium"
            >
              <FileText size={12} />
              {sources.length} source{sources.length > 1 ? 's' : ''}
              {showSources ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            </button>

            {showSources && (
              <div className="mt-2 space-y-2 animate-fade-in">
                {sources.map((src, i) => (
                  <div
                    key={i}
                    className="border border-slate-200 rounded-lg px-3 py-2 bg-slate-50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-medium text-navy-700 truncate">
                        {src.document}
                      </span>
                      <span className="text-xs text-emerald-600 font-medium ml-2 flex-shrink-0">
                        {src.similarity}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                      {src.excerpt}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
