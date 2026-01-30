import { NavLink, useNavigate, Link, useLocation } from "react-router-dom"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext.jsx"
function TopBar() {
  const { isAuthenticated, username, logout } = useContext(AuthContext)
  const navigate = useNavigate()
  const location = useLocation()

  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Good morning";
    if (hour >= 12 && hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div className="d-flex align-items-center w-100 py-3 px-4 border-bottom bg-white"style={{backgroundColor: '#ffffff'}}>
      <div className="fs-5 fw-semibold text-dark">
        {getGreeting()}
      </div>
      
      <ul className="navbar-nav d-flex flex-row align-items-center gap-4 ms-auto mb-0">
        {isAuthenticated && (
          <>
            <li className="nav-item">
              <NavLink
                to="/profile"
                className={({ isActive }) =>
                  isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                }
                end
              >
                Hi, {username}
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="nav-link fw-semibold btn btn-link text-decoration-none"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Logout
              </button>
            </li>
        </>
      )}
    </ul>
    </div>
  )
}

export default TopBar