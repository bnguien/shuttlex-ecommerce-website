import { useMemo, useState } from "react"
import CategoryForm from "./CategoryForm"

const emptyCategory = {
  name: "",
  slug: "",
  image: null,
  is_active: true
}

function CategoryModal({ open, category, onClose, onSave }) {
  const initialValues = useMemo(() => category || emptyCategory, [category])
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
              <h5 className="modal-title">{category ? "Edit Category" : "New Category"}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <CategoryForm
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

export default CategoryModal
