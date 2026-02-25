import {useCallback, useEffect, useState} from 'react'
import { jwtDecode } from 'jwt-decode'
import api from '../../api'
import { Navigate , useLocation} from 'react-router-dom'
import Spinner from './Spinner.jsx'
function ProtectedRoute({children}) {
    const [isAuthorised, setIsAuthorised] = useState(null)
    const location = useLocation()
    const refreshToken = useCallback(async () => {
        const refreshToken = localStorage.getItem("refresh")
        try{
            const res = await api.post("/token/refresh/", {
                refresh: refreshToken
            })
            if(res.status === 200){
                localStorage.setItem("access", res.data.access)
                setIsAuthorised(true)
            }
            else{
                setIsAuthorised(false)
            }
        }
        catch(error){
            console.log("Refresh token error:", error)
            setIsAuthorised(false)
        }
    }, [])

    const auth = useCallback(async () => {
        const token = localStorage.getItem("access")
        if(!token){
            setIsAuthorised(false)
            return
        }

        const decoded = jwtDecode(token)
        const expiry_date = decoded.exp
        const current_time = Date.now()/1000
        if (expiry_date < current_time){
            await refreshToken()
        }
        else{
            setIsAuthorised(true)
        }
    }, [refreshToken])

    useEffect(()=>{
        auth().catch(()=> setIsAuthorised(true))
    },[auth])

    if(isAuthorised === null){
        return <Spinner/>
    }

    if(isAuthorised){
        return children
    }
    else{
        return <Navigate to="/login" state={{from: location}} replace/>
    }
}

export default ProtectedRoute