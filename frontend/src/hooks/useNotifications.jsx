import { useState, useEffect, useCallback, useRef } from 'react'
import api, { BASE_URL } from '../api'

export function useNotifications() {
    const [notifications, setNotifications] = useState()
    const [loading, setLoading] = useState(false)
    const wsRef = useRef(null)

    const fetchNotifications = useCallback(async() => {
        const token = localStorage.getItem('access')
        if (!token) return

        setLoading(true)

        try {
            const res = await api.get('/api/notifications/?page_size=20')
            setNotifications(res.data.results ?? res.data)
        } catch(err) {
            console.error('[NOTIFICATIONS] Fetch error:', err)
        } finally {
            setLoading(false)
        }
    }, []) 

    const connectWS = useCallback(() => {
        const token = localStorage.getItem('access')
        if (!token) return

        if (wsRef.current) wsRef.current.close()
        
        const wsUrl = `${BASE_URL.replace('http', 'ws')}/ws/notifications/?token=${token}`
        const ws = new WebSocket(wsUrl)
        wsRef.current = ws

        ws.onmessage = (event) => {
            const data = JSON.parse(event.data)
            if (data.type === 'NEW_NOTIFICATION') {
                setNotifications(prev => [data.payload, ...prev])
            }
        }

        ws.onerror = () => console.error('[WEBSOCKET] Notification connection error.')
        ws.onclose = (e) => {
            if (e.code !== 1000) {
                setTimeout(connectWS, 3000)
            }
        }
    }, [])

    useEffect(() => {
        fetchNotifications()
        connectWS()
        return () => {
            if(wsRef.current) wsRef.current.close(1000)
        }
    }, [fetchNotifications, connectWS])

    const unreadCount = (notifications || []).filter(n => !n.is_read).length

    const markRead = useCallback(async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/read/`)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: true } : n)
            )
        } catch (err) {
            console.error('[NOTIFICATIONS] Mark read error:', err)
        }
    }, [])

    const markUnRead = useCallback(async (id) => {
        try {
            await api.patch(`/api/notifications/${id}/unread/`)
            setNotifications(prev =>
                prev.map(n => n.id === id ? { ...n, is_read: false } : n)
            )
        } catch (err) {
            console.error('[NOTIFICATIONS] Mark unread error:', err)
        }
    }, [])

    const markAllRead = useCallback(async () => {
        try {
            await api.post('/api/notifications/mark-all-read/')
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
        } catch (err) {
            console.error('[Notifications] Mark all read error:', err)
        }
    }, [])

    const clearAll = useCallback(async () => {
        try {
            await api.delete('/api/notifications/clear-all/')
            setNotifications([])
        } catch (err) {
            console.error('[Notifications] Clear all error:', err)
        }
    }, [])

    return {
        notifications,
        unreadCount, 
        loading,
        markRead,
        markUnRead,
        markAllRead,
        clearAll,
        refetch: fetchNotifications,
    }
}