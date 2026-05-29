import { NavLink, useNavigate, Link, useLocation } from "react-router-dom"
import { useContext, useEffect, useState } from "react"
import { FaChevronDown, FaUser, FaRightFromBracket } from "react-icons/fa6"
import { AuthContext } from "../context/AuthContext.jsx"
import api from "../../api"
import styles from "./NavBarLink.module.css"

const NavBarLink = () => {
    const { isAuthenticated, username, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()
    const [categories, setCategories] = useState([])
    const [isProductsOpen, setIsProductsOpen] = useState(false)
    const [isPromosOpen, setIsPromosOpen] = useState(false)

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
                        Trang chủ
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
                        Giới thiệu
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
                        Sản phẩm
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
                                <span className={styles.dropdownEmpty}>Không có danh mục</span>
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
                <li
                    className={`nav-item ${styles.productsMenu} ${isPromosOpen ? styles.dropdownOpen : ""}`}
                    onMouseEnter={() => setIsPromosOpen(true)}
                    onMouseLeave={() => setIsPromosOpen(false)}
                >
                    <NavLink
                        to="/promotions"
                        className={({ isActive }) =>
                            isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                        }
                        onClick={() => setIsPromosOpen(false)}
                    >
                        Khuyến mãi
                        <span
                            className={`${styles.productsArrow} ${isPromosOpen ? styles.productsArrowOpen : ""}`}
                            aria-hidden="true"
                        >
                            <FaChevronDown />
                        </span>
                    </NavLink>
                    <div className={styles.dropdown}>
                        <div className={styles.dropdownGrid}>
                            <Link
                                to="/promotions#flash-sale"
                                className={styles.dropdownItem}
                                onClick={() => setIsPromosOpen(false)}
                            >
                                Flash Sale
                            </Link>
                            <Link
                                to="/promotions#vouchers"
                                className={styles.dropdownItem}
                                onClick={() => setIsPromosOpen(false)}
                            >
                                Voucher
                            </Link>
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
                        Liên hệ
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
                                <FaUser />
                            </NavLink>
                        </li>
                    </>
                )}
                {isAuthenticated && (
                    <>
                        <li
                            className={`nav-item ${styles.accountMenu}`}
                        >
                            <NavLink
                                to="/profile"
                                className={({ isActive }) =>
                                    isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                                }
                                end
                            >
                                Xin chào, {username}
                            </NavLink>
                            <div className={styles.accountDropdown}>
                                <Link
                                    to="/profile"
                                    className={styles.accountItem}
                                >
                                    <FaUser />
                                    <span>Profile</span>
                                </Link>
                                <button
                                    onClick={handleLogout}
                                    className={styles.accountItemButton}
                                    type="button"
                                >
                                    <FaRightFromBracket />
                                    <span>Logout</span>
                                </button>
                            </div>
                        </li>
                    </>
                )}
            </ul>
        </div>
    )
}


export default NavBarLink