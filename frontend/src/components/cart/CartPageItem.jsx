import api, { BASE_URL } from "../../api"
import styles from "./CartPageItem.module.css"
import { useState } from "react"
import { formatCurrencyVND } from "../../utils/format"

function CartPageItem({ item, onRemove, onUpdate }) {
  const [quantity, setQuantity] = useState(item?.quantity ?? 1)
  const cartCode = localStorage.getItem("cart_code")
  const unavailable = item?.is_available === false

  if (!item) return null

  const productId = item.product_id ?? item.product?.id
  const variantId = item.variant_id ?? item.variant?.id
  const imageUrl = item.image ? `${BASE_URL}${item.image}` : (item.product?.image ? `${BASE_URL}${item.product.image}` : null)
  const displayName = item.name ?? item.product?.name
  const unitPrice = item.price_at_add ?? item.price ?? item.product?.price
  const subtotal = item.subtotal != null ? item.subtotal : (Number(unitPrice) * (item.quantity || 0))

  function remove_item() {
    if (!cartCode || !productId) return
    let url = `remove_item/${productId}/?cart_code=${encodeURIComponent(cartCode)}`
    if (variantId) url += `&variant_id=${variantId}`
    api.delete(url)
      .then(() => onRemove?.(item.id))
      .catch((err) => console.error(err))
  }

  function update_quantity() {
    if (!cartCode || !productId || unavailable) return
    const diff = quantity - (item.quantity || 0)
    api.put(`update_item_quantity/${productId}/`, {
      cart_code: cartCode,
      variant_id: variantId || null,
      quantity,
    })
      .then(() => {
        item.quantity = quantity
        onUpdate?.(diff)
      })
      .catch((err) => console.error(err))
  }

  return (
    <div
      className={`d-flex align-items-center py-3 border-bottom ${unavailable ? "opacity-50" : ""}`}
      style={unavailable ? { backgroundColor: "var(--bs-light)" } : {}}
    >
      <div className={styles.cardImgWrapper}>
        <img src={imageUrl || ""} alt={displayName} />
      </div>
      <div className="flex-grow-1 mx-3">
        <h6 className="mb-1">{displayName}</h6>
        {(item.size || item.color) && (
          <p className="mb-0 small text-muted">
            {[item.size, item.color].filter(Boolean).join(" / ")}
          </p>
        )}
        <p className="mb-0 text-muted">
          {formatCurrencyVND(unitPrice)} × {item.quantity} = {formatCurrencyVND(subtotal)}
        </p>
        {unavailable && (
          <span className="badge bg-secondary mt-1">Không còn khả dụng</span>
        )}
      </div>
      <div className="mx-3" style={{ width: "90px" }}>
        <input
          type="number"
          min="1"
          max="99"
          value={quantity}
          onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
          className="form-control text-center"
          disabled={unavailable}
        />
      </div>
      <div className="d-flex gap-2 mx-3">
        <button
          className="btn btn-outline-primary btn-sm"
          onClick={update_quantity}
          disabled={unavailable}
        >
          Cập nhật
        </button>
        <button className="btn btn-outline-danger btn-sm" onClick={remove_item}>
          Xóa
        </button>
      </div>
    </div>
  )
}

export default CartPageItem