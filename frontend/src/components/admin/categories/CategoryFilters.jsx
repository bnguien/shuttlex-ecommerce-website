function CategoryFilters({ filters, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
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
          <div className="col-md-6">
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
              <option value="active">Đang hoạt động</option>
              <option value="inactive">Tạm khóa</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CategoryFilters
