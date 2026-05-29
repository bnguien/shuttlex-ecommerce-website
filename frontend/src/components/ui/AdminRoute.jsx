import { Navigate } from "react-router-dom"
import { useAuthStore } from "../../store/authStore"

function AdminRoute({ children }) {
  const { isAuthenticated, isStaff, isLoading } = useAuthStore()
  
  // Chờ AuthContext load xong
  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100">
      <div className="spinner-border" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (!isStaff) {
    return <Navigate to="/" replace />
  }
  
  return children
}

export default AdminRoute
