function SizeFilters({ filters, onChange, sizeTypes }) {
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
            <label className="form-label">Type</label>
            <select
              className="form-select"
              value={filters.type}
              onChange={(event) =>
                onChange({
                  ...filters,
                  type: event.target.value
                })
              }
            >
              <option value="">All</option>
              {sizeTypes.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SizeFilters
