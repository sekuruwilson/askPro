import NisrLogo from '../ui/NisrLogo'

export default function TypingIndicator() {
  return (
    <div className="flex gap-3 mb-4 animate-fade-in">
      <div className="flex-shrink-0 mt-1">
        <NisrLogo size={32} dark />
      </div>
      <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm
                      px-4 py-3 flex items-center gap-1.5 shadow-sm">
        <span className="typing-dot" />
        <span className="typing-dot" />
        <span className="typing-dot" />
      </div>
    </div>
  )
}
