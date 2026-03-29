import { useEffect, useState } from "react"
import api from "../../../api"

const toDateTimeLocalValue = (input) => {
  if (!input) return ""
  const date = new Date(input)
  if (Number.isNaN(date.getTime())) return ""

  const pad = (value) => String(value).padStart(2, "0")
  const year = date.getFullYear()
  const month = pad(date.getMonth() + 1)
  const day = pad(date.getDate())
  const hours = pad(date.getHours())
  const minutes = pad(date.getMinutes())

  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function FlashSaleModal({ isOpen, flashSale, onClose, onSave, loading }) {
  const [formData, setFormData] = useState({
    name: "",
    discount_percent: 10,
    start_time: "",
    end_time: "",
    is_active: true,
    product_ids: []
  })
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [selectedProducts, setSelectedProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [productFilters, setProductFilters] = useState({
    search: "",
    category: "",
  })
  const [searchKeyword, setSearchKeyword] = useState("")
  const [productPage, setProductPage] = useState(1)
  const [productTotalPages, setProductTotalPages] = useState(1)
  const [productTotalCount, setProductTotalCount] = useState(0)

  const pageSize = 8

  useEffect(() => {
    const timer = setTimeout(() => {
      setProductFilters(prev => ({ ...prev, search: searchKeyword.trim() }))
      setProductPage(1)
    }, 350)

    return () => clearTimeout(timer)
  }, [searchKeyword])

  useEffect(() => {
    if (!isOpen) return

    setLoadingCategories(true)
    api.get("categories/")
      .then(res => {
        const categoryList = Array.isArray(res.data) ? res.data : res.data.results || []
        setCategories(categoryList)
      })
      .catch(err => console.error("Failed to load categories:", err))
      .finally(() => setLoadingCategories(false))
  }, [isOpen])

  useEffect(() => {
    if (!isOpen) return

    const params = {
      page: productPage,
      page_size: pageSize,
      search: productFilters.search,
    }
    if (productFilters.category) {
      params.category = productFilters.category
    }

    setLoadingProducts(true)
    api.get("products/", { params })
      .then(res => {
        if (Array.isArray(res.data)) {
          setProducts(res.data)
          setProductTotalCount(res.data.length)
          setProductTotalPages(1)
          return
        }

        const productList = res.data.results || []
        const totalCount = res.data.count || productList.length
        const totalPages = Math.max(1, res.data.total_pages || Math.ceil(totalCount / pageSize))

        setProducts(productList)
        setProductTotalCount(totalCount)
        setProductTotalPages(totalPages)
      })
      .catch(err => console.error("Failed to load products:", err))
      .finally(() => setLoadingProducts(false))
  }, [isOpen, productPage, pageSize, productFilters.search, productFilters.category])

  useEffect(() => {
    if (!isOpen) return

    if (flashSale) {
      const productIds = flashSale.items
        ? flashSale.items.map(item => item.product)
        : flashSale.products
          ? flashSale.products.map(p => p.id)
          : []

      const uniqueProductIds = [...new Set(productIds)]
      setSelectedProducts(uniqueProductIds)

      setFormData({
        name: flashSale.name || "",
        discount_percent: flashSale.discount_percent || 10,
        start_time: toDateTimeLocalValue(flashSale.start_time),
        end_time: toDateTimeLocalValue(flashSale.end_time),
        is_active: flashSale.is_active !== false,
        product_ids: uniqueProductIds,
      })
    } else {
      const now = new Date()
      const later = new Date(now.getTime() + 24 * 60 * 60 * 1000)

      setFormData({
        name: "",
        discount_percent: 10,
        start_time: toDateTimeLocalValue(now),
        end_time: toDateTimeLocalValue(later),
        is_active: true,
        product_ids: [],
      })
      setSelectedProducts([])
    }

    setSearchKeyword("")
    setProductFilters({ search: "", category: "" })
    setProductPage(1)
  }, [flashSale, isOpen])

  useEffect(() => {
    setFormData(prev => ({ ...prev, product_ids: selectedProducts }))
  }, [selectedProducts])

  const handleCategoryFilterChange = (e) => {
    const value = e.target.value
    setProductFilters(prev => ({ ...prev, category: value }))
    setProductPage(1)
  }

  const clearFilters = () => {
    setSearchKeyword("")
    setProductFilters({ search: "", category: "" })
    setProductPage(1)
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value
    }))
  }

  const handleProductToggle = (productId) => {
    setSelectedProducts(prev => {
      const updated = prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
      return updated
    })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    onSave(formData)
  }

  if (!isOpen) return null

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">
                {flashSale ? "Chỉnh sửa flash sale" : "Tạo flash sale mới"}
              </h5>
              <button type="button" className="btn-close" onClick={onClose}></button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="mb-3">
                  <label htmlFor="name" className="form-label">Tên flash sale</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="form-control"
                    value={formData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="discount_percent" className="form-label">Giảm giá (%)</label>
                      <input
                        type="number"
                        id="discount_percent"
                        name="discount_percent"
                        className="form-control"
                        value={formData.discount_percent}
                        onChange={handleChange}
                        min="1"
                        max="99"
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label className="form-label">
                        <input
                          type="checkbox"
                          name="is_active"
                          className="form-check-input me-2"
                          checked={formData.is_active}
                          onChange={handleChange}
                        />
                        Kích hoạt
                      </label>
                    </div>
                  </div>
                </div>

                <div className="row">
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="start_time" className="form-label">Thời gian bắt đầu</label>
                      <input
                        type="datetime-local"
                        id="start_time"
                        name="start_time"
                        className="form-control"
                        value={formData.start_time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="mb-3">
                      <label htmlFor="end_time" className="form-label">Thời gian kết thúc</label>
                      <input
                        type="datetime-local"
                        id="end_time"
                        name="end_time"
                        className="form-control"
                        value={formData.end_time}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label">
                    Chọn sản phẩm ({selectedProducts.length}/{productTotalCount || products.length})
                  </label>
                  <div className="row g-2 mb-3">
                    <div className="col-md-6">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Tìm theo tên sản phẩm..."
                        value={searchKeyword}
                        onChange={(e) => setSearchKeyword(e.target.value)}
                      />
                    </div>
                    <div className="col-md-4">
                      <select
                        className="form-select"
                        value={productFilters.category}
                        onChange={handleCategoryFilterChange}
                        disabled={loadingCategories}
                      >
                        <option value="">Tất cả danh mục</option>
                        {categories.map(category => (
                          <option key={category.id} value={category.slug}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="col-md-2 d-grid">
                      <button type="button" className="btn btn-outline-secondary" onClick={clearFilters}>
                        Xóa lọc
                      </button>
                    </div>
                  </div>
                  <div style={{
                    maxHeight: "300px",
                    overflowY: "auto",
                    border: "1px solid #dee2e6",
                    borderRadius: "4px",
                    padding: "1rem"
                  }}>
                    {loadingProducts ? (
                      <div className="text-center py-3">Đang tải sản phẩm...</div>
                    ) : products.length === 0 ? (
                      <div className="text-center py-3 text-muted">Không có sản phẩm phù hợp</div>
                    ) : (
                      <div className="row g-2">
                        {products.map(product => (
                          <div key={product.id} className="col-md-6">
                            <div className="form-check">
                              <input
                                type="checkbox"
                                id={`product-${product.id}`}
                                className="form-check-input"
                                checked={selectedProducts.includes(product.id)}
                                onChange={() => handleProductToggle(product.id)}
                              />
                              <label className="form-check-label" htmlFor={`product-${product.id}`}>
                                {product.name || product.title}
                              </label>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="d-flex justify-content-between align-items-center mt-2">
                    <small className="text-muted">
                      Trang {productPage} / {productTotalPages} - Tổng {productTotalCount} sản phẩm
                    </small>
                    <div className="btn-group btn-group-sm">
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={productPage <= 1 || loadingProducts}
                        onClick={() => setProductPage(prev => Math.max(1, prev - 1))}
                      >
                        Trước
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-secondary"
                        disabled={productPage >= productTotalPages || loadingProducts}
                        onClick={() => setProductPage(prev => Math.min(productTotalPages, prev + 1))}
                      >
                        Sau
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={onClose}>
                  Hủy
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || loadingProducts}>
                  {loading ? "Đang lưu..." : "Lưu"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  )
}

export default FlashSaleModal
