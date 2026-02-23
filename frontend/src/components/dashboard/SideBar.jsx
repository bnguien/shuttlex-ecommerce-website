import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { FiBox, FiGrid, FiHome, FiShoppingBag, FiTag, FiUsers, FiChevronDown, FiLayers } from 'react-icons/fi'
import styles from './SideBar.module.css'

function SideBar() {
  const [isCatalogOpen, setIsCatalogOpen] = useState(false)

  const openCatalog = () => setIsCatalogOpen(true)
  const closeCatalog = () => setIsCatalogOpen(false)
  const toggleCatalog = () => setIsCatalogOpen(prev => !prev)

  return (
    <div className={`d-flex flex-column p-4 h-100 w-100 ${styles.sidebar}`}>
      <Link className="navbar-brand fw-bold fs-4 text-white mb-0 text-center" to="/admin/dashboard">
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
        <div
          className={styles.sidebarGroupWrapper}
          onMouseEnter={openCatalog}
          onMouseLeave={closeCatalog}
        >
          <button
            type="button"
            className={styles.sidebarGroupToggle}
            onClick={toggleCatalog}
          >
            <span className={styles.sidebarGroupToggleInner}>
              <span className={styles.sidebarGroupTitle}>
                <FiLayers /> Catalog
              </span>
              <FiChevronDown className={isCatalogOpen ? styles.catalogChevronOpen : styles.catalogChevron} />
            </span>
          </button>
          <div className={`${styles.sidebarGroup} ${isCatalogOpen ? styles.sidebarGroupOpen : ""}`}>
            <NavLink
              to="/admin/categories"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${styles.sidebarSubLink} ${isActive ? styles.sidebarLinkActive : ""}`
              }
            >
              <FiGrid /> Categories
            </NavLink>
            <NavLink
              to="/admin/brands"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${styles.sidebarSubLink} ${isActive ? styles.sidebarLinkActive : ""}`
              }
            >
              <FiTag /> Brands
            </NavLink>
            <NavLink
              to="/admin/sizes"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${styles.sidebarSubLink} ${isActive ? styles.sidebarLinkActive : ""}`
              }
            >
              <FiBox /> Sizes
            </NavLink>
            <NavLink
              to="/admin/products"
              className={({ isActive }) =>
                `nav-link d-flex align-items-center gap-2 ${styles.sidebarLink} ${styles.sidebarSubLink} ${isActive ? styles.sidebarLinkActive : ""}`
              }
            >
              <FiBox /> Products
            </NavLink>
          </div>
        </div>
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