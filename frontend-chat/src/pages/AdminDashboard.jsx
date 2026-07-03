import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  FileText, Database, MessageSquare, Globe, Search,
  Trash2, Download, Eye, CheckCircle, Clock, XCircle,
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts'
import { getDocuments, getStats, deleteDocument } from '../api'
import clsx from 'clsx'

const STATUS_ICON = {
  ready:      <CheckCircle size={14} className="text-emerald-500" />,
  processing: <Clock size={14} className="text-amber-500" />,
  failed:     <XCircle size={14} className="text-red-500" />,
}

const CATEGORY_COLORS = ['#1e4080', '#2d5a9e', '#4e77b5', '#7d9bcc', '#f97316']

export default function AdminDashboard() {
  const [tab, setTab] = useState('dashboard')
  const [search, setSearch] = useState('')
  const queryClient = useQueryClient()

  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: getDocuments,
    refetchInterval: 8000,
  })

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: getStats,
  })

  const deleteMutation = useMutation({
    mutationFn: deleteDocument,
    onSuccess: () => queryClient.invalidateQueries(['documents']),
  })

  const readyDocs = documents.filter(d => d.status === 'ready')
  const totalPages = documents.reduce((sum, d) => sum + (d.page_count || 0), 0)

  // Build category breakdown from documents
  const categoryMap = {}
  documents.forEach(d => {
    const cat = d.category || 'DHS'
    categoryMap[cat] = (categoryMap[cat] || 0) + 1
  })
  const pieData = Object.entries(categoryMap).map(([name, value]) => ({ name, value }))

  // Recent conversations for bar chart
  const activityData = stats?.recentActivity || []

  const filtered = documents.filter(d =>
    d.original_name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Admin Panel</h1>
        <p className="text-slate-500 text-sm mt-1">Overview of the NISR intelligence system</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-lg w-fit">
        {['dashboard', 'library'].map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={clsx(
              'px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize',
              tab === t
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            )}
          >
            {t === 'library' ? 'Document Library' : 'Dashboard'}
          </button>
        ))}
      </div>

      {/* ── Dashboard tab ── */}
      {tab === 'dashboard' && (
        <div className="space-y-6">
          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            <StatCard
              icon={<FileText size={20} className="text-navy-600" />}
              bg="bg-navy-50"
              value={documents.length}
              label="Documents Indexed"
            />
            <StatCard
              icon={<Database size={20} className="text-blue-600" />}
              bg="bg-blue-50"
              value={totalPages || readyDocs.length}
              label={totalPages ? 'Total Pages' : 'Indexed & Ready'}
            />
            <StatCard
              icon={<MessageSquare size={20} className="text-emerald-600" />}
              bg="bg-emerald-50"
              value={stats?.totalQuestions || 0}
              label="Questions Asked"
            />
            <StatCard
              icon={<Globe size={20} className="text-orange-500" />}
              bg="bg-orange-50"
              value={stats?.totalConversations || 0}
              label="Conversations"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-2 gap-6">
            {/* Pie chart */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Documents by Category
              </h3>
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="40%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={80}
                      dataKey="value"
                    >
                      {pieData.map((_, i) => (
                        <Cell key={i} fill={CATEGORY_COLORS[i % CATEGORY_COLORS.length]} />
                      ))}
                    </Pie>
                    <Legend
                      layout="vertical"
                      align="right"
                      verticalAlign="middle"
                      formatter={(value, entry) => (
                        <span className="text-xs text-slate-600">
                          {value} {entry.payload.value}
                        </span>
                      )}
                    />
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">
                  No documents yet
                </p>
              )}
            </div>

            {/* Recent conversations */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-700 mb-4">
                Query Activity
              </h3>
              {activityData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={activityData}>
                    <XAxis
                      dataKey="label"
                      tick={{ fontSize: 10 }}
                      tickFormatter={v => v.length > 14 ? v.slice(0, 14) + '…' : v}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#2d5a9e" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-slate-400 text-center py-10">
                  No activity yet
                </p>
              )}
            </div>
          </div>

          {/* Recent conversations list */}
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-slate-700 mb-4">
              Recent Conversations
            </h3>
            {(stats?.recentConversations || []).length === 0 ? (
              <p className="text-sm text-slate-400">No conversations yet</p>
            ) : (
              <div className="space-y-2">
                {(stats?.recentConversations || []).map(conv => (
                  <div
                    key={conv.id}
                    className="flex items-center justify-between py-2 border-b
                               border-slate-100 last:border-0"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <MessageSquare size={14} className="text-slate-400 flex-shrink-0" />
                      <span className="text-sm text-slate-700 truncate">{conv.title}</span>
                    </div>
                    <span className="text-xs text-slate-400 flex-shrink-0 ml-4">
                      {conv.message_count} msgs
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Library tab ── */}
      {tab === 'library' && (
        <div className="space-y-4">
          {/* Search + filter row */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search documents..."
                className="w-full pl-8 pr-3 py-2 border border-slate-200 rounded-lg text-sm
                           focus:outline-none focus:border-navy-400 bg-white"
              />
            </div>
            <select className="border border-slate-200 rounded-lg px-3 py-2 text-sm
                               focus:outline-none focus:border-navy-400 bg-white text-slate-600">
              <option>All Categories</option>
              <option>DHS</option>
              <option>Census</option>
              <option>EICV</option>
            </select>
          </div>

          {/* Document grid */}
          {filtered.length === 0 ? (
            <div className="card p-12 text-center">
              <FileText size={36} className="text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500 text-sm">
                {documents.length === 0
                  ? 'No documents uploaded yet. Go to Upload & Index to add reports.'
                  : 'No documents match your search.'}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              {filtered.map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onDelete={() => deleteMutation.mutate(doc.id)}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ icon, bg, value, label }) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className={clsx('w-10 h-10 rounded-lg flex items-center justify-center', bg)}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900">{value}</p>
        <p className="text-xs text-slate-500 mt-0.5">{label}</p>
      </div>
    </div>
  )
}

function DocumentCard({ doc, onDelete }) {
  const category = doc.category || 'DHS'
  const year = doc.year || (doc.created_at ? new Date(doc.created_at).getFullYear() : '')

  return (
    <div className="card p-4 hover:shadow-md transition-shadow">
      <div className="flex gap-3">
        <div className="w-9 h-9 bg-navy-50 rounded-lg flex items-center justify-center flex-shrink-0">
          <FileText size={18} className="text-navy-600" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold text-slate-800 leading-snug line-clamp-2">
              {doc.original_name.replace(/\.pdf$/i, '')}
            </h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {STATUS_ICON[doc.status] || STATUS_ICON.processing}
              <span className="text-xs text-emerald-600 font-medium capitalize">
                {doc.status === 'ready' ? 'Indexed' : doc.status}
              </span>
            </div>
          </div>

          {doc.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
              {doc.description}
            </p>
          )}

          <div className="flex items-center gap-3 mt-2">
            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs
                             bg-navy-100 text-navy-700 font-medium">
              {category}
            </span>
            {year && (
              <span className="text-xs text-slate-400 flex items-center gap-1">
                📅 {year}
              </span>
            )}
            {doc.page_count && (
              <span className="text-xs text-slate-400">
                # {doc.page_count} pages
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 mt-3 pt-3 border-t border-slate-100">
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                           border border-slate-200 text-xs text-slate-600
                           hover:bg-slate-50 transition-colors">
          <Eye size={12} />
          Read Report
        </button>
        <button className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg
                           border border-slate-200 text-xs text-slate-600
                           hover:bg-slate-50 transition-colors">
          <Download size={12} />
          Download
        </button>
        <button
          onClick={onDelete}
          className="px-3 py-1.5 rounded-lg border border-red-100 text-xs text-red-400
                     hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  )
}
