import React from 'react'
import { FaBold } from 'react-icons/fa6'
import notFoundImg from "../../imgs/notfoundpage.png";
import { Link } from 'react-router-dom';

function NotFoundPage() {
    return (
        <div className="d-flex flex-row justify-content-center align-items-center" style={{ height: "80vh" }}>
            <div className="d-flex flex-column justify-content-start align-items-start me-5">
                <h1 className="display-1 fw-bold">404</h1>
                <h3 className="mb-4">Sorry we couldn't find this page.</h3>
                <p className="mb-4 " style={{ maxWidth: "300px" }}>
                    But dont worry, you can find plenty of other things on our homepage
                </p>
                <Link to="/" className="btn rounded-pill px-4 py-2" style={{backgroundColor: "#029942", fontWeight: "600", color: "#fff"}}> 
                    Go to Homepage
                </Link>
            </div>
            <div className="img-container mb-4">
                <img
                    src={notFoundImg}
                    alt="Page not found"
                    className="img-fluid"
                    style={{ maxWidth: "400px" }}
                />

            </div>
        </div>
    )
}

export default NotFoundPage