import { Sparkles } from 'lucide-react'

export default function SuggestedQuestions({ questions, onSelect }) {
  return (
    <div className="w-full max-w-2xl">
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400 mb-4">
        <Sparkles size={12} />
        <span>Suggested questions</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {questions.map((q, i) => (
          <button
            key={i}
            onClick={() => onSelect(q)}
            className="text-left px-4 py-3 rounded-xl border border-slate-200 bg-white
                       text-xs text-slate-700 hover:border-navy-300 hover:bg-navy-50
                       hover:text-navy-800 transition-all duration-150 shadow-sm
                       leading-relaxed"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
