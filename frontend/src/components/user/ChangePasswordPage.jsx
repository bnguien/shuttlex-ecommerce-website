import { useState } from 'react'
import api from '../../api'
import Error from '../ui/Error'
import { getPasswordValidationMessage, getPasswordMatchMessage, doPasswordsMatch, isValidPassword } from '../../utils/validation'

function ChangePasswordPage() {
    const [oldPassword, setOldPassword] = useState("")
    const [newPassword1, setNewPassword1] = useState("")
    const [newPassword2, setNewPassword2] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")

    async function handleSubmit(e){
        e.preventDefault()
        
        // Validate passwords
        if (!doPasswordsMatch(newPassword1, newPassword2)) {
            setError("Passwords do not match")
            return
        }
        
        if (!isValidPassword(newPassword1)) {
            setError("Password must be at least 8 characters long")
            return
        }
        
        setLoading(true)
        setError("")
        setSuccess("")
        
        const payload = {
            old_password: oldPassword,
            new_password1: newPassword1,
            new_password2: newPassword2
        }

        try {
            const res = await api.post("/auth/password/change/", payload)
            console.log(res.data)
            setOldPassword("")
            setNewPassword1("")
            setNewPassword2("")
            setSuccess("Password changed successfully!")
        } catch (err) {
            const msg =
                err.response?.data?.detail ||
                err.response?.data?.old_password?.[0] ||
                err.response?.data?.new_password1?.[0] ||
                err.response?.data?.new_password2?.[0] ||
                err.response?.data?.non_field_errors?.[0] ||
                err.message
            setError(msg)
            console.log("change password error", err.response?.data || err)
        } finally {
            setLoading(false)
        }
    }

  return (
    <div className="container my-5">
        <div className="row justify-content-center">
            <div className="col-md-6">
                <div className="card shadow">
                    <div className="card-body p-4">
                        {error && <Error error={error} />}
                        {success && <div className="alert alert-success">{success}</div>}
                        <h2 className="text-center mb-3">Change Password</h2>
                        <p className="text-center text-muted mb-4">Update your account password</p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="oldPassword" className="form-label fw-semibold">Current Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="oldPassword"
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    placeholder="Enter your current password"
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label htmlFor="newPassword1" className="form-label fw-semibold">New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="newPassword1"
                                    value={newPassword1}
                                    onChange={(e) => setNewPassword1(e.target.value)}
                                    placeholder="Enter new password"
                                    required
                                />
                                {getPasswordValidationMessage(newPassword1) && (
                                    <small className="text-danger d-block mt-1">{getPasswordValidationMessage(newPassword1)}</small>
                                )}
                            </div>
                            <div className="mb-3">
                                <label htmlFor="newPassword2" className="form-label fw-semibold">Confirm New Password</label>
                                <input
                                    type="password"
                                    className="form-control"
                                    id="newPassword2"
                                    value={newPassword2}
                                    onChange={(e) => setNewPassword2(e.target.value)}
                                    placeholder="Re-enter new password"
                                    required
                                />
                                {getPasswordMatchMessage(newPassword1, newPassword2) && (
                                    <small className="text-danger d-block mt-1">{getPasswordMatchMessage(newPassword1, newPassword2)}</small>
                                )}
                            </div>
                            <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                                {loading ? "Changing..." : "Change Password"}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    </div>
  )
}

export default ChangePasswordPage