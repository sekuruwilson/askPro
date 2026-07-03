import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
  timeout: 60000, // 60s — LLM calls can be slow
})

// ─── Documents ────────────────────────────────────────────────────────────────

export const getDocuments = () =>
  api.get('/documents').then(r => r.data)

export const uploadDocument = (file, onProgress) => {
  const form = new FormData()
  form.append('file', file)
  return api.post('/documents', form, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: e => {
      if (onProgress) onProgress(Math.round((e.loaded * 100) / e.total))
    },
  }).then(r => r.data)
}

export const deleteDocument = (id) =>
  api.delete(`/documents/${id}`).then(r => r.data)

// ─── Conversations ─────────────────────────────────────────────────────────────

export const getConversations = () =>
  api.get('/conversations').then(r => r.data)

export const createConversation = (title) =>
  api.post('/conversations', { title }).then(r => r.data)

export const deleteConversation = (id) =>
  api.delete(`/conversations/${id}`).then(r => r.data)

// ─── Messages ─────────────────────────────────────────────────────────────────

export const getMessages = (conversationId) =>
  api.get(`/messages/${conversationId}`).then(r => r.data)

export const saveMessage = (data) =>
  api.post('/messages', data).then(r => r.data)

// ─── Query (RAG) ──────────────────────────────────────────────────────────────

export const queryRAG = (question, conversationId) =>
  api.post('/query', { question, conversationId }).then(r => r.data)

// ─── Stats (admin dashboard) ──────────────────────────────────────────────────

export const getStats = () =>
  api.get('/stats').then(r => r.data)

export default api
