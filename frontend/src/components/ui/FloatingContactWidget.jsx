import { useState, useEffect } from 'react'
import { FiPhoneCall, FiChevronDown, FiChevronUp, FiMessageCircle, FiX } from 'react-icons/fi'
import api from '../../api'
import './FloatingContactWidget.css'

function FloatingContactWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [settings, setSettings] = useState(null)
  const [activeFaq, setActiveFaq] = useState(null)
  
  // Track vertical position (bottom offset in pixels)
  const [yPos, setYPos] = useState(() => {
    const saved = localStorage.getItem('floating_widget_y')
    return saved ? parseInt(saved, 10) : 110
  })

  useEffect(() => {
    api.get('/system/')
      .then(res => {
        setSettings(res.data)
      })
      .catch(err => {
        console.error("Lỗi khi tải cấu hình liên hệ:", err)
      })
  }, [])

  if (!settings) return null

  // Pointer drag handler for both mouse and touch screens
  const handlePointerDown = (e) => {
    // Only allow drag with left click/primary touch pointer
    if (e.button !== 0) return

    const startY = e.clientY
    const startBottom = yPos
    let hasDragged = false

    const handlePointerMove = (moveEvent) => {
      const deltaY = startY - moveEvent.clientY // positive when dragging upwards
      const newBottom = startBottom + deltaY
      
      // Keep widget within visible window boundaries (min 30px from bottom, max window height - 120px)
      const clampedBottom = Math.max(30, Math.min(newBottom, window.innerHeight - 120))
      
      if (Math.abs(deltaY) > 5) {
        hasDragged = true
      }
      
      setYPos(clampedBottom)
    }

    const handlePointerUp = (upEvent) => {
      window.removeEventListener('pointermove', handlePointerMove)
      window.removeEventListener('pointerup', handlePointerUp)

      if (hasDragged) {
        // Save the custom coordinate so it persists across page transitions
        const finalDelta = startY - upEvent.clientY
        const finalBottom = Math.max(30, Math.min(startBottom + finalDelta, window.innerHeight - 120))
        localStorage.setItem('floating_widget_y', finalBottom.toString())
      } else {
        // Toggle the popup card only if the user didn't drag
        setIsOpen(prev => !prev)
      }
    }

    window.addEventListener('pointermove', handlePointerMove)
    window.addEventListener('pointerup', handlePointerUp)
  }

  const toggleFaq = (index) => {
    if (activeFaq === index) {
      setActiveFaq(null)
    } else {
      setActiveFaq(index)
    }
  }

  const faqs = [
    {
      q: "Shop có đan sẵn lưới cầu lông không?",
      a: "Có ạ! Khi mua vợt bạn có thể chọn căng lưới Yonex/Lining với số ký (tension) mong muốn để sẵn sàng chiến đấu ngay."
    },
    {
      q: "Chính sách bảo hành vợt tại ShuttleX?",
      a: "Vợt bảo hành chính hãng 3 tháng. Đổi mới trong 7 ngày nếu nứt gãy do nhà vận chuyển."
    }
  ]

  // Beautiful Zalo custom SVG icon
  const ZaloIcon = () => (
    <svg className="channel-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 2C6.477 2 2 5.865 2 10.648c0 2.502 1.22 4.75 3.17 6.257-.168.618-.62 2.274-.62 2.274a.434.434 0 00.584.475s1.956-.99 2.766-1.428a11.1 11.1 0 004.1.768c5.523 0 10-3.865 10-8.648S17.523 2 12 2z"/>
    </svg>
  )

  // Facebook Messenger custom SVG icon
  const MessengerIcon = () => (
    <svg className="channel-icon" viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
      <path d="M12 2C6.36 2 2 6.14 2 11.7c0 2.9 1.15 5.5 3.03 7.37.16.16.27.38.27.62l.02 2.08a.48.48 0 00.7.43l2.29-1.26c.2-.11.43-.14.65-.08 1 .28 2.04.43 3.09.43 5.64 0 10-4.14 10-9.7C22 6.14 17.64 2 12 2zm1.18 12.3l-2.02-2.15-3.95 2.15 4.35-4.62 2.02 2.15 3.95-2.15-4.35 4.62z"/>
    </svg>
  )

  return (
    <div className="floating-contact-container" style={{ bottom: `${yPos}px` }}>
      {isOpen && (
        <div className="floating-contact-card">
          {/* Header */}
          <div className="floating-contact-header">
            <div className="floating-contact-avatar">SX</div>
            <div>
              <h4 className="floating-contact-header-title">Hỗ trợ ShuttleX</h4>
              <p className="floating-contact-header-subtitle">Phản hồi siêu tốc trong vài phút</p>
            </div>
          </div>

          {/* Compact 3-Column horizontal channels */}
          <div className="floating-contact-body-grid">
            {settings.zalo_link && (
              <a 
                href={settings.zalo_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-channel-item contact-channel-zalo"
              >
                <ZaloIcon />
                <span className="channel-grid-name">Zalo</span>
              </a>
            )}

            {settings.facebook_link && (
              <a 
                href={settings.facebook_link} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="contact-channel-item contact-channel-messenger"
              >
                <MessengerIcon />
                <span className="channel-grid-name">Messenger</span>
              </a>
            )}

            {settings.phone_contact && (
              <a 
                href={`tel:${settings.phone_contact}`} 
                className="contact-channel-item contact-channel-hotline"
              >
                <FiPhoneCall className="channel-icon" />
                <span className="channel-grid-name">Hotline</span>
              </a>
            )}
          </div>

          {/* FAQ section */}
          <div className="floating-contact-faq">
            <h5 className="faq-title">Giải đáp nhanh</h5>
            {faqs.map((faq, idx) => (
              <div key={idx}>
                <button className="faq-item" onClick={() => toggleFaq(idx)}>
                  <span>{faq.q}</span>
                  {activeFaq === idx ? <FiChevronUp /> : <FiChevronDown />}
                </button>
                {activeFaq === idx && (
                  <div className="faq-answer">{faq.a}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Draggable smaller trigger button */}
      <button 
        className="floating-contact-trigger" 
        onPointerDown={handlePointerDown}
        title="Nhấp để mở chat / Kéo lên xuống để di chuyển"
      >
        {isOpen ? <FiX /> : <FiMessageCircle />}
      </button>
    </div>
  )
}

export default FloatingContactWidget
