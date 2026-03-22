import { createContext, useEffect } from "react"
import { useState } from "react"
import { jwtDecode } from "jwt-decode"
import api from "../../api"

const AuthContext = createContext(false)

function AuthProvider({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [isLoading, setIsLoading] = useState(true)
    const [username, setUsername] = useState("")
    const [first_name, setFirstName] = useState("")
    const [last_name, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [isStaff, setIsStaff] = useState(false)

    const handleAuth = () => {
        const token = localStorage.getItem("access")
        if (token) {
            const decoded = jwtDecode(token)
            const expiry_date = decoded.exp
            const current_time = Date.now() / 1000
            if (expiry_date >= current_time) {
                setIsAuthenticated(true)
                return true
            }
        }
        setIsAuthenticated(false)
        return false
    }
    function get_username() {
        return api.get("get_username/")
            .then(res => {
                setUsername(res.data.username)
            })
            .catch(err => {
                console.log(err)
            })
    }
    function get_first_name() {
        return api.get("get_first_name/")
            .then(res => {
                setFirstName(res.data.first_name)
            })
            .catch(err => {
                console.log(err)
            })
    }
    function get_last_name() {
        return api.get("get_last_name/")
            .then(res => {
                setLastName(res.data.last_name)
            })
            .catch(err => {
                console.log(err)
            })
    }
    function get_email() {
        return api.get("get_email/")
            .then(res => {
                setEmail(res.data.email)
            })
            .catch(err => {
                console.log(err)
            })
    }
    function get_user_role() {
        return api.get("get_user_role/")
            .then(res => {
                setIsStaff(res.data.is_staff || res.data.is_superuser)
                return res
            })
            .catch(err => {
                console.log(err)
                return null
            })
    }

    async function refreshUserData() {
        const authenticated = handleAuth()
        if (!authenticated) {
            setUsername("")
            setFirstName("")
            setLastName("")
            setEmail("")
            setIsStaff(false)
            return { isStaff: false }
        }

        const [, , , , roleResponse] = await Promise.all([
            get_username(),
            get_first_name(),
            get_last_name(),
            get_email(),
            get_user_role()
        ])

        return {
            isStaff: !!(roleResponse?.data?.is_staff || roleResponse?.data?.is_superuser)
        }
    }
    async function logout() {
        try {
            await api.post("/auth/logout/")
        } catch (err) {
            console.log("Logout error:", err)
        } finally {
            localStorage.removeItem("access")
            localStorage.removeItem("refresh")
            window.dispatchEvent(new Event("cart:reset"))
            setIsAuthenticated(false)
            setUsername("")
            setFirstName("")
            setLastName("")
            setEmail("")
            setIsStaff(false)
        }
    }
    useEffect(() => {
        const loadUserData = async () => {
            try {
                await refreshUserData()
            } finally {
                setIsLoading(false)
            }
        }
        loadUserData()
    }, [])
    const authValue = { isAuthenticated, setIsAuthenticated, isLoading, get_username, get_first_name, get_last_name, get_email, get_user_role, refreshUserData, setIsStaff, username, first_name, last_name, email, isStaff, logout }
    return <AuthContext.Provider value={authValue}>
        {children}
    </AuthContext.Provider>
}
export { AuthContext, AuthProvider }