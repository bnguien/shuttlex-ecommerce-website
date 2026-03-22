import React from 'react'
import { FaBold } from 'react-icons/fa6'
import notFoundImg from "../../imgs/notfoundpage.png";
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="d-flex flex-row justify-content-center align-items-center" style={{ height: "80vh" }}>
            <div className="d-flex flex-column justify-content-start align-items-start me-5">
                <h1 className="display-1 fw-bold">404</h1>
                <h3 className="mb-4">Xin lỗi, không tìm thấy trang này.</h3>
                <p className="mb-4 " style={{ maxWidth: "300px" }}>
                    Đừng lo, bạn có thể quay lại trang chủ để tiếp tục mua sắm.
                </p>
                <Link to="/" className="btn rounded-pill px-4 py-2" style={{backgroundColor: "#029942", fontWeight: "600", color: "#fff"}}> 
                    Về trang chủ
                </Link>
            </div>
            <div className="img-container mb-4">
                <img
                    src={notFoundImg}
                    alt="Không tìm thấy trang"
                    className="img-fluid"
                    style={{ maxWidth: "400px" }}
                />

            </div>
        </div>
    )
}

export default NotFoundPage