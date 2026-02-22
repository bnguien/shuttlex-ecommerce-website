import RelatedProducts from './RelatedProducts'
import ProductPagePlaceHolder from './ProductPagePlaceHolder'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BASE_URL } from '../../api'
import api from '../../api'
import { formatCurrencyVND } from '../../utils/format'
import { useToast } from '../ui/Toast'

function ProductDetailPage({ setNumCartItems }) {
    const { slug } = useParams()
    const showToast = useToast()
    const [product, setProduct] = useState({})
    const [selectedVariant, setSelectedVariant] = useState(null)
    const [similarProducts, setSimilarProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [inCart, setInCart] = useState(false)
    const [adding, setAdding] = useState(false)
    const [cartCode, setCartCode] = useState(() => localStorage.getItem("cart_code"))

    const getDisplayPrice = () => {
        if (selectedVariant) {
            const isSale = selectedVariant.is_on_sale || (
                selectedVariant.sale_price &&
                (!selectedVariant.sale_ends_at || new Date(selectedVariant.sale_ends_at) > new Date())
            )
            const originalPrice = selectedVariant.price ?? product.base_price
            const displayPrice = selectedVariant.display_price ?? selectedVariant.sale_price ?? originalPrice
            if (isSale) {
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

        const { price_min, price_max, base_price } = product
        if (price_min != null && price_max != null && String(price_min) !== String(price_max)) {
            return <span className="fw-bold fs-4 text-primary">{formatCurrencyVND(price_min)} – {formatCurrencyVND(price_max)}</span>
        }
        return <span className="fw-bold fs-4">{formatCurrencyVND(price_min ?? base_price)}</span>
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
        if (!product.id) return

        if (product.variants?.length > 0 && !selectedVariant) {
            showToast("Vui lòng chọn Size hoặc Màu.", "error")
            return
        }

        const payload = {
            cart_code: cartCode || undefined,
            product_id: product.id,
            variant_id: selectedVariant ? selectedVariant.id : null,
            quantity: 1,
        }

        setAdding(true)
        api.post("add_item/", payload)
            .then((res) => {
                if (res.data?.cart_code) {
                    localStorage.setItem("cart_code", res.data.cart_code)
                    setCartCode(res.data.cart_code)
                }
                setInCart(true)
                if (setNumCartItems) setNumCartItems((n) => n + 1)
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
                            <div className="small mb-1 text-muted">
                                SKU: 
                                <span className="text-uppercase fw-bold">
                                    {selectedVariant ? selectedVariant.sku : (product.sku || 'N/A')}
                                </span>
                            </div>
                            <h1 className="display-5 fw-bolder">{product.name}</h1>
                            <div className="fs-5 mb-5">
                                {getDisplayPrice()}
                            </div>

                            <p className="lead mb-4">
                                {product.description}
                            </p>

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

                            <div className="d-flex">
                                <button className="btn btn-outline-dark flex-shrink-0"
                                    type="button"
                                    onClick={add_item}
                                    disabled={inCart || adding}
                                >
                                    <i className="bi-cart-fill me-1"></i>
                                    {inCart ? "Product added to Cart" : "Add to cart"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <RelatedProducts products={similarProducts} />
        </div>
    )
}

export default ProductDetailPage