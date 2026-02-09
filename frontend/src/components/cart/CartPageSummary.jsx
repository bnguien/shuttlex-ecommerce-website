
import { formatCurrencyVND } from '../../utils/format'

function CartPageSummary({ cartItems }) {
    function calculateSubtotal() {
        return cartItems.reduce((total, item) => {
            return total + (parseFloat(item.product.price) * item.quantity);
        }, 0);
    }
    return (
        <div className="card shadow-none p-4">
            <div className="mb-1">
                <h4>Order Summary</h4>
            </div>
            <hr />
            <div className="d-flex flex-column gap-2">
                <div className="d-flex justify-content-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrencyVND(calculateSubtotal())}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>Tax:</span>
                    <span>{formatCurrencyVND(100000)}</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>Total:</span>
                    <strong>{formatCurrencyVND(calculateSubtotal() + 100000)}</strong>
                </div>
            </div>
            <div className="mb-5 mt-4">
                <button className="btn btn-primary w-100">
                    Proceed to Checkout
                </button>
            </div>
        </div>
    )
}

export default CartPageSummary