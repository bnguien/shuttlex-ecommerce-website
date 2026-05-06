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
  
  const [selectedItemIds, setSelectedItemIds] = useState(new Set())
  const [isFirstLoad, setIsFirstLoad] = useState(true)

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
        const items = res.data.items || res.data || []
        setCartItems(items)
        if (isFirstLoad) {
            setSelectedItemIds(new Set(items.map(i => i.id)))
            setIsFirstLoad(false)
        }
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
  }, [isFirstLoad])

  const selectedItemsList = cartItems.filter(item => selectedItemIds.has(item.id))
  const hasUnavailable = selectedItemsList.some((item) => item.is_available === false)
  const canCheckout = selectedItemsList.length > 0 && !hasUnavailable

  const handleToggleSelect = (id) => {
      setSelectedItemIds(prev => {
          const newSet = new Set(prev)
          if (newSet.has(id)) newSet.delete(id)
          else newSet.add(id)
          return newSet
      })
  }

  const handleToggleSelectAll = (e) => {
      if (e.target.checked) {
          setSelectedItemIds(new Set(cartItems.map(i => i.id)))
      } else {
          setSelectedItemIds(new Set())
      }
  }

  if (loading && cartItems.length === 0) return <div className="container mt-5"><p>Đang tải...</p></div>
  if (error && cartItems.length === 0) return <div className="container mt-5"><p className="text-danger">Lỗi: {error}</p></div>

  const isAllSelected = cartItems.length > 0 && selectedItemIds.size === cartItems.length;

  return (
    <section className="py-2" id="cart-page">
      <div className="container px-4 px-lg-5 mt-5 d-flex justify-content-between align-items-start">
        <div className="flex-grow-1 me-3">
          <h4 className="mb-4 d-flex align-items-center">
            Giỏ hàng: <span className="text-muted ms-2">{cartItems.length} sản phẩm</span>
            {hasUnavailable && (
              <span className="ms-2 badge bg-warning text-dark">Một số sản phẩm đang chọn không khả dụng</span>
            )}
          </h4>

          {cartItems.length > 0 && (
             <div className="d-flex align-items-center mb-3 pb-2 border-bottom">
                 <input 
                     type="checkbox" 
                     className="form-check-input mt-0 me-2" 
                     checked={isAllSelected}
                     onChange={handleToggleSelectAll}
                 />
                 <strong>Chọn tất cả ({cartItems.length})</strong>
             </div>
          )}

          <div className="cart-items-list">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartPageItem
                  key={item.id}
                  item={item}
                  isSelected={selectedItemIds.has(item.id)}
                  onToggleSelect={() => handleToggleSelect(item.id)}
                  onRemove={(itemId) => {
                    setCartItems((prev) => prev.filter((i) => i.id !== itemId))
                    setSelectedItemIds(prev => {
                        const newSet = new Set(prev)
                        newSet.delete(itemId)
                        return newSet
                    })
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
            cartItems={selectedItemsList}
            canCheckout={canCheckout}
            onCheckout={() => navigate('/checkout', { state: { selectedItems: Array.from(selectedItemIds) } })}
          />
        </div>
      </div>
    </section>
  )
}

export default CartPage
