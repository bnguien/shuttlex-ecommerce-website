import {Link} from 'react-router-dom'
import styles from './CategoryCard.module.css'

function CategoryCard({image, name, slug}) {
    return (
        <div className="col mb-4">
            <div className={styles['category-card']}>
                <img src={image} alt={name} className={styles['category-img']} />
                <div className={styles['category-footer']}>
                    <span className={styles['category-name']}>{name}</span>
                    <Link
                        to={`/products?category=${slug}`}
                        className={styles['category-arrow']}
                        aria-label={`View ${name}`}
                    >
                        →
                    </Link>
                </div>
            </div>
        </div>
    )
}

export default CategoryCard
