import { useCallback, useEffect, useState } from "react"
import VouchersTable from "./VouchersTable"
import VoucherModal from "./VoucherModal"
import VoucherDeleteDialog from "./VoucherDeleteDialog"
import api from "../../../api"

function VouchersPage() {
  const [vouchers, setVouchers] = useState([])
  const [editingVoucher, setEditingVoucher] = useState(null)
  const [deletingVoucher, setDeletingVoucher] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const loadVouchers = useCallback(() => {
    setLoading(true)
    setError("")
    return api.get("vouchers/")
      .then(res => setVouchers(Array.isArray(res.data) ? res.data : res.data.results || []))
      .catch(err => {
        console.error(err)
        setError("Không thể tải danh sách mã giảm giá.")
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadVouchers()
  }, [loadVouchers])

  const handleCreate = () => {
    setEditingVoucher(null)
    setIsModalOpen(true)
  }

  const handleEdit = (voucher) => {
    setEditingVoucher(voucher)
    setIsModalOpen(true)
  }

  const handleDelete = (voucher) => {
    setDeletingVoucher(voucher)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClose = () => {
    setDeletingVoucher(null)
  }

  const handleSave = async (data) => {
    setLoading(true)
    setError("")
    const payload = { ...data }

    try {
      if (editingVoucher) {
        await api.patch(`vouchers/${editingVoucher.code}/update/`, payload)
      } else {
        await api.post("vouchers/create/", payload)
      }
      setIsModalOpen(false)
      setEditingVoucher(null)
      await loadVouchers()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể lưu mã giảm giá."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingVoucher?.code) {
      setDeletingVoucher(null)
      return
    }

    setLoading(true)
    setError("")

    try {
      await api.delete(`vouchers/${deletingVoucher.code}/delete/`)
      setDeletingVoucher(null)
      await loadVouchers()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || err?.response?.data || "Không thể xóa mã giảm giá."
      setError(typeof message === "string" ? message : JSON.stringify(message))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1 className="h3 mb-0">Mã giảm giá</h1>
        <button className="btn btn-primary" onClick={handleCreate} disabled={loading}>
            Tạo mã giảm giá
        </button>
      </div>

      {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">
        {error}
        <button type="button" className="btn-close" onClick={() => setError("")}></button>
      </div>}

      <div className="card">
        <div className="card-body p-0">
          <VouchersTable
            vouchers={vouchers}
            loading={loading}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      <VoucherModal
        isOpen={isModalOpen}
        voucher={editingVoucher}
        onClose={handleModalClose}
        onSave={handleSave}
        loading={loading}
      />

      <VoucherDeleteDialog
        isOpen={!!deletingVoucher}
        voucher={deletingVoucher}
        onClose={handleDeleteClose}
        onConfirm={handleConfirmDelete}
        loading={loading}
      />
    </div>
  )
}

export default VouchersPage
