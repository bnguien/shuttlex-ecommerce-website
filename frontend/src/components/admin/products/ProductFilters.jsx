function ProductFilters({ filters, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-4">
            <label className="form-label">Search</label>
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
            <label className="form-label">Category</label>
            <input
              className="form-control"
              value={filters.category}
              onChange={(event) =>
                onChange({
                  ...filters,
                  category: event.target.value
                })
              }
            />
          </div>
          <div className="col-md-4">
            <label className="form-label">Brand</label>
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
            <label className="form-label">Status</label>
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
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductFilters
