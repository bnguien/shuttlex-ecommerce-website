import React, { useEffect, useState, useRef } from 'react'
import CartPageItem from './CartPageItem'
import CartPageSummary from './CartPageSummary'
import api from '../../api'
import { useNavigate } from 'react-router-dom'

function CartPage({ setNumCartItems }) {
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const pollingRef = useRef(null)

  const loadCart = () => {
    const cartCode = localStorage.getItem("cart_code")
    if (!cartCode) {
      setCartItems([])
      setError("")
      return
    }

    setLoading(true)
    api.get(`get_cart_items?cart_code=${cartCode}`)
      .then((res) => {
        setCartItems(res.data.items || res.data || [])
        setError("")
      })
      .catch((err) => {
        setError(err.message || "Không tải được giỏ hàng.")
      })
      .finally(() => setLoading(false))
  }

  // Load cart items when component mounts
  useEffect(() => {
    loadCart()

    // Polling to reload cart every 2 seconds
    pollingRef.current = setInterval(() => {
      loadCart()
    }, 2000)

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current)
    }
  }, [])

  const hasUnavailable = cartItems.some((item) => item.is_available === false)
  const canCheckout = cartItems.length > 0 && !hasUnavailable

  if (loading && cartItems.length === 0) return <div className="container mt-5"><p>Đang tải...</p></div>
  if (error && cartItems.length === 0) return <div className="container mt-5"><p className="text-danger">Lỗi: {error}</p></div>

  return (
    <section className="py-2" id="cart-page">
      <div className="container px-4 px-lg-5 mt-5 d-flex justify-content-between align-items-start">
        <div className="flex-grow-1 me-3">
          <h4 className="mb-4">
            Giỏ hàng: <span className="text-muted">{cartItems.length} sản phẩm</span>
            {hasUnavailable && (
              <span className="ms-2 badge bg-warning text-dark">Một số sản phẩm không còn khả dụng</span>
            )}
          </h4>

          <div className="cart-items-list">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartPageItem
                  key={item.id}
                  item={item}
                  onRemove={(itemId) => {
                    setCartItems((prev) => prev.filter((i) => i.id !== itemId))
                    if (setNumCartItems) setNumCartItems((n) => Math.max(0, n - (item.quantity || 1)))
                  }}
                  onUpdate={(quantityDifference) => {
                    if (setNumCartItems) setNumCartItems((n) => n + quantityDifference)
                  }}
                />
              ))
            ) : (
              <p className="text-muted">Giỏ hàng trống.</p>
            )}
          </div>
        </div>

        <div className="me-3" style={{ width: "300px" }}>
          <CartPageSummary
            cartItems={cartItems}
            canCheckout={canCheckout}
            onCheckout={() => navigate('/checkout')}
          />
        </div>
      </div>
    </section>
  )
}

export default CartPage
