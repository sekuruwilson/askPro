import { useState, useMemo } from 'react'
import { Outlet, useNavigate, useParams, Link } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { MessageSquare, SquarePen, PanelLeft, Trash2, Search, LayoutDashboard } from 'lucide-react'
import { getConversations, createConversation, deleteConversation } from '../../api'
import clsx from 'clsx'

export default function PublicLayout() {
  const navigate = useNavigate()
  const { conversationId } = useParams()
  const queryClient = useQueryClient()
  const [collapsed, setCollapsed] = useState(true)
  const [search, setSearch] = useState('')

  const { data: conversations = [] } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    refetchInterval: 5000,
  })

  const createMutation = useMutation({
    mutationFn: () => createConversation('New Conversation'),
    onSuccess: (conv) => {
      queryClient.invalidateQueries(['conversations'])
      navigate(`/chat/${conv.id}`)
    },
  })

  const deleteMutation = useMutation({
    mutationFn: deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries(['conversations'])
      navigate('/')
    },
  })

  const filtered = useMemo(() =>
    conversations.filter(c =>
      c.title?.toLowerCase().includes(search.toLowerCase())
    ), [conversations, search])

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* ── Sidebar ── */}
      <aside
        className={clsx(
          'flex flex-col bg-navy-900 transition-all duration-200 flex-shrink-0',
          collapsed ? 'w-[52px]' : 'w-[260px]'
        )}
      >
        {/* Top icon row — always visible */}
        <div className={clsx(
          'flex items-center py-3 px-2 gap-1',
          collapsed ? 'flex-col' : 'flex-row justify-between'
        )}>
          {/* Toggle sidebar */}
          <button
            onClick={() => setCollapsed(v => !v)}
            className="w-9 h-9 flex items-center justify-center rounded-lg
                       text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
            title="Toggle sidebar"
          >
            <PanelLeft size={18} />
          </button>

          {/* New conversation — only show when expanded, or as icon when collapsed */}
          <button
            onClick={() => createMutation.mutate()}
            className="w-9 h-9 flex items-center justify-center rounded-lg
                       text-slate-400 hover:text-white hover:bg-navy-700 transition-colors"
            title="New conversation"
          >
            <SquarePen size={18} />
          </button>
        </div>

        {/* Expanded content */}
        {!collapsed && (
          <>
            {/* "Chat History" header */}
            <div className="px-4 pt-1 pb-2">
              <h2 className="text-white font-semibold text-sm tracking-wide">
                Chat History
              </h2>
            </div>

            {/* Search box */}
            <div className="px-3 pb-2">
              <div className="relative">
                <Search
                  size={13}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500"
                />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search chats..."
                  className="w-full bg-navy-800 text-slate-300 placeholder:text-slate-500
                             text-xs rounded-lg pl-7 pr-3 py-1.5 outline-none
                             border border-transparent focus:border-navy-600 transition-colors"
                />
              </div>
            </div>

            {/* Conversation list */}
            <div className="flex-1 overflow-y-auto px-2 pb-2">
              {filtered.length === 0 ? (
                <p className="text-xs text-slate-600 text-center mt-4 px-2">
                  {search ? 'No matching chats' : 'No conversations yet'}
                </p>
              ) : (
                <div className="space-y-0.5">
                  {filtered.map(conv => (
                    <div
                      key={conv.id}
                      className={clsx(
                        'group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer',
                        'transition-colors',
                        conv.id === conversationId
                          ? 'bg-navy-700 text-white'
                          : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                      )}
                      onClick={() => navigate(`/chat/${conv.id}`)}
                    >
                      <MessageSquare size={13} className="flex-shrink-0 opacity-70" />
                      <span className="flex-1 truncate text-xs leading-relaxed">
                        {conv.title}
                      </span>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteMutation.mutate(conv.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 text-slate-500
                                   hover:text-red-400 transition-opacity p-0.5 flex-shrink-0"
                        title="Delete"
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>


          </>
        )}


      </aside>

      {/* ── Main content ── */}
      <main className="flex-1 overflow-hidden flex flex-col">
        {/* Top bar — matches screenshot: title + subtitle */}
        <Outlet />
      </main>
    </div>
  )
}