function ProductForm({ values, brands = [], categories = [], onChange, onSubmit, onCancel }) {
  const variants = Array.isArray(values.variants) ? values.variants : []

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    onChange({
      ...values,
      [name]: type === "checkbox" ? checked : value
    })
  }

  const handleFileChange = (event) => {
    const file = event.target.files && event.target.files[0]
    onChange({
      ...values,
      image: file || null
    })
  }

  const updateVariants = (nextVariants) => {
    onChange({
      ...values,
      variants: nextVariants
    })
  }

  const handleVariantChange = (index, field, value) => {
    const nextVariants = variants.map((variant, i) =>
      i === index ? { ...variant, [field]: value } : variant
    )
    updateVariants(nextVariants)
  }

  const addVariant = () => {
    updateVariants([
      ...variants,
      { size: "", color: "", sku: "", price: "", stock: "", is_active: true }
    ])
  }

  const removeVariant = (index) => {
    updateVariants(variants.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={onSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Name</label>
          <input
            className="form-control"
            name="name"
            value={values.name || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Slug</label>
          <input
            className="form-control"
            name="slug"
            value={values.slug || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
            <label className="form-label">Image</label>
            <input
              className="form-control"
              name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            />
        </div>
        <div className="col-md-6">
          <label className="form-label">Category</label>
          <select
            className="form-select"
            name="category_id"
            value={values.category_id || values.category?.id || ""}
            onChange={handleChange}
          >
            <option value="">Select category</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Brand</label>
          <select
            className="form-select"
            name="brand_id"
            value={values.brand_id || values.brand?.id || ""}
            onChange={handleChange}
          >
            <option value="">Select brand</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Base Price</label>
          <input
            className="form-control"
            name="base_price"
            type="number"
            value={values.base_price || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Base Stock</label>
          <input
            className="form-control"
            name="base_stock"
            type="number"
            value={values.base_stock || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-12">
          <label className="form-label">Description</label>
          <textarea
            className="form-control"
            name="description"
            rows="3"
            value={values.description || ""}
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

      <div className="mt-4">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <h6 className="fw-semibold mb-0">Product Variants</h6>
          <button type="button" className="btn btn-outline-primary btn-sm" onClick={addVariant}>
            Add Variant
          </button>
        </div>
        {variants.length === 0 ? (
          <div className="text-muted">No variants added.</div>
        ) : (
          <div className="table-responsive">
            <table className="table align-middle">
              <thead>
                <tr>
                  <th>Size</th>
                  <th>Color</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Active</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {variants.map((variant, index) => (
                  <tr key={index}>
                    <td>
                      <input
                        className="form-control"
                        value={variant.size || ""}
                        onChange={(event) => handleVariantChange(index, "size", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={variant.color || ""}
                        onChange={(event) => handleVariantChange(index, "color", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        value={variant.sku || ""}
                        onChange={(event) => handleVariantChange(index, "sku", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        type="number"
                        value={variant.price || ""}
                        onChange={(event) => handleVariantChange(index, "price", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-control"
                        type="number"
                        value={variant.stock || ""}
                        onChange={(event) => handleVariantChange(index, "stock", event.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        className="form-check-input"
                        type="checkbox"
                        checked={variant.is_active !== false}
                        onChange={(event) =>
                          handleVariantChange(index, "is_active", event.target.checked)
                        }
                      />
                    </td>
                    <td className="text-end">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={() => removeVariant(index)}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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

export default ProductForm
