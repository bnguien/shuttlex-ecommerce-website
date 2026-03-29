import { useCallback, useEffect, useState } from "react"
import FlashSalesTable from "./FlashSalesTable"
import FlashSaleModal from "./FlashSaleModal"
import FlashSaleDeleteDialog from "./FlashSaleDeleteDialog"
import api from "../../../api"

const toUtcIsoString = (localDateTime) => {
  if (!localDateTime) return localDateTime
  const date = new Date(localDateTime)
  if (Number.isNaN(date.getTime())) return localDateTime
  return date.toISOString()
}

function FlashSalesPage() {
  const [flashSales, setFlashSales] = useState([])
  const [editingFlashSale, setEditingFlashSale] = useState(null)
  const [deletingFlashSale, setDeletingFlashSale] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadFlashSales = useCallback(() => {
    setLoading(true)
    setError("")
    return api.get("flash-sales/")
      .then(res => setFlashSales(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Không thể tải danh sách khuyến mãi flash sale.")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadFlashSales()
  }, [loadFlashSales])

  const handleCreate = () => {
    setEditingFlashSale(null)
    setIsModalOpen(true)
  }

  const handleEdit = (flashSale) => {
    setEditingFlashSale(flashSale)
    setIsModalOpen(true)
  }

  const handleDelete = (flashSale) => {
    setDeletingFlashSale(flashSale)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClose = () => {
    setDeletingFlashSale(null)
  }

  const handleSave = async (data) => {
    setLoading(true)
    setError("")

    try {
      const payload = {
        name: data.name,
        discount_percent: data.discount_percent,
        start_time: toUtcIsoString(data.start_time),
        end_time: toUtcIsoString(data.end_time),
        is_active: data.is_active,
        product_ids: data.product_ids || []
      }

      if (editingFlashSale) {
        await api.patch(`flash-sales/${editingFlashSale.id}/update/`, payload)
      } else {
        await api.post("flash-sales/create/", payload)
      }
      setIsModalOpen(false)
      setEditingFlashSale(null)
      await loadFlashSales()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể lưu khuyến mãi flash sale."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingFlashSale?.id) {
      setDeletingFlashSale(null)
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.delete(`flash-sales/${deletingFlashSale.id}/delete/`)
      setDeletingFlashSale(null)
      await loadFlashSales()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể xóa khuyến mãi flash sale."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Khuyến mãi Flash Sale</h1>
        <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
          Tạo flash sale
        </button>
      </div>

      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {error}
        <button type="button" className="btn-close" onClick={() => setError("")}></button>
      </div>}

      <div className="card">
        <div className="card-body p-0">
          <FlashSalesTable
            flashSales={flashSales}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <FlashSaleModal
        isOpen={isModalOpen}
        flashSale={editingFlashSale}
        onClose={handleModalClose}
        onSave={handleSave}
        loading={loading}
      />

      <FlashSaleDeleteDialog
        isOpen={!!deletingFlashSale}
        flashSale={deletingFlashSale}
        onClose={handleDeleteClose}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </div>
  )
}

export default FlashSalesPage
