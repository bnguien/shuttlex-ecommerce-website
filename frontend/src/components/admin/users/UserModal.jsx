import { useEffect, useMemo, useState } from "react"
import UserForm from "./UserForm"

const emptyUser = {
  username: "",
  email: "",
  password: "",
  first_name: "",
  last_name: "",
  phone: "",
  address: "",
  is_active: true,
  is_staff: false,
  is_superuser: false
}

const normalizeUserForForm = (user) => {
  if (!user) return emptyUser
  return {
    ...user,
    password: "" // Never show password
  }
}

function UserModal({ open, user, onClose, onSave }) {
  const initialValues = useMemo(() => normalizeUserForForm(user), [user])
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
              <h5 className="modal-title">{user?.id ? "Edit User" : "New User"}</h5>
              <button type="button" className="btn-close" onClick={onClose} />
            </div>
            <div className="modal-body">
              <UserForm
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

export default UserModal
