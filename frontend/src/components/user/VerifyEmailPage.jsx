import React, { useEffect, useMemo, useState } from "react"
import { useLocation, useNavigate, useParams } from "react-router-dom"
import api from "../../api"

function VerifyEmailPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { key } = useParams()
  const initialEmail = useMemo(() => location.state?.email || "", [location.state])
  const [email, setEmail] = useState(initialEmail)
  const [feedback, setFeedback] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [verified, setVerified] = useState(false)

  // If the route contains a key, confirm it immediately
  useEffect(() => {
    const confirm = async () => {
      if (!key) return
      setLoading(true)
      setError("")
      setFeedback("")
      try {
        await api.post("/auth/registration/verify-email/", { key })
        setVerified(true)
        setFeedback("Xác minh email thành công! Bạn có thể đóng tab này và quay lại đăng nhập.")

        // Broadcast to other tabs that verification succeeded
        localStorage.setItem("emailVerified", Date.now().toString())

        setTimeout(() => {
          window.close()
          setTimeout(() => {
            if (!window.closed) {
              navigate("/login", { replace: true })
            }
          }, 500)
        }, 2000)
      } catch (err) {
        const msg = err.response?.data?.detail || "Xác minh thất bại hoặc liên kết đã hết hạn. Bạn có thể yêu cầu gửi lại bên dưới."
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    confirm()
  }, [key, navigate])

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "emailVerified") {
        setVerified(true)
        setFeedback("Email verified successfully! You can now login.")
      }
    }

    window.addEventListener("storage", handleStorageChange)
    return () => window.removeEventListener("storage", handleStorageChange)
  }, [])

  const handleResend = async (e) => {
    e.preventDefault()
    if (!email) {
      setError("Vui lòng nhập email để gửi lại liên kết xác minh.")
      return
    }
    setLoading(true)
    setFeedback("")
    setError("")
    try {
      await api.post("/auth/registration/resend-email/", { email })
      setFeedback("Đã gửi lại liên kết thành công. Vui lòng kiểm tra email.")
    } catch (err) {
      const msg = err.response?.data?.detail || "Gửi lại email thất bại. Vui lòng thử lại sau." 
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container my-5" style={{ maxWidth: 640 }}>
      {verified ? (
        <div className="text-center">
          <h2 className="mb-3 text-success">Xác minh email thành công!</h2>
          <div className="alert alert-success">
            <p className="mb-2"><strong>Email của bạn đã được xác minh thành công.</strong></p>
            <p className="mb-0">Bạn có thể đóng tab này và quay lại đăng nhập, hoặc sẽ được chuyển hướng tự động.</p>
          </div>
          <button onClick={() => window.close()} className="btn btn-secondary me-2">Đóng tab</button>
          <button onClick={() => navigate("/login")} className="btn btn-primary">Đi tới đăng nhập</button>
        </div>
      ) : (
        <>
          <h2 className="mb-3">Xác minh email</h2>
          <p className="text-muted mb-4">
            Bạn đã đăng ký thành công. Để hoàn tất đăng ký, vui lòng kiểm tra email và bấm vào liên kết xác minh.
          </p>

          {initialEmail && (
            <div className="alert alert-info py-2">Liên kết đã được gửi tới: <strong>{initialEmail}</strong></div>
          )}
          {feedback && <div className="alert alert-success py-2">{feedback}</div>}
          {error && <div className="alert alert-danger py-2">{error}</div>}

          <form onSubmit={handleResend} className="border rounded p-3 bg-light">
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                id="email"
                type="email"
                className="form-control"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Nhập email đã đăng ký"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Đang gửi lại..." : "Gửi lại email xác minh"}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default VerifyEmailPage