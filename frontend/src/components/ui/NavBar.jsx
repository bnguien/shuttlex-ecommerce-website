import { FaCartShopping, FaUser } from "react-icons/fa6"
/*Search react icon để biết thêm nhiều icon*/
import { Link } from "react-router-dom"
import { useContext } from "react"
import { AuthContext } from "../context/AuthContext"
import styles from "./NavBar.module.css"
import NavLink from "./NavBarLink.jsx"

const NavBar = ({numCartItems, transparent = false}) => {
    const { isAuthenticated } = useContext(AuthContext)
    
    return (
        <nav
            className={`navbar navbar-expand-lg ${transparent ? 'navbar-dark' : 'navbar-light bg-white shadow-sm'} py-3 ${transparent ? '' : styles.stickyNavbar}`}
            style={transparent ? {position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, backgroundColor: 'rgba(0,0,0,0)'} : {}}
        >
            <div className="container">
                <Link className="navbar-brand fw-bold fs-4" to="/" style={transparent ? {color: '#ffffff'} : {}}>
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
                    <Link to="/cart" className={`btn ${transparent ? 'btn-outline-light' : 'btn-dark'} ms-3 rounded-pill position-relative ${styles.responsiveCart}`}>
                        <FaCartShopping />
                        {numCartItems == 0 || <span
                            className="position-absolute top-0 start-100 translate-middle badge rounded-pill"
                            style={{ fontSize: "0.85rem", padding: "0.5em 0.65em", backgroundColor: "#1b0f4a" }}
                        >
                            {numCartItems}
                        </span>}
                    </Link>
                    
                </div>
            </div>
        </nav>
    )
}

export default NavBar
