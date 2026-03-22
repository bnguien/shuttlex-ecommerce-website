import { FaFacebook, FaInstagram } from 'react-icons/fa6'

const Footer = () => {
    return (
        <footer className="py-3" style={{
            background: `radial-gradient(circle, #2f6f2e 0%, #429241 40%, #66c064 100%)`, color: "#b6d985"
        }}>
            <div className="container text-center">
                <div className="mb-2">
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Trang chủ</a>
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Giới thiệu</a>
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Mua sắm</a>
                    <a href="#" className="text-decoration-none mx-2" style={{ color: "#b6d985", fontWeight: "bold" }}>Liên hệ</a>
                </div>

                <div className="mb-2">
                    <a href="#" className="mx-2" style={{ color: "#b6d985" }}><FaFacebook /></a>
                    <a href="#" className="mx-2" style={{ color: "#b6d985" }}><FaInstagram /></a>
                </div>
                <p className="mb-0" style={{ fontWeight: "bold" }}>&copy; 2026 ShuttleX. Bảo lưu mọi quyền.</p>
            </div>
        </footer>
    )
}

export default Footer
