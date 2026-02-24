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
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-3 text-muted">Loading your profile...</p>
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
            <h2 className="mb-0">Admin Profile</h2>
            <span className="badge bg-success fs-6">
              <FiShield className="me-1" />
              {isStaff ? 'Staff' : 'Administrator'}
            </span>
          </div>

          <div className="row g-4">
            <div className="col-lg-8">
              <div className="card shadow-sm border-0">
                <div className="card-header bg-white border-bottom">
                  <h5 className="mb-0">
                    <FiUser className="me-2" />
                    Profile Information
                  </h5>
                </div>
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Username</label>
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
                      <label className="form-label text-muted small">Email Address</label>
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
                      <label className="form-label text-muted small">First Name</label>
                      <input 
                        type="text" 
                        className="form-control bg-light border-0" 
                        value={first_name || ''} 
                        disabled 
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label text-muted small">Last Name</label>
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
                  <h5 className="mb-0">Quick Actions</h5>
                </div>
                <div className="card-body">
                  <div className="d-grid gap-2">
                    <button 
                      className="btn btn-outline-primary text-start"
                      onClick={() => navigate('/admin/change-password')}
                    >
                      <FiLock className="me-2" />
                      Change Password
                    </button>
                    <button 
                      className="btn btn-outline-secondary text-start"
                      onClick={() => navigate('/admin/dashboard')}
                    >
                      <FiShield className="me-2" />
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>

              <div className="card shadow-sm border-0 mt-3">
                <div className="card-body">
                  <h6 className="card-subtitle mb-2 text-muted">Account Type</h6>
                  <p className="card-text">
                    You are logged in as an administrator. You have access to the admin panel and can manage the system.
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
