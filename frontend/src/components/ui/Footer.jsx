import { FaFacebook, FaInstagram } from 'react-icons/fa6'

const Footer = () => {
    return (
        <footer className="py-3" style={{
            background: `radial-gradient(circle, #2f6f2e 0%, #429241 40%, #66c064 100%)`, color: "#b6d985"
        }}>
            <div className="container text-center">
                <div className="mb-2">
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Home</a>
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>About</a>
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Shop</a>
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Contact</a>
                </div>

                <div className="mb-2">
                    <a href="#" className="mx-2" style={{ color: "#b6d985" }}><FaFacebook /></a>
                    <a href="#" className="mx-2" style={{ color: "#b6d985" }}><FaInstagram /></a>
                </div>
                <p className="mb-0" style={{ fontWeight: "bold" }}>&copy; 2026 ShuttleX. All rights reserved.</p>
            </div>
        </footer>
    )
}

export default Footer
