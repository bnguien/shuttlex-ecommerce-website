import { useEffect, useMemo, useState } from "react"
import ProductForm from "./ProductForm"

const emptyProduct = {
  name: "",
  slug: "",
  base_price: "",
  base_stock: "",
  description: "",
  is_active: true
}

function ProductModal({ open, product, brands, categories, sizes, onClose, onSave }) {
  const initialValues = useMemo(() => product || emptyProduct, [product])
  const [values, setValues] = useState(initialValues)

  useEffect(() => {
    setValues(initialValues)
  }, [initialValues, open])

  if (!open) return null

  const handleSubmit = (event) => {
    event.preventDefault()
    onSave(values)
  }

  return (
    <>
      <div className="modal d-block" tabIndex="-1" role="dialog">
        <div className="modal-dialog modal-lg" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{product ? "Edit Product" : "New Product"}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <ProductForm
                values={values}
                brands={brands}
                categories={categories}
                sizes={sizes}
                onChange={setValues}
                onSubmit={handleSubmit}
                onCancel={onClose}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  )
}

export default ProductModal
