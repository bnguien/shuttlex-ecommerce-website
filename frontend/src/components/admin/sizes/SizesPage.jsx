import { useEffect, useState } from "react"
import SizesTable from "./SizesTable"
import SizeFilters from "./SizeFilters"
import SizeModal from "./SizeModal"
import SizeDeleteDialog from "./SizeDeleteDialog"
import api from "../../../api"

const sizeTypes = [
  { value: "racket", label: "Racket" },
  { value: "clothes", label: "Clothes" },
  { value: "shoes", label: "Shoes" }
]

function SizesPage() {
  const [sizes, setSizes] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    type: ""
  })
  const [editingSize, setEditingSize] = useState(null)
  const [deletingSize, setDeletingSize] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    api.get("sizes")
      .then(res => setSizes(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Failed to load sizes.")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = () => {
    setEditingSize(null)
    setIsModalOpen(true)
  }

  const handleEdit = (size) => {
    setEditingSize(size)
    setIsModalOpen(true)
  }

  const handleDelete = (size) => {
    setDeletingSize(size)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClose = () => {
    setDeletingSize(null)
  }

  const handleSave = () => {
    setIsModalOpen(false)
  }

  const handleConfirmDelete = () => {
    setDeletingSize(null)
  }

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Sizes</h2>
        <button className="btn btn-primary" onClick={handleCreate}>New Size</button>
      </div>

      <SizeFilters filters={filters} onChange={setFilters} sizeTypes={sizeTypes} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Loading sizes...</div>}
          {error && <div className="text-danger mb-3">{error}</div>}
          <SizesTable
            sizes={sizes}
            onEdit={handleEdit}
            onDelete={handleDelete}
            sizeTypes={sizeTypes}
          />
        </div>
      </div>

      <SizeModal
        open={isModalOpen}
        size={editingSize}
        onClose={handleModalClose}
        onSave={handleSave}
        sizeTypes={sizeTypes}
      />

      <SizeDeleteDialog
        open={Boolean(deletingSize)}
        size={deletingSize}
        onCancel={handleDeleteClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default SizesPage
