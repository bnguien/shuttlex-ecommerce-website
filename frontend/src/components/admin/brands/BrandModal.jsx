import { useMemo, useState } from "react"
import BrandForm from "./BrandForm"

const emptyBrand = {
  name: "",
  slug: "",
  is_active: true
}

function BrandModal({ open, brand, onClose, onSave }) {
  const initialValues = useMemo(() => brand || emptyBrand, [brand])
  const [values, setValues] = useState(initialValues)

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
              <h5 className="modal-title">{brand ? "Edit Brand" : "New Brand"}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <BrandForm
                values={values}
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

export default BrandModal
