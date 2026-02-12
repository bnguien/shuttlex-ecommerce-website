function VariantForm({ values, onChange, onSubmit, onCancel }) {
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    onChange({
      ...values,
      [name]: type === "checkbox" ? checked : value
    })
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Size</label>
          <input
            className="form-control"
            name="size"
            value={values.size || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Color</label>
          <input
            className="form-control"
            name="color"
            value={values.color || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">SKU</label>
          <input
            className="form-control"
            name="sku"
            value={values.sku || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Price</label>
          <input
            className="form-control"
            name="price"
            type="number"
            value={values.price || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-3">
          <label className="form-label">Stock</label>
          <input
            className="form-control"
            name="stock"
            type="number"
            value={values.stock || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_active"
              checked={Boolean(values.is_active)}
              onChange={handleChange}
            />
            <label className="form-check-label">Active</label>
          </div>
        </div>
      </div>

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary">
          Save
        </button>
      </div>
    </form>
  )
}

export default VariantForm
