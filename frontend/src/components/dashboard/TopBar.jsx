import { NavLink, useNavigate, Link } from "react-router-dom"

import { useAuthStore } from "../../store/authStore"
function TopBar() {
  const { isAuthenticated, username, logout } = useAuthStore()
  const navigate = useNavigate()
  const getGreeting = () => {
    const hour = new Date().getHours();

    if (hour >= 5 && hour < 12) return "Chào buổi sáng";
    if (hour >= 12 && hour < 18) return "Chào buổi chiều";
    return "Chào buổi tối";
  };

  const handleLogout = async () => {
    await logout()
    navigate("/login")
  }

  return (
    <div
      className="d-flex align-items-center w-100 py-3 px-4 border-bottom"
      style={{
        background: `linear-gradient(
    to right,
    rgba(255, 255, 255, 0.25),
    rgba(255, 255, 255, 0.05)
  )`,
        backdropFilter: "blur(18px)",
        WebkitBackdropFilter: "blur(18px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.4)",
        boxShadow: "0 8px 32px rgba(0, 0, 0, 0.08)"
      }}
    >
      <div className="fs-5 fw-semibold text-dark">
        {getGreeting()}
      </div>

      <ul className="navbar-nav d-flex flex-row align-items-center gap-4 ms-auto mb-0">
        {isAuthenticated && (
          <>
            <li className="nav-item">
              <NavLink
                to="/admin/profile"
                className={({ isActive }) =>
                  isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                }
                end
              >
                Xin chào, {username}
              </NavLink>
            </li>
            <li className="nav-item">
              <button
                onClick={handleLogout}
                className="nav-link fw-semibold btn btn-link text-decoration-none"
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                Đăng xuất
              </button>
            </li>
          </>
        )}
      </ul>
    </div>
  )
}

export default TopBar