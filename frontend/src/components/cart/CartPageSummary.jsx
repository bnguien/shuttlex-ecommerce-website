import { formatCurrencyVND } from "../../utils/format"

function CartPageSummary({ cartItems, canCheckout = true, onCheckout }) {
  function calculateSubtotal() {
    return cartItems.reduce((total, item) => {
      const subtotal = item.subtotal != null ? Number(item.subtotal) : (Number(item.price_at_add ?? item.price ?? 0) * (item.quantity || 0))
      return total + subtotal
    }, 0)
  }

  const subtotal = calculateSubtotal()

  return (
    <div className="card shadow-none p-4">
      <div className="mb-1">
        <h4>Tóm tắt đơn hàng</h4>
      </div>
      <hr />
      <div className="d-flex flex-column gap-2">
        <div className="d-flex justify-content-between">
          <span>Tạm tính:</span>
          <span>{formatCurrencyVND(subtotal)}</span>
        </div>
        <div className="d-flex justify-content-between">
          <span>Tổng cộng:</span>
          <strong>{formatCurrencyVND(subtotal)}</strong>
        </div>
      </div>
      <div className="mb-5 mt-4">
        <button className="btn btn-primary w-100" disabled={!canCheckout} onClick={onCheckout}>
          {canCheckout ? "Thanh toán" : "Vui lòng xóa sản phẩm không khả dụng"}
        </button>
      </div>
    </div>
  )
}

export default CartPageSummary