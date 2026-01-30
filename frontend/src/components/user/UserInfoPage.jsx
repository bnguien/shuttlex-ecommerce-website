import { useContext } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthContext } from '../context/AuthContext.jsx'

function UserInfoPage() {
    const {username, last_name, first_name, email} = useContext(AuthContext)
    const navigate = useNavigate()
  return (
    <>
      <div className="container mt-5">
        <h2>User Information</h2>
        <div className="card mt-4">
          <div className="card-body">
            <h5 className="card-title">Username: {username}</h5>
            <p className="card-text">First Name: {first_name}</p>
            <p className="card-text">Last Name: {last_name}</p>
            <p className="card-text">Email: {email}</p>
          </div>
        </div>
        <div className="mt-4">
          <button className="btn btn-primary me-2">Edit Information</button>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/change-password')}
          >
            Change Password
          </button>
        </div>
      </div>
    </>
  )
}

export default UserInfoPage