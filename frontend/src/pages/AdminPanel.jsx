import { useEffect, useState } from 'react'
import { api } from '@/services/api'
import { Button } from '@/components/ui/button'
import DocumentCard from '@/components/documents/DocumentCard'

export default function AdminPanel() {
  const [documents, setDocuments] = useState([])

  useEffect(() => { loadDocuments() }, [])

  const loadDocuments = async () => {
    const data = await api.getDocuments()
    setDocuments(data)
  }

  const handleDelete = async (id) => {
    await api.deleteDocument(id)
    loadDocuments()
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h2 className="text-2xl font-semibold mb-6">Document Management</h2>
      <div className="space-y-4">
        {documents.map(doc => (
          <DocumentCard key={doc._id} document={doc} onDelete={handleDelete} />
        ))}
        {documents.length === 0 && <p className="text-muted-foreground">No documents uploaded.</p>}
      </div>
    </div>
  )
}