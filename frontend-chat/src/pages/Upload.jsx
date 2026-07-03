import { useState, useRef, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { Upload as UploadIcon, FileText, CheckCircle, XCircle, Loader2, X } from 'lucide-react'
import { uploadDocument } from '../api'
import clsx from 'clsx'

const STATUS = {
  pending:    { icon: FileText,    color: 'text-slate-400',  label: 'Waiting' },
  uploading:  { icon: Loader2,     color: 'text-blue-500',   label: 'Uploading...' },
  processing: { icon: Loader2,     color: 'text-amber-500',  label: 'Processing...' },
  done:       { icon: CheckCircle, color: 'text-emerald-500',label: 'Indexed' },
  error:      { icon: XCircle,     color: 'text-red-500',    label: 'Failed' },
}

export default function Upload() {
  const [files, setFiles] = useState([])
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef(null)
  const queryClient = useQueryClient()

  const addFiles = useCallback((newFiles) => {
    const pdfs = Array.from(newFiles).filter(f => f.type === 'application/pdf')
    const entries = pdfs.map(f => ({
      id: `${f.name}-${Date.now()}`,
      file: f,
      status: 'pending',
      progress: 0,
      error: null,
    }))
    setFiles(prev => [...prev, ...entries])
    // Auto-start upload
    entries.forEach(entry => processFile(entry))
  }, [])

  const processFile = async (entry) => {
    setFiles(prev => prev.map(f =>
      f.id === entry.id ? { ...f, status: 'uploading' } : f
    ))

    try {
      await uploadDocument(entry.file, (progress) => {
        setFiles(prev => prev.map(f =>
          f.id === entry.id ? { ...f, progress } : f
        ))
      })

      setFiles(prev => prev.map(f =>
        f.id === entry.id ? { ...f, status: 'done', progress: 100 } : f
      ))
      queryClient.invalidateQueries(['documents'])
    } catch (err) {
      setFiles(prev => prev.map(f =>
        f.id === entry.id
          ? { ...f, status: 'error', error: err.response?.data?.error || err.message }
          : f
      ))
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setIsDragOver(false)
    addFiles(e.dataTransfer.files)
  }

  const removeFile = (id) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Upload & Index</h1>
        <p className="text-slate-500 text-sm mt-1">
          Upload PDF reports to index them for intelligent querying
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e => { e.preventDefault(); setIsDragOver(true) }}
        onDragLeave={() => setIsDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={clsx(
          'border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer',
          'transition-all duration-200',
          isDragOver
            ? 'border-navy-400 bg-navy-50'
            : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          multiple
          className="hidden"
          onChange={e => addFiles(e.target.files)}
        />

        <div className={clsx(
          'w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4',
          isDragOver ? 'bg-navy-100' : 'bg-slate-100'
        )}>
          <UploadIcon
            size={24}
            className={isDragOver ? 'text-navy-600' : 'text-slate-400'}
          />
        </div>

        <p className={clsx(
          'text-sm font-medium mb-1',
          isDragOver ? 'text-navy-700' : 'text-slate-600'
        )}>
          {isDragOver ? 'Drop to upload' : 'Click to upload PDF reports'}
        </p>
        <p className="text-xs text-slate-400">
          Supports DHS, Census, EICV, and other NISR statistical reports
        </p>
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="mt-6 space-y-3">
          <h2 className="text-sm font-semibold text-slate-700">
            {files.length} file{files.length > 1 ? 's' : ''}
          </h2>
          {files.map(entry => {
            const s = STATUS[entry.status]
            const Icon = s.icon
            return (
              <div key={entry.id} className="card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 bg-slate-50 rounded-lg flex items-center
                                  justify-center flex-shrink-0">
                    <FileText size={18} className="text-slate-400" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-medium text-slate-800 truncate">
                        {entry.file.name}
                      </p>
                      <button
                        onClick={() => removeFile(entry.id)}
                        className="text-slate-300 hover:text-slate-500 flex-shrink-0"
                      >
                        <X size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 mt-1">
                      <Icon
                        size={12}
                        className={clsx(
                          s.color,
                          (entry.status === 'uploading' || entry.status === 'processing') &&
                            'animate-spin'
                        )}
                      />
                      <span className={clsx('text-xs font-medium', s.color)}>
                        {s.label}
                      </span>
                      <span className="text-xs text-slate-400">
                        {(entry.file.size / 1024 / 1024).toFixed(1)} MB
                      </span>
                    </div>

                    {/* Progress bar */}
                    {entry.status === 'uploading' && (
                      <div className="mt-2 h-1 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-navy-500 rounded-full transition-all duration-300"
                          style={{ width: `${entry.progress}%` }}
                        />
                      </div>
                    )}

                    {/* Error */}
                    {entry.error && (
                      <p className="text-xs text-red-500 mt-1">{entry.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Tips */}
      <div className="mt-8 p-4 bg-slate-50 rounded-xl border border-slate-200">
        <h3 className="text-xs font-semibold text-slate-700 mb-2">Upload tips</h3>
        <ul className="space-y-1">
          {[
            'PDFs must have selectable text (not scanned images)',
            'Large reports (100+ pages) may take 1–2 minutes to process',
            'You can upload multiple files at once',
            'Processing generates semantic embeddings for each chunk',
          ].map((tip, i) => (
            <li key={i} className="text-xs text-slate-500 flex items-start gap-2">
              <span className="text-slate-300 mt-0.5">•</span>
              {tip}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
