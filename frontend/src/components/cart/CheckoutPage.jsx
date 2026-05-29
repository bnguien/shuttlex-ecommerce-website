import { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api, { BASE_URL } from "../../api"
import { formatCurrencyVND } from "../../utils/format"
import { useToast } from "../ui/Toast"
import "./CheckoutPage.css"
import AddressFormModal from "../address/AddressFormModal"

function CheckoutPage({ setNumCartItems }) {
  const navigate = useNavigate()
  const location = useLocation()
  const showToast = useToast()

  const selectedItemIds = location.state?.selectedItems || []

  const [loading, setLoading] = useState(true)
  const [placingOrder, setPlacingOrder] = useState(false)

  const [cartItems, setCartItems] = useState([])
  const [shippingMethods, setShippingMethods] = useState([])
  const [paymentMethod, setPaymentMethod] = useState("CASH")
  const [shippingMethodCode, setShippingMethodCode] = useState("GHN")
  const [dynamicShippingFee, setDynamicShippingFee] = useState(0)

  const [userAddresses, setUserAddresses] = useState([])
  const [selectedAddress, setSelectedAddress] = useState(null)
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false)
  const [editingAddress, setEditingAddress] = useState(false)
  
  const [isGift, setIsGift] = useState(false)

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
      api.get("addresses/"),
      api.get("vouchers/"),
    ])
      .then(([cartRes, methodRes, addressRes, voucherRes]) => {
        if (cancelled) return

        let items = cartRes.data?.items || []
        if (selectedItemIds.length > 0) {
            items = items.filter(item => selectedItemIds.includes(item.id))
        }
        setCartItems(items)

        const methods = methodRes.data || []
        setShippingMethods(methods)
        if (methods.length > 0) {
          setShippingMethodCode((prev) => prev || methods[0].code)
        }

        const allAddresses = addressRes.data || []
        setUserAddresses(allAddresses)

        const vouchers = Array.isArray(voucherRes.data) ? voucherRes.data : (voucherRes.data?.results || [])
        setAvailableVouchers(vouchers)

        if (allAddresses.length > 0) {
          const defaultAddr = allAddresses.find(a => a.is_default) || allAddresses[0];
          setSelectedAddress(defaultAddr);
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

  useEffect(() => {
    if (selectedAddress && selectedAddress.latitude && subtotal > 0) {
      api.post('calculate-shipping-fee/', {
          latitude: selectedAddress.latitude,
          longitude: selectedAddress.longtitude,
          cart_total: subtotal
      }).then(res => {
          setDynamicShippingFee(res.data.shipping_fee);
      }).catch(err => {
          console.error("Lỗi tính phí ship:", err);
      });
    } else {
      setDynamicShippingFee(0);
    }
  }, [selectedAddress, subtotal]);

  // Vô hiệu hóa COD nếu là quà tặng
  useEffect(() => {
    if (isGift && paymentMethod === 'CASH') {
        setPaymentMethod('BANK_TRANSFER');
    }
  }, [isGift]);

  const currentShipping = useMemo(() => {
    return shippingMethods.find((m) => String(m.code) === String(shippingMethodCode))
  }, [shippingMethodCode, shippingMethods])


  const estimatedShippingFee = dynamicShippingFee > 0 ? dynamicShippingFee : Number(currentShipping?.base_cost ?? 0)
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


  async function ensureAddressId() {
    if (!selectedAddress) {
      throw new Error("Vui lòng chọn địa chỉ giao hàng.")
    }

    const payload = {
      recipient_name: selectedAddress.receiver_name,
      recipient_phone: selectedAddress.phone,
      full_address: selectedAddress.full_address || `${selectedAddress.street_detail}, ${selectedAddress.ward}, ${selectedAddress.province}`,
      street: selectedAddress.street_detail,
      ward: selectedAddress.ward,
      district: selectedAddress.ward, 
      province: selectedAddress.province,
      latitude: selectedAddress.latitude,
      longitude: selectedAddress.longtitude
    }

    const created = await api.post("order-addresses/", payload)
    return created.data.id
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
        is_gift: isGift,
        item_ids: selectedItemIds.length > 0 ? selectedItemIds : undefined,
      })

      const code = res.data?.code
      if (code && paymentMethod === "BANK_TRANSFER") {
        setCartItems([])
        if (setNumCartItems) setNumCartItems(0)
        window.dispatchEvent(new Event("cart:refresh"))
        showToast("Đơn hàng đã được tạo, vui lòng quét QR để hoàn tất thanh toán.", "success")
        navigate(`/payment/qr/${code}`, { state: { order: res.data } })
      } else if (code) {
        setCartItems([])
        if (setNumCartItems) setNumCartItems(0)
        window.dispatchEvent(new Event("cart:refresh"))
        showToast(`Đặt hàng thành công (${code}).`, "success")
        navigate(`/orders/${code}`)
      } else {
        setCartItems([])
        if (setNumCartItems) setNumCartItems(0)
        window.dispatchEvent(new Event("cart:refresh"))
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
      <div className="container checkout-shell">
        <div className="mb-4">
          <h1 className="checkout-title mb-1">Thanh toán</h1>
          <p className="checkout-subtitle mb-0">Hoàn tất đơn hàng của bạn với bước cuối cùng.</p>
        </div>

        <div className="row g-4">
          <div className="col-xl-7 col-lg-8">
            <article className="checkout-card checkout-block mb-4">
              <header className="checkout-section-header mb-3">
                <h4 className="mb-0">Thông tin giao hàng</h4>
                <div className="d-flex gap-3">
                  {userAddresses.length > 0 && (
                    <button
                      type="button"
                      className="checkout-text-link"
                      onClick={() => setEditingAddress((prev) => !prev)}
                    >
                      {editingAddress ? "Đóng" : "Thay đổi"}
                    </button>
                  )}
                  <button
                    type="button"
                    className="checkout-text-link"
                    style={{ color: "#0d6efd" }}
                    onClick={() => {
                      if (userAddresses.length >= 5) {
                        showToast("Sổ địa chỉ của bạn đã đầy (tối đa 5). Vui lòng Sửa hoặc Xóa bớt ở trang cá nhân.", "warning");
                        return;
                      }
                      setIsAddressModalOpen(true);
                    }}
                  >
                    + Thêm mới
                  </button>
                </div>
              </header>

              {!editingAddress && selectedAddress ? (
                <div className="checkout-address-card">
                  <div className="checkout-address-name">{selectedAddress.receiver_name}</div>
                  <div className="checkout-address-phone">{selectedAddress.phone}</div>
                  <div className="checkout-address-full">{selectedAddress.full_address}</div>
                </div>
              ) : !editingAddress && !selectedAddress ? (
                <div className="alert alert-warning mb-0">Vui lòng thêm địa chỉ giao hàng.</div>
              ) : null}

              {editingAddress && (
                <div className="mb-3 mt-3">
                  <label className="form-label text-muted small">Chọn địa chỉ từ Sổ địa chỉ của bạn:</label>
                  <div className="d-flex flex-column gap-2">
                    {userAddresses.map((addr) => (
                      <div 
                        key={addr.id} 
                        className={`p-3 border rounded ${selectedAddress?.id === addr.id ? 'border-success bg-success-subtle' : ''}`}
                        style={{ cursor: "pointer", transition: "0.2s" }}
                        onClick={() => {
                          setSelectedAddress(addr);
                          setEditingAddress(false);
                        }}
                      >
                        <div className="fw-bold">{addr.receiver_name} - {addr.phone} {addr.is_default && <span className="badge bg-success ms-2">Mặc định</span>}</div>
                        <div className="text-muted small mt-1">{addr.full_address}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </article>

            <article className="checkout-card checkout-block mb-4">
              <header className="checkout-section-header mb-3">
                <h4 className="mb-0">Tặng quà</h4>
              </header>
              <div className="form-check d-flex align-items-center gap-2">
                <input 
                  className="form-check-input mt-0" 
                  type="checkbox" 
                  id="giftCheckbox" 
                  checked={isGift}
                  onChange={(e) => {
                      setIsGift(e.target.checked);
                      if (e.target.checked && paymentMethod === 'CASH') {
                          showToast("Đơn hàng quà tặng shop sẽ chuẩn bị cẩn thận hơn, vui lòng thanh toán trước nha.", "info");
                      }
                  }}
                  style={{ width: "1.2rem", height: "1.2rem", cursor: "pointer" }}
                />
                <label className="form-check-label ms-1" htmlFor="giftCheckbox" style={{ fontSize: "0.95rem", color: "#333", cursor: "pointer" }}>
                  Đánh dấu đơn hàng này là quà tặng (Shop sẽ nâng niu, tri ân và đóng gói đặc biệt hơn)
                </label>
              </div>
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
                    className={`checkout-choice-card checkout-choice-card-payment ${paymentMethod === "CASH" ? "is-active" : ""} ${isGift ? 'opacity-50' : ''}`}
                    onClick={() => {
                        if (!isGift) setPaymentMethod("CASH")
                        else showToast("Vui lòng thanh toán trước đối với đơn hàng Quà tặng.", "warning")
                    }}
                    style={isGift ? { cursor: 'not-allowed' } : {}}
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

              <div className="checkout-products-scroll mb-3">
                {cartItems.map((item, index) => (
                  <div key={index} className="checkout-product preview mb-2">
                    <img src={item.image ? `${BASE_URL}${item.image}` : ""} alt={item.name} />
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{item.name}</div>
                      <small className="text-muted">
                        {item.size ? `Size: ${item.size}` : ""}
                        {item.color ? ` | Màu: ${item.color}` : ""}
                        {` | SL: ${item.quantity}`}
                      </small>
                      <div className="checkout-item-price">
                        {formatCurrencyVND(Number(item.subtotal ?? item.total ?? 0))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

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

      <AddressFormModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)}
        onSaved={() => {
          api.get("addresses/").then(res => {
             setUserAddresses(res.data);
             if (res.data.length > 0) {
                setSelectedAddress(res.data.find(a => a.is_default) || res.data[0]);
             }
          });
        }}
      />
    </section>
  )
}

export default CheckoutPage
