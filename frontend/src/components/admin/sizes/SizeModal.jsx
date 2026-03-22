import { useEffect, useMemo, useState } from "react"
import SizeForm from "./SizeForm"

const emptySize = {
  name: "",
  type: ""
}

function SizeModal({ open, size, onClose, onSave, sizeTypes }) {
  const initialValues = useMemo(() => size || emptySize, [size])
  const [values, setValues] = useState(initialValues)

   useEffect(() => {
      if (open) {
        setValues(initialValues)
      }
    }, [open, initialValues])
  
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
              <h5 className="modal-title">{size ? "Sửa kích cỡ" : "Thêm kích cỡ"}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <SizeForm
                values={values}
                onChange={setValues}
                onSubmit={handleSubmit}
                onCancel={onClose}
                sizeTypes={sizeTypes}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="modal-backdrop fade show" onClick={onClose} />
    </>
  )
}

export default SizeModal
