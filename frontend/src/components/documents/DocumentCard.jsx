import { Button } from '@/components/ui/button'
import { Trash2, FileText } from 'lucide-react'

export default function DocumentCard({ document, onDelete }) {
  return (
    <div className="flex items-center justify-between p-4 border rounded-lg bg-card">
      <div className="flex items-center gap-3">
        <FileText className="w-5 h-5 text-muted-foreground" />
        <div>
          <p className="font-medium">{document.originalName}</p>
          <p className="text-sm text-muted-foreground">
            {new Date(document.uploadedAt).toLocaleDateString()} • {(document.size / 1024).toFixed(1)} KB
          </p>
        </div>
      </div>
      <Button variant="ghost" size="sm" onClick={() => onDelete(document._id)}>
        <Trash2 className="w-4 h-4" />
      </Button>
    </div>
  )
}