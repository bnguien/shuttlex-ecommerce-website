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
            setError("Mật khẩu xác nhận không khớp")
            return
        }

        if (password.length < 8) {
            setError("Mật khẩu phải có ít nhất 8 ký tự")
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

            alert("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.")
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
                "Đặt lại mật khẩu thất bại. Liên kết có thể đã hết hạn."
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
                <h2 className="forgot-password-title">Đặt mật khẩu mới</h2>
                <p className="forgot-password-subtitle">Nhập mật khẩu mới của bạn bên dưới</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="form-control"
                            id="password"
                            placeholder="Nhập mật khẩu mới"
                            required
                        />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Xác nhận mật khẩu mới</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="form-control"
                            id="confirmPassword"
                            placeholder="Nhập lại mật khẩu mới"
                            required
                        />
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={loading}
                    >
                        {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
                    </button>
                </form>
                <div className="forgot-password-footer">
                    <p>Đã nhớ mật khẩu? <a href="/login">Đăng nhập</a></p>
                </div>
            </div>
        </div>
    )
}

export default ResetPasswordPage
