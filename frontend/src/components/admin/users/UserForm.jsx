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
      alert("Username is required!")
      return
    }
    
    if (!values.email?.trim()) {
      alert("Email is required!")
      return
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(values.email)) {
      alert("Invalid email format!")
      return
    }
    
    // Password is required for new user
    if (!values.id && !values.password) {
      alert("Password is required for new user!")
      return
    }
    
    onSubmit(event)
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="row g-3">
        <div className="col-md-6">
          <label className="form-label">Username *</label>
          <input
            className="form-control"
            name="username"
            value={values.username || ""}
            onChange={handleChange}
            disabled={values.id} // Cannot change username after creation
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
          <label className="form-label">First Name</label>
          <input
            className="form-control"
            name="first_name"
            value={values.first_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Last Name</label>
          <input
            className="form-control"
            name="last_name"
            value={values.last_name || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">Phone</label>
          <input
            className="form-control"
            name="phone"
            value={values.phone || ""}
            onChange={handleChange}
          />
        </div>

        <div className="col-md-6">
          <label className="form-label">
            Password {!values.id && "*"}
          </label>
          <input
            className="form-control"
            name="password"
            type="password"
            value={values.password || ""}
            onChange={handleChange}
            placeholder={values.id ? "Leave blank to keep current" : ""}
          />
          {values.id && (
            <small className="text-muted">Leave blank to keep current password</small>
          )}
        </div>

        <div className="col-12">
          <label className="form-label">Address</label>
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
            <label className="form-check-label">Active</label>
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
            <label className="form-check-label">Staff (Can access admin)</label>
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
            <label className="form-check-label">Superuser (Full permissions)</label>
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

export default UserForm
