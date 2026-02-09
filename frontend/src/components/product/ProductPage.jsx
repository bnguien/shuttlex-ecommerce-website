import RelatedProducts from './RelatedProducts'
import ProductPagePlaceHolder from './ProductPagePlaceHolder'
import { useParams } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { BASE_URL } from '../../api'
import api from '../../api'
import { formatCurrencyVND } from '../../utils/format'
function ProductPage({ setNumCartItems }) {
    const { slug } = useParams()
    const [product, setProduct] = useState({})
    const [similarProducts, setSimilarProducts] = useState([])
    const [loading, setLoading] = useState(false)
    const [inCart, setInCart] = useState(false)
    const [adding, setAdding] = useState(false);
    const cart_code = localStorage.getItem("cart_code")

    useEffect(() => {
        if (!cart_code || !product.id) return;

        api.get(
            `product_in_cart?cart_code=${cart_code}&product_id=${product.id}`
        )
            .then(res => {
                setInCart(res.data.product_in_cart)
            })
            .catch(err => {
                console.error(err.message)
            })
    }, [cart_code, product.id])
    function add_item() {
        // Check if product_id exists before adding
        if (!product.id) {
            console.error("Product ID is missing");
            return;
        }

        const new_item = {
            cart_code: cart_code,
            product_id: product.id
        }
        setAdding(true);
        api.post("add_item/", new_item)
            .then(res => {
                console.log(res.data)
                setInCart(true)
                setNumCartItems(current => current + 1);
            })
            .catch(err => {
                console.error(err.message)
            })
            .finally(()=>setAdding(false))
    }

    useEffect(() => {
        setLoading(true)
        api.get(`product_detail/${slug}`)
            .then(res => {
                console.log(res.data)
                setProduct(res.data)
                setSimilarProducts(res.data.similar_products)
                setLoading(false)
            })
            .catch(err => {
                console.error(err.message)
                setLoading(false)
            })
    }, [slug])
    if (loading) {
        return <ProductPagePlaceHolder />
    }
    return (
        <div>
            <section className="py-3">
                <div className="container px-4 px-lg-5 my-5">
                    <div className="row gx-4 gx-lg-5 align-items-center">
                        <div className="col-md-6">
                            <img
                                className="card-img-top mb-5 mb-md-0"
                                src={`${BASE_URL}${product.image}`}
                                alt="Product Image"
                            />
                        </div>
                        <div className="col-md-6">
                            <div className="small mb-1">SKU: BST-498</div>
                            <h1 className="display-5 fw-bolder">{product.name}</h1>
                            <div className="fs-5 mb-5">
                                <span>{formatCurrencyVND(product.price)}</span>
                            </div>
                            <p className="lead">
                                {product.description}
                            </p>
                            <div className="d-flex">
                                <button className="btn btn-outline-dark flex-shrink-0"
                                    type="button"
                                    onClick={add_item}
                                    disabled={inCart || adding}
                                >
                                    <i className="bi-cart-fill me-1"></i>
                                    {inCart ? "Product added to Cart" : "Add to cart"}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
            <RelatedProducts products={similarProducts} />
        </div>
    )
}

export default ProductPage