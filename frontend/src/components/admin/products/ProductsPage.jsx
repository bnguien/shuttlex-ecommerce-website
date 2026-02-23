import { useCallback, useEffect, useState } from "react"
import ProductsTable from "./ProductsTable"
import ProductFilters from "./ProductFilters"
import ProductModal from "./ProductModal"
import ProductDeleteDialog from "./ProductDeleteDialog"
import api from "../../../api"

function ProductsPage() {
  const [products, setProducts] = useState([])
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    status: ""
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [brands, setBrands] = useState([])
  const [categories, setCategories] = useState([])
  const [sizes, setSizes] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const pageSize = 12

  const loadProducts = useCallback(() => {
    setLoading(true)
    setError("")
    return api.get("products", { params: { page, page_size: pageSize, search: filters.search, category: filters.category, brands: filters.brand, status: filters.status } })
      .then(res => {
        if (Array.isArray(res.data)) {
          setProducts(res.data)
          setTotalCount(res.data.length)
          setTotalPages(1)
        } else {
          setProducts(res.data.results || [])
          setTotalCount(res.data.count || 0)
          setTotalPages(res.data.total_pages || 1)
        }
      })
      .catch(err => {
        console.error(err)
        setError("Failed to load products.")
      })
      .finally(() => setLoading(false))
  }, [page, pageSize, filters.search, filters.category, filters.brand, filters.status])

  useEffect(() => {
    loadProducts()
  }, [loadProducts])

  useEffect(() => {
    api.get("brands/")
      .then(res => setBrands(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    api.get("categories/")
      .then(res => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error(err))
  }, [])

  useEffect(() => {
    api.get("sizes/")
      .then(res => setSizes(Array.isArray(res.data) ? res.data : []))
      .catch(err => console.error(err))
  }, [])

  const handleCreate = () => {
    setEditingProduct(null)
    setIsModalOpen(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setIsModalOpen(true)
  }

  const handleDelete = (product) => {
    setDeletingProduct(product)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleDeleteClose = () => {
    setDeletingProduct(null)
  }

  const handleSave = async (data) => {
    setLoading(true)
    setError("")

    const formData = new FormData()
    const appendIfPresent = (key, value) => {
      if (value === undefined || value === null) return
      if (typeof value === "string" && value.trim() === "") return
      formData.append(key, value)
    }

    appendIfPresent("name", data.name)
    appendIfPresent("slug", data.slug)
    appendIfPresent("description", data.description)
    appendIfPresent("base_price", data.base_price)
    appendIfPresent("base_stock", data.base_stock)
    formData.append("is_active", data.is_active ? "true" : "false")

    const categoryId = data.category_id || data.category?.id
    if (categoryId) {
      formData.append("category", categoryId)
    }

    const brandId = data.brand_id || data.brand?.id
    if (brandId) {
      formData.append("brand", brandId)
    }

    if (data.image instanceof File) {
      formData.append("image", data.image)
    }

    try {
      if (data.id) {
        await api.patch(`update_product/${data.id}/`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      } else {
        await api.post("create_product/", formData, {
          headers: { "Content-Type": "multipart/form-data" }
        })
      }

      setIsModalOpen(false)
      setEditingProduct(null)
      await loadProducts()
    } catch (err) {
      console.error(err)
      const message = err?.response?.data || "Failed to save product."
      setError(typeof message === "string" ? message : "Failed to save product.")
    } finally {
      setLoading(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct?.id) {
      setDeletingProduct(null)
      return
    }

    setLoading(true)
    setError("")
    try {
      await api.delete(`delete_product/${deletingProduct.id}/`)
      setDeletingProduct(null)
      await loadProducts()
    } catch (err) {
      console.error(err)
      const payload = err?.response?.data
      const fallback = "Failed to delete product."

      let message = payload?.detail || payload?.message
      if (!message && typeof payload === "string") {
        message = payload
      }
      if (!message && payload && typeof payload === "object") {
        const firstValue = Object.values(payload)[0]
        if (Array.isArray(firstValue)) {
          message = firstValue[0]
        } else if (typeof firstValue === "string") {
          message = firstValue
        }
      }
      if (!message) {
        message = err?.response?.status
          ? `${fallback} (HTTP ${err.response.status})`
          : fallback
      }

      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const getPageNumbers = () => {
    if (totalPages <= 1) return []
    const maxButtons = 5
    let start = Math.max(1, page - Math.floor(maxButtons / 2))
    let end = Math.min(totalPages, start + maxButtons - 1)
    if (end - start + 1 < maxButtons) {
      start = Math.max(1, end - maxButtons + 1)
    }
    return Array.from({ length: end - start + 1 }, (_, i) => start + i)
  }

  const pageNumbers = getPageNumbers()

  return (
    <div className="container-fluid p-4 bg-light h-100">
      <div className="d-flex align-items-center justify-content-between mb-3">
        <h2 className="fw-semibold mb-0">Products</h2>
        <button className="btn btn-primary" onClick={handleCreate}>New Product</button>
      </div>

      <ProductFilters filters={filters} onChange={setFilters} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Loading products...</div>}
          {error && <div className="text-danger mb-3">{error}</div>}
          <ProductsTable
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
          {totalPages > 1 && (
            <nav aria-label="Products pagination" className="d-flex justify-content-center mt-4">
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Prev
                  </button>
                </li>
                {pageNumbers.map(pageNum => (
                  <li key={pageNum} className={`page-item ${pageNum === page ? "active" : ""}`}>
                    <button className="page-link" onClick={() => setPage(pageNum)}>
                      {pageNum}
                    </button>
                  </li>
                ))}
                <li className={`page-item ${page === totalPages ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(prev => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                  >
                    Next
                  </button>
                </li>
              </ul>
            </nav>
          )}
          {totalCount > 0 && (
            <div className="text-center mt-2 text-muted">
              Page {page} of {totalPages} ({totalCount} items)
            </div>
          )}
        </div>
      </div>

      <ProductModal
        open={isModalOpen}
        product={editingProduct}
        brands={brands}
        categories={categories}
        sizes={sizes}
        onClose={handleModalClose}
        onSave={handleSave}
      />

      <ProductDeleteDialog
        open={Boolean(deletingProduct)}
        product={deletingProduct}
        onCancel={handleDeleteClose}
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}

export default ProductsPage
