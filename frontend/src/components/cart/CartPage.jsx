import React, { useEffect, useState } from 'react'
import CartPageItem from './CartPageItem'
import CartPageSummary from './CartPageSummary'
import api from '../../api'

function CartPage({ setNumCartItems }) {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    const cartCode = localStorage.getItem("cart_code")
    if (!cartCode) return

    setLoading(true)
    api.get(`get_cart_items?cart_code=${cartCode}`)
      .then(res => {
        console.log(res.data)
        setCartItems(res.data.items || res.data)
        setError("")
      })
      .catch(err => {
        console.error(err.message)
        setError(err.message)
      })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="container mt-5"><p>Loading...</p></div>
  if (error) return <div className="container mt-5"><p className="text-danger">Error: {error}</p></div>
  return (
    <section className="py-2" id="cart-page">
      <div className="container px-4 px-lg-5 mt-5 d-flex justify-content-between align-items-start">

        <div className="flex-grow-1 me-3">
          <h4 className="mb-4">
            Your Shopping Cart : <span className="text-muted">{cartItems.length} Product(s)</span>
          </h4>

          <div className="cart-items-list">
            {cartItems.length > 0 ? (
              cartItems.map((item) => (
                <CartPageItem 
                  key={item.id} 
                  item={item}
                  onRemove={(itemId) => {
                    setCartItems(cartItems.filter(i => i.id !== itemId))
                    if (setNumCartItems) {
                      setNumCartItems(current => current - 1)
                    }
                  }}
                  onUpdate={(quantityDifference) => {
                    if (setNumCartItems) {
                      setNumCartItems(current => current + quantityDifference)
                    }
                  }}
                />
              ))
            ) : (
              <p className="text-muted">Your cart is empty</p>
            )}
          </div>
        </div>

        <div className="me-3" style={{ width: "300px" }}>
          <CartPageSummary cartItems={cartItems} />
        </div>

      </div>
    </section>
  )
}

export default CartPage
