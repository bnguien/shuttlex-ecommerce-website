import { useEffect, useState } from "react"
import BrandsTable from "./BrandsTable"
import BrandFilters from "./BrandFilters"
import BrandModal from "./BrandModal"
import BrandDeleteDialog from "./BrandDeleteDialog"
import api from "../../../api"

function BrandsPage() {
  const [brands, setBrands] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    status: ""
  })
  const [editingBrand, setEditingBrand] = useState(null)
  const [deletingBrand, setDeletingBrand] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    setLoading(true)
    setError("")
    api.get("brands")
      .then(res => setBrands(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Failed to load brands.")
      })
      .finally(() => setLoading(false))
  }, [])

  const handleCreate = () => {
    setEditingBrand(null)
    setIsModalOpen(true)
  }

  const handleEdit = (brand) => {
    setEditingBrand(brand)
    setIsModalOpen(true)
  }

  const handleDelete = (brand) => {
    setDeletingBrand(brand)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClose = () => {
    setDeletingBrand(null)
  }

  const handleSave = () => {
    setIsModalOpen(false)
  }

  const handleConfirmDelete = () => {
    setDeletingBrand(null)
  }

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Brands</h2>
        <button className="btn btn-primary" onClick={handleCreate}>New Brand</button>
      </div>

      <BrandFilters filters={filters} onChange={setFilters} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Loading brands...</div>}
          {error && <div className="text-danger mb-3">{error}</div>}
          <BrandsTable
            brands={brands}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <BrandModal
        open={isModalOpen}
        brand={editingBrand}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      <BrandDeleteDialog
        open={Boolean(deletingBrand)}
        brand={deletingBrand}
        onCancel={handleDeleteClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default BrandsPage
