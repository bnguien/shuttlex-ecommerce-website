function BrandFilters({ filters, onChange }) {
  return (
    <div className="card mb-3">
      <div className="card-body">
        <div className="row g-3">
          <div className="col-md-6">
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
          <div className="col-md-6">
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

export default BrandFilters
