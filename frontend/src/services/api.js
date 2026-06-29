export const API_BASE = 'http://localhost:3001/api'

export const api = {
  getDocuments: () => fetch(`${API_BASE}/documents`).then(r => r.json()),
  uploadDocument: (file) => {
    const formData = new FormData()
    formData.append('file', file)
    return fetch(`${API_BASE}/documents/upload`, { method: 'POST', body: formData }).then(r => r.json())
  },
  deleteDocument: (id) => fetch(`${API_BASE}/documents/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getConversations: () => fetch(`${API_BASE}/conversations`).then(r => r.json()),
  createConversation: (title) => fetch(`${API_BASE}/conversations`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ title }) }).then(r => r.json()),
  getConversation: (id) => fetch(`${API_BASE}/conversations/${id}`).then(r => r.json()),
  deleteConversation: (id) => fetch(`${API_BASE}/conversations/${id}`, { method: 'DELETE' }).then(r => r.json()),
  getMessages: (conversationId) => fetch(`${API_BASE}/messages/conversation/${conversationId}`).then(r => r.json()),
  addMessage: (conversationId, role, content) => fetch(`${API_BASE}/messages/conversation/${conversationId}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ role, content }) }).then(r => r.json()),
  query: (query, conversationId) => fetch(`${API_BASE}/query`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ query, conversationId }) }).then(r => r.json())
}