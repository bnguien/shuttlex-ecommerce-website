import { useState } from 'react'
import about1 from '../../imgs/about1.jpg'
import about2 from '../../imgs/about2.jpg'
import { useScrollAnimation } from '../../utils/useScrollAnimation'
import { NavLink } from 'react-router-dom'

const AboutPage = () => {
  const [ctaHover, setCtaHover] = useState(false)
  const [img1Hover, setImg1Hover] = useState(false)
  const [img2Hover, setImg2Hover] = useState(false)
  const [ref1, isVisible1] = useScrollAnimation()
  const [ref2, isVisible2] = useScrollAnimation()
  const [ref3, isVisible3] = useScrollAnimation()
  const [ref4, isVisible4] = useScrollAnimation()

  const getAnimationStyle = (isVisible, delay) => ({
    opacity: isVisible ? 1 : 0,
    transform: isVisible ? 'translateY(0)' : 'translateY(20px)',
    transition: `opacity 600ms ease-out ${delay}ms, transform 600ms ease-out ${delay}ms`
  })

  return (
    <section className="py-5">
      <div className="container">
        <div className="row gx-4 gy-5">
          <div className="col-md-6" ref={ref1} style={getAnimationStyle(isVisible1, 0)}>
            <div className="p-4 h-100">
              <p>Who We Are</p>
              <h1 className="mb-0">A Place for <br /> Badminton Essentials</h1>
            </div>
          </div>

          <div className="col-md-6" ref={ref2} style={getAnimationStyle(isVisible2, 100)}>
            <div className="p-4 h-100">
              <p className="mb-0">
                We are a dedicated badminton shop serving players at every level — from beginners to competitive athletes. At ShuttleX, you'll find carefully selected gear, honest advice, and everything you need to play with confidence and consistency.
              </p>

              <NavLink 
                to="/about"
                className="btn mt-3 rounded-pill px-4 py-2"
                style={{
                  backgroundColor: ctaHover ? '#79dba2' : '#029942',
                  borderColor: ctaHover ? '#79dba2' : '#029942',
                  color: '#fff',
                  transform: ctaHover ? 'translateY(-2px)' : 'translateY(0)',
                  transition: 'all 180ms ease'
                }}
                onMouseEnter={() => setCtaHover(true)}
                onMouseLeave={() => setCtaHover(false)}
              >
                <strong>Learn more about ShuttleX</strong>
              </NavLink>
            </div>
          </div>

          <div className="col-md-6" ref={ref3} style={getAnimationStyle(isVisible3, 200)}>
            <div
              style={{
                overflow: 'hidden',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setImg1Hover(true)}
              onMouseLeave={() => setImg1Hover(false)}
            >
              <img
                src={about1}
                alt="About ShuttleX"
                className="img-fluid"
                style={{
                  transform: img1Hover ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 400ms ease'
                }}
              />
            </div>
          </div>

          <div className="col-md-6" ref={ref4} style={getAnimationStyle(isVisible4, 300)}>
            <div
              style={{
                overflow: 'hidden',
                borderRadius: '0.375rem',
                cursor: 'pointer'
              }}
              onMouseEnter={() => setImg2Hover(true)}
              onMouseLeave={() => setImg2Hover(false)}
            >
              <img
                src={about2}
                alt="About ShuttleX"
                className="img-fluid"
                style={{
                  transform: img2Hover ? 'scale(1.1)' : 'scale(1)',
                  transition: 'transform 400ms ease'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default AboutPage
