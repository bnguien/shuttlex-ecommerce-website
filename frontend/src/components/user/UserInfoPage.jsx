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
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your profile...</p>
          </div>
        </div>
      </div>
    )
  }
    
  return (
    <>
      <div className="container my-5">
        <div className="mb-4">
          <h2 className="fw-bold">My Profile</h2>
          <p className="text-muted">Manage your personal information and preferences</p>
        </div>

        <div className="row g-4">
          <div className="col-lg-6">
            <div className="card shadow-sm border-0 mb-4">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiUser className="me-2" />
                  Profile Information
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="mb-3">
                  <label className="form-label text-muted small mb-1">Username</label>
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
                    <label className="form-label text-muted small mb-1">First Name</label>
                    <input 
                      type="text" 
                      className="form-control bg-light border-0" 
                      value={first_name || ''} 
                      disabled 
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label text-muted small mb-1">Last Name</label>
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
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiMapPin className="me-2" />
                  Address Book
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="text-center py-4 text-muted">
                  <FiMapPin size={48} className="mb-3 opacity-50" />
                  <p className="mb-3">No address saved yet</p>
                  <button className="btn btn-outline-success">
                    Add Address
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
                  Order Summary
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="row text-center">
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h3 className="mb-0 text-primary">0</h3>
                      <small className="text-muted">Total Orders</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h3 className="mb-0" style={{color: '#ff4d2a'}}>0</h3>
                      <small className="text-muted">Pending</small>
                    </div>
                  </div>
                  <div className="col-4">
                    <div className="border rounded p-3">
                      <h3 className="mb-0 text-success">0</h3>
                      <small className="text-muted">Completed</small>
                    </div>
                  </div>
                </div>
                <hr className="my-3" />
                <div className="text-center text-muted">
                  <p className="mb-3">No orders found</p>
                  <button 
                    className="btn btn-outline-success"
                    onClick={() => navigate('/products')}
                  >
                    Start Shopping
                  </button>
                </div>
              </div>
            </div>

            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom py-3">
                <h5 className="mb-0 d-flex align-items-center">
                  <FiLock className="me-2" />
                  Security Settings
                </h5>
              </div>
              <div className="card-body p-4">
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h6 className="mb-1">Password</h6>
                    <small className="text-muted">Change your account password</small>
                  </div>
                  <button 
                    className="btn btn-outline-success btn-sm"
                    onClick={() => navigate('/change-password')}
                  >
                    Change
                  </button>
                </div>
                <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom">
                  <div>
                    <h6 className="mb-1">Two-Factor Authentication</h6>
                    <small className="text-muted">Add an extra layer of security</small>
                  </div>
                  <span className="badge bg-secondary">Coming Soon</span>
                </div>
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <h6 className="mb-1">Login History</h6>
                    <small className="text-muted">View recent login activity</small>
                  </div>
                  <button className="btn btn-outline-secondary btn-sm" disabled>
                    View
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