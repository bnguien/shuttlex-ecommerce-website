import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FaRegBell, FaRegEnvelope } from 'react-icons/fa6'
import { useNotifications } from '../../hooks/useNotifications'
import './NotificationBell.css'

export default function NotificationBell() {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef(null)
    const navigate = useNavigate()

    const {
        notifications,
        unreadCount,
        loading,
        markRead,
        markUnRead,
        markAllRead,
        clearAll,
    } = useNotifications()

    useEffect(() => {
        const handler = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setIsOpen(false)
            }
        }
        document.addEventListener('mousedown', handler)
        return () => document.removeEventListener('mousedown', handler)
    }, [])

    const handleItemClick = async (notif) => {
        if (!notif.is_read) await markRead(notif.id)
        if (notif.link) navigate(notif.link)
        setIsOpen(false)
    }

    const handleClearAll = async () => {
        if (window.confirm('Bạn có muốn xóa tất cả thông báo không?')) {
            await clearAll()
        }
    }

    const formatTime = (isoString) => {
        const date = new Date(isoString)
        const now = new Date()
        const diffMin = Math.floor((now - date) / 60000)
        if (diffMin < 1) return 'Vừa xong'
        if (diffMin < 60) return `${diffMin} phút trước`
        const diffH = Math.floor(diffMin / 60)
        if (diffH < 24) return `${diffH} giờ trước`
        return date.toLocaleDateString('vi-VN')
    }

    return (
        <div className="notif-wrapper" ref={dropdownRef}>
            {/* ===== Icon chuông ===== */}
            <button
                id="notification-bell-btn"
                className="btn btn-link text-light p-0 border-0 position-relative notif-bell-btn"
                onClick={() => setIsOpen(prev => !prev)}
                aria-label="Thông báo"
            >
                <FaRegBell size={20} />
                {unreadCount > 0 && (
                    <span className="notif-badge">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* ===== Dropdown Panel ===== */}
            {isOpen && (
                <div className="notif-dropdown" id="notification-dropdown">
                    {/* Header */}
                    <div className="notif-header">
                        <span className="notif-header-title">
                            Thông báo {unreadCount > 0 && <span className="notif-header-count">({unreadCount} chưa đọc)</span>}
                        </span>
                        <div className="notif-header-actions">
                            {unreadCount > 0 && (
                                <button className="notif-action-btn" onClick={markAllRead} title="Đánh dấu tất cả đã đọc">
                                    Đọc tất cả
                                </button>
                            )}
                            {notifications.length > 0 && (
                                <button className="notif-action-btn notif-action-danger" onClick={handleClearAll} title="Xóa tất cả">
                                    Xóa hết
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Danh sách */}
                    <div className="notif-list">
                        {loading && <div className="notif-empty">Đang tải...</div>}

                        {!loading && notifications.length === 0 && (
                            <div className="notif-empty">
                                <FaRegBell size={32} style={{ opacity: 0.3 }} />
                                <p>Không có thông báo nào</p>
                            </div>
                        )}

                        {!loading && notifications.map(notif => (
                            <div
                                key={notif.id}
                                id={`notif-item-${notif.id}`}
                                className={`notif-item ${notif.is_read ? 'notif-item--read' : 'notif-item--unread'}`}
                                onClick={() => handleItemClick(notif)}
                                role="button"
                                tabIndex={0}
                            >
                                <div className="notif-item-content">
                                    <p className="notif-item-title">{notif.title}</p>
                                    <p className="notif-item-message">{notif.message}</p>
                                    <span className="notif-item-time">{formatTime(notif.created_at)}</span>
                                </div>
                                {!notif.is_read ? (
                                    <span className="notif-unread-dot" title="Chưa đọc" />
                                ) : (
                                    <button
                                        className="btn btn-link p-0 text-muted"
                                        title="Đánh dấu chưa đọc"
                                        onClick={(e) => {
                                            e.stopPropagation()
                                            markUnRead(notif.id)
                                        }}
                                        style={{ zIndex: 2 }}
                                    >
                                        <FaRegEnvelope size={14} />
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
