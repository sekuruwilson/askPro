import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import PublicLayout from './components/layout/PublicLayout'
import AdminLayout from './components/layout/AdminLayout'
import Chat from './pages/Chat'
import AdminDashboard from './pages/AdminDashboard'
import Upload from './pages/Upload'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public user-facing chat */}
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Chat />} />
          <Route path="/chat/:conversationId" element={<Chat />} />
        </Route>

        {/* Admin panel */}
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="upload" element={<Upload />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
