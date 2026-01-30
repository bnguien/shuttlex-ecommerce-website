import React from 'react'
import PlaceHolder from './PlaceHolder'

function PlaceHolderContainer() {
    const placeNumber = Array.from({ length: 8 })

    return (
        <section className="py-5" id="shop">
            <h4 className="text-center">Our Products</h4>

            <div className="container px-4 px-lg-5 mt-5">
                <div className="row">
                    {placeNumber.map((_, index) => (
                        <PlaceHolder key={index} />
                    ))}
                </div>
            </div>
        </section>
    )
}

export default PlaceHolderContainer
