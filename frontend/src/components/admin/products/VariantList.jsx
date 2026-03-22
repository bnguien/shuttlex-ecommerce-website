import React, { useState } from 'react'
import { formatCurrencyVND } from '../../utils/format'

function VariantList({ variants, onEdit, onDelete }) {
  const [searchTerm, setSearchTerm] = useState('')

  if (!variants || variants.length === 0) {
    return <div className="text-muted p-3">Chưa có biến thể.</div>
  }

  // Filter data logic
  const filteredVariants = variants.filter(variant => {
    const searchLower = searchTerm.toLowerCase();
    return (
      variant.sku?.toLowerCase().includes(searchLower) ||
      variant.size?.name?.toLowerCase().includes(searchLower) ||
      variant.color?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <div className="card shadow-sm">
      {/* Header with search input */}
      <div className="card-header bg-white py-3">
        <div className="row align-items-center">
          <div className="col-md-4">
            <h6 className="mb-0 fw-bold">Danh sách biến thể ({filteredVariants.length})</h6>
          </div>
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-light border-end-0">
                <i className="bi bi-search"></i>
              </span>
              <input
                type="text"
                className="form-control border-start-0 bg-light"
                placeholder="Tìm theo SKU, kích cỡ hoặc màu..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button 
                  className="btn btn-outline-secondary" 
                  onClick={() => setSearchTerm('')}
                >
                  Xóa lọc
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Data table */}
      <div className="table-responsive">
        <table className="table align-middle table-hover mb-0">
          <thead className="table-light">
            <tr>
              <th>Kích cỡ</th>
              <th>Màu</th>
              <th>SKU</th>
              <th>Giá</th>
              <th>Giá sale</th>
              <th>Tồn kho</th>
              <th>Trạng thái</th>
              <th className="text-end">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredVariants.length > 0 ? (
              filteredVariants.map((variant) => (
                <tr key={variant.id}>
                  <td className="fw-medium">{variant.size?.name || "-"}</td>
                  <td>{variant.color || "-"}</td>
                  <td><code>{variant.sku || "-"}</code></td>
                  <td>
                    {variant.price 
                      ? formatCurrencyVND(variant.price) 
                      : <span className="text-muted small">(Giá gốc)</span>}
                  </td>
                  <td>
                    {variant.sale_price ? (
                      <span className="text-danger fw-bold">
                        {formatCurrencyVND(variant.sale_price)}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <span className={`badge ${variant.stock > 0 ? 'bg-success-subtle text-success' : 'bg-danger-subtle text-danger'}`}>
                      {variant.stock ?? 0}
                    </span>
                  </td>
                  <td>
                    {variant.is_active !== false ? (
                      <span className="badge rounded-pill bg-primary">Đang bán</span>
                    ) : (
                      <span className="badge rounded-pill bg-secondary">Ngừng bán</span>
                    )}
                  </td>
                  <td className="text-end">
                    <button
                      className="btn btn-sm btn-outline-primary me-2"
                      onClick={() => onEdit(variant)}
                    >
                      <i className="bi bi-pencil me-1"></i> Sửa
                    </button>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => onDelete(variant)}
                    >
                      <i className="bi bi-trash me-1"></i> Xóa
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="8" className="text-center py-4 text-muted">
                  Không tìm thấy biến thể khớp với "{searchTerm}"
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div> // Close card container
  );
}

export default VariantList;