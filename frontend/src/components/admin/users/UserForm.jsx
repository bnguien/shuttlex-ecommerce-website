function UserForm({ values, onChange, onSubmit, onCancel }) {
  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    onChange({
      ...values,
      [name]: type === 'checkbox' ? checked : value
    })
  }

  const handleSubmit = (event) => {
    event.preventDefault()
    
    if (!values.username?.trim()) {
      alert("Tên đăng nhập là bắt buộc!")
      return
    }
    
    if (!values.email?.trim()) {
      alert("Email là bắt buộc!")
      return
    }
    
    // Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(values.email)) {
      alert("Định dạng email không hợp lệ!")
      return
    }
    
    // Bắt buộc mật khẩu khi tạo user mới
    if (!values.id && !values.password) {
      alert("Mật khẩu là bắt buộc khi tạo người dùng mới!")
      return
    }
    
    onSubmit(event)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Tên đăng nhập *</label>
          <input
            className="form-control"
            name="username"
            value={values.username || ""}
            onChange={handleChange}
            disabled={values.id} // Không cho đổi tên đăng nhập sau khi tạo
          />
        </div>
        
        <div className="col-md-6">
          <label className="form-label">Email *</label>
          <input
            className="form-control"
            name="email"
            type="email"
            value={values.email || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Tên</label>
          <input
            className="form-control"
            name="first_name"
            value={values.first_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Họ</label>
          <input
            className="form-control"
            name="last_name"
            value={values.last_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Số điện thoại</label>
          <input
            className="form-control"
            name="phone"
            value={values.phone || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">
            Mật khẩu {!values.id && "*"}
          </label>
          <input
            className="form-control"
            name="password"
            type="password"
            value={values.password || ""}
            onChange={handleChange}
            placeholder={values.id ? "Để trống nếu giữ nguyên" : ""}
          />
          {values.id && (
            <small className="text-muted">Để trống nếu giữ nguyên mật khẩu hiện tại</small>
          )}
        </div>

        <div className="col-12">
          <label className="form-label">Địa chỉ</label>
          <textarea
            className="form-control"
            name="address"
            rows="2"
            value={values.address || ""}
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
            <label className="form-check-label">Đang hoạt động</label>
          </div>
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_staff"
              checked={Boolean(values.is_staff)}
              onChange={handleChange}
            />
            <label className="form-check-label">Nhân viên (Có quyền vào trang quản trị)</label>
          </div>
        </div>

        <div className="col-12">
          <div className="form-check">
            <input
              className="form-check-input"
              type="checkbox"
              name="is_superuser"
              checked={Boolean(values.is_superuser)}
              onChange={handleChange}
            />
            <label className="form-check-label">Quản trị cao nhất (Toàn quyền)</label>
          </div>
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

export default UserForm
