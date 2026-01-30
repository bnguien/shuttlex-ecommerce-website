import { Link } from 'react-router-dom'
import { FiHome, FiGrid, FiBox, FiShoppingBag, FiUsers } from 'react-icons/fi'
import styles from './SideBar.module.css'

function SideBar() {
  return (
    <div className={`d-flex flex-column p-4 h-100 ${styles.sidebar}`}>
      <Link className="navbar-brand fw-bold fs-4 text-dark mb-0 text-center" to="/">
        ShuttleX
      </Link>
      <hr/>
      <nav className="nav flex-column gap-2">
        <Link to="/admin/dashboard" className="nav-link d-flex align-items-center gap-2">
          <FiHome /> Dashboard
        </Link>
        <Link to="/admin/categories" className="nav-link d-flex align-items-center gap-2">
          <FiGrid /> Categories
        </Link>
        <Link to="/admin/products" className="nav-link d-flex align-items-center gap-2">
          <FiBox /> Products
        </Link>
        <Link to="/admin/orders" className="nav-link d-flex align-items-center gap-2">
          <FiShoppingBag /> Orders
        </Link>
        <Link to="/admin/users" className="nav-link d-flex align-items-center gap-2">
          <FiUsers /> Users
        </Link>
      </nav>

      <div className="mt-auto pt-3 border-top text-muted small text-center">
        ShuttleX Admin<br />
        2026 ShuttleX Inc.
      </div>
    </div>

  )
}

export default SideBar