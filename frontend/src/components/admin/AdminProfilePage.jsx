import { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import { FiUser, FiMail, FiShield, FiLock } from 'react-icons/fi'

function AdminProfilePage() {
  const { username, last_name, first_name, email, isStaff, isLoading } = useContext(AuthContext)
  const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="container-fluid p-4">
        <div className="d-flex justify-content-center align-items-center" style={{minHeight: '400px'}}>
          <div className="text-center">
            <div className="spinner-border text-success" role="status" style={{width: '3rem', height: '3rem'}}>
              <span className="visually-hidden">Đang tải...</span>
            </div>
            <p className="mt-3 text-muted">Đang tải hồ sơ của bạn...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container-fluid p-4">
      <div className="row">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">Hồ sơ quản trị</h2>
            <span className="badge bg-success fs-6">
              <FiShield className="me-1" />
              {isStaff ? 'Nhân viên' : 'Quản trị viên'}
            </span>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0">
                    <FiUser className="me-2" />
                    Thông tin hồ sơ
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Tên đăng nhập</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0">
                          <FiUser />
                        </span>
                        <input 
                          type="text" 
                          className="form-control bg-light border-0" 
                          value={username || ''} 
                          disabled 
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Địa chỉ email</label>
                      <div className="input-group">
                        <span className="input-group-text bg-light border-0">
                          <FiMail />
                        </span>
                        <input 
                          type="email" 
                          className="form-control bg-light border-0" 
                          value={email || ''} 
                          disabled 
                        />
                      </div>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Tên</label>
                      <input 
                        type="text" 
                        className="form-control bg-light border-0" 
                        value={first_name || ''} 
                        disabled 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Họ</label>
                      <input 
                        type="text" 
                        className="form-control bg-light border-0" 
                        value={last_name || ''} 
                        disabled 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-lg-4">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0">Thao tác nhanh</h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary text-start"
                      onClick={() => navigate('/admin/change-password')}
                    >
                      <FiLock className="me-2" />
                      Đổi mật khẩu
                    </button>
                    <button 
                      className="btn btn-outline-secondary text-start"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <FiShield className="me-2" />
                      Quay lại bảng điều khiển
                    </button>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 mt-3">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Loại tài khoản</h6>
                  <p className="card-text">
                    Bạn đang đăng nhập với vai trò quản trị. Bạn có quyền truy cập trang quản trị và quản lý hệ thống.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AdminProfilePage
