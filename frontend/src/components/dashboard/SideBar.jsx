import { Link, NavLink } from 'react-router-dom'
import { FiHome, FiGrid, FiBox, FiShoppingBag, FiUsers } from 'react-icons/fi'
import styles from './SideBar.module.css'

function SideBar() {
  return (
    <div className={`d-flex flex-column p-4 h-100 ${styles.sidebar}`}>
      <Link className="navbar-brand fw-bold fs-4 text-white mb-0 text-center" to="/">
        ShuttleX
      </Link>
      <hr/>
      <nav className="nav flex-column gap-2">
        <NavLink
          to="/admin/dashboard"
          className={({ isActive }) =>
            `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`
          }
        >
          <FiHome /> Dashboard
        </NavLink>
        <NavLink
          to="/admin/categories"
          className={({ isActive }) =>
            `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`
          }
        >
          <FiGrid /> Categories
        </NavLink>
        <NavLink
          to="/admin/products"
          className={({ isActive }) =>
            `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`
          }
        >
          <FiBox /> Products
        </NavLink>
        <NavLink
          to="/admin/orders"
          className={({ isActive }) =>
            `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`
          }
        >
          <FiShoppingBag /> Orders
        </NavLink>
        <NavLink
          to="/admin/users"
          className={({ isActive }) =>
            `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${isActive ? styles.sidebarLinkActive : ""}`
          }
        >
          <FiUsers /> Users
        </NavLink>
      </nav>

      <div className={`mt-auto pt-3 border-top small text-center ${styles.sidebarFooter}`}>
        ShuttleX Admin<br />
        2026 ShuttleX Inc.
      </div>
    </div>

  )
}

export default SideBar