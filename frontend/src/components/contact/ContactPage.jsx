import { useScrollAnimation } from '../../utils/useScrollAnimation'

function ContactPage() {
    const [refInfo, isInfoVisible] = useScrollAnimation()
    const [refMap, isMapVisible] = useScrollAnimation()

    return (
        <div className="container mt-5 d-flex flex-row justify-content-between">
            <div 
                className="contact-info mb-4"
                ref={refInfo}
                style={{
                    opacity: isInfoVisible ? 1 : 0,
                    transform: isInfoVisible ? 'translateX(0)' : 'translateX(-30px)',
                    transition: 'opacity 600ms ease-out, transform 600ms ease-out'
                }}
            >
                <h2>Contact Us</h2>
                <p>If you have any questions or need assistance, feel free to reach out to us!</p>
                <p><strong>Email:</strong>
                    <a href="mailto:contact@shuttlex.com">contact@shuttlex.com</a></p>
                <p><strong>Phone:</strong> +84 234567890</p>
                <p><strong>Address:</strong> 642 Ton Duc Thang, Da Nang, Vietnam</p>
            </div>
            <div 
                className="map-container mb-4"
                ref={refMap}
                style={{
                    opacity: isMapVisible ? 1 : 0,
                    transform: isMapVisible ? 'translateX(0)' : 'translateX(30px)',
                    transition: 'opacity 600ms ease-out 200ms, transform 600ms ease-out 200ms'
                }}
            >
                <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3834.013486386539!2d108.15384037459988!3d16.06478993955779!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314219003f1aac01%3A0xb6a347a558ffb9bc!2zU8OibiBD4bqndSBMw7RuZyBXaW4gV2luIEJhZG1pbnRvbiAtIDY0MiBUw7RuIMSQ4bupYyBUaOG6r25n!5e0!3m2!1svi!2s!4v1769159132446!5m2!1svi!2s"
                    width="600"
                    height="450"
                    style={{ border: 0 }} allowFullScreen=""
                    loading="lazy" referrerPolicy="no-referrer-when-downgrade"></iframe>
            </div>
        </div>
    )
}

export default ContactPage