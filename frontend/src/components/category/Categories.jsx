import { useEffect, useState } from 'react'
import CategoryCard from './CategoryCard'
import { useScrollAnimation } from '../../utils/useScrollAnimation'
import categoryBg from '../../imgs/category-bg.jpg'
import api, { BASE_URL } from '../../api'

function Categories() {
    const [ref, isVisible] = useScrollAnimation()
    const [categories, setCategories] = useState([])

    useEffect(() => {
        api.get('categories/')
            .then((res) => {
                setCategories(res.data)
            })
            .catch((err) => {
                console.log(err.message)
            })
    }, [])

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
                            image={item.image ? `${BASE_URL}${item.image}` : ''}
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
