import { create } from 'zustand'
import { jwtDecode } from "jwt-decode"
import api from "../api"

export const useAuthStore = create((set, get) => ({
    isAuthenticated: false,
    isLoading: true,
    username: "",
    first_name: "",
    last_name: "",
    email: "",
    isStaff: false,

    setIsAuthenticated: (val) => set({ isAuthenticated: val }),
    setIsStaff: (val) => set({ isStaff: val }),
    
    handleAuth: () => {
        const token = localStorage.getItem("access")
        if (token) {
            try {
                const decoded = jwtDecode(token)
                const expiry_date = decoded.exp
                const current_time = Date.now() / 1000
                if (expiry_date >= current_time) {
                    set({ isAuthenticated: true })
                    return true
                }
            } catch (e) {
                console.error("Invalid token:", e)
            }
        }
        set({ isAuthenticated: false })
        return false
    },

    get_username: async () => {
        try {
            const res = await api.get("get_username/")
            set({ username: res.data.username })
            return res
        } catch (err) {
            console.log(err)
        }
    },
    get_first_name: async () => {
        try {
            const res = await api.get("get_first_name/")
            set({ first_name: res.data.first_name })
            return res
        } catch (err) {
            console.log(err)
        }
    },
    get_last_name: async () => {
        try {
            const res = await api.get("get_last_name/")
            set({ last_name: res.data.last_name })
            return res
        } catch (err) {
            console.log(err)
        }
    },
    get_email: async () => {
        try {
            const res = await api.get("get_email/")
            set({ email: res.data.email })
            return res
        } catch (err) {
            console.log(err)
        }
    },
    get_user_role: async () => {
        try {
            const res = await api.get("get_user_role/")
            set({ isStaff: res.data.is_staff || res.data.is_superuser })
            return res
        } catch (err) {
            console.log(err)
            return null
        }
    },

    refreshUserData: async () => {
        const store = get()
        const authenticated = store.handleAuth()
        if (!authenticated) {
            set({
                username: "",
                first_name: "",
                last_name: "",
                email: "",
                isStaff: false
            })
            return { isStaff: false }
        }

        const [ , , , , roleResponse ] = await Promise.all([
            store.get_username(),
            store.get_first_name(),
            store.get_last_name(),
            store.get_email(),
            store.get_user_role()
        ])

        return {
            isStaff: !!(roleResponse?.data?.is_staff || roleResponse?.data?.is_superuser)
        }
    },

    logout: async () => {
        try {
            await api.post("/auth/logout/")
        } catch (err) {
            console.log("Logout error:", err)
        } finally {
            localStorage.removeItem("access")
            localStorage.removeItem("refresh")
            window.dispatchEvent(new Event("cart:reset"))
            set({
                isAuthenticated: false,
                username: "",
                first_name: "",
                last_name: "",
                email: "",
                isStaff: false
            })
        }
    },

    initAuth: async () => {
        try {
            await get().refreshUserData()
        } finally {
            set({ isLoading: false })
        }
    }
}))
