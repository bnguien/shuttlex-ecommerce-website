import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import api, { BASE_URL } from "../../api"
import { formatCurrencyVND } from "../../utils/format"
import { useToast } from "../ui/Toast"
import "./CheckoutPage.css"

function CheckoutPage({ setNumCartItems }) {
  const navigate = useNavigate()
  const showToast = useToast()

  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)

  const [cartItems, setCartItems] = useState([])
  const [shippingMethods, setShippingMethods] = useState([])
  const [addresses, setAddresses] = useState([])

  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [shippingMethodCode, setShippingMethodCode] = useState("GHN")
  const [selectedAddressId, setSelectedAddressId] = useState("")

  const [addressForm, setAddressForm] = useState({
    recipient_name: "",
    recipient_phone: "",
    full_address: "",
    street: "",
    ward: "",
    district: "",
    province: "",
  })

  const cartCode = localStorage.getItem("cart_code")

  useEffect(() => {
    if (!cartCode) {
      showToast("Giỏ hàng trống.", "error")
      navigate("/cart")
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      api.get(`get_cart_items?cart_code=${encodeURIComponent(cartCode)}`),
      api.get("shipping-methods/"),
      api.get("order-addresses/"),
    ])
      .then(([cartRes, methodRes, addressRes]) => {
        if (cancelled) return

        const items = cartRes.data?.items || []
        setCartItems(items)

        const methods = methodRes.data || []
        setShippingMethods(methods)
        if (methods.length > 0) {
          setShippingMethodCode((prev) => prev || methods[0].code)
        }

        const allAddresses = addressRes.data || []
        setAddresses(allAddresses)

        if (allAddresses.length > 0) {
          const first = allAddresses[0]
          setSelectedAddressId(String(first.id))
          setAddressForm({
            recipient_name: first.recipient_name || "",
            recipient_phone: first.recipient_phone || "",
            full_address: first.full_address || "",
            street: first.street || "",
            ward: first.ward || "",
            district: first.district || "",
            province: first.province || "",
          })
        }
      })
      .catch(() => {
        if (cancelled) return
        showToast("Không tải được dữ liệu thanh toán.", "error")
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [cartCode, navigate, showToast])

  const subtotal = useMemo(() => {
    return cartItems.reduce((sum, item) => {
      const value = item.subtotal != null
        ? Number(item.subtotal)
        : Number(item.price_at_add ?? item.price ?? 0) * Number(item.quantity || 0)
      return sum + (Number.isNaN(value) ? 0 : value)
    }, 0)
  }, [cartItems])

  const currentShipping = useMemo(() => {
    return shippingMethods.find((m) => String(m.code) === String(shippingMethodCode))
  }, [shippingMethodCode, shippingMethods])

  const estimatedShippingFee = Number(currentShipping?.base_cost ?? 0)
  const estimatedTotal = subtotal + estimatedShippingFee

  const hasUnavailable = cartItems.some((item) => item.is_available === false)

  function getShippingMethodLabel(method) {
    const code = String(method?.code || "").toUpperCase()
    if (code === "GHN") return "Giao Hàng Nhanh (GHN)"
    if (code === "GHHT") return "Giao Hàng Hỏa Tốc (GHHT)"
    if (code === "GHTK") return "Giao Hàng Tiết Kiệm (GHTK)"
    return method?.name || code
  }

  function selectAddress(value) {
    setSelectedAddressId(value)
    const addr = addresses.find((a) => String(a.id) === String(value))
    if (!addr) return
    setAddressForm({
      recipient_name: addr.recipient_name || "",
      recipient_phone: addr.recipient_phone || "",
      full_address: addr.full_address || "",
      street: addr.street || "",
      ward: addr.ward || "",
      district: addr.district || "",
      province: addr.province || "",
    })
  }

  function parseAddressFromFull(fullAddress) {
    const parts = (fullAddress || "").split(",").map((p) => p.trim()).filter(Boolean)
    return {
      street: parts[0] || fullAddress || "",
      ward: parts[1] || "Chưa rõ",
      district: parts[2] || "Chưa rõ",
      province: parts[3] || "Chưa rõ",
    }
  }

  async function ensureAddressId() {
    if (selectedAddressId) return Number(selectedAddressId)

    const recipient_name = addressForm.recipient_name.trim()
    const recipient_phone = addressForm.recipient_phone.trim()
    const full_address = addressForm.full_address.trim()

    if (!recipient_name || !recipient_phone || !full_address) {
      throw new Error("Vui lòng nhập họ tên, số điện thoại và địa chỉ.")
    }

    const fallback = parseAddressFromFull(full_address)
    const payload = {
      recipient_name,
      recipient_phone,
      full_address,
      street: addressForm.street.trim() || fallback.street,
      ward: addressForm.ward.trim() || fallback.ward,
      district: addressForm.district.trim() || fallback.district,
      province: addressForm.province.trim() || fallback.province,
    }

    const created = await api.post("order-addresses/", payload)
    const addr = created.data
    setAddresses((prev) => [addr, ...prev])
    setSelectedAddressId(String(addr.id))
    return addr.id
  }

  async function placeOrder() {
    if (!cartCode) {
      showToast("Không tìm thấy giỏ hàng.", "error")
      return
    }
    if (cartItems.length === 0) {
      showToast("Giỏ hàng trống.", "error")
      return
    }
    if (hasUnavailable) {
      showToast("Vui lòng xóa sản phẩm không khả dụng trước khi thanh toán.", "error")
      return
    }

    setPlacingOrder(true)
    try {
      const addressId = await ensureAddressId()

      const res = await api.post("checkout/", {
        address_id: addressId,
        shipping_method_code: shippingMethodCode,
        payment_method: paymentMethod,
      })

      const code = res.data?.code
      if (code && paymentMethod === "BANK_TRANSFER") {
        showToast("Đơn hàng đã được tạo, vui lòng quét QR để hoàn tất thanh toán.", "success")
        navigate(`/payment/qr/${code}`, { state: { order: res.data } })
      } else if (code) {
        setCartItems([])
        if (setNumCartItems) setNumCartItems(0)
        showToast(`Đặt hàng thành công (${code}).`, "success")
        navigate(`/orders/${code}`)
      } else {
        setCartItems([])
        if (setNumCartItems) setNumCartItems(0)
        showToast("Đặt hàng thành công.", "success")
        navigate("/profile")
      }
    } catch (err) {
      const msg = err.response?.data?.detail || "Không thể tạo đơn hàng."
      showToast(msg, "error")
    } finally {
      setPlacingOrder(false)
    }
  }

  if (loading) {
    return <div className="container py-5">Đang tải trang thanh toán...</div>
  }

  return (
    <section className="checkout-page py-4 py-lg-5">
      <div className="container">
        <div className="mb-4">
          <h1 className="checkout-title mb-1">Thanh toán</h1>
          <p className="text-muted mb-0">Kiểm tra thông tin đơn hàng trước khi xác nhận.</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-8">
            <div className="checkout-card mb-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h4 className="mb-0">Địa chỉ giao hàng</h4>
                {addresses.length > 0 && (
                  <select
                    className="form-select w-auto"
                    value={selectedAddressId}
                    onChange={(e) => selectAddress(e.target.value)}
                  >
                    <option value="">Địa chỉ mới</option>
                    {addresses.map((addr) => (
                      <option key={addr.id} value={addr.id}>
                        {addr.recipient_name} - {addr.recipient_phone}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Họ và tên</label>
                  <input
                    className="form-control"
                    value={addressForm.recipient_name}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, recipient_name: e.target.value }))}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Số điện thoại</label>
                  <input
                    className="form-control"
                    value={addressForm.recipient_phone}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, recipient_phone: e.target.value }))}
                    placeholder="0901234567"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label">Địa chỉ chi tiết</label>
                  <input
                    className="form-control"
                    value={addressForm.full_address}
                    onChange={(e) => setAddressForm((prev) => ({ ...prev, full_address: e.target.value }))}
                    placeholder="72 Lê Thanh Tôn, Quận 1, TP.HCM"
                  />
                </div>
              </div>
            </div>

            <div className="checkout-card mb-4">
              <h4 className="mb-3">Phương thức thanh toán</h4>
              <div className="checkout-option" onClick={() => setPaymentMethod("CASH") }>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "CASH"}
                  onChange={() => setPaymentMethod("CASH")}
                />
                <div>
                  <div className="fw-semibold">Thanh toán khi nhận hàng (COD)</div>
                  <small className="text-muted">Thanh toán khi nhận hàng.</small>
                </div>
              </div>
              <div className="checkout-option" onClick={() => setPaymentMethod("BANK_TRANSFER") }>
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "BANK_TRANSFER"}
                  onChange={() => setPaymentMethod("BANK_TRANSFER")}
                />
                <div>
                  <div className="fw-semibold">Chuyển khoản ngân hàng</div>
                  <small className="text-muted">Chuyển khoản ngân hàng.</small>
                </div>
              </div>

              <div className="mt-3">
                <label className="form-label">Phương thức vận chuyển</label>
                <select
                  className="form-select"
                  value={shippingMethodCode}
                  onChange={(e) => setShippingMethodCode(e.target.value)}
                >
                  {shippingMethods.map((method) => (
                    <option key={method.id ?? method.code} value={method.code}>
                      {getShippingMethodLabel(method)} ({formatCurrencyVND(method.base_cost)})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="checkout-card">
              <h4 className="mb-3">Sản phẩm của bạn</h4>
              <div className="d-flex flex-column gap-3">
                {cartItems.map((item) => {
                  const imageUrl = item.image ? `${BASE_URL}${item.image}` : ""
                  const price = Number(item.subtotal ?? item.total ?? ((item.price_at_add ?? item.price ?? 0) * (item.quantity || 0)))
                  return (
                    <div className="checkout-product" key={item.id}>
                      <img src={imageUrl} alt={item.name} />
                      <div className="flex-grow-1">
                        <div className="fw-semibold">{item.name}</div>
                        <small className="text-muted">Số lượng: {item.quantity}</small>
                      </div>
                      <div className="fw-semibold">{formatCurrencyVND(price)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="checkout-summary sticky-lg-top">
              <h4 className="mb-3">Tóm tắt đơn hàng</h4>
              <div className="d-flex justify-content-between mb-2">
                <span>Tạm tính</span>
                <span>{formatCurrencyVND(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3">
                <span>Phí vận chuyển</span>
                <span>{formatCurrencyVND(estimatedShippingFee)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4 fs-5 fw-bold">
                <span>Tổng cộng</span>
                <span>{formatCurrencyVND(estimatedTotal)}</span>
              </div>
              <button
                className="btn btn-success w-100"
                onClick={placeOrder}
                disabled={placingOrder || cartItems.length === 0 || hasUnavailable}
              >
                {placingOrder ? "Đang xử lý..." : "Đặt hàng"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutPage