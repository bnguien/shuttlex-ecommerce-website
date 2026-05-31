import RelatedProducts from './RelatedProducts'
import ProductReviews from './ProductReviews'
import ProductPagePlaceHolder from './ProductPagePlaceHolder'
import { useParams, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BASE_URL } from '../../api'
import api from '../../api'
import { formatCurrencyVND } from '../../utils/format'
import { useToast } from '../ui/Toast'
import { useAuthStore } from '../../store/authStore'

function ProductDetailPage({ setNumCartItems }) {
    const { slug } = useParams()
    const navigate = useNavigate()
    const showToast = useToast()
    const isAuthenticated = useAuthStore(state => state.isAuthenticated)
    const [product, setProduct] = useState({})
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [quantity, setQuantity] = useState(1)
    const [similarProducts, setSimilarProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [inCart, setInCart] = useState(false)
    const [adding, setAdding] = useState(false)
    const [cartCode, setCartCode] = useState(() => localStorage.getItem("cart_code"))
    const [promotionHighlights, setPromotionHighlights] = useState([])

    const getDisplayPrice = () => {
        const fs = product.flash_sale_info
        const flashBlock = fs ? (
            <div className="d-flex align-items-center gap-2">
                <span className="text-decoration-line-through text-muted">
                    {formatCurrencyVND(fs.original_price)}
                </span>
                <span className="text-danger fw-bold fs-4">
                    {formatCurrencyVND(fs.sale_price)}
                </span>
            </div>
        ) : null

        if (selectedVariant) {
            if (fs) return flashBlock
            const isSale = selectedVariant.is_on_sale || (
                selectedVariant.sale_price &&
                (!selectedVariant.sale_ends_at || new Date(selectedVariant.sale_ends_at) > new Date())
            )
            const originalPrice = Number(selectedVariant.price ?? product.base_price)
            const displayPrice = Number(selectedVariant.display_price ?? selectedVariant.sale_price ?? originalPrice)
            
            const showSale = isSale && displayPrice < originalPrice

            if (showSale) {
                return (
                    <div className="d-flex align-items-center gap-2">
                        <span className="text-decoration-line-through text-muted">
                            {formatCurrencyVND(originalPrice)}
                        </span>
                        <span className="text-danger fw-bold fs-4">
                            {formatCurrencyVND(displayPrice)}
                        </span>
                    </div>
                )
            }
            return <span className="fw-bold fs-4">{formatCurrencyVND(displayPrice)}</span>
        }

        if (fs) return flashBlock

        const { price_min, price_max, base_price, price: effectivePrice } = product
        if (price_min != null && price_max != null && String(price_min) !== String(price_max)) {
            return (
                <span className="fw-bold fs-4 text-primary">
                    {formatCurrencyVND(price_min)} – {formatCurrencyVND(price_max)}
                </span>
            )
        }
        return (
            <span className="fw-bold fs-4">
                {formatCurrencyVND(effectivePrice ?? price_min ?? base_price)}
            </span>
        )
    }

    useEffect(() => {
        if (!product.id) return
        const code = cartCode || localStorage.getItem("cart_code")
        if (!code) return
        let url = `product_in_cart?cart_code=${encodeURIComponent(code)}&product_id=${product.id}`
        if (selectedVariant?.id) url += `&variant_id=${selectedVariant.id}`
        api.get(url)
            .then((res) => setInCart(res.data.product_in_cart))
            .catch(() => setInCart(false))
    }, [cartCode, product.id, selectedVariant?.id])

    function add_item() {
        if (!isAuthenticated) {
            navigate("/login", { state: { from: `/product/${slug}` } })
            return
        }

        if (!product.id) return

        if (product.variants?.length > 0 && !selectedVariant) {
            showToast("Vui lòng chọn Size hoặc Màu.", "error")
            return
        }

        const payload = {
            cart_code: cartCode || undefined,
            product_id: product.id,
            variant_id: selectedVariant ? selectedVariant.id : null,
            quantity: quantity,
        }

        setAdding(true)
        api.post("add_item/", payload)
            .then((res) => {
                if (res.data?.cart_code) {
                    localStorage.setItem("cart_code", res.data.cart_code)
                    setCartCode(res.data.cart_code)
                }
                setInCart(true)
                if (setNumCartItems) setNumCartItems((n) => n + quantity)
                showToast("Đã thêm vào giỏ hàng.", "success")
            })
            .catch((err) => {
                const msg = err.response?.data?.detail || err.response?.data?.message || "Không thể thêm vào giỏ."
                showToast(msg, "error")
            })
            .finally(() => setAdding(false))
    }

    useEffect(() => {
        let cancelled = false
        setLoading(true)
        api.get(`product_detail/${slug}`)
            .then((res) => {
                if (!cancelled) {
                    setProduct(res.data)
                    setSimilarProducts(res.data.similar_products || [])
                    setSelectedVariant(null)
                }
            })
            .catch(() => {})
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [slug])

    useEffect(() => {
        if (!product?.id) {
            setPromotionHighlights([])
            return
        }

        let cancelled = false

        Promise.all([
            api.get("flash-sales/active/"),
            api.get("vouchers/"),
        ])
            .then(([flashRes, voucherRes]) => {
                if (cancelled) return

                const flashSales = Array.isArray(flashRes.data) ? flashRes.data : (flashRes.data?.results || [])
                const vouchers = Array.isArray(voucherRes.data) ? voucherRes.data : (voucherRes.data?.results || [])
                const now = new Date()
                const highlights = []

                let flashSaleVariant = null
                flashSales.forEach((sale) => {
                    const item = (sale.items || []).find(
                        (i) => Number(i.product) === Number(product.id)
                    )
                    if (item) {
                        let text = `FLASH SALE: ${sale.name} - giảm ${sale.discount_percent}% cho sản phẩm này`
                        if (item.variant) {
                            const v = (product.variants || []).find(v => v.id === item.variant)
                            if (v) {
                                const variantDesc = [v.size?.name, v.color].filter(Boolean).join(" - ")
                                text = `FLASH SALE: ${sale.name} - giảm ${sale.discount_percent}% cho ${variantDesc}`
                                flashSaleVariant = v
                            }
                        }
                        highlights.push({
                            id: `flash-${sale.id}-${item.id}`,
                            text: text,
                        })
                    }
                })

                vouchers.forEach((voucher) => {
                    const voucherTypeCode = typeof voucher.voucher_type === "object"
                        ? String(voucher.voucher_type?.code || "").toUpperCase()
                        : String(voucher.voucher_type || "").toUpperCase()
                    if (voucherTypeCode !== "PRODUCT") return

                    const start = voucher.start_date ? new Date(voucher.start_date) : null
                    const end = voucher.end_date ? new Date(voucher.end_date) : null
                    if (start && !Number.isNaN(start.getTime()) && now < start) return
                    if (end && !Number.isNaN(end.getTime()) && now > end) return

                    const discountTypeCode = typeof voucher.discount_type === "object"
                        ? String(voucher.discount_type?.code || "").toUpperCase()
                        : String(voucher.discount_type || "").toUpperCase()
                    const isPercent = discountTypeCode === "PERCENTAGE"
                    const discountText = isPercent
                        ? `giảm ${voucher.value}%`
                        : `giảm ${formatCurrencyVND(voucher.value)}`
                    highlights.push({
                        id: `voucher-${voucher.id ?? voucher.code}`,
                        text: `${voucher.code}: ${discountText}`,
                    })
                })

                setPromotionHighlights(highlights.slice(0, 4))
                if (flashSaleVariant) {
                    setSelectedVariant(prev => prev || flashSaleVariant)
                } else if (product.variants?.length > 0) {
                    const firstAvailable = product.variants.find(v => v.stock > 0) || product.variants[0]
                    setSelectedVariant(prev => prev || firstAvailable)
                }
            })
            .catch(() => {
                if (!cancelled) setPromotionHighlights([])
            })

        return () => {
            cancelled = true
        }
    }, [product?.id])

    if (loading) {
        return <ProductPagePlaceHolder />
    }

    return (
        <div>
            <section className="py-3">
                <div className="container px-4 px-lg-5 my-5">
                    <div className="row gx-4 gx-lg-5 align-items-center">
                        <div className="col-md-6">
                            <img
                                className="card-img-top mb-5 mb-md-0"
                                src={`${BASE_URL}${product.image}`}
                                alt="Product Image"
                            />
                        </div>
                        <div className="col-md-6">
                            <div className="small mb-2 text-muted">
                                SKU: 
                                <span className="text-uppercase fw-bold ms-1">
                                    {selectedVariant ? selectedVariant.sku : (product.sku || 'N/A')}
                                </span>
                            </div>
                            <h1 className="display-5 fw-bolder mb-2" style={{ color: "#222" }}>{product.name}</h1>
                            
                            {/* Top Rating & Sales Statistics Bar */}
                            <div className="d-flex align-items-center gap-3 mb-4 pb-3 border-bottom text-muted small" style={{ borderBottomColor: "#eaeaea" }}>
                                <div className="d-flex align-items-center gap-2">
                                    <span className="fw-bold text-dark fs-5" style={{ lineHeight: 1 }}>{product.average_rating ? Number(product.average_rating).toFixed(1) : '0.0'}</span>
                                    <div className="text-warning d-flex align-items-center">
                                        {Array.from({ length: 5 }).map((_, i) => (
                                            <i 
                                                key={i} 
                                                className={`bi-star-fill ${i < Math.round(product.average_rating || 0) ? 'text-warning' : 'text-secondary opacity-25'}`}
                                                style={{ fontSize: '1.05rem', marginRight: '1px' }}
                                            ></i>
                                        ))}
                                    </div>
                                </div>
                                <div className="border-start ps-3" style={{ borderColor: "#ddd !important" }}>
                                    <span className="fw-bold text-dark fs-6">{product.review_count || 0}</span>
                                    <span className="ms-1 text-muted">Đánh giá</span>
                                </div>
                                <div className="border-start ps-3" style={{ borderColor: "#ddd !important" }}>
                                    <span className="fw-bold text-dark fs-6">{product.sold_count || 0}</span>
                                    <span className="ms-1 text-muted">Đã bán</span>
                                </div>
                            </div>

                            <div className="fs-4 mb-4 fw-bold" style={{ color: "#029942" }}>
                                {getDisplayPrice()}
                            </div>

                            <p className="lead mb-4">
                                {product.description}
                            </p>

                            {promotionHighlights.length > 0 && (
                                <div className="mb-4 d-flex flex-column gap-2">
                                    {promotionHighlights.map((promotion) => (
                                        <div key={promotion.id} className="p-2 px-3 rounded-3 border border-success-subtle bg-success-subtle text-success-emphasis fw-semibold small">
                                            {promotion.text}
                                        </div>
                                    ))}
                                </div>
                            )}

                            {product.variants?.length > 0 && (
                                <div className="mb-4">
                                    <h6 className="fw-bold mb-3">Tùy chọn sản phẩm:</h6>
                                    <div className="d-flex flex-wrap gap-2">
                                        {product.variants.map((v) => (
                                            <button
                                                key={v.id}
                                                type="button"
                                                className={`btn btn-sm py-2 px-3 ${selectedVariant?.id === v.id ? 'btn-dark' : 'btn-outline-dark'}`}
                                                onClick={() => setSelectedVariant(v)}
                                                disabled={v.stock === 0}
                                            >
                                                {v.size_name || v.size?.name || v.size} {v.color}
                                                {v.stock === 0 && " (Hết hàng)"}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="d-flex align-items-center">
                                <div className="input-group me-3" style={{ width: "130px" }}>
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        type="button"
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        disabled={inCart || adding}
                                    >-</button>
                                    <input 
                                        type="number" 
                                        className="form-control text-center" 
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value)
                                            if (!isNaN(val) && val >= 1) setQuantity(val)
                                        }}
                                        min="1"
                                        disabled={inCart || adding}
                                    />
                                    <button 
                                        className="btn btn-outline-secondary" 
                                        type="button"
                                        onClick={() => setQuantity(q => q + 1)}
                                        disabled={inCart || adding}
                                    >+</button>
                                </div>
                                <button className="btn btn-dark flex-shrink-0"
                                    type="button"
                                    onClick={add_item}
                                    disabled={inCart || adding}
                                >
                                    <i className="bi-cart-fill me-1"></i>
                                    {inCart ? "Đã thêm vào giỏ" : "Thêm vào giỏ"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <ProductReviews product={product} />
            <RelatedProducts products={similarProducts} />
        </div>
    )
}

export default ProductDetailPage