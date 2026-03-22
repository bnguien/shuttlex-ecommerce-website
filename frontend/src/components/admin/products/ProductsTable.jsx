import { Fragment, useState, useImperativeHandle, forwardRef } from "react"
import api from "../../../api"

const ProductsTable = forwardRef(
  ({ products, onEdit, onDelete, onEditVariant, onDeleteVariant, onAddVariant }, ref) => {
    const [expandedIds, setExpandedIds] = useState({})
    const [variantMap, setVariantMap] = useState({})
    const [loadingMap, setLoadingMap] = useState({})

    useImperativeHandle(ref, () => ({
      clearVariantCache(productId) {
        setVariantMap((prev) => {
          const updated = { ...prev }
          delete updated[productId]
          return updated
        })
      },
      refetchVariants(product) {
        if (!product?.id || !product?.slug) return Promise.resolve()
        const productId = product.id
        setLoadingMap((prev) => ({ ...prev, [productId]: true }))
        return api
          .get(`product_detail/${product.slug}/`)
          .then((response) => {
            const variants = Array.isArray(response.data?.variants) ? response.data.variants : []
            setVariantMap((prev) => ({ ...prev, [productId]: variants }))
          })
          .catch(() => {
            setVariantMap((prev) => ({ ...prev, [productId]: [] }))
          })
          .finally(() => {
            setLoadingMap((prev) => ({ ...prev, [productId]: false }))
          })
      },
    }))

    const toggleExpand = async (product) => {
      const productId = product.id
      const isExpanded = Boolean(expandedIds[productId])

      if (isExpanded) {
        setExpandedIds((prev) => ({ ...prev, [productId]: false }))
        return
      }

      setExpandedIds((prev) => ({ ...prev, [productId]: true }))

      if (variantMap[productId] !== undefined || !product.slug) {
        return
      }

      setLoadingMap((prev) => ({ ...prev, [productId]: true }))
      try {
        const response = await api.get(`product_detail/${product.slug}/`)
        const variants = Array.isArray(response.data?.variants) ? response.data.variants : []
        setVariantMap((prev) => ({ ...prev, [productId]: variants }))
      } catch {
        setVariantMap((prev) => ({ ...prev, [productId]: [] }))
      } finally {
        setLoadingMap((prev) => ({ ...prev, [productId]: false }))
      }
    }

  if (!products || products.length === 0) {
    return <div className="text-muted">Không tìm thấy sản phẩm.</div>
  }

  return (
    <div className="table-responsive">
      <table className="table align-middle mb-0">
        <thead>
          <tr>
            <th style={{ width: "44px" }}></th>
            <th>Tên</th>
            <th>Danh mục</th>
            <th>Thương hiệu</th>
            <th>Giá</th>
            <th>Tồn kho</th>
            <th>Trạng thái</th>
            <th className="text-end">Thao tác</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => {
            const isExpanded = Boolean(expandedIds[product.id])
            const variants = variantMap[product.id]
            const isLoadingVariants = Boolean(loadingMap[product.id])

            return (
              <Fragment key={product.id}>
                <tr>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-light"
                      onClick={() => toggleExpand(product)}
                      aria-label={isExpanded ? "Thu gọn biến thể" : "Mở rộng biến thể"}
                    >
                      {isExpanded ? "▾" : "▸"}
                    </button>
                  </td>
                  <td>{product.name}</td>
                  <td>{product.category?.name || "-"}</td>
                  <td>{product.brand?.name || "-"}</td>
                  <td>{product.price || "-"}</td>
                  <td>{product.stock ?? 0}</td>
                  <td>{product.is_active ? "Đang bán" : "Ngừng bán"}</td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => onEdit(product)}
                    >
                      Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(product)}
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
                {isExpanded && (
                  <tr>
                    <td></td>
                    <td colSpan={7}>
                      {isLoadingVariants ? (
                        <div className="text-muted py-2">Đang tải biến thể...</div>
                      ) : (
                        <div>
                          <div className="table-responsive border rounded">
                            <table className="table table-sm mb-0">
                              <thead className="table-light">
                                <tr>
                                  <th>Kích cỡ</th>
                                  <th>Màu</th>
                                  <th>Giá</th>
                                  <th>Tồn kho</th>
                                  <th>Hoạt động</th>
                                  <th className="text-end">Thao tác</th>
                                </tr>
                              </thead>
                              <tbody>
                                {Array.isArray(variants) && variants.length > 0 ? (
                                  variants.map((variant) => (
                                    <tr key={variant.id}>
                                      <td>{variant.size?.name || "-"}</td>
                                      <td>{variant.color || "-"}</td>
                                      <td>{variant.display_price || variant.price || "-"}</td>
                                      <td>{variant.stock ?? 0}</td>
                                      <td>{variant.is_active ? "Có" : "Không"}</td>
                                      <td className="text-end">
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-primary me-2"
                                          onClick={() => onEditVariant?.({ ...variant, product: product.id })}
                                        >
                                          Sửa
                                        </button>
                                        <button
                                          type="button"
                                          className="btn btn-sm btn-outline-danger"
                                          onClick={() => onDeleteVariant?.({ ...variant, product: product.id })}
                                        >
                                          Xóa
                                        </button>
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan={6} className="text-muted py-2">
                                      Không có biến thể.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>
                          <div className="mt-2">
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-success"
                              onClick={() => onAddVariant?.(product)}
                            >
                              <i className="bi bi-plus-circle me-1"></i>
                              Thêm biến thể
                            </button>
                          </div>
                        </div>
                      )}
                    </td>
                  </tr>
                )}
              </Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

ProductsTable.displayName = "ProductsTable"
export default ProductsTable
