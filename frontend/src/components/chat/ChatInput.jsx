import { useState, useRef, useEffect } from 'react'
import { Send, Square } from 'lucide-react'
import clsx from 'clsx'

export default function ChatInput({ onSend, disabled }) {
  const [value, setValue] = useState('')
  const textareaRef = useRef(null)

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px'
  }, [value])

  const handleSubmit = () => {
    const q = value.trim()
    if (!q || disabled) return
    setValue('')
    onSend(q)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  return (
    <div className="flex items-end gap-2 bg-white border border-slate-200 rounded-xl
                    px-3 py-2 shadow-sm focus-within:border-navy-400 transition-colors">
      <textarea
        ref={textareaRef}
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder="Ask a question about Rwanda's statistics..."
        rows={1}
        className="flex-1 resize-none outline-none text-sm text-slate-800
                   placeholder:text-slate-400 bg-transparent leading-relaxed
                   min-h-[24px] max-h-[160px] py-1"
      />

      <button
        onClick={handleSubmit}
        disabled={!value.trim() || disabled}
        className={clsx(
          'flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
          value.trim() && !disabled
            ? 'bg-navy-700 text-white hover:bg-navy-600'
            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
        )}
      >
        {disabled ? <Square size={14} /> : <Send size={14} />}
      </button>
    </div>
  )
}
