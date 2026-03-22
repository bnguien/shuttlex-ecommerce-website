import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../../api"
import { formatCurrencyVND } from "../../../utils/format"
import "./AdminOrdersPage.css"

const STATUS_LABEL = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
}

const STATUS_OPTIONS = [
  "PENDING",
  "CONFIRMED",
  "PACKING",
  "SHIPPING",
  "DELIVERED",
  "CANCELLED",
]

const VALID_TRANSITIONS = {
  PENDING: ["CONFIRMED", "PACKING", "SHIPPING", "DELIVERED", "CANCELLED"],
  CONFIRMED: ["PACKING", "SHIPPING", "DELIVERED", "CANCELLED"],
  PACKING: ["SHIPPING", "DELIVERED", "CANCELLED"],
  SHIPPING: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], 
  CANCELLED: [], 
}

const getAvailableStatuses = (currentStatus) => {
  return VALID_TRANSITIONS[currentStatus] || []
}

const isStatusLocked = (status) => {
  return status === "DELIVERED" || status === "CANCELLED"
}

function formatDate(value) {
  if (!value) return "-"
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return "-"
  return d.toLocaleDateString("vi-VN")
}

function AdminOrdersPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [query, setQuery] = useState("")
  const [updatingId, setUpdatingId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    setLoading(true)
    api
      .get("admin-orders/")
      .then((res) => setOrders(Array.isArray(res.data) ? res.data : []))
      .catch(() => setError("Không tải được danh sách đơn hàng."))
      .finally(() => setLoading(false))
  }, [])

  const filteredOrders = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return orders
    return orders.filter((order) => {
      return (
        order.code?.toLowerCase().includes(q) ||
        order.customer_name?.toLowerCase().includes(q) ||
        order.customer_email?.toLowerCase().includes(q)
      )
    })
  }, [orders, query])

  const stats = useMemo(() => {
    const total = orders.length
    const pending = orders.filter((o) => o.status === "PENDING").length
    const inTransit = orders.filter((o) => o.status === "SHIPPING").length
    const delivered = orders.filter((o) => o.status === "DELIVERED").length
    return { total, pending, inTransit, delivered }
  }, [orders])

  const handleStatusChange = async (orderId, nextStatus) => {
    setUpdatingId(orderId)
    try {
      const res = await api.patch(`admin-orders/${orderId}/`, { status: nextStatus })
      setOrders((prev) =>
        prev.map((item) => (item.id === orderId ? { ...item, ...res.data } : item))
      )
    } catch {
      window.alert("Không thể cập nhật trạng thái đơn hàng.")
    } finally {
      setUpdatingId(null)
    }
  }

  const handleDeleteOrder = async (orderId, orderCode) => {
    const ok = window.confirm(`Bạn có chắc muốn xóa đơn #${orderCode}?`)
    if (!ok) return

    setDeletingId(orderId)
    try {
      await api.delete(`admin-orders/${orderId}/`)
      setOrders((prev) => prev.filter((item) => item.id !== orderId))
    } catch {
      window.alert("Không thể xóa đơn hàng.")
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <section className="admin-orders-page p-4 p-lg-5">
      <div className="d-flex flex-wrap justify-content-between align-items-center gap-3 mb-4">
        <div>
          <h1 className="admin-orders-title mb-0">Quản lý Đơn hàng</h1>
        </div>
      </div>

      <div className="admin-orders-panel soft-card mb-4">
        <input
          className="form-control admin-orders-search"
          placeholder="Tìm đơn hàng theo mã, tên khách, email..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="row g-3 mb-4">
        <div className="col-12 col-md-6 col-xl-3">
          <div className="soft-card stat-card stat-total">
            <small className="text-muted">Tổng đơn hàng</small>
            <h2>{stats.total}</h2>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="soft-card stat-card stat-pending">
            <small className="text-muted">Chờ xử lý</small>
            <h2>{stats.pending}</h2>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="soft-card stat-card stat-transit">
            <small className="text-muted">Đang vận chuyển</small>
            <h2>{stats.inTransit}</h2>
          </div>
        </div>
        <div className="col-12 col-md-6 col-xl-3">
          <div className="soft-card stat-card stat-delivered">
            <small className="text-muted">Đã giao</small>
            <h2>{stats.delivered}</h2>
          </div>
        </div>
      </div>

      <div className="soft-card recent-orders-card p-0">
        <div className="d-flex justify-content-between align-items-center p-3 border-bottom">
          <h5 className="mb-0">Đơn hàng gần đây</h5>
        </div>

        {loading && <div className="p-3 text-muted">Đang tải đơn hàng...</div>}
        {error && <div className="p-3 text-danger">{error}</div>}

        {!loading && !error && (
          <div className="table-responsive">
            <table className="table align-middle mb-0 admin-orders-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Ngày tạo</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                  <th>Số món</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td className="fw-semibold">#{order.code}</td>
                      <td>
                        <div className="fw-semibold">{order.customer_name || "-"}</div>
                        <small className="text-muted">{order.customer_email || "-"}</small>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                      <td className="fw-semibold">{formatCurrencyVND(order.total || 0)}</td>
                      <td>
                        {isStatusLocked(order.status) ? (
                          <div
                            className={`form-select form-select-sm status-select status-${order.status?.toLowerCase() || "pending"}`}
                            style={{
                              cursor: "not-allowed",
                              opacity: 0.7,
                              backgroundColor: "#f0f0f0",
                              padding: "0.375rem 0.75rem",
                              borderRadius: "0.25rem",
                              border: "1px solid #dee2e6",
                              display: "inline-block",
                            }}
                          >
                            {STATUS_LABEL[order.status] || order.status}
                          </div>
                        ) : (
                          <select
                            className={`form-select form-select-sm status-select status-${order.status?.toLowerCase() || "pending"}`}
                            value={order.status}
                            disabled={updatingId === order.id || deletingId === order.id}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          >
                            <option value={order.status}>{STATUS_LABEL[order.status]}</option>
                            {getAvailableStatuses(order.status).map((statusValue) => (
                              <option key={statusValue} value={statusValue}>
                                {STATUS_LABEL[statusValue]}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                      <td>{order.item_count ?? 0}</td>
                      <td>
                        <div className="admin-order-actions" style={{ gap: "0.5rem", display: "flex" }}>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-info"
                            onClick={() => navigate(`/admin/orders/${order.id}`)}
                          >
                            Chi tiết
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            disabled={updatingId === order.id || deletingId === order.id}
                            onClick={() => handleDeleteOrder(order.id, order.code)}
                          >
                            {deletingId === order.id ? "Đang xóa..." : "Xóa"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">
                      Không có đơn hàng phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </section>
  )
}

export default AdminOrdersPage
