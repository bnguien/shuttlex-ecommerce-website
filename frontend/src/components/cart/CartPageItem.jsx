import api, { BASE_URL } from '../../api'
import styles from './CartPageItem.module.css'
import { useState } from 'react'
import { formatCurrencyVND } from '../../utils/format'

function CartPageItem({ item, onRemove, onUpdate }) {
    const [quantity, setQuantity] = useState(item?.quantity || 1)

    const cart_code = localStorage.getItem("cart_code")
    if (!item) return null

    function remove_item() {
        api.delete(`remove_item/${item.product.id}/?cart_code=${cart_code}`)
            .then(res => {
                console.log(res.data)
                if (onRemove) onRemove(item.id)
            })
            .catch(err => {
                console.error(err.message)
            })
    }
    function update_quantity() {
        const quantityDifference = quantity - item.quantity  
        api.put(`update_item_quantity/${item.product.id}/`, {
            cart_code: cart_code,
            quantity: quantity
        })
        .then(res => {
            console.log(res.data)
            item.quantity = quantity
            if (onUpdate) onUpdate(quantityDifference)
        })
        .catch(err => {
            console.error(err.message)
        })
    }
    return (
        <div className="d-flex align-items-center py-3 border-bottom">
            <div className={styles.cardImgWrapper}>
                <img
                    src={`${BASE_URL}${item.product?.image}`}
                    alt={item.product?.name}
                />
            </div>
            <div className="flex-grow-1 mx-3">
                <h6 className="mb-1">{item.product?.name}</h6>
                <p className="mb-0 text-muted">{formatCurrencyVND(item.product?.price)}</p>
            </div>
            <div className="mx-3" style={{ width: "90px" }}>
                <input
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                    className="form-control text-center"
                />
            </div>
            <div className="d-flex gap-2 mx-3">
                <button className="btn btn-outline-primary btn-sm" onClick={update_quantity}>
                    Update
                </button>
                <button className="btn btn-outline-danger btn-sm" onClick={remove_item}>
                    Remove
                </button>
            </div>
        </div>
    );
}

export default CartPageItem