function SizeForm({ values, onChange, onSubmit, onCancel, sizeTypes }) {
  const handleChange = (event) => {
    const { name, value } = event.target
    onChange({
      ...values,
      [name]: value
    })
  }

  return (
    <form onSubmit={onSubmit}>
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
          <label className="form-label">Loại</label>
          <select
            className="form-select"
            name="type"
            value={values.type || ""}
            onChange={handleChange}
          >
            <option value="">Chọn loại</option>
            {sizeTypes.map((type) => (
              <option key={type.value} value={type.value}>
                {type.label}
              </option>
            ))}
          </select>
        </div>
      </div>

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

export default SizeForm
