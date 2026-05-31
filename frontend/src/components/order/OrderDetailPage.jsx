import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams, Link } from "react-router-dom"
import api from "../../api"
import { formatCurrencyVND } from "../../utils/format"
import "./OrderDetailPage.css"

const STEP_DEFS = [
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PACKING", label: "Đang đóng gói" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
]

const CANCELLED_STEP_DEFS = [
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "CANCELLED", label: "Đã hủy" },
]

const STATUS_LABEL = {
  PENDING: "Chờ xử lý",
  CONFIRMED: "Đã xác nhận",
  PACKING: "Đang đóng gói",
  SHIPPING: "Đang giao",
  DELIVERED: "Đã giao",
  CANCELLED: "Đã hủy",
}

function formatOrderDate(value) {
  if (!value) return "-"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return "-"
  return date.toLocaleDateString("vi-VN")
}

function OrderDetailPage() {
  const navigate = useNavigate()
  const { code } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [cancelling, setCancelling] = useState(false)

  useEffect(() => {
    if (!code) {
      setError("Không tìm thấy mã đơn hàng.")
      setLoading(false)
      return
    }

    setLoading(true)
    api
      .get(`my-orders/${code}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Không tải được thông tin đơn hàng."))
      .finally(() => setLoading(false))
  }, [code])

  const timelineSteps = useMemo(() => {
    return order?.status === "CANCELLED" ? CANCELLED_STEP_DEFS : STEP_DEFS
  }, [order?.status])

  const activeIndex = useMemo(() => {
    if (!order?.status) return 0
    const idx = timelineSteps.findIndex((step) => step.key === order.status)
    if (idx >= 0) return idx
    if (order.status === "PENDING") return 0
    return 0
  }, [order?.status, timelineSteps])

  if (loading) return <div className="container py-5">Đang tải chi tiết đơn hàng...</div>
  if (error || !order) return <div className="container py-5 text-danger">{error || "Không có dữ liệu đơn hàng."}</div>

  const canCancel = order.status === "CONFIRMED"

  const handleCancelOrder = async () => {
    const ok = window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")
    if (!ok) return

    setCancelling(true)
    try {
      const res = await api.patch(`my-orders/${order.code}/`, { status: "CANCELLED" })
      setOrder(res.data)
    } catch (err) {
      const message = err?.response?.data?.detail || "Không thể hủy đơn hàng."
      window.alert(message)
    } finally {
      setCancelling(false)
    }
  }

  return (
    <section className="order-detail-page py-4 py-lg-5">
      <div className="container">
        <button className="btn btn-link text-success ps-0 mb-3 text-decoration-none" onClick={() => navigate("/orders")}>
          ← Quay lại đơn hàng
        </button>

        <div className="d-flex flex-wrap justify-content-between align-items-end gap-3 mb-4">
          <div>
            <h1 className="order-detail-title mb-1">Order #{order.code}</h1>
            <p className="text-muted mb-0">Ngày đặt: {formatOrderDate(order.created_at)}</p>
          </div>
          <div className="d-flex align-items-center gap-2">
            <span className="order-detail-status">{STATUS_LABEL[order.status] || order.status}</span>
            {canCancel && (
              <button
                type="button"
                className="btn btn-outline-danger btn-sm"
                disabled={cancelling}
                onClick={handleCancelOrder}
              >
                {cancelling ? "Đang hủy..." : "Hủy đơn hàng"}
              </button>
            )}
          </div>
        </div>

        <div className="order-tracking mb-4">
          {timelineSteps.map((step, index) => {
            const done = index <= activeIndex
            const linkDone = index < activeIndex
            return (
              <div className={`track-step ${done ? "done" : ""} ${linkDone ? "link-done" : ""}`} key={step.key}>
                <div className={`track-dot ${done ? "done" : ""}`} />
                <small>{step.label}</small>
              </div>
            )
          })}
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="order-detail-card mb-4">
              <h5 className="mb-3">Địa chỉ giao hàng</h5>
              <p className="mb-1 fw-semibold">{order.shipping_address?.recipient_name || "-"}</p>
              <p className="mb-1">{order.shipping_address?.full_address || "-"}</p>
              <p className="mb-0 text-muted">{order.shipping_address?.recipient_phone || "-"}</p>
            </div>

            <div className="order-detail-card mb-4">
              <h5 className="mb-3">Phương thức giao hàng</h5>
              <p className="mb-1">{order.shipping_fee > 0 ? "Giao hàng tiêu chuẩn" : "Miễn phí giao hàng"}</p>
              <p className="mb-0 text-muted">
                Thanh toán: {order.payment_method === "BANK_TRANSFER" ? "Chuyển khoản" : "COD"}
              </p>
            </div>

            <div className="order-detail-card">
              <h4 className="mb-3">Sản phẩm trong đơn</h4>
              <div className="d-flex flex-column gap-3">
                {Array.isArray(order.items) && order.items.length > 0 ? (
                  order.items.map((item, index) => (
                    <div key={`${item.product_name}-${index}`} className="order-product-item">
                      <div className="order-product-thumb">IMG</div>
                      <div className="flex-grow-1">
                        <h6 className="mb-1">{item.product_name}</h6>
                        {item.variant_display ? (
                          <small className="text-muted d-block">{item.variant_display}</small>
                        ) : null}
                        <small className="text-muted">Số lượng: {item.quantity}</small>
                      </div>
                      <div className="text-end d-flex flex-column align-items-end justify-content-between gap-2">
                        <strong>{formatCurrencyVND(item.line_total || 0)}</strong>
                        {order.status === "DELIVERED" && item.product_slug && (
                          <Link
                            to={`/product/${item.product_slug}#reviews-anchor`}
                            className="btn btn-sm btn-outline-success rounded-pill px-3 py-1 mt-1 animate-hover-scale"
                            style={{ fontSize: "0.8rem", fontWeight: "600", whiteSpace: "nowrap" }}
                          >
                            Đánh giá ngay
                          </Link>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-muted mb-0">Đơn hàng chưa có sản phẩm.</p>
                )}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <aside className="order-summary-box">
              <h4 className="mb-3">Order Summary</h4>
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính</span>
                <span>{formatCurrencyVND(order.subtotal || 0)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Phí vận chuyển</span>
                <span>{formatCurrencyVND(order.shipping_fee || 0)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2">
                <span>Giảm giá</span>
                <span>-{formatCurrencyVND(order.discount_amount || 0)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5 mb-0">
                <span>Tổng cộng</span>
                <span>{formatCurrencyVND(order.total || 0)}</span>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OrderDetailPage
