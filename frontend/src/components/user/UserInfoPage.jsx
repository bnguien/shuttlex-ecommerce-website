import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'
import { FiUser, FiMail, FiMapPin, FiShoppingBag, FiLock, FiEdit3 } from 'react-icons/fi'

function UserInfoPage() {
    const {username, last_name, first_name, email, isLoading} = useContext(AuthContext)
    const navigate = useNavigate()

  if (isLoading) {
    return (
      <div className="container my-5">
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
    <>
      <div className="container my-5">
        <div className="mb-4">
          <h2 className="fw-bold">Hồ sơ của tôi</h2>
          <p className="text-muted">Quản lý thông tin cá nhân và tùy chọn của bạn</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiUser className="me-2" />
                  Thông tin hồ sơ
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label text-muted small mb-1">Tên đăng nhập</label>
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
                <div className="mb-3">
                  <label className="form-label text-muted small mb-1">Email</label>
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
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Tên</label>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0" 
                      value={first_name || ''} 
                      disabled 
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Họ</label>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0" 
                      value={last_name || ''} 
                      disabled 
                    />
                  </div>
                </div>
                <button className="btn btn-success w-100 mt-2">
                  <FiEdit3 className="me-2" />
                  Chỉnh sửa hồ sơ
                </button>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiMapPin className="me-2" />
                  Sổ địa chỉ
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="text-center py-4 text-muted">
                  <FiMapPin size={48} className="mb-3 opacity-50" />
                  <p className="mb-3">Chưa có địa chỉ nào được lưu</p>
                  <button className="btn btn-outline-success">
                    Thêm địa chỉ
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-6">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiShoppingBag className="me-2" />
                  Tóm tắt đơn hàng
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row text-center">
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h3 className="mb-0 text-primary">0</h3>
                      <small className="text-muted">Tổng đơn hàng</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h3 className="mb-0" style={{color: '#ff4d2a'}}>0</h3>
                      <small className="text-muted">Đang xử lý</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h3 className="mb-0 text-success">0</h3>
                      <small className="text-muted">Hoàn thành</small>
                    </div>
                  </div>
                </div>
                <hr className="my-3" />
                <div className="text-center text-muted">
                  <p className="mb-3">Chưa có đơn hàng nào</p>
                  <button 
                    className="btn btn-outline-success"
                    onClick={() => navigate('/products')}
                  >
                    Bắt đầu mua sắm
                  </button>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiLock className="me-2" />
                  Cài đặt bảo mật
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h6 className="mb-1">Mật khẩu</h6>
                    <small className="text-muted">Đổi mật khẩu tài khoản của bạn</small>
                  </div>
                  <button 
                    className="btn btn-outline-success btn-sm"
                    onClick={() => navigate('/change-password')}
                  >
                    Đổi
                  </button>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h6 className="mb-1">Xác thực hai lớp</h6>
                    <small className="text-muted">Thêm một lớp bảo mật bổ sung</small>
                  </div>
                  <span className="badge bg-secondary">Sắp ra mắt</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Lịch sử đăng nhập</h6>
                    <small className="text-muted">Xem hoạt động đăng nhập gần đây</small>
                  </div>
                  <button className="btn btn-outline-secondary btn-sm" disabled>
                    Xem
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default UserInfoPage