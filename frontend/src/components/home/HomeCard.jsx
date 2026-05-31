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
                        <h5 className={`${styles.cardTitle} mb-1 text-truncate px-1`}>{product.name}</h5>
                        
                        {/* Interactive Stats Badge */}
                        <div className={`${styles.cardStats} d-flex align-items-center justify-content-center gap-2 mb-2`}>
                            <div className="d-flex align-items-center text-warning">
                                <i className="bi-star-fill me-1"></i>
                                <span className="fw-bold text-dark">{product.average_rating ? Number(product.average_rating).toFixed(1) : '0.0'}</span>
                            </div>
                            <span className="text-muted opacity-50">•</span>
                            <span className="text-muted">{product.review_count || 0} Đánh giá</span>
                            <span className="text-muted opacity-50">•</span>
                            <span className="text-muted">Đã bán {product.sold_count || 0}</span>
                        </div>

                        <div className="d-flex align-items-center gap-2 justify-content-center mt-1">
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
