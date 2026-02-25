import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import HomeCard from '../home/HomeCard'
import PlaceHolderContainer from '../ui/PlaceHolder'
import Error from '../ui/Error'
import api from '../../api'

function FeaturedProducts({ limit = 4 }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    setLoading(true)
    api.get("products")
      .then(res => {
        setProducts(res.data.slice(0, limit))
        setLoading(false)
        setError("")
        setTimeout(() => setLoaded(true), 100)
      })
      .catch(err => {
        console.error(err)
        setLoading(false)
        setError(err.message)
      })
  }, [limit])

  return (
    <section className="py-5" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="container">
        <div 
          className="text-center mb-5"
          style={{
            opacity: loaded ? 1 : 0,
            transform: loaded ? 'translateY(0)' : 'translateY(30px)',
            transition: 'opacity 600ms ease-out, transform 600ms ease-out'
          }}
        >
          <h2 className="fw-bold mb-3" style={{ fontSize: '2.5rem' }}>
            Our Products
          </h2>
          <p className="text-muted" style={{ fontSize: '1.1rem' }}>
            Discover our <strong>handpicked selection</strong> of quality gear
          </p>
        </div>

        {error && <Error error={error} />}
        {loading && <PlaceHolderContainer />}
        
        {!loading && !error && (
          <>
            <div 
              className="row row-cols-1 row-cols-sm-2 row-cols-md-3 row-cols-lg-4 g-4"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                transition: 'opacity 600ms ease-out 200ms, transform 600ms ease-out 200ms'
              }}
            >
              {products.map(product => (
                <HomeCard key={product.id} product={product} />
              ))}
            </div>

            <div 
              className="text-center mt-5"
              style={{
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 600ms ease-out 400ms, transform 600ms ease-out 400ms'
              }}
            >
              <Link 
                to="/products" 
                className="btn btn-lg rounded-pill px-5 py-2"
                style={{
                  backgroundColor: '#029942',
                  borderColor: '#029942',
                  color: '#fff',
                  fontSize: '1rem',
                  fontWeight: 500,
                  transition: 'all 300ms ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = '#79dba2'
                  e.target.style.transform = 'translateY(-2px)'
                  e.target.style.boxShadow = '0 8px 20px rgba(2, 153, 66, 0.3)'
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = '#029942'
                  e.target.style.transform = 'translateY(0)'
                  e.target.style.boxShadow = 'none'
                }}
              >
                See All Products
              </Link>
            </div>
          </>
        )}
      </div>
    </section>
  )
}

export default FeaturedProducts
