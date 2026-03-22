import { useCallback, useEffect, useState } from "react"
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

  const loadBrands = useCallback(() => {
    setLoading(true)
    setError("")
    return api.get("brands", { params: { search: filters.search, status: filters.status } })
      .then(res => setBrands(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Không thể tải danh sách thương hiệu.")
      })
      .finally(() => setLoading(false))
  }, [filters.search, filters.status])

  useEffect(() => {
    loadBrands()
  }, [loadBrands])

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

  const handleSave = async(data) => {
    setLoading(true)
    setError("")

    const formData = new FormData()
    const appendIfPresent = (key, value) => {
      if (value === undefined || value === null) return
      formData.append(key, value)
    }
    appendIfPresent("name", data.name)
    appendIfPresent("slug", data.slug)
    formData.append("is_active", data.is_active ? "true" : "false")

    if (data.logo instanceof File) {
      formData.append("logo", data.logo)
    }

    try{
     if(editingBrand){
         await api.patch(`update_brand/${editingBrand.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
     }else {
        await api.post("create_brand/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      }
      setIsModalOpen(false)
      setEditingBrand(null)
      await loadBrands()
    }catch(err){
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể lưu thương hiệu."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    }finally{
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if(!deletingBrand) {
      setDeletingBrand(null)
      return
    }
    setLoading(true)
    setError("")
    try{
      await api.delete(`delete_brand/${deletingBrand.id}/`)
      setDeletingBrand(null)
      await loadBrands()
    }catch(err){
       console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể xóa thương hiệu."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    }finally{
      setLoading(false)
      setDeletingBrand(null)
    }
  }

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Thương hiệu</h2>
        <button className="btn btn-primary" onClick={handleCreate}>Thêm thương hiệu</button>
      </div>

      <BrandFilters filters={filters} onChange={setFilters} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Đang tải thương hiệu...</div>}
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
