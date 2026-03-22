import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api from "../../api"
import { formatCurrencyVND } from "../../utils/format"
import "./OrderHistoryPage.css"

const PAGE_SIZE = 5

const STATUS_MAP = {
  PENDING: { label: "Chờ xử lý", className: "pending" },
  CONFIRMED: { label: "Đã xác nhận", className: "confirmed" },
  PACKING: { label: "Đang đóng gói", className: "packing" },
  SHIPPING: { label: "Đang giao", className: "shipping" },
  DELIVERED: { label: "Đã hoàn thành", className: "delivered" },
  CANCELLED: { label: "Đã hủy", className: "cancelled" },
}

function formatOrderDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("vi-VN")
}

function OrderHistoryPage() {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)

  useEffect(() => {
    setLoading(true)
    api
      .get("my-orders/")
      .then((res) => {
        const rows = Array.isArray(res.data) ? res.data : []
        setOrders(rows)
      })
      .catch(() => setError("Không tải được lịch sử đơn hàng."))
      .finally(() => setLoading(false))
  }, [])

  const visibleOrders = useMemo(() => orders.slice(0, visibleCount), [orders, visibleCount])

  if (loading) return <div className="container py-5">Đang tải lịch sử đơn hàng...</div>
  if (error) return <div className="container py-5 text-danger">{error}</div>

  return (
    <section className="order-history-page py-4 py-lg-5">
      <div className="container">
        <header className="order-history-header text-center mb-4 mb-lg-5">
          <h1 className="mb-2">Lịch sử đơn hàng</h1>
          <p className="text-muted mb-0">
            Quản lý các đơn hàng của bạn, xem lại thông tin và theo dõi trạng thái giao hàng.
          </p>
        </header>

        {visibleOrders.length === 0 ? (
          <div className="order-history-empty text-center">
            <p className="mb-3">Bạn chưa có đơn hàng nào.</p>
            <button className="btn btn-success" onClick={() => navigate("/products")}>
              Bắt đầu mua sắm
            </button>
          </div>
        ) : (
          <div className="d-flex flex-column gap-3">
            {visibleOrders.map((order) => {
              const status = STATUS_MAP[order.status] || { label: order.status || "-", className: "pending" }
              const firstItem = Array.isArray(order.items) && order.items.length > 0 ? order.items[0] : null

              return (
                <article key={order.code} className="order-history-card">
                  <div className="order-history-top">
                    <div>
                      <div className="order-code-row">
                        <strong>#{order.code}</strong>
                        <span className={`order-status-chip ${status.className}`}>{status.label}</span>
                      </div>
                      <small className="text-muted">Ngày đặt: {formatOrderDate(order.created_at)}</small>
                    </div>
                    <div className="text-end">
                      <small className="text-muted d-block">Tổng cộng</small>
                      <strong className="order-total">{formatCurrencyVND(order.total || 0)}</strong>
                    </div>
                  </div>

                  <div className="order-history-body">
                    {firstItem ? (
                      <div>
                        <h6 className="mb-1">{firstItem.product_name}</h6>
                        {firstItem.variant_display ? (
                          <small className="text-muted d-block">{firstItem.variant_display}</small>
                        ) : null}
                        <small className="text-muted">Số lượng: {firstItem.quantity}</small>
                      </div>
                    ) : (
                      <small className="text-muted">Đơn hàng chưa có dòng sản phẩm.</small>
                    )}
                  </div>

                  <div className="order-history-actions">
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => navigate("/contact")}
                    >
                      Hỗ trợ
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={() => navigate(`/orders/${order.code}`)}
                    >
                      Xem chi tiết
                    </button>
                  </div>
                </article>
              )
            })}

            {orders.length > visibleCount && (
              <div className="text-center mt-2">
                <button
                  className="btn btn-link text-success text-decoration-none"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE)}
                >
                  Tải thêm lịch sử
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default OrderHistoryPage
