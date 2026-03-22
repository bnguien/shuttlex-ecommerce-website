function ProductForm({ values, brands = [], categories = [], sizes = [], onChange, onSubmit, onCancel }) {
  const variants = Array.isArray(values.variants) ? values.variants : []
  
  const generateSlug = (text) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD') //tách dấu
      .replace(/[\u0300-\u036f]/g, '') //xóa dấu
      .replace(/[^\w\s-]/g, '') // Xóa ký tự đặc biệt
      .trim()
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    const variants = values.variants || [];
    
    if (!values.name?.trim()) {
      alert("Tên sản phẩm không được để trống!");
      return;
    }
    
    if (!values.category_id && !values.category?.id) {
      alert("Vui lòng chọn Danh mục cho sản phẩm!");
      return;
    }
    
    const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
    if (values.slug && !slugRegex.test(values.slug)) {
      alert("Slug không hợp lệ! Chỉ dùng chữ thường, số và dấu gạch ngang (vd: vot-cau-long-yonex).");
      return;
    }

    if (Number(values.base_price) < 0 || Number(values.base_stock) < 0) {
      alert("Giá gốc và tồn kho không được là số âm!");
      return;
    }

    const skuSet = new Set();
    const variantComboSet = new Set();

    for (let i = 0; i < variants.length; i++) {
      const v = variants[i];
      const rowIndex = i + 1;

      const vPrice = Number(v.Price || 0);
      const vSale = Number(v.sale_price || 0);
      const vStock = Number(v.stock || 0);
      const basePrice = Number(values.base_price || 0);

      if (vPrice < 0 || vStock < 0 || vSale < 0) {
        alert(`Biến thể hàng ${rowIndex} có giá trị âm. Vui lòng kiểm tra lại!`);
        return;
      }

      const sizeId = v.size_id || v.size?.id || "";
      const color = v.color?.trim().toLowerCase() || "";
      const comboKey = `${sizeId}-${color}`;

      if (variantComboSet.has(comboKey)) {
        alert(`Biến thể hàng ${rowIndex} bị trùng lặp Size và Màu với một hàng khác!`);
        return;
      }
      variantComboSet.add(comboKey);
      
      if (v.sku?.trim()) {
        if (skuSet.has(v.sku.trim())) {
          alert(`Mã SKU "${v.sku}" bị trùng lặp ở hàng ${rowIndex}. SKU phải là duy nhất!`);
          return;
        }
        skuSet.add(v.sku.trim());
      }

      if (!v.price && !values.base_price) {
        alert(`Biến thể hàng ${rowIndex} chưa có giá và sản phẩm cũng không có Giá gốc!`);
        return;
      }

      if (!sizeId && !color) {
        alert(`Biến thể hàng ${rowIndex} phải có ít nhất Size hoặc Màu sắc!`);
        return;
      }

      if (v.sale_price && vSale >= (vPrice || basePrice)) {
        alert(`Hàng ${rowIndex}: Giá Sale phải nhỏ hơn giá gốc!`);
        return;
      }
    }

    if (variants.length === 0 && !values.base_price) {
      alert("Sản phẩm không có biến thể phải có giá gốc (Base Price)!");
      return;
    }

    onSubmit(event);
  }

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    
    if (name === "name" && !values.slug) {
      onChange({
        ...values,
        name: value,
        slug: generateSlug(value)
      });
      return;
    }
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
      { size_id: "", color: "", sku: "", price: "", stock: "", is_active: true }
    ])
  }

  const removeVariant = (index) => {
    updateVariants(variants.filter((_, i) => i !== index))
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Tên</label>
          <input
            className="form-control"
            name="name"
            value={values.name || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
          <label className="form-label">Đường dẫn (slug)</label>
          <input
            className="form-control"
            name="slug"
            value={values.slug || ""}
            onChange={handleChange}
          />
        </div>
        <div className="col-md-6">
            <label className="form-label">Hình ảnh</label>
            <input
              className="form-control"
              name="image"
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            />
        </div>
        <div className="col-md-6">
          <label className="form-label">Danh mục</label>
          <select
            className="form-select"
            name="category_id"
            value={values.category_id || values.category?.id || ""}
            onChange={handleChange}
          >
            <option value="">Chọn danh mục</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Thương hiệu</label>
          <select
            className="form-select"
            name="brand_id"
            value={values.brand_id || values.brand?.id || ""}
            onChange={handleChange}
          >
            <option value="">Chọn thương hiệu</option>
            {brands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
        <div className="col-md-6">
          <label className="form-label">Giá gốc</label>
          <input
            className="form-control"
            name="base_price"
            type="number"
            value={values.base_price || ""}
            onChange={handleChange}
          />
          <small className="text-muted">Dùng khi sản phẩm không có biến thể</small>
        </div>
        <div className="col-md-6">
          <label className="form-label">Tồn kho gốc</label>
          <input
            className="form-control"
            name="base_stock"
            type="number"
            value={values.base_stock || ""}
            onChange={handleChange}
          />
          <small className="text-muted">Dùng khi sản phẩm không có biến thể. Tổng tồn kho = tổng tồn kho các biến thể nếu có.</small>
        </div>
        <div className="col-12">
          <label className="form-label">Mô tả</label>
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
            <label className="form-check-label">Đang bán</label>
          </div>
        </div>
      </div>

      {!values.id && (
        <div className="mt-4">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <div>
              <h6 className="fw-semibold mb-0">Biến thể sản phẩm</h6>
              {variants.length > 0 && (
                <small className="text-muted">
                  Tổng tồn kho: {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}
                </small>
              )}
            </div>
            <button type="button" className="btn btn-outline-primary btn-sm" onClick={addVariant}>
              Thêm biến thể
            </button>
          </div>
          {variants.length === 0 ? (
            <div className="text-muted">Chưa thêm biến thể.</div>
          ) : (
            <div className="table-responsive">
              <table className="table align-middle">
                <thead>
                  <tr>
                    <th>Kích cỡ</th>
                    <th>Màu</th>
                    <th>SKU</th>
                    <th>Giá</th>
                    <th>Giá sale</th>
                    <th>Tồn kho</th>
                    <th>Hoạt động</th>
                    <th className="text-end">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((variant, index) => (
                    <tr key={index}>
                      <td>
                        <select
                          className="form-select"
                          value={variant.size_id || variant.size?.id || ""}
                          onChange={(event) => handleVariantChange(index, "size_id", event.target.value)}
                        >
                          <option value="">Chọn kích cỡ</option>
                          {sizes.map((size) => (
                            <option key={size.id} value={size.id}>
                              {size.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={variant.color || ""}
                          onChange={(event) => handleVariantChange(index, "color", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          value={variant.sku || ""}
                          onChange={(event) => handleVariantChange(index, "sku", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          value={variant.price || ""}
                          onChange={(event) => handleVariantChange(index, "price", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm border-danger"
                          type="number"
                          placeholder="Giá sale"
                          value={variant.sale_price || ""}
                          onChange={(event) => handleVariantChange(index, "sale_price", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-control form-control-sm"
                          type="number"
                          value={variant.stock || 0}
                          onChange={(event) => handleVariantChange(index, "stock", event.target.value)}
                        />
                      </td>
                      <td>
                        <input
                          className="form-check-input"
                          type="checkbox"
                          checked={Boolean(variant.is_active)}
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
                          Xóa
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {values.id && (
        <div className="mt-4">
          <div className="alert alert-info mb-0">
            <i className="bi bi-info-circle me-2"></i>
            Để quản lý biến thể của sản phẩm này, hãy mở rộng dòng sản phẩm trong bảng sản phẩm.
          </div>
        </div>
      )}

      <div className="d-flex justify-content-end gap-2 mt-4">
        <button type="button" className="btn btn-outline-secondary" onClick={onCancel}>
          Hủy
        </button>
        <button type="submit" className="btn btn-primary">
          Lưu
        </button>
      </div>
    </form>
  )
}


export default ProductForm
