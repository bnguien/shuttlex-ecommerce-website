import { useEffect, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api from "../../../api"
import { formatCurrencyVND } from "../../../utils/format"
import "./AdminOrderDetailPage.css"

const STATUS_LABEL = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang chuẩn bị",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
}

const STATUS_ORDER = ["PENDING", "CONFIRMED", "PACKING", "SHIPPING", "DELIVERED"]

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

function getInitials(name) {
  if (!name) return "?"
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2)
}

function AdminOrderDetailPage() {
  const navigate = useNavigate()
  const { orderId } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [updating, setUpdating] = useState(false)

  useEffect(() => {
    if (!orderId) {
      setError("Không tìm thấy ID đơn hàng.")
      setLoading(false)
      return
    }

    setLoading(true)
    api
      .get(`admin-orders/${orderId}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Không tải được thông tin đơn hàng."))
      .finally(() => setLoading(false))
  }, [orderId])

  const handleStatusChange = async (nextStatus) => {
    setUpdating(true)
    try {
      const res = await api.patch(`admin-orders/${orderId}/`, { status: nextStatus })
      setOrder(res.data)
    } catch {
      alert("Không thể cập nhật trạng thái đơn hàng.")
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return <div className="container py-5">Đang tải chi tiết đơn hàng...</div>
  if (error || !order) return <div className="container py-5 text-danger">{error || "Không có dữ liệu đơn hàng."}</div>

  const customerName = order.user?.first_name && order.user?.last_name
    ? order.user.first_name + " " + order.user.last_name
    : order.customer_name || order.shipping_address?.recipient_name || "Khách hàng"

  const currentStatusIndex = STATUS_ORDER.indexOf(order.status)
  const itemCount = order.item_count || order.items?.length || 0

  return (
    <section className="admin-order-detail-page">
      <div className="container-fluid px-4 py-4">
        <button className="back-to-orders" onClick={() => navigate("/admin/orders")}>← Quay lại danh sách đơn hàng</button>

        <div className="order-header">
          <div className="header-left">
            <div className="header-meta-row">
              <span className="badge-tag">Chi tiết đơn hàng</span>
              <span className="order-date-inline">Placed on {formatDate(order.created_at)}</span>
            </div>
            <h1 className="order-code">#{order.code}</h1>
          </div>
          <div className="header-right">
            {isStatusLocked(order.status) ? (
              <div
                className="status-dropdown"
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
                className="status-dropdown"
                value={order.status}
                disabled={updating}
                onChange={(e) => handleStatusChange(e.target.value)}
              >
                <option value={order.status}>{STATUS_LABEL[order.status]}</option>
                {getAvailableStatuses(order.status).map((s) => (
                  <option key={s} value={s}>
                    {STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-xxl-3 col-lg-4">
            <div className="card-customer">
              <h5 className="section-title">Thông tin khách hàng</h5>
              <div className="customer-avatar">
                {getInitials(customerName)}
              </div>
              <h5 className="customer-name">{customerName}</h5>
              <p className="customer-title"></p>
              <hr />
              <div className="customer-detail">
                <p>Email</p>
                <p>{order.customer_email || "-"}</p>
              </div>
              <div className="customer-detail">
                <p>Địa chỉ</p>
                <p>{order.shipping_address?.full_address || "-"}</p>
              </div>
              <div className="customer-detail">
                <p>Số điện thoại</p>
                <p>{order.shipping_address?.recipient_phone || "-"}</p>
              </div>
            </div>

            <div className="card-timeline mt-4">
              <h5 className="section-title">Trạng thái đơn hàng</h5>
              <div className="timeline">
                {STATUS_ORDER.map((status, idx) => {
                  const isActive = currentStatusIndex >= idx
                  const label = STATUS_LABEL[status]
                  return (
                    <div key={status} className={`timeline-item ${isActive ? "active" : ""}`}>
                      <div className="timeline-dot" />
                      <div className="timeline-content">
                        <p className="timeline-label">{label}</p>
                        {isActive && <p className="timeline-time">{formatDate(order.created_at)}</p>}
                      </div>
                    </div>
                  )
                })}
                {order.status === "CANCELLED" && (
                  <div className="timeline-item cancelled">
                    <div className="timeline-dot">
                      <span className="cancel-mark"></span>
                    </div>
                    <div className="timeline-content">
                      <p className="timeline-label">Đã hủy</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="col-xxl-9 col-lg-8">
            <div className="card-items">
              <div className="items-header">
                <h5 className="section-title">Sản phẩm trong đơn hàng</h5>
                <span className="items-count">{itemCount} sản phẩm</span>
              </div>

              <table className="items-table">
                <thead>
                  <tr>
                    <th>Sản phẩm</th>
                    <th>SL</th>
                    <th>Giá</th>
                    <th>Tổng</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, idx) => (
                    <tr key={idx}>
                      <td>
                        <div className="item-name">{item.product_name}</div>
                        {item.variant_display && <div className="item-variant">{item.variant_display}</div>}
                      </td>
                      <td>{item.quantity}</td>
                      <td>{formatCurrencyVND(item.price_at_purchase)}</td>
                      <td className="item-total">{formatCurrencyVND(item.line_total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="summary-section align-right">
                <div className="summary-item">
                  <span>Tổng sản phẩm</span>
                  <span>{formatCurrencyVND(order.subtotal)}</span>
                </div>
                {order.shipping_fee > 0 && (
                  <div className="summary-item">
                    <span>Phí vận chuyển</span>
                    <span>{formatCurrencyVND(order.shipping_fee)}</span>
                  </div>
                )}
                {order.product_discount_amount > 0 && (
                  <div className="summary-item discount">
                    <span>Giảm sản phẩm</span>
                    <span>-{formatCurrencyVND(order.product_discount_amount)}</span>
                  </div>
                )}
                {order.shipping_discount_amount > 0 && (
                  <div className="summary-item discount">
                    <span>Giảm vận chuyển</span>
                    <span>-{formatCurrencyVND(order.shipping_discount_amount)}</span>
                  </div>
                )}
                <div className="summary-item total">
                  <span>Tổng cộng</span>
                  <span>{formatCurrencyVND(order.total)}</span>
                </div>

                <div className="summary-meta">
                  <div className="info-block">
                    <p className="label">Phương thức thanh toán</p>
                    <p className="value">
                      {order.payment_method === "BANK_TRANSFER" ? "Chuyển khoản ngân hàng" : "Tiền mặt khi nhận"}
                    </p>
                  </div>
                  <div className="info-block">
                    <p className="label">Trạng thái thanh toán</p>
                    <p className={`value ${order.payment_status === "PAID" ? "paid" : ""}`}>
                      {order.payment_status === "PAID" ? "Đã thanh toán" : "Chưa thanh toán"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AdminOrderDetailPage
