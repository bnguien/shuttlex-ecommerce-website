import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import api from "../../api"
import { formatCurrencyVND } from "../../utils/format"
import "./PaymentQrPage.css"

const DEV_BANKS = {
  DEV1: {
    bankCode: import.meta.env.VITE_BANK_CODE_DEV1,
    accountNumber: import.meta.env.VITE_BANK_ACC_DEV1,
    accountName: import.meta.env.VITE_BANK_NAME_DEV1,
    bankName: import.meta.env.VITE_BANK_DISPLAY_NAME_DEV1,
  },
  DEV2: {
    bankCode: import.meta.env.VITE_BANK_CODE_DEV2,
    accountNumber: import.meta.env.VITE_BANK_ACC_DEV2,
    accountName: import.meta.env.VITE_BANK_NAME_DEV2,
    bankName: import.meta.env.VITE_BANK_DISPLAY_NAME_DEV2,
  },
}

const activeDev = import.meta.env.VITE_ACTIVE_DEV
const BANK_INFO = DEV_BANKS[activeDev] || {
  bankCode: "VCB",
  accountNumber: "998812345678",
  accountName: "SHUTTLEX KINETIC PRECISION",
  bankName: "Vietcombank",
}

const isDemo = !!activeDev
const DEMO_AMOUNT = 2000
const EXPIRE_SECONDS = 10 * 60

function formatCountdown(seconds) {
  const clamped = Math.max(0, seconds)
  const minutes = String(Math.floor(clamped / 60)).padStart(2, "0")
  const remainSeconds = String(clamped % 60).padStart(2, "0")
  return `${minutes}:${remainSeconds}`
}

function PaymentQrPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { code } = useParams()

  const [order, setOrder] = useState(location.state?.order || null)
  const [loading, setLoading] = useState(!location.state?.order)
  const [checking, setChecking] = useState(false)
  const [error, setError] = useState("")
  const [timeLeft, setTimeLeft] = useState(EXPIRE_SECONDS)

  const qrUrl = useMemo(() => {
    const amount = isDemo ? DEMO_AMOUNT : Number(order?.total || 0)
    const transferContent = encodeURIComponent(`Thanh toan ${code || ""}`)
    const accountName = encodeURIComponent(BANK_INFO.accountName)
    return `https://img.vietqr.io/image/${BANK_INFO.bankCode}-${BANK_INFO.accountNumber}-compact2.png?amount=${amount}&addInfo=${transferContent}&accountName=${accountName}`
  }, [order?.total, code])

  const fetchOrder = async () => {
    if (!code) return null
    const res = await api.get(`my-orders/${code}/`)
    setOrder(res.data)
    return res.data
  }

  useEffect(() => {
    if (!code) {
      setError("Không tìm thấy mã đơn hàng để thanh toán.")
      return
    }

    if (!order) {
      setLoading(true)
      fetchOrder()
        .catch(() => setError("Không tải được thông tin đơn hàng."))
        .finally(() => setLoading(false))
    }
  }, [code])

  useEffect(() => {
    if (!order || order.payment_status === "PAID") return

    const timerId = setInterval(() => {
      setTimeLeft((prev) => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timerId)
  }, [order])

  useEffect(() => {
    if (!order || order.payment_status === "PAID" || timeLeft <= 0) return

    const pollingId = setInterval(async () => {
      try {
        const latest = await fetchOrder()
        if (latest?.payment_status === "PAID") {
          navigate(`/orders/${code}`, { replace: true })
        }
      } catch { /* empty */ }
    }, 1000)

    return () => clearInterval(pollingId)
  }, [order, timeLeft, code, navigate])

  useEffect(() => {
    if (order?.payment_status === "PAID") {
      navigate(`/orders/${code}`, { replace: true })
    }
  }, [order?.payment_status, code, navigate])

  const handleManualCheck = async () => {
    setChecking(true)
    setError("")
    try {
      const latest = await fetchOrder()
      if (latest?.payment_status === "PAID") {
        navigate(`/orders/${code}`, { replace: true })
        return
      }
      setError("Hệ thống chưa ghi nhận thanh toán. Vui lòng thử lại sau vài giây.")
    } catch {
      setError("Không kiểm tra được trạng thái thanh toán.")
    } finally {
      setChecking(false)
    }
  }

  if (loading) {
    return <div className="container py-5">Đang tải trang thanh toán QR...</div>
  }

  return (
    <section className="payment-qr-page py-4 py-lg-5">
      <div className="container">
        <div className="mb-4">
          <h1 className="payment-qr-title mb-1">Hoàn tất đơn hàng</h1>
          <p className="text-muted mb-0">Quét mã QR bằng ứng dụng ngân hàng để thanh toán an toàn.</p>
        </div>

        {error && <div className="alert alert-warning">{error}</div>}

        {isDemo && order && (
          <div className="demo-banner">
            <div className="demo-banner-header">
              <span className="demo-banner-icon">⚠️</span>
              <strong>CHẾ ĐỘ DEMO</strong>
            </div>
            <p className="demo-banner-text">
              Chuyển khoản mặc định <strong>{formatCurrencyVND(DEMO_AMOUNT)}</strong> để test thanh toán tự động.
            </p>
            <div className="demo-diff">
              <span>Giá trị thật: <strong>{formatCurrencyVND(order?.total || 0)}</strong></span>
              <span className="demo-diff-sep">·</span>
              <span>CK demo: <strong>{formatCurrencyVND(DEMO_AMOUNT)}</strong></span>
              <span className="demo-diff-sep">·</span>
              <span>Chênh lệch: <strong>{formatCurrencyVND(Number(order?.total || 0) - DEMO_AMOUNT)}</strong></span>
            </div>
          </div>
        )}

        <div className="row g-4 align-items-stretch">
          <div className="col-lg-5">
            <div className="payment-qr-card h-100">
              <h6 className="payment-qr-subtitle">Quét mã QR</h6>
              <div className="payment-qr-image-wrap">
                <img src={qrUrl} alt="QR thanh toán" className="payment-qr-image" />
              </div>
              <div className="payment-qr-timer">
                <span>Hiệu lực trong</span>
                <strong>{formatCountdown(timeLeft)}</strong>
              </div>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="payment-info-card mb-3">
              <div className="d-flex flex-wrap justify-content-between gap-2 mb-3">
                <div>
                  <p className="payment-info-label mb-1">Tổng tiền</p>
                  <h2 className="payment-info-amount mb-0">{formatCurrencyVND(order?.total || 0)}</h2>
                </div>
                <div className="text-lg-end">
                  <p className="payment-info-label mb-1">Mã đơn hàng</p>
                  <p className="payment-info-order mb-0">#{code}</p>
                </div>
              </div>

              <div className="payment-info-row">
                <span>Ngân hàng</span>
                <strong>{BANK_INFO.bankName}</strong>
              </div>
              <div className="payment-info-row">
                <span>Tên tài khoản</span>
                <strong>{BANK_INFO.accountName}</strong>
              </div>
              <div className="payment-info-row mb-0">
                <span>Số tài khoản</span>
                <strong>{BANK_INFO.accountNumber}</strong>
              </div>
            </div>

            <div className="payment-steps mb-4">
              <div className="payment-step-item"><span>1</span>Mở app ngân hàng</div>
              <div className="payment-step-item"><span>2</span>Chọn quét mã QR</div>
              <div className="payment-step-item"><span>3</span>Xác nhận và thanh toán</div>
            </div>

            <div className="d-flex flex-wrap gap-3">
              <button className="btn btn-success px-4" onClick={handleManualCheck} disabled={checking}>
                {checking ? "Đang kiểm tra..." : "Tôi đã thanh toán"}
              </button>
              <button className="btn btn-outline-secondary px-4" onClick={() => navigate("/checkout")}>Hủy giao dịch</button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default PaymentQrPage
