import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../../api'
import Error from '../ui/Error'
import './ForgotPasswordPage.css'

function ResetPasswordPage() {
    const navigate = useNavigate()
    const { uid, token } = useParams()
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    async function handleSubmit(e) {
        e.preventDefault()

        if (password !== confirmPassword) {
            setError("Passwords do not match")
            return
        }

        if (password.length < 8) {
            setError("Password must be at least 8 characters long")
            return
        }

        setLoading(true)
        setError("")

        try {
            const payload = {
                new_password1: password,
                new_password2: confirmPassword,
                uid: uid,
                token: token
            }

            await api.post("/auth/password/reset/confirm/", payload)
            localStorage.setItem("passwordResetSuccess", Date.now().toString())

            alert("Password has been reset successfully! You can now login with your new password.")
            setTimeout(() => {
                window.close()
                setTimeout(() => {
                    if (!window.closed) {
                        navigate("/login")
                    }
                }, 500)
            }, 1000)
        } catch (err) {
            const msg =
                err.response?.data?.new_password2?.[0] ||
                err.response?.data?.token?.[0] ||
                err.response?.data?.detail ||
                "Password reset failed. The link may have expired."
            setError(msg)
            console.log("reset password error", err.response?.data || err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="forgot-password-container my-5">
            <div className="forgot-password-card-shadow">
                {error && <Error error={error} />}
                <h2 className="forgot-password-title">Set New Password</h2>
                <p className="forgot-password-subtitle">Enter your new password below</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">New Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="form-control"
                            id="password"
                            placeholder="Enter new password"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirm New Password</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="form-control"
                            id="confirmPassword"
                            placeholder="Confirm new password"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading ? "Resetting..." : "Reset Password"}
                    </button>
                </form>
                <div className="forgot-password-footer">
                    <p>Remember your password? <a href="/login">Log in</a></p>
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordPage
