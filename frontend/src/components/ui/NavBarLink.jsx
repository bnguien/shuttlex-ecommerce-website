import { NavLink, useNavigate, Link, useLocation } from "react-router-dom"
import { useContext, useEffect, useState } from "react"
import { FaChevronDown } from "react-icons/fa6"
import { AuthContext } from "../context/AuthContext.jsx"
import api from "../../api"
import styles from "./NavBarLink.module.css"

const NavBarLink = () => {
    const { isAuthenticated, username, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()
    const [categories, setCategories] = useState([])
    const [isProductsOpen, setIsProductsOpen] = useState(false)

    useEffect(() => {
        let isMounted = true
        api.get('categories/')
            .then((res) => {
                if (isMounted) {
                    setCategories(Array.isArray(res.data) ? res.data : [])
                }
            })
            .catch(() => {})

        return () => {
            isMounted = false
        }
    }, [])

    const handleLogout = async () => {
        await logout()
        navigate("/login")
    }

    const handleAboutClick = (e) => {
        if (location.pathname === '/') {
            e.preventDefault()
            const aboutSection = document.getElementById('about-section')
            if (aboutSection) {
                aboutSection.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }

    const handleContactClick = (e) => {
        if (location.pathname === '/') {
            e.preventDefault()
            const contactSection = document.getElementById('contact-section')
            if (contactSection) {
                contactSection.scrollIntoView({ behavior: 'smooth' })
            }
        }
    }

    return (
        <div className="d-flex align-items-center w-100">
            <ul
                className="navbar-nav d-flex align-items-center gap-3 px-4 py-1 position-absolute start-50 translate-middle-x"
                style={{
                    backgroundColor: 'rgba(244, 238, 238, 0.2)',
                    borderRadius: '999px'
                }}
            >
                <li className="nav-item">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                        }
                        end
                    >
                        Home
                    </NavLink>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/about"
                        className={({ isActive }) =>
                            isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                        }
                        onClick={handleAboutClick}
                    >
                        About
                    </NavLink>
                </li>
                <li
                    className={`nav-item ${styles.productsMenu} ${isProductsOpen ? styles.dropdownOpen : ""}`}
                    onMouseEnter={() => setIsProductsOpen(true)}
                    onMouseLeave={() => setIsProductsOpen(false)}
                >
                    <NavLink
                        to="/products"
                        className={({ isActive }) =>
                            isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                        }
                        onClick={() => setIsProductsOpen(false)}
                    >
                        Products
                        <span
                            className={`${styles.productsArrow} ${isProductsOpen ? styles.productsArrowOpen : ""}`}
                            aria-hidden="true"
                        >
                            <FaChevronDown />
                        </span>
                    </NavLink>
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownGrid}>
                            {categories.length === 0 && (
                                <span className={styles.dropdownEmpty}>No categories</span>
                            )}
                            {categories.map((category) => (
                                <Link
                                    key={category.id}
                                    to={`/products?category=${category.slug}`}
                                    className={styles.dropdownItem}
                                    onClick={() => setIsProductsOpen(false)}
                                >
                                    {category.name}
                                </Link>
                            ))}
                        </div>
                    </div>
                </li>
                <li className="nav-item">
                    <NavLink
                        to="/contact"
                        className={({ isActive }) =>
                            isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                        }
                        onClick={handleContactClick}
                    >
                        Contact
                    </NavLink>
                </li>
            </ul>

            <ul className="navbar-nav d-flex align-items-center gap-2 mb-0 ms-auto">
                {!isAuthenticated && (
                    <>
                        <li className="nav-item">
                            <NavLink
                                to="/login"
                                className={({ isActive }) =>
                                    isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                                }
                            >
                                Login
                            </NavLink>
                        </li>
                        <li className="nav-item">
                            <NavLink
                                to="/register"
                                className={({ isActive }) =>
                                    isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                                }
                            >
                                Register
                            </NavLink>
                        </li>
                    </>
                )}
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


export default NavBarLink