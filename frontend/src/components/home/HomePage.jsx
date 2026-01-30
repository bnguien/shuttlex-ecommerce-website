import Header from './Header'
import AboutPage from '../about/AboutPage'
import Categories from '../category/Categories'
import FeaturedProducts from '../product/FeaturedProducts'
import { useEffect } from 'react'
import { randomValue } from '../../GenerateCartCode'
import ContactPage from '../contact/ContactPage'

function HomePage() {
    useEffect(()=>{
        if(localStorage.getItem("cart_code") === null){
            localStorage.setItem("cart_code", randomValue)
        }
    },[])

    return (
        <>
            <Header />
            <div id="about-section">
                <AboutPage />
            </div>
            <Categories />
            <FeaturedProducts limit={4} />
            <div id="contact-section">
                <ContactPage />
            </div>
        </>
    )
}

export default HomePage