import { useCallback, useEffect, useState, useRef } from "react"
import ProductsTable from "./ProductsTable"
import ProductFilters from "./ProductFilters"
import ProductModal from "./ProductModal"
import ProductDeleteDialog from "./ProductDeleteDialog"
import VariantModal from "./VariantModal"
import { 
  useProducts, 
  useBrands, 
  useCategories, 
  useSizes,
  useCreateProduct,
  useUpdateProduct,
  useDeleteProduct,
  useCreateVariant,
  useUpdateVariant,
  useDeleteVariant 
} from "../../../hooks/useCatalog"

function ProductsPage() {
  const [filters, setFilters] = useState({
    search: "",
    category: "",
    brand: "",
    status: ""
  })
  const [editingProduct, setEditingProduct] = useState(null)
  const [editingVariant, setEditingVariant] = useState(null)
  const [deletingProduct, setDeletingProduct] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isVariantModalOpen, setIsVariantModalOpen] = useState(false)
  const [page, setPage] = useState(1)
  const pageSize = 12
  const tableRef = useRef()

  const { data: brands = [] } = useBrands()
  const { data: categories = [] } = useCategories()
  const { data: sizes = [] } = useSizes()
  
  const { 
    data: productsData, 
    isLoading: loadingProducts, 
    isError: errorProducts,
    error: fetchError 
  } = useProducts({
    page,
    page_size: pageSize,
    search: filters.search,
    category: filters.category,
    brands: filters.brand,
    status: filters.status
  })

  const products = productsData?.results || []
  const totalCount = productsData?.count || 0
  const totalPages = productsData?.total_pages || 1

  const createProduct = useCreateProduct()
  const updateProduct = useUpdateProduct()
  const deleteProduct = useDeleteProduct()
  
  const createVariant = useCreateVariant()
  const updateVariant = useUpdateVariant()
  const deleteVariant = useDeleteVariant()

  const loading = loadingProducts || createProduct.isLoading || updateProduct.isLoading || deleteProduct.isLoading || createVariant.isLoading || updateVariant.isLoading || deleteVariant.isLoading
  const error = (errorProducts ? (fetchError?.message || "Không thể tải danh sách sản phẩm.") : "") || 
                (createProduct.isError ? "Không thể tạo sản phẩm." : "") ||
                (updateProduct.isError ? "Không thể cập nhật sản phẩm." : "") ||
                (deleteProduct.isError ? "Không thể xóa sản phẩm." : "") ||
                (createVariant.isError ? "Không thể tạo biến thể." : "") ||
                (updateVariant.isError ? "Không thể cập nhật biến thể." : "") ||
                (deleteVariant.isError ? "Không thể xóa biến thể." : "")
                
  const [formError, setFormError] = useState("")
  const displayError = formError || error

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

  const handleEditVariant = (variant) => {
    setEditingVariant(variant)
    setIsVariantModalOpen(true)
  }

  const handleAddVariant = (product) => {
    // Create empty variant with product reference
    setEditingVariant({
      product: product.id,
      size_id: "",
      color: "",
      sku: "",
      price: "",
      stock: 0,
      sale_price: "",
      sale_ends_at: "",
      is_active: true
    })
    setIsVariantModalOpen(true)
  }

  const handleDeleteVariant = async (variant) => {
    if (!variant?.id) return

    const confirmed = window.confirm("Bạn có chắc muốn xóa biến thể này?")
    if (!confirmed) return

    setFormError("")
    try {
      const product = variant.product ? products.find(p => p.id === variant.product) : null
      
      await deleteVariant.mutateAsync(variant.id)
      
      if (product && tableRef.current) {
        tableRef.current.clearVariantCache(product.id)
        await tableRef.current.refetchVariants(product)
      }
    } catch (err) {
      console.error(err)
      setFormError("Không thể xóa biến thể.")
    }
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
  }

  const handleVariantModalClose = () => {
    setIsVariantModalOpen(false)
    setEditingVariant(null)
  }

  const handleDeleteClose = () => {
    setDeletingProduct(null)
  }

  const handleSave = async (data) => {
    setFormError("")

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
        await updateProduct.mutateAsync({ id: data.id, formData })
      } else {
        await createProduct.mutateAsync(formData)
      }

      setIsModalOpen(false)
      setEditingProduct(null)
    } catch (err) {
      console.error(err)
      const message = err?.response?.data || "Không thể lưu sản phẩm."
      setFormError(typeof message === "string" ? message : "Không thể lưu sản phẩm.")
    }
  }

  const handleSaveVariant = async (data) => {
    const toNumberOrNull = (value) => {
      if (value === "" || value === null || value === undefined) return null
      const parsed = Number(value)
      return Number.isNaN(parsed) ? null : parsed
    }

    const stockValue = Number(data.stock)
    if (Number.isNaN(stockValue) || stockValue < 0) {
      setFormError("Tồn kho biến thể phải là số >= 0.")
      return
    }

    const payload = {
      size_id: data.size_id || null,
      color: data.color || "",
      sku: data.sku || "",
      stock: stockValue,
      price: toNumberOrNull(data.price),
      sale_price: toNumberOrNull(data.sale_price),
      sale_ends_at: data.sale_ends_at || null,
      is_active: Boolean(data.is_active),
    }

    setFormError("")
    try {
      const product = data.product ? products.find(p => p.id === data.product) : null
      
      if (data.id) {
        await updateVariant.mutateAsync({ id: data.id, payload })
      } else {
        if (!data.product) {
          setFormError("Cần có ID sản phẩm để tạo biến thể.")
          return
        }
        await createVariant.mutateAsync({ productId: data.product, payload })
      }
      
      setIsVariantModalOpen(false)
      setEditingVariant(null)
      
      if (product && tableRef.current) {
        tableRef.current.clearVariantCache(product.id)
        await tableRef.current.refetchVariants(product)
      }
    } catch (err) {
      console.error(err)
      const action = data.id ? "cập nhật" : "tạo"
      setFormError(`Không thể ${action} biến thể.`)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct?.id) {
      setDeletingProduct(null)
      return
    }

    setFormError("")
    try {
      await deleteProduct.mutateAsync(deletingProduct.id)
      setDeletingProduct(null)
    } catch (err) {
      console.error(err)
      const payload = err?.response?.data
      const fallback = "Không thể xóa sản phẩm."

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

      setFormError(message)
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
        <h2 className="fw-semibold mb-0">Sản phẩm</h2>
        <button className="btn btn-primary" onClick={handleCreate}>Thêm sản phẩm</button>
      </div>

      <ProductFilters filters={filters} onChange={setFilters} categories={categories} />

      <div className="card">
        <div className="card-body">
          {loading && <div className="text-muted">Đang xử lý...</div>}
          {displayError && <div className="text-danger mb-3">{displayError}</div>}
          <ProductsTable
            ref={tableRef}
            products={products}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddVariant={handleAddVariant}
            onEditVariant={handleEditVariant}
            onDeleteVariant={handleDeleteVariant}
          />
          {totalPages > 1 && (
            <nav aria-label="Phân trang sản phẩm" className="d-flex justify-content-center mt-4">
              <ul className="pagination mb-0">
                <li className={`page-item ${page === 1 ? "disabled" : ""}`}>
                  <button
                    className="page-link"
                    onClick={() => setPage(prev => Math.max(1, prev - 1))}
                    disabled={page === 1}
                  >
                    Trước
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
                    Sau
                  </button>
                </li>
              </ul>
            </nav>
          )}
          {totalCount > 0 && (
            <div className="text-center mt-2 text-muted">
              Trang {page}/{totalPages} ({totalCount} mục)
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

      <VariantModal
        open={isVariantModalOpen}
        variant={editingVariant}
        sizes={sizes}
        onClose={handleVariantModalClose}
        onSave={handleSaveVariant}
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
