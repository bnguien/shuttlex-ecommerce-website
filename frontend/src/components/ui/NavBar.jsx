import { FaCartShopping, FaUser, FaMagnifyingGlass, FaRegBell } from "react-icons/fa6"
/*Search react icon để biết thêm nhiều icon*/
import { Link } from "react-router-dom"
import { useContext, useState } from "react"
import { AuthContext } from "../context/AuthContext"
import styles from "./NavBar.module.css"
import NavLink from "./NavBarLink.jsx"
import SearchBar from "./SearchBar.jsx"
import NotificationBell from './NotificationBell'

const NavBar = ({ numCartItems, transparent = false }) => {
    const { isAuthenticated } = useContext(AuthContext)
    const [isSearchOpen, setIsSearchOpen] = useState(false);

    return (
        <nav
            className={`navbar navbar-expand-lg navbar-dark py-3 ${transparent ? '' : `${styles.stickyNavbar} ${styles.greenNavbar}`}`}
            style={transparent
                ? { position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(0,0,0,0)' }
                : { background: 'radial-gradient(circle, #66c064 0%, #429241 40%, #2f6f2e 100%)', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }
            }
        >
            <div className="container position-relative">
                <Link className="navbar-brand fw-bold fs-4" to="/" style={transparent ? { color: '#ffffff' } : { color: '#b6d985' }}>
                    ShuttleX
                </Link>
                {/* hamburger button dùng cho màn hình nhỏ (mobile,tablet) */}
                <button
                    className="navbar-toggler"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target="#navbarContent"
                    aria-controls="navbarContent"
                    aria-expanded="false"
                    aria-label="Toggle navigation"
                >
                    <span className="navbar-toggler-icon"></span>
                </button>
                <div className="collapse navbar-collapse" id="navbarContent">
                    <NavLink />
                    <div className="d-flex align-items-center ms-3 gap-3">
                        <button
                            id="search-toggle-btn"
                            className={`btn btn-link p-0 border-0 ${isSearchOpen ? 'text-white' : 'text-light'}`}
                            style={{
                                opacity: isSearchOpen ? 1 : 0.8,
                                transform: isSearchOpen ? 'scale(1.1)' : 'scale(1)',
                                transition: 'all 0.2s'
                            }}
                            onClick={() => setIsSearchOpen(!isSearchOpen)}
                        >
                            <FaMagnifyingGlass size={20} />
                        </button>
                        {isAuthenticated && (<NotificationBell />)}

                        <Link to="/cart" className={`btn btn-outline-light ms-3 rounded-pill position-relative ${styles.responsiveCart}`}>
                            <FaCartShopping />
                            {numCartItems > 0 && <span
                                className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                                style={{ fontSize: "0.85rem", padding: "0.5em 0.65em", backgroundColor: "#1b0f4a" }}
                            >
                                {numCartItems}
                            </span>}
                        </Link>
                    </div>
                </div>
            </div>

            <SearchBar
                isOpen={isSearchOpen}
                onClose={() => setIsSearchOpen(false)}
                transparent={transparent}
            />
        </nav>
    )
}

export default NavBar
