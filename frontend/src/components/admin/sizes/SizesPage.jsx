import { useCallback, useEffect, useState } from "react"
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

  const loadSizes = useCallback(() => {
    setLoading(true)
    setError("")
    return api.get("sizes", { params: { search: filters.search, type: filters.type } })
      .then(res => setSizes(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Không thể tải danh sách kích cỡ.")
      })
      .finally(() => setLoading(false))
  }, [filters.search, filters.type])

  useEffect(() => {
    loadSizes()
  }, [loadSizes])

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

  const handleSave = async (data) => {
    setLoading(true)
    setError("")

    const formData = new FormData()
    const appendIfPresent = (key, value) => {
      if (value === undefined || value === null) return
      formData.append(key, value)
    }
    appendIfPresent("name", data.name)
    appendIfPresent("type", data.type)
    try {
      if (editingSize) {
        await api.patch(`update_size/${editingSize.id}/`, formData)
      } else {
        await api.post("create_size/", formData)
      }
      setIsModalOpen(false)
      setEditingSize(null)
      await loadSizes()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể lưu kích cỡ."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingSize) {
      setDeletingSize(null)
      return
    }
    setLoading(true)
    setError("")
    try {
      await api.delete(`delete_size/${deletingSize.id}/`)
      setDeletingSize(null)
      await loadSizes()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể xóa kích cỡ."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
      setDeletingSize(null)
    }
  }

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Kích cỡ</h2>
        <button className="btn btn-primary" onClick={handleCreate}>Thêm kích cỡ</button>
      </div>

      <SizeFilters filters={filters} onChange={setFilters} sizeTypes={sizeTypes} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Đang tải kích cỡ...</div>}
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
