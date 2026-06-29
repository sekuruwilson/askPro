import { Outlet, NavLink, Link } from 'react-router-dom'
import { LayoutDashboard, Upload, MessageSquare } from 'lucide-react'
import clsx from 'clsx'

const navItems = [
  { to: '/admin/dashboard', icon: LayoutDashboard, label: 'Dashboard & Library' },
  { to: '/admin/upload',    icon: Upload,          label: 'Upload & Index' },
]

export default function AdminLayout() {
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      {/* Admin sidebar */}
      <aside className="w-56 flex flex-col bg-navy-900 flex-shrink-0">
        {/* Header */}
        <div className="px-4 py-4 border-b border-navy-700">
          <div>
          <p className="text-white text-sm font-semibold leading-tight">Ask DHS Admin Panel</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-2 space-y-0.5">
          {navItems.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors',
                  isActive
                    ? 'bg-navy-700 text-white font-medium'
                    : 'text-slate-400 hover:bg-navy-800 hover:text-slate-200'
                )
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-navy-700 space-y-2">
          <Link
            to="/"
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs
                       text-slate-400 hover:bg-navy-800 hover:text-slate-200 transition-colors"
          >
            <MessageSquare size={14} />
            View Chat (User Page)
          </Link>
          <p className="text-xs text-slate-600 px-3 pb-1">
            National Institute of Statistics of Rwanda
          </p>
        </div>
      </aside>

      {/* Content */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  )
}
