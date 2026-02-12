import { useEffect, useState } from "react"
import CategoriesTable from "./CategoriesTable"
import CategoryFilters from "./CategoryFilters"
import CategoryModal from "./CategoryModal"
import CategoryDeleteDialog from "./CategoryDeleteDialog"
import api from "../../../api"

function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    status: ""
  })
  const [editingCategory, setEditingCategory] = useState(null)
  const [deletingCategory, setDeletingCategory] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    api.get("categories")
      .then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Failed to load categories.")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = () => {
    setEditingCategory(null)
    setIsModalOpen(true)
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setIsModalOpen(true)
  }

  const handleDelete = (category) => {
    setDeletingCategory(category)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClose = () => {
    setDeletingCategory(null)
  }

  const handleSave = () => {
    setIsModalOpen(false)
  }

  const handleConfirmDelete = () => {
    setDeletingCategory(null)
  }

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Categories</h2>
        <button className="btn btn-primary" onClick={handleCreate}>New Category</button>
      </div>

      <CategoryFilters filters={filters} onChange={setFilters} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Loading categories...</div>}
          {error && <div className="text-danger mb-3">{error}</div>}
          <CategoriesTable
            categories={categories}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <CategoryModal
        open={isModalOpen}
        category={editingCategory}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      <CategoryDeleteDialog
        open={Boolean(deletingCategory)}
        category={deletingCategory}
        onCancel={handleDeleteClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default CategoriesPage
