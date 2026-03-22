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
                setSuccess("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.")
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
            setSuccess("Liên kết đặt lại mật khẩu đã được gửi tới email của bạn. Vui lòng kiểm tra hộp thư!")
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
                        <h2 className="forgot-password-title text-success">Đặt lại mật khẩu hoàn tất!</h2>
                        <p className="forgot-password-subtitle">Mật khẩu của bạn đã được đặt lại thành công.</p>
                        <a href="/login" className="btn btn-primary mt-3">Đi tới trang đăng nhập</a>
                    </div>
                ) : (
                    <>
                        <h2 className="forgot-password-title">Đặt lại mật khẩu</h2>
                        <p className="forgot-password-subtitle">Nhập email của bạn, chúng tôi sẽ gửi liên kết đặt lại mật khẩu</p>
                        <form onSubmit={handleSubmit}>
                            <div className="mb-3">
                                <label htmlFor="email" className="form-label">Địa chỉ email</label>
                                <input 
                                    type="email" 
                                    value={email}
                                    onChange={e => setEmail(e.target.value)}
                                    className="form-control" 
                                    id="email"
                                    placeholder="Nhập địa chỉ email" 
                                    required 
                                />
                            </div>
                            <button 
                                type="submit" 
                                className="btn btn-primary w-100" 
                                disabled={loading}
                            >
                                {loading ? "Đang gửi..." : "Gửi liên kết đặt lại"}
                            </button>
                        </form>
                        <div className="forgot-password-footer">
                            <p>Đã nhớ mật khẩu? <a href="/login">Đăng nhập</a></p>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

export default ForgotPasswordPage