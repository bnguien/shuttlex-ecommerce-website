function ProductFilters({ filters, onChange, categories = [] }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Tìm kiếm</label>
            <input
              className="form-control"
              value={filters.search}
              onChange={(event) =>
                onChange({
                  ...filters,
                  search: event.target.value
                })
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Danh mục</label>
            <select
              className="form-select"
              value={filters.category}
              onChange={(event) =>
                onChange({
                  ...filters,
                  category: event.target.value
                })
              }
            >
              <option value="">Tất cả</option>
              {categories.map((category) => (
                <option key={category.id} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-4">
            <label className="form-label">Thương hiệu</label>
            <input
              className="form-control"
              value={filters.brand}
              onChange={(event) =>
                onChange({
                  ...filters,
                  brand: event.target.value
                })
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Trạng thái</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(event) =>
                onChange({
                  ...filters,
                  status: event.target.value
                })
              }
            >
              <option value="">Tất cả</option>
              <option value="active">Đang bán</option>
              <option value="inactive">Ngừng bán</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductFilters
