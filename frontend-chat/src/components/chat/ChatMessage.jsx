import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { FileText, ChevronDown, ChevronUp } from 'lucide-react'
import { useState } from 'react'
import clsx from 'clsx'
import NisrLogo from '../ui/NisrLogo'

/* Custom renderers for markdown elements */
const markdownComponents = {
  table: ({ children }) => (
    <div className="chat-table-wrapper">
      <table>{children}</table>
    </div>
  ),
}

export default function ChatMessage({ message }) {
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

  // Helper to format sources grouped by document with sorted page numbers
  const renderSourcesText = () => {
    if (!sources || sources.length === 0) return null

    // Group by document name
    const grouped = {}
    sources.forEach(src => {
      const doc = src.document
      if (!grouped[doc]) {
        grouped[doc] = new Set()
      }
      if (src.page_number) {
        grouped[doc].add(Number(src.page_number))
      }
    })

    const docStrings = Object.entries(grouped).map(([doc, pagesSet]) => {
      const pages = Array.from(pagesSet).sort((a, b) => a - b)
      if (pages.length === 0) {
        return doc
      } else if (pages.length === 1) {
        return `${doc}, Page ${pages[0]}`
      } else {
        return `${doc}, Pages: ${pages.join(', ')}`
      }
    })

    if (docStrings.length === 0) return null

    return (
      <div className="mt-3 pt-2 border-t border-slate-100 text-xs text-slate-500 italic">
        {docStrings.length === 1 ? (
          <span>Source: {docStrings[0]}</span>
        ) : (
          <span>Sources: {docStrings.join('; ')}</span>
        )}
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
          <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>{message.content}</ReactMarkdown>
        </div>

        {/* Sources Display */}
        {renderSourcesText()}
      </div>
    </div>
  )
}
