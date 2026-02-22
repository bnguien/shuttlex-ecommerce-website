import { Link } from 'react-router-dom'
import styles from './HomeCard.module.css'
import { BASE_URL } from '../../api'
import { formatCurrencyVND } from '../../utils/format'
function HomeCard({ product }) {
    const renderPrice = () => {
        const { price_min, price_max, base_price } = product;

        if (price_min && price_max && price_min !== price_max) {
            return `${formatCurrencyVND(price_min)} - ${formatCurrencyVND(price_max)}`;
        }

        return formatCurrencyVND(price_min || base_price);
    };

    return (
        <div className={`col-md-3 ${styles.col}`}>
            <Link to={`/product/${product.slug}`} className={styles.link}>
                <div className={styles.card}>
                    <div className={styles.cardImgWrapper}>
                        <img
                            src={`${BASE_URL}${product.image}`}
                            alt="Product Image"
                        />
                    </div>
                    <div className={styles.cardBody}>
                        <h5 className={`${styles.cardTitle} mb-1`}>{product.name}</h5>
                        <h6 className={styles.cardText}>
                            {renderPrice()}
                        </h6>
                    </div>
                </div>
            </Link>
        </div>
    )
}

export default HomeCard
