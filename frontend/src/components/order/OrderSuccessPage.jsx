import { useEffect, useMemo, useState } from "react"
import { useNavigate, useParams } from "react-router-dom"
import api, { BASE_URL } from "../../api"
import { formatCurrencyVND } from "../../utils/format"
import "./OrderSuccessPage.css"

const STATUS_STEPS = [
  { key: "PENDING", label: "Đã tạo" },
  { key: "CONFIRMED", label: "Đã xác nhận" },
  { key: "PACKING", label: "Đang đóng gói" },
  { key: "SHIPPING", label: "Đang giao" },
  { key: "DELIVERED", label: "Đã giao" },
]

function imageSrc(raw) {
  if (!raw) return null
  if (typeof raw === "string" && raw.startsWith("http")) return raw
  if (typeof raw === "string" && raw.startsWith("/")) return `${BASE_URL}${raw}`
  return raw
}

function OrderSuccessPage() {
  const navigate = useNavigate()
  const { code } = useParams()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!code) {
      setError("Không tìm thấy mã đơn hàng.")
      setLoading(false)
      return
    }

    setLoading(true)
    api.get(`my-orders/${code}/`)
      .then((res) => setOrder(res.data))
      .catch(() => setError("Không tải được thông tin đơn hàng."))
      .finally(() => setLoading(false))
  }, [code])

  const activeStepIndex = useMemo(() => {
    const index = STATUS_STEPS.findIndex((step) => step.key === order?.status)
    return index === -1 ? 0 : index
  }, [order?.status])

  if (loading) return <div className="container py-5">Đang tải đơn hàng...</div>
  if (error || !order) return <div className="container py-5 text-danger">{error || "Không có dữ liệu đơn hàng."}</div>

  return (
    <section className="order-success-page py-4 py-lg-5">
      <div className="container">
        <div className="order-success-hero mb-4">
          <div>
            <span className="order-success-badge">ORDER CONFIRMED</span>
            <h1 className="order-success-title mt-3 mb-2">Cảm ơn bạn đã đặt hàng!</h1>
            <p className="mb-3">Order ID: <strong>#{order.code}</strong></p>
            <button className="btn btn-success px-4" onClick={() => navigate("/profile")}>Xem lịch sử đơn hàng</button>
          </div>
          <div className="order-success-box" aria-hidden="true">📦</div>
        </div>

        <div className="order-success-card mb-4">
          <h4 className="mb-4">Tracking Progress</h4>
          <div className="tracking-line">
            {STATUS_STEPS.map((step, index) => {
              const done = index <= activeStepIndex
              return (
                <div key={step.key} className="tracking-step">
                  <div className={`tracking-dot ${done ? "done" : ""}`} />
                  <p className="tracking-label mb-0">{step.label}</p>
                </div>
              )
            })}
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-8">
            <div className="order-success-card h-100">
              <h4 className="mb-3">Order Contents</h4>
              <div className="d-flex flex-column gap-3">
                {order.items?.map((item, idx) => (
                  <div key={idx} className="order-item-row">
                    {item.image ? (
                      <img src={imageSrc(item.image)} alt={item.product_name} className="order-item-image" />
                    ) : (
                      <div className="order-item-image-placeholder">IMG</div>
                    )}
                    <div className="flex-grow-1">
                      <h6 className="mb-1">{item.product_name}</h6>
                      <small className="text-muted d-block">{item.variant_display || "Biến thể mặc định"}</small>
                      <small className="text-muted">SL: {item.quantity}</small>
                    </div>
                    <strong>{formatCurrencyVND(item.line_total || 0)}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="order-success-summary h-100">
              <h4 className="mb-3">Summary</h4>
              <div className="d-flex justify-content-between mb-2"><span>Subtotal</span><span>{formatCurrencyVND(order.subtotal || 0)}</span></div>
              <div className="d-flex justify-content-between mb-2"><span>Shipping</span><span>{formatCurrencyVND(order.shipping_fee || 0)}</span></div>
              <div className="d-flex justify-content-between mb-2"><span>Discount</span><span>-{formatCurrencyVND(order.discount_amount || 0)}</span></div>
              <hr />
              <div className="d-flex justify-content-between fw-bold fs-5"><span>Total</span><span>{formatCurrencyVND(order.total || 0)}</span></div>
            </div>
          </div>
        </div>

        <div className="order-success-card">
          <h4 className="mb-3">Shipping & Delivery</h4>
          <div className="row g-3">
            <div className="col-md-6">
              <p className="text-muted mb-1">Delivery Address</p>
              <p className="mb-1 fw-semibold">{order.shipping_address?.recipient_name || "-"}</p>
              <p className="mb-1">{order.shipping_address?.full_address || "-"}</p>
              <p className="mb-0">{order.shipping_address?.recipient_phone || "-"}</p>
            </div>
            <div className="col-md-6">
              <p className="text-muted mb-1">Payment</p>
              <p className="mb-1">Phương thức: {order.payment_method === "BANK_TRANSFER" ? "Chuyển khoản" : "COD"}</p>
              <p className="mb-0">Trạng thái thanh toán: {order.payment_status === "PAID" ? "Đã thanh toán" : "Chờ thanh toán"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default OrderSuccessPage
