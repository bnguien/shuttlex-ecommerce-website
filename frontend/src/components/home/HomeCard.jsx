import { Link } from 'react-router-dom'
import styles from './HomeCard.module.css'
import { BASE_URL } from '../../api'
import { formatCurrencyVND } from '../../utils/format'
function HomeCard({ product }) {
    const renderPrice = () => {
        const { price_min, price_max, price, base_price } = product;

        if (price_min != null && price_max != null && String(price_min) !== String(price_max)) {
            return `${formatCurrencyVND(price_min)} - ${formatCurrencyVND(price_max)}`;
        }

        return formatCurrencyVND(price ?? price_min ?? base_price);
    };

    return (
        <div className={`col-md-3 ${styles.col}`}>
            <Link to={`/product/${product.slug}`} className={styles.link}>
                <div className={`${styles.card} ${product.is_on_sale ? styles.flashSaleCard : ''}`}>
                    {product.is_on_sale && (
                        <div className={styles.flashBadge}>
                            <i className="bi-lightning-charge-fill"></i> Flash Sale
                        </div>
                    )}
                    <div className={styles.cardImgWrapper}>
                        <img
                            src={`${BASE_URL}${product.image}`}
                            alt="Product Image"
                        />
                    </div>
                    <div className={styles.cardBody}>
                        <h5 className={`${styles.cardTitle} mb-1`}>{product.name}</h5>
                        <div className="d-flex align-items-center gap-2 justify-content-center">
                            {product.is_on_sale && (
                                <span className="text-decoration-line-through text-muted small">
                                    {formatCurrencyVND(product.price_min ?? product.base_price)}
                                </span>
                            )}
                            <h6 className={`${styles.cardText} mb-0 ${product.is_on_sale ? 'text-danger fw-bold' : ''}`}>
                                {renderPrice()}
                            </h6>
                        </div>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default HomeCard
