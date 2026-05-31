import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiPhoneCall, FiMail, FiMapPin, FiSave, FiSettings, FiCheckCircle } from 'react-icons/fi'
import api from '../../../api'
import { useToastStore } from '../../../store/toastStore'

function SystemSettingsPage() {
  const [formData, setFormData] = useState({
    phone_contact: '',
    zalo_link: '',
    facebook_link: '',
    email_contact: '',
    address_contact: '',
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const showToast = useToastStore(state => state.showToast)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/system/')
      .then(res => {
        setFormData(res.data)
        setIsLoading(false)
      })
      .catch(err => {
        console.error('Lỗi khi tải cấu hình hệ thống:', err)
        showToast('Không thể tải cấu hình hệ thống!', 'error')
        setIsLoading(false)
      })
  }, [showToast])

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setIsSaving(true)

    api.patch('/system/update/', formData)
      .then(res => {
        setFormData(res.data)
        showToast('Cấu hình hệ thống đã được cập nhật thành công!', 'success')
        setIsSaving(false)
      })
      .catch(err => {
        console.error('Lỗi khi cập nhật cấu hình:', err)
        const errMsg = err.response?.data?.detail || 'Cập nhật cấu hình thất bại!'
        showToast(errMsg, 'error')
        setIsSaving(false)
      })
  }

  if (isLoading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
          <div className="text-center">
            <div className="spinner-border text-primary" role="status" style={{ width: '3rem', height: '3rem' }}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3 text-muted">Đang tải thông tin cấu hình...</p>
          </div>
        </div>
      </div>
    )
  }

  // Custom Zalo SVG Icon
  const ZaloIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2C6.477 2 2 5.865 2 10.648c0 2.502 1.22 4.75 3.17 6.257-.168.618-.62 2.274-.62 2.274a.434.434 0 00.584.475s1.956-.99 2.766-1.428a11.1 11.1 0 004.1.768c5.523 0 10-3.865 10-8.648S17.523 2 12 2z"/>
    </svg>
  )

  // Custom Messenger SVG Icon
  const MessengerIcon = () => (
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M12 2C6.36 2 2 6.14 2 11.7c0 2.9 1.15 5.5 3.03 7.37.16.16.27.38.27.62l.02 2.08a.48.48 0 00.7.43l2.29-1.26c.2-.11.43-.14.65-.08 1 .28 2.04.43 3.09.43 5.64 0 10-4.14 10-9.7C22 6.14 17.64 2 12 2zm1.18 12.3l-2.02-2.15-3.95 2.15 4.35-4.62 2.02 2.15 3.95-2.15-4.35 4.62z"/>
    </svg>
  )

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <FiSettings className="me-2 text-primary" />
              Cấu hình hệ thống
            </h2>
            <span className="badge bg-primary fs-6">Kênh liên hệ trực tuyến</span>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <form onSubmit={handleSubmit}>
                <div className="card shadow-sm border-0 mb-4">
                  <div className="card-header bg-white border-bottom py-3">
                    <h5 className="mb-0 text-dark">
                      <FiCheckCircle className="me-2 text-success" />
                      Thông tin liên hệ Hotline & Mạng xã hội
                    </h5>
                  </div>
                  <div className="card-body p-4">
                    <div className="row g-3">
                      {/* Hotline */}
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold">Số điện thoại Hotline</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0 text-success">
                            <FiPhoneCall />
                          </span>
                          <input
                            type="text"
                            name="phone_contact"
                            className="form-control bg-light border-0"
                            placeholder="Ví dụ: 0987654321"
                            value={formData.phone_contact}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Email */}
                      <div className="col-md-6">
                        <label className="form-label text-muted small fw-bold">Email hỗ trợ khách hàng</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0 text-info">
                            <FiMail />
                          </span>
                          <input
                            type="email"
                            name="email_contact"
                            className="form-control bg-light border-0"
                            placeholder="Ví dụ: support@shuttlex.com"
                            value={formData.email_contact}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>

                      {/* Zalo Link */}
                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold">Đường dẫn Chat Zalo (zalo.me)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0 text-primary" style={{ padding: '10px 15px' }}>
                            <ZaloIcon />
                          </span>
                          <input
                            type="url"
                            name="zalo_link"
                            className="form-control bg-light border-0"
                            placeholder="Ví dụ: https://zalo.me/0123456789"
                            value={formData.zalo_link}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="form-text text-muted small mt-1">
                          Liên kết Zalo của bạn dưới dạng: <code>https://zalo.me/sdt_cua_ban</code>. Khi khách hàng bấm vào sẽ mở trực tiếp khung chat Zalo.
                        </div>
                      </div>

                      {/* Facebook Link */}
                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold">Đường dẫn Facebook Messenger (m.me)</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0 text-primary" style={{ padding: '10px 15px' }}>
                            <MessengerIcon />
                          </span>
                          <input
                            type="url"
                            name="facebook_link"
                            className="form-control bg-light border-0"
                            placeholder="Ví dụ: https://m.me/yourfanpage"
                            value={formData.facebook_link}
                            onChange={handleChange}
                            required
                          />
                        </div>
                        <div className="form-text text-muted small mt-1">
                          Liên kết Messenger dưới dạng: <code>https://m.me/ten_fanpage_hoac_id</code> để khách hàng kết nối trực tiếp đến hộp thư Fanpage.
                        </div>
                      </div>

                      {/* Address */}
                      <div className="col-12">
                        <label className="form-label text-muted small fw-bold">Địa chỉ cửa hàng</label>
                        <div className="input-group">
                          <span className="input-group-text bg-light border-0 text-danger">
                            <FiMapPin />
                          </span>
                          <textarea
                            name="address_contact"
                            rows="2"
                            className="form-control bg-light border-0"
                            placeholder="Nhập địa chỉ showroom/cửa hàng của bạn..."
                            value={formData.address_contact}
                            onChange={handleChange}
                            required
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="card-footer bg-white border-top p-4 d-flex justify-content-end">
                    <button
                      type="submit"
                      className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2 fw-semibold shadow-sm"
                      disabled={isSaving}
                    >
                      {isSaving ? (
                        <>
                          <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                          Đang lưu cấu hình...
                        </>
                      ) : (
                        <>
                          <FiSave />
                          Lưu cấu hình hệ thống
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0 mb-4">
                <div className="card-header bg-white border-bottom py-3">
                  <h5 className="mb-0 text-dark">Hướng dẫn thiết lập</h5>
                </div>
                <div className="card-body">
                  <p className="card-text text-muted small leading-relaxed">
                    Thông tin cấu hình ở đây sẽ hiển thị trực tiếp lên <strong>Widget liên hệ thông minh</strong> nổi ở góc phải bên dưới của tất cả trang dành cho khách hàng.
                  </p>
                  <div className="bg-light p-3 rounded-3 mb-3">
                    <h6 className="fw-bold small text-dark mb-2">📌 Mẹo nhỏ Zalo:</h6>
                    <p className="text-muted small mb-0 leading-relaxed">
                      Sử dụng số điện thoại đăng ký Zalo: <code>https://zalo.me/0987654321</code> để dẫn khách thẳng tới ô nhắn tin cá nhân của bạn.
                    </p>
                  </div>
                  <div className="bg-light p-3 rounded-3">
                    <h6 className="fw-bold small text-dark mb-2">📌 Mẹo nhỏ Facebook Messenger:</h6>
                    <p className="text-muted small mb-0 leading-relaxed">
                      Sử dụng tên người dùng của Fanpage: <code>https://m.me/shuttlex.vn</code> để liên kết trực tiếp với Fanpage bán hàng.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SystemSettingsPage
