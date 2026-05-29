import { useEffect, useState } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import api, { BASE_URL } from "../../api"
import { formatCurrencyVND } from "../../utils/format"

function PromotionsPage() {
    const location = useLocation()
    const navigate = useNavigate()
    const [flashSales, setFlashSales] = useState([])
    const [vouchers, setVouchers] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        let isMounted = true
        Promise.all([
            api.get("flash-sales/active/").catch(() => ({ data: [] })),
            api.get("vouchers/").catch(() => ({ data: [] }))
        ]).then(([flashRes, voucherRes]) => {
            if (isMounted) {
                setFlashSales(Array.isArray(flashRes.data) ? flashRes.data : (flashRes.data?.results || []))
                setVouchers(Array.isArray(voucherRes.data) ? voucherRes.data : (voucherRes.data?.results || []))
                setLoading(false)
            }
        }).catch(() => {
            if (isMounted) setLoading(false)
        })

        return () => { isMounted = false }
    }, [])

    useEffect(() => {
        if (!loading && location.hash) {
            const id = location.hash.substring(1)
            const element = document.getElementById(id)
            if (element) {
                setTimeout(() => {
                    element.scrollIntoView({ behavior: "smooth" })
                }, 100)
            }
        }
    }, [loading, location.hash])

    if (loading) {
        return <div className="container py-5 text-center">Đang tải thông tin khuyến mãi...</div>
    }

    return (
        <div className="container py-5">
            <h1 className="mb-5 text-center fw-bold">Chương Trình Khuyến Mãi</h1>

            {/* Section Flash Sale */}
            <section id="flash-sale" className="mb-5" style={{ scrollMarginTop: "100px" }}>
                <h2 className="mb-4 text-danger fw-bold border-bottom pb-2">
                    <i className="bi-lightning-charge-fill me-2"></i> Flash Sale
                </h2>
                {flashSales.length === 0 ? (
                    <p className="text-muted">Hiện tại không có chương trình Flash Sale nào.</p>
                ) : (
                    <div className="row g-4">
                        {flashSales.map(sale => (
                            <div key={sale.id} className="col-md-6 col-lg-4">
                                <div className="card h-100 border-danger shadow-sm">
                                    <div className="card-header bg-danger text-white fw-bold">
                                        {sale.name}
                                    </div>
                                    <div className="card-body">
                                        <p className="mb-2 fs-5">Giảm <strong>{sale.discount_percent}%</strong></p>
                                        <p className="text-muted small mb-0">
                                            Bắt đầu: {new Date(sale.start_time).toLocaleString("vi-VN")}
                                        </p>
                                        <p className="text-muted small mb-0">
                                            Kết thúc: {new Date(sale.end_time).toLocaleString("vi-VN")}
                                        </p>
                                    </div>
                                    <div className="card-footer bg-white border-top-0 pt-0">
                                        <button 
                                            className="btn btn-outline-danger w-100"
                                            onClick={() => {
                                                if (sale.items?.length === 1) {
                                                    const productSlug = sale.items[0].product_slug || sale.items[0].product?.slug || sale.items[0].product
                                                    if (productSlug) {
                                                        navigate(`/product/${productSlug}`)
                                                        return
                                                    }
                                                }
                                                navigate(`/products?is_flash_sale=true`)
                                            }}
                                        >
                                            Mua ngay
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* Section Voucher */}
            <section id="vouchers" className="mb-5" style={{ scrollMarginTop: "100px" }}>
                <h2 className="mb-4 text-success fw-bold border-bottom pb-2">
                    <i className="bi-ticket-perforated-fill me-2"></i> Mã Giảm Giá (Voucher)
                </h2>
                {vouchers.length === 0 ? (
                    <p className="text-muted">Hiện tại không có Voucher nào.</p>
                ) : (
                    <div className="row g-4">
                        {vouchers.map(voucher => {
                            const isFreeship = voucher.voucher_type?.code === 'SHIPPING' || voucher.voucher_type === 'SHIPPING' || voucher.voucher_type === 2;
                            return (
                                <div key={voucher.id || voucher.code} className="col-md-6 col-lg-4">
                                    <div className={`card h-100 shadow-sm ${isFreeship ? 'border-info' : 'border-success'}`}>
                                        <div className={`card-header text-white fw-bold d-flex justify-content-between align-items-center ${isFreeship ? 'bg-info' : 'bg-success'}`}>
                                            <span>{voucher.code}</span>
                                            <span className="badge bg-white text-dark ms-2">{isFreeship ? 'Freeship' : 'Giảm giá'}</span>
                                        </div>
                                        <div className="card-body">
                                            <p className="mb-2 fw-semibold">{voucher.description}</p>
                                            <div className="small text-muted mb-1">
                                                Đơn tối thiểu: {formatCurrencyVND(voucher.min_order_value)}
                                            </div>
                                            {voucher.max_discount_amount > 0 && (
                                                <div className="small text-muted mb-1">
                                                    Giảm tối đa: {formatCurrencyVND(voucher.max_discount_amount)}
                                                </div>
                                            )}
                                            <div className="small text-muted mt-2">
                                                Hạn sử dụng: {new Date(voucher.end_date).toLocaleDateString("vi-VN")}
                                            </div>
                                        </div>
                                        <div className="card-footer bg-white border-top-0 pt-0">
                                            <button 
                                                className={`btn w-100 ${isFreeship ? 'btn-outline-info' : 'btn-outline-success'}`}
                                                onClick={() => {
                                                    navigator.clipboard.writeText(voucher.code)
                                                    alert("Đã copy mã: " + voucher.code)
                                                }}
                                            >
                                                Copy mã
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </section>
        </div>
    )
}

export default PromotionsPage
