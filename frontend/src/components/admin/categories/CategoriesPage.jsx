import { useCallback, useEffect, useState } from "react"
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

  const loadCategories = useCallback(() => {
    setLoading(true)
    setError("")
    return api.get("categories", { params: { search: filters.search, status: filters.status } })
      .then(res => setCategories(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Failed to load categories.")
      })
      .finally(() => setLoading(false))
  }, [filters.search, filters.status])

  useEffect(() => {
    loadCategories()
  }, [loadCategories])

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

  const handleSave = async (data) => {
    setLoading(true)
    setError("")

    const formData = new FormData()
    const appendIfPresent = (key, value) => {
      if (value === undefined || value === null) return
      if (typeof value === "string" && value.trim() === "") return
      formData.append(key, value)
    }

    appendIfPresent("name", data.name)
    appendIfPresent("slug", data.slug)
    formData.append("is_active", data.is_active ? "true" : "false")

    if (data.image instanceof File) {
      formData.append("image", data.image)
    }

    try {
      if (editingCategory) {
        await api.patch(`update_category/${editingCategory.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      } else {
        await api.post("create_category/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      }
      setIsModalOpen(false)
      setEditingCategory(null)
      await loadCategories()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Failed to save category."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory?.id) {
      setDeletingCategory(null)
      return
    }

    setLoading(true)
    setError("")
    try {
      await api.delete(`delete_category/${deletingCategory.id}/`)
      setDeletingCategory(null)
      await loadCategories()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Failed to delete category."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
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
