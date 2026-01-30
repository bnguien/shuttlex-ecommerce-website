import CategoryCard from './CategoryCard'
import { useScrollAnimation } from '../../utils/useScrollAnimation'
import racket from '../../imgs/racket.jpg'
import shoes from '../../imgs/shoes.jpg'
import apparel from '../../imgs/apparel.jpg'
import accessories from '../../imgs/accessories.jpg'
import shuttlecock from '../../imgs/shuttlecock.jpg'
import bag from '../../imgs/bags.jpg'
import categoryBg from '../../imgs/category-bg.jpg'

const categories = [
    { image: racket, name: 'Rackets', slug: 'rackets' },
    { image: shoes, name: 'Shoes', slug: 'shoes' },
    { image: apparel, name: 'Apparel', slug: 'apparel' },
    { image: accessories, name: 'Accessories', slug: 'accessories' },
    { image: shuttlecock, name: 'Shuttlecocks', slug: 'shuttlecocks' },
    { image: bag, name: 'Bags', slug: 'bags' },
]

function Categories() {
    const [ref, isVisible] = useScrollAnimation()

    return (
        <div className="py-5" style={{ backgroundImage: `url(${categoryBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
            <div className="container my-5">
                <div
                    className="text-center mb-5"
                    ref={ref}
                    style={{
                        opacity: isVisible ? 1 : 0,
                        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
                        transition: 'opacity 600ms ease-out, transform 600ms ease-out'
                    }}
                >
                    <h2 className="fw-bold mb-3" style={{ fontSize: '2.5rem', color: "#ffffff" }}>
                        Explore by Category
                    </h2>
                    <p className="" style={{ fontSize: '1.1rem', maxWidth: '700px', margin: '0 auto', color: "#ffffff" }}>
                        From rackets to shoes, find everything you need to <strong>dominate the court</strong>
                    </p>
                </div>

                <div className="row">
                    {categories.map((item, index) => (
                        <CategoryCard
                            key={index}
                            image={item.image}
                            name={item.name}
                            slug={item.slug}
                        />
                    ))}
                </div>
            </div>
        </div>
    )
}

export default Categories
