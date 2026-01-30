import React from 'react'

function PlaceHolder() {
    return (
        <div className="col-12 col-sm-6 col-md-3 mb-5">
            <div className="card" aria-hidden="true">
                <div
                    style={{ height: "180px", backgroundColor: "lightgray" }}
                />
                <div className="card-body">
                    <p className="placeholder-glow">
                        <span className="placeholder col-12 placeholder-xs"></span>
                        <span className="placeholder col-12 placeholder-xs"></span>
                    </p>
                </div>
            </div>
        </div>
    )
}

export default PlaceHolder