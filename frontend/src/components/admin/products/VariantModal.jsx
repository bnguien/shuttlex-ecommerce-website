import { useEffect, useMemo, useState } from "react"
import VariantForm from "./VariantForm"

const emptyVariant = {
  size_id: "",
  color: "",
  sku: "",
  price: "",
  sale_price: "",
  sale_ends_at: "",
  stock: 0,
  is_active: true,
}

const toDatetimeLocalValue = (value) => {
  if (!value) return ""
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ""

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  const hours = String(date.getHours()).padStart(2, "0")
  const minutes = String(date.getMinutes()).padStart(2, "0")
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

const normalizeVariantForForm = (variant) => {
  if (!variant) return emptyVariant
  return {
    ...variant,
    size_id: variant.size_id ?? variant.size?.id ?? "",
    color: variant.color ?? "",
    sku: variant.sku ?? "",
    price: variant.price ?? "",
    sale_price: variant.sale_price ?? "",
    sale_ends_at: toDatetimeLocalValue(variant.sale_ends_at),
    stock: variant.stock ?? 0,
    is_active: variant.is_active !== false,
  }
}

function VariantModal({ open, variant, sizes, onClose, onSave }) {
  const initialValues = useMemo(() => normalizeVariantForForm(variant), [variant])
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
        <div className="modal-dialog" role="document">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">{variant?.id ? "Edit Variant" : "Add Variant"}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <VariantForm
                values={values}
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

export default VariantModal
