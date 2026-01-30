import { NavLink, useNavigate, Link, useLocation } from "react-router-dom"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext.jsx"

const NavBarLink = () => {
    const { isAuthenticated, username, logout } = useContext(AuthContext)
    const navigate = useNavigate()
    const location = useLocation()

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
                 <li className="nav-item">
                    <NavLink
                        to="/products"
                        className={({ isActive }) =>
                            isActive ? "nav-link active fw-semibold" : "nav-link fw-semibold"
                        }
                    >
                        Products
                    </NavLink>
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