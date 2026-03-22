import { useCallback, useEffect, useState } from "react"
import UsersTable from "./UsersTable"
import UserModal from "./UserModal"
import api from "../../../api"

function UsersPage() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState("")
  const [editingUser, setEditingUser] = useState(null)
  const [deletingUser, setDeletingUser] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 10

  const loadUsers = useCallback(() => {
    setLoading(true)
    setError("")
    return api
      .get("users/", { params: { page, page_size: pageSize, search } })
      .then((res) => {
        setUsers(res.data.results || [])
        setTotalCount(res.data.count || 0)
        setTotalPages(res.data.total_pages || 1)
      })
      .catch((err) => {
        console.error(err)
        setError("Không thể tải danh sách người dùng.")
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, search])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleCreate = () => {
    setEditingUser(null)
    setIsModalOpen(true)
  }

  const handleEdit = (user) => {
    setEditingUser(user)
    setIsModalOpen(true)
  }

  const handleDelete = (user) => {
    setDeletingUser(user)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleSave = async (data) => {
    setLoading(true)
    setError("")

    const payload = {
      username: data.username?.trim(),
      email: data.email?.trim(),
      first_name: data.first_name?.trim() || "",
      last_name: data.last_name?.trim() || "",
      phone: data.phone?.trim() || "",
      address: data.address?.trim() || "",
      is_active: Boolean(data.is_active),
      is_staff: Boolean(data.is_staff),
      is_superuser: Boolean(data.is_superuser),
    }

    // Only include password if it's provided
    if (data.password?.trim()) {
      payload.password = data.password
    }

    try {
      if (data.id) {
        // Update
        await api.put(`users/${data.id}/update/`, payload)
      } else {
        // Create
        await api.post("users/create/", payload)
      }
      setIsModalOpen(false)
      setEditingUser(null)
      await loadUsers()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data || "Không thể lưu người dùng."
      if (typeof message === "object") {
        // Hiển thị lỗi validation
        const errors = Object.entries(message)
          .map(([key, val]) => `${key}: ${Array.isArray(val) ? val.join(", ") : val}`)
          .join("\n")
        setError(errors)
      } else {
        setError(message)
      }
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingUser?.id) {
      setDeletingUser(null)
      return
    }

    setLoading(true)
    setError("")
    try {
      await api.delete(`users/${deletingUser.id}/delete/`)
      setDeletingUser(null)
      await loadUsers()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data?.detail || "Không thể xóa người dùng."
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const handleSearchChange = (event) => {
    setSearch(event.target.value)
    setPage(1) // Quay lại trang đầu khi tìm kiếm
  }

  const getPageNumbers = () => {
    if (totalPages <= 1) return []
    const maxButtons = 5
    let start = Math.max(1, page - Math.floor(maxButtons / 2))
    let end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Người dùng</h2>
        <button className="btn btn-primary" onClick={handleCreate}>
          Thêm người dùng
        </button>
      </div>

      {/* Tìm kiếm */}
      <div className="card mb-3">
        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <input
                type="text"
                className="form-control"
                placeholder="Tìm theo tên đăng nhập, email hoặc họ tên..."
                value={search}
                onChange={handleSearchChange}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Bảng dữ liệu */}
      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Đang tải người dùng...</div>}
          {error && <div className="text-danger mb-3">{error}</div>}
          <UsersTable users={users} onEdit={handleEdit} onDelete={handleDelete} />
          
          {/* Phân trang */}
          {totalPages > 1 && (
            <nav aria-label="Phân trang người dùng" className="d-flex justify-content-center mt-4">
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Trước
                  </button>
                </li>
                {pageNumbers.map((num) => (
                  <li key={num} className={`page-item ${page === num ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(num)}>
                      {num}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          )}
        </div>
      </div>

      {/* Hộp thoại */}
      <UserModal
        open={isModalOpen}
        user={editingUser}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      {/* Xác nhận xóa */}
      {deletingUser && (
        <>
          <div className="modal d-block" tabIndex="-1" role="dialog">
            <div className="modal-dialog" role="document">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Xác nhận xóa</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setDeletingUser(null)}
                  />
                </div>
                <div className="modal-body">
                  <p>
                    Bạn có chắc muốn xóa người dùng <strong>{deletingUser.username}</strong>?
                  </p>
                  <p className="text-danger mb-0">Thao tác này không thể hoàn tác.</p>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setDeletingUser(null)}
                  >
                    Hủy
                  </button>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={handleConfirmDelete}
                  >
                    Xóa
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" onClick={() => setDeletingUser(null)} />
        </>
      )}
    </div>
  )
}

export default UsersPage
