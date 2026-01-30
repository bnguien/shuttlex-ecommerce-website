import { useEffect, useState } from 'react'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'
import 'swiper/css/navigation'
import homeImg from '../../imgs/header.jpg'
import homeImg1 from '../../imgs/header1.jpg'
import homeImg2 from '../../imgs/header2.jpg'

function Header() {
  const [ctaHover, setCtaHover] = useState(false)
  const [loaded, setLoaded] = useState(false)
  
  useEffect(() => {
    setLoaded(true)
  }, [])

  const slides = [
    {
      image: homeImg,
      title: 'Welcome to ShuttleX',
      subtitle: 'Gear up. Smash harder. Play better.'
    },
    {
      image: homeImg1,
      title: 'Big Sale – Up to 30% OFF',
      subtitle: 'Limited Time Offer for Yonex Lovers'
    },
    {
      image: homeImg2,
      title: 'Get Into The Zone',
      subtitle: 'Back in a bold new color with the Li-Ning Ranger Lite Z1.'
    }
  ]

  return (
    <div style={{ position: 'relative' }}>
      <Swiper
        modules={[Autoplay, Pagination, Navigation]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        navigation
        loop
        style={{
          '--swiper-pagination-color': '#ffffff',
          '--swiper-navigation-color': '#ffffff',
          '--swiper-navigation-size': '20px'
        }}
      >
        {slides.map((slide, idx) => (
          <SwiperSlide key={idx}>
            <header
              style={{
                backgroundImage: `url(${slide.image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                color: '#ffffff',
                minHeight: '700px',
                display: 'flex',
                alignItems: 'center',
                paddingTop: '100px',
                paddingBottom: '100px',
                position: 'relative'
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  backgroundColor: 'rgba(0, 0, 0, 0.3)'
                }}
              ></div>
              <div className="container text-center" style={{ position: 'relative', zIndex: 1 }}>
                <h1
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 800ms ease',
                    fontSize: '3rem',
                    fontWeight: 'bold',
                    marginBottom: '1rem'
                  }}
                >
                  {slide.title}
                </h1>
                <p
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'translateY(0)' : 'translateY(30px)',
                    transition: 'all 800ms ease 200ms',
                    fontSize: '1.3rem',
                    marginBottom: '2rem',
                    fontStyle: 'italic'
                  }}
                >
                  {slide.subtitle}
                </p>
                <a
                  href="#"
                  className="btn"
                  style={{
                    backgroundColor: ctaHover ? 'rgba(255, 255, 255, 0.95)' : 'rgba(255, 255, 255, 0.85)',
                    color: '#029942',
                    borderRadius: '999px',
                    padding: '14px 32px',
                    fontWeight: 700,
                    letterSpacing: '0.5px',
                    boxShadow: ctaHover ? '0 16px 40px rgba(0, 0, 0, 0.25)' : '0 12px 30px rgba(0, 0, 0, 0.2)',
                    transform: ctaHover ? 'translateY(-2px)' : 'translateY(0)',
                    transition: 'all 180ms ease'
                  }}
                  onMouseEnter={() => setCtaHover(true)}
                  onMouseLeave={() => setCtaHover(false)}
                >
                  Shop Now
                </a>
              </div>
            </header>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}

export default Header
