import './ForgotPasswordPage.css'
import { useState, useEffect } from 'react'
import api from '../../api'
import Error from '../ui/Error'

function ForgotPasswordPage() {
    const [email, setEmail] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [resetComplete, setResetComplete] = useState(false)
    // Listen for password reset success from other tabs
    useEffect(() => {
        const handleStorageChange = (e) => {
            if (e.key === "passwordResetSuccess") {
                setResetComplete(true)
                setSuccess("Password has been reset successfully! You can now login with your new password.")
                setError("")

                setTimeout(() => {
                    window.close()
                }, 1500)
            }
        }

        window.addEventListener("storage", handleStorageChange)
        return () => window.removeEventListener("storage", handleStorageChange)
    }, [])

    async function handleSubmit(e) {
        e.preventDefault()
        setLoading(true)
        setError("")
        setSuccess("")

        try {
            const payload = {
                email: email
            }

            await api.post("/auth/password/reset/", payload)

            setEmail("")
            setSuccess("Password reset link has been sent to your email. Please check your inbox!")
        } catch (err) {
            const msg =
                err.response?.data?.detail ||
                err.response?.data?.email?.[0] ||
                err.message
            setError(msg)
            console.log("forgot password error", err.response?.data || err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="forgot-password-container my-5">
            <div className="forgot-password-card-shadow">
                {error && <Error error={error} />}
                {success && <div className="alert alert-success">{success}</div>}
                
                {resetComplete ? (
                    <div className="text-center">
                        <h2 className="forgot-password-title text-success">Password Reset Complete!</h2>
                        <p className="forgot-password-subtitle">Your password has been successfully reset.</p>
                        <a href="/login" className="btn btn-primary mt-3">Go to Login</a>
                    </div>
                ) : (
                    <>
                        <h2 className="forgot-password-title">Reset Password</h2>
                        <p className="forgot-password-subtitle">Enter your email address and we'll send you a link to reset your password</p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Email Address</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="form-control" 
                                    id="email"
                                    placeholder="Enter your email address" 
                                    required 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={loading}
                            >
                                {loading ? "Sending..." : "Send Reset Link"}
                            </button>
                        </form>
                        <div className="forgot-password-footer">
                            <p>Remember your password? <a href="/login">Log in</a></p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ForgotPasswordPage