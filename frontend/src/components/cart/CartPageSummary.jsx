
// Hàm format tiền tệ với dấu phân cách
function formatCurrency(amount) {
    return Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

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
                    <span>{formatCurrency(calculateSubtotal())} VND</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>Tax:</span>
                    <span>{formatCurrency(100000)} VND</span>
                </div>
                <div className="d-flex justify-content-between">
                    <span>Total:</span>
                    <strong>{formatCurrency(calculateSubtotal() + 100000)} VND</strong>
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