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
        setFeedback("Email verified successfully! You can close this tab and return to login.")

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
        const msg = err.response?.data?.detail || "Verification failed or link expired. You can request a new link below."
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
      setError("Please enter an email to resend the verification link.")
      return
    }
    setLoading(true)
    setFeedback("")
    setError("")
    try {
      await api.post("/auth/registration/resend-email/", { email })
      setFeedback("The link has been resent successfully. Please check your email.")
    } catch (err) {
      const msg = err.response?.data?.detail || "Resending email failed. Please try again later." 
      setError(msg)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container my-5" style={{ maxWidth: 640 }}>
      {verified ? (
        <div className="text-center">
          <h2 className="mb-3 text-success">Email Verified!</h2>
          <div className="alert alert-success">
            <p className="mb-2"><strong>Your email has been verified successfully.</strong></p>
            <p className="mb-0">You can close this tab and return to login, or you will be redirected automatically.</p>
          </div>
          <button onClick={() => window.close()} className="btn btn-secondary me-2">Close Tab</button>
          <button onClick={() => navigate("/login")} className="btn btn-primary">Go to Login</button>
        </div>
      ) : (
        <>
          <h2 className="mb-3">Email Verification</h2>
          <p className="text-muted mb-4">
            You have registered successfully. To complete the registration, please check your email for a verification link and click on it to verify your email address.
          </p>

          {initialEmail && (
            <div className="alert alert-info py-2">The link has been sent to: <strong>{initialEmail}</strong></div>
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
                placeholder="Enter the registered email"
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? "Resending..." : "Resend verification email"}
            </button>
          </form>
        </>
      )}
    </div>
  )
}

export default VerifyEmailPage