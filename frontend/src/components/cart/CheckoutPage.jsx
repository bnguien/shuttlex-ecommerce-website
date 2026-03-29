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
  const [editingAddress, setEditingAddress] = useState(false)

  const [addressForm, setAddressForm] = useState({
    recipient_name: "",
    recipient_phone: "",
    full_address: "",
    street: "",
    ward: "",
    district: "",
    province: "",
  })

  const [availableVouchers, setAvailableVouchers] = useState([])
  const [showVoucherPicker, setShowVoucherPicker] = useState(false)
  const [productVoucherCode, setProductVoucherCode] = useState("")
  const [shippingVoucherCode, setShippingVoucherCode] = useState("")
  const [applyingProductVoucher, setApplyingProductVoucher] = useState(false)
  const [applyingShippingVoucher, setApplyingShippingVoucher] = useState(false)
  const [productDiscountAmount, setProductDiscountAmount] = useState(0)
  const [shippingDiscountAmount, setShippingDiscountAmount] = useState(0)
  const [appliedProductVoucher, setAppliedProductVoucher] = useState(null)
  const [appliedShippingVoucher, setAppliedShippingVoucher] = useState(null)

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
      api.get("vouchers/"),
    ])
      .then(([cartRes, methodRes, addressRes, voucherRes]) => {
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

        const vouchers = Array.isArray(voucherRes.data) ? voucherRes.data : (voucherRes.data?.results || [])
        setAvailableVouchers(vouchers)

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

  const selectedAddress = useMemo(() => {
    if (!selectedAddressId) return null
    return addresses.find((a) => String(a.id) === String(selectedAddressId)) || null
  }, [addresses, selectedAddressId])

  const estimatedShippingFee = Number(currentShipping?.base_cost ?? 0)
  const effectiveShippingDiscount = Math.min(shippingDiscountAmount, estimatedShippingFee)
  const estimatedTotal = Math.max(0, subtotal + estimatedShippingFee - productDiscountAmount - effectiveShippingDiscount)

  const hasUnavailable = cartItems.some((item) => item.is_available === false)

  function getShippingMethodLabel(method) {
    const code = String(method?.code || "").toUpperCase()
    if (code === "GHN") return "Giao Hàng Nhanh (GHN)"
    if (code === "GHHT") return "Giao Hàng Hỏa Tốc (GHHT)"
    if (code === "GHTK") return "Giao Hàng Tiết Kiệm (GHTK)"
    return method?.name || code
  }

  function normalizeVoucherType(voucher) {
    const source = voucher?.voucher_type
    if (typeof source === "string") return source.toUpperCase()
    if (typeof source === "object") return String(source?.code || "").toUpperCase()
    return ""
  }

  const productVoucherSuggestions = useMemo(() => {
    const now = new Date()
    return availableVouchers.filter((voucher) => {
      if (normalizeVoucherType(voucher) !== "PRODUCT") return false
      const start = voucher?.start_date ? new Date(voucher.start_date) : null
      const end = voucher?.end_date ? new Date(voucher.end_date) : null
      if (start && !Number.isNaN(start.getTime()) && now < start) return false
      if (end && !Number.isNaN(end.getTime()) && now > end) return false
      return true
    })
  }, [availableVouchers])

  const shippingVoucherSuggestions = useMemo(() => {
    const now = new Date()
    return availableVouchers.filter((voucher) => {
      if (normalizeVoucherType(voucher) !== "SHIPPING") return false
      const start = voucher?.start_date ? new Date(voucher.start_date) : null
      const end = voucher?.end_date ? new Date(voucher.end_date) : null
      if (start && !Number.isNaN(start.getTime()) && now < start) return false
      if (end && !Number.isNaN(end.getTime()) && now > end) return false
      return true
    })
  }, [availableVouchers])

  async function applyVoucherCode(kind, explicitCode = "") {
    const isShipping = kind === "shipping"
    const rawCode = explicitCode || (isShipping ? shippingVoucherCode : productVoucherCode)
    const code = rawCode.trim().toUpperCase()

    if (!code) {
      showToast("Vui lòng nhập mã voucher.", "error")
      return
    }

    isShipping ? setApplyingShippingVoucher(true) : setApplyingProductVoucher(true)

    try {
      const payload = {
        code,
        order_subtotal: Number(subtotal.toFixed(2)),
        shipping_fee: Number(estimatedShippingFee.toFixed(2)),
      }
      const res = await api.post("vouchers/apply/", payload)

      const discountAmount = Number(res.data?.discount_amount || 0)
      const voucher = res.data || null
      const voucherType = normalizeVoucherType(voucher)

      if (isShipping && voucherType !== "SHIPPING") {
        throw new Error("Mã này không phải voucher vận chuyển.")
      }
      if (!isShipping && voucherType !== "PRODUCT") {
        throw new Error("Mã này không phải voucher giảm giá sản phẩm.")
      }

      if (isShipping) {
        setShippingVoucherCode(code)
        setAppliedShippingVoucher(voucher)
        setShippingDiscountAmount(discountAmount)
      } else {
        setProductVoucherCode(code)
        setAppliedProductVoucher(voucher)
        setProductDiscountAmount(discountAmount)
      }

      showToast("Áp dụng voucher thành công!", "success")

    } catch (err) {
      const msg = err?.response?.data?.error
        || err?.response?.data?.detail
        || err?.response?.data?.non_field_errors?.[0]
        || err?.message
        || "Không thể áp dụng voucher."

      showToast(msg, "error")

      if (isShipping) {
        setAppliedShippingVoucher(null)
        setShippingDiscountAmount(0)
      } else {
        setAppliedProductVoucher(null)
        setProductDiscountAmount(0)
      }
    } finally {
      isShipping ? setApplyingShippingVoucher(false) : setApplyingProductVoucher(false)
    }
  }
  function removeVoucher(kind) {
    if (kind === "shipping") {
      setShippingVoucherCode("")
      setAppliedShippingVoucher(null)
      setShippingDiscountAmount(0)
      return
    }

    setProductVoucherCode("")
    setAppliedProductVoucher(null)
    setProductDiscountAmount(0)
  }

  useEffect(() => {
    if (appliedProductVoucher) {
      setAppliedProductVoucher(null)
      setProductDiscountAmount(0)
      showToast("Giỏ hàng thay đổi, vui lòng áp dụng lại voucher sản phẩm.", "warning")
    }
  }, [subtotal])
  useEffect(() => {
    if (!appliedShippingVoucher) return

    const recalculate = async () => {
      try {
        const res = await api.post("vouchers/apply/", {
          code: appliedShippingVoucher.code,
          order_subtotal: Number(subtotal.toFixed(2)),
          shipping_fee: Number(estimatedShippingFee.toFixed(2)),
        })
        setShippingDiscountAmount(Number(res.data?.discount_amount || 0))
      } catch {
        setAppliedShippingVoucher(null)
        setShippingDiscountAmount(0)
        showToast("Voucher vận chuyển không còn hợp lệ.", "error")
      }
    }

    recalculate()
  }, [estimatedShippingFee])

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
    setEditingAddress(false)
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
    if (selectedAddressId && !editingAddress) return Number(selectedAddressId)

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
    setEditingAddress(false)
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
        product_voucher_code: appliedProductVoucher?.code || undefined,
        shipping_voucher_code: appliedShippingVoucher?.code || undefined,
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

  const featuredCartItem = cartItems[0]

  return (
    <section className="checkout-page py-4 py-lg-5">
      <div className="container checkout-shell">
        <div className="mb-4">
          <h1 className="checkout-title mb-1">Thanh toán</h1>
          <p className="checkout-subtitle mb-0">Hoàn tất đơn hàng của bạn với bước cuối cùng.</p>
        </div>

        <div className="row g-4 align-items-start">
          <div className="col-xl-7 col-lg-8">
            <article className="checkout-card checkout-block mb-4">
              <header className="checkout-section-header mb-3">
                <h4 className="mb-0">Thông tin giao hàng</h4>
                {addresses.length > 0 && (
                  <button
                    type="button"
                    className="checkout-text-link"
                    onClick={() => setEditingAddress((prev) => !prev)}
                  >
                    {editingAddress ? "Đóng" : "Thay đổi"}
                  </button>
                )}
              </header>

              {!editingAddress && selectedAddress && (
                <div className="checkout-address-card">
                  <div className="checkout-address-name">{selectedAddress.recipient_name}</div>
                  <div className="checkout-address-phone">{selectedAddress.recipient_phone}</div>
                  <div className="checkout-address-full">{selectedAddress.full_address}</div>
                </div>
              )}

              {(editingAddress || !selectedAddress) && (
                <>
                  {addresses.length > 0 && (
                    <div className="mb-3">
                      <label className="form-label">Chon dia chi da luu</label>
                      <select
                        className="form-select"
                        value={selectedAddressId}
                        onChange={(e) => selectAddress(e.target.value)}
                      >
                        <option value="">Tạo địa chỉ mới</option>
                        {addresses.map((addr) => (
                          <option key={addr.id} value={addr.id}>
                            {addr.recipient_name} - {addr.recipient_phone}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                        placeholder="0392663097"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label">Địa chỉ chi tiết</label>
                      <input
                        className="form-control"
                        value={addressForm.full_address}
                        onChange={(e) => setAddressForm((prev) => ({ ...prev, full_address: e.target.value }))}
                        placeholder="K32/58 Ngô Sĩ Liên, Hòa Khánh Bắc, Liên Chiểu, Đà Nẵng"
                      />
                    </div>
                  </div>
                </>
              )}
            </article>

            <article className="checkout-card checkout-block mb-4">
              <header className="checkout-section-header mb-3">
                <h4 className="mb-0">Ưu đãi & Mã giảm giá</h4>
                <button
                  type="button"
                  className="checkout-pill-toggle"
                  onClick={() => setShowVoucherPicker((prev) => !prev)}
                >
                  {showVoucherPicker ? "Ẩn voucher" : "Chọn voucher"}
                </button>
              </header>

              <div className="checkout-voucher-input-row mb-2">
                <input
                  className="form-control"
                  value={productVoucherCode}
                  onChange={(e) => setProductVoucherCode(e.target.value)}
                  placeholder="Nhập mã voucher sản phẩm"
                />
                <button
                  type="button"
                  className="btn btn-success"
                  onClick={() => applyVoucherCode("product")}
                  disabled={applyingProductVoucher || subtotal <= 0}
                >
                  {applyingProductVoucher ? "Đang áp..." : "Áp dụng"}
                </button>
              </div>

              <div className="checkout-voucher-input-row mb-3">
                <input
                  className="form-control"
                  value={shippingVoucherCode}
                  onChange={(e) => setShippingVoucherCode(e.target.value)}
                  placeholder="Nhập mã freeship"
                />
                <button
                  type="button"
                  className="btn btn-outline-success"
                  onClick={() => applyVoucherCode("shipping")}
                  disabled={applyingShippingVoucher || estimatedShippingFee <= 0}
                >
                  {applyingShippingVoucher ? "Đang áp..." : "Áp dụng"}
                </button>
              </div>

              {showVoucherPicker && (
                <div className="checkout-voucher-suggestions mb-3">
                  <div className="checkout-voucher-group mb-2">
                    <div className="checkout-voucher-group-title">Voucher sản phẩm</div>
                    <div className="d-flex flex-wrap gap-2">
                      {productVoucherSuggestions.length === 0 && <span className="text-muted small">Không có voucher phù hợp</span>}
                      {productVoucherSuggestions.map((voucher) => (
                        <button
                          key={voucher.id ?? voucher.code}
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setProductVoucherCode(voucher.code)
                            applyVoucherCode("product", voucher.code)
                          }}
                        >
                          {voucher.code}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="checkout-voucher-group">
                    <div className="checkout-voucher-group-title">Voucher vận chuyển</div>
                    <div className="d-flex flex-wrap gap-2">
                      {shippingVoucherSuggestions.length === 0 && <span className="text-muted small">Không có voucher phù hợp</span>}
                      {shippingVoucherSuggestions.map((voucher) => (
                        <button
                          key={voucher.id ?? voucher.code}
                          type="button"
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => {
                            setShippingVoucherCode(voucher.code)
                            applyVoucherCode("shipping", voucher.code)
                          }}
                        >
                          {voucher.code}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex flex-column gap-2">
                {appliedProductVoucher && (
                  <div className="checkout-voucher-chip">
                    <div>
                      <div className="checkout-voucher-chip-code">{appliedProductVoucher.code}</div>
                      <div className="checkout-voucher-chip-desc">
                        {appliedProductVoucher.description?.trim() ? appliedProductVoucher.description : "Giảm giá cho đơn hàng của bạn"}
                      </div>
                    </div>
                    <button type="button" className="checkout-chip-remove" onClick={() => removeVoucher("product")}>x</button>
                  </div>
                )}
                {appliedShippingVoucher && (
                  <div className="checkout-voucher-chip checkout-voucher-chip-shipping">
                    <div>
                      <div className="checkout-voucher-chip-code">{appliedShippingVoucher.code}</div>
                      <div className="checkout-voucher-chip-desc">
                        {appliedShippingVoucher.description?.trim() ? appliedShippingVoucher.description : "Miễn phí vận chuyển toàn quốc"}
                      </div>
                    </div>
                    <button type="button" className="checkout-chip-remove" onClick={() => removeVoucher("shipping")}>x</button>
                  </div>
                )}
              </div>
            </article>

            <article className="checkout-card checkout-block mb-4">
              <header className="checkout-section-header mb-3">
                <h4 className="mb-0">Phương thức vận chuyển</h4>
              </header>
              <div className="d-flex flex-column gap-2">
                {shippingMethods.map((method) => {
                  const isActive = String(shippingMethodCode) === String(method.code)
                  return (
                    <button
                      type="button"
                      key={method.id ?? method.code}
                      className={`checkout-choice-card ${isActive ? "is-active" : ""}`}
                      onClick={() => setShippingMethodCode(method.code)}
                    >
                      <div>
                        <div className="checkout-choice-title-wrap">
                          <span className="checkout-choice-title">{getShippingMethodLabel(method)}</span>
                          {String(method.code).toUpperCase() === "GHN" && (
                            <span className="checkout-fast-badge">Nhanh nhất</span>
                          )}
                        </div>
                        <div className="checkout-choice-subtitle">Dự kiến giao: {method.estimate_delivery_days || 1} - {(method.estimate_delivery_days || 1) + 2} ngày</div>
                      </div>
                      <div className="checkout-choice-right">
                        <div className="checkout-choice-price">{formatCurrencyVND(method.base_cost)}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </article>

            <article className="checkout-card checkout-block">
              <header className="checkout-section-header mb-3">
                <h4 className="mb-0">Phương thức thanh toán</h4>
              </header>

              <div className="row g-2">
                <div className="col-md-6">
                  <button
                    type="button"
                    className={`checkout-choice-card checkout-choice-card-payment ${paymentMethod === "CASH" ? "is-active" : ""}`}
                    onClick={() => setPaymentMethod("CASH")}
                  >
                    <div>
                      <div className="checkout-choice-title">Thanh toán khi nhận hàng (COD)</div>
                      <div className="checkout-choice-subtitle">Trả tiền mặt khi giao hàng</div>
                    </div>
                  </button>
                </div>
                <div className="col-md-6">
                  <button
                    type="button"
                    className={`checkout-choice-card checkout-choice-card-payment ${paymentMethod === "BANK_TRANSFER" ? "is-active" : ""}`}
                    onClick={() => setPaymentMethod("BANK_TRANSFER")}
                  >
                    <div>
                      <div className="checkout-choice-title">Chuyển khoản ngân hàng</div>
                      <div className="checkout-choice-subtitle">Xử lý nhanh qua mã QR</div>
                    </div>
                  </button>
                </div>
              </div>
            </article>
          </div>

          <div className="col-xl-5 col-lg-4">
            <aside className="checkout-summary sticky-lg-top">
              <h4 className="mb-3">Tóm tắt đơn hàng</h4>

              {featuredCartItem && (
                <div className="checkout-product preview mb-3">
                  <img src={featuredCartItem.image ? `${BASE_URL}${featuredCartItem.image}` : ""} alt={featuredCartItem.name} />
                  <div className="flex-grow-1">
                    <div className="fw-semibold">{featuredCartItem.name}</div>
                    <small className="text-muted">
                      {featuredCartItem.size ? `Size: ${featuredCartItem.size}` : ""}
                      {featuredCartItem.color ? ` | Màu: ${featuredCartItem.color}` : ""}
                    </small>
                    <div className="checkout-item-price">
                      {formatCurrencyVND(Number(featuredCartItem.subtotal ?? featuredCartItem.total ?? 0))}
                    </div>
                  </div>
                </div>
              )}

              <div className="d-flex justify-content-between mb-2 checkout-price-row">
                <span>Tạm tính</span>
                <span>{formatCurrencyVND(subtotal)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 checkout-price-row">
                <span>Phí vận chuyển ({currentShipping?.code || "GHN"})</span>
                <span>{formatCurrencyVND(estimatedShippingFee)}</span>
              </div>
              <div className="d-flex justify-content-between mb-2 checkout-price-row discount">
                <span>Giảm giá voucher</span>
                <span>-{formatCurrencyVND(productDiscountAmount)}</span>
              </div>
              <div className="d-flex justify-content-between mb-3 checkout-price-row discount">
                <span>Giảm giá vận chuyển</span>
                <span>-{formatCurrencyVND(effectiveShippingDiscount)}</span>
              </div>
              <hr />
              <div className="d-flex justify-content-between mb-4 checkout-total-row">
                <div>
                  <span>TỔNG CỘNG</span>
                  <div className="checkout-vat-note">(Đã bao gồm VAT)</div>
                </div>
                <span className="checkout-total-value">{formatCurrencyVND(estimatedTotal)}</span>
              </div>
              <button
                className="btn checkout-place-order-btn w-100"
                onClick={placeOrder}
                disabled={placingOrder || cartItems.length === 0 || hasUnavailable}
              >
                {placingOrder ? "Đang xử lý..." : "ĐẶT HÀNG NGAY"}
              </button>

              <div className="checkout-summary-note mt-3">
                Bằng cách đặt hàng, bạn đồng ý với điều khoản dịch vụ của ShuttleX.
              </div>

              <div className="checkout-benefits mt-3">
                <div className="checkout-benefit-item">Chính hãng 100%</div>
                <div className="checkout-benefit-item">Đổi trả 7 ngày</div>
                <div className="checkout-benefit-item">Hỗ trợ 24/7</div>
              </div>

              {hasUnavailable && (
                <div className="alert alert-warning mt-3 mb-0">
                  Có sản phẩm không khả dụng trong giỏ. Vui lòng quay lại giỏ hàng để cập nhật.
                </div>
              )}
            </aside>
          </div>
        </div>
      </div>
    </section>
  )
}

export default CheckoutPage
