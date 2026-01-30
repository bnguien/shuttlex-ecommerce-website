import { useState } from 'react'
import api from '../../api'
import Error from '../ui/Error'
import { useNavigate } from 'react-router-dom'
import './RegisterPage.css'
import { 
    isValidEmail, 
    getValidationEmailMessage,
    getPasswordValidationMessage,
    getPasswordMatchMessage,
    doPasswordsMatch,
    isValidPassword
} from '../../utils/validation'

function RegisterPage() {
    const navigate = useNavigate() 
    const [error, setError] = useState("")
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const userInfo = { firstName, lastName, username, email, password, confirmPassword }
    async function handleSubmit(e) {
        e.preventDefault();
        
        // Validate passwords before submitting
        if (!doPasswordsMatch(password, confirmPassword)) {
            setError("Passwords do not match")
            return
        }
        
        if (!isValidPassword(password)) {
            setError("Password must be at least 8 characters long")
            return
        }
        
        setLoading(true);
        setError("");

        try {
            const payload = {
                username: userInfo.username,
                email: userInfo.email,
                password1: userInfo.password,
                password2: userInfo.confirmPassword,
                first_name: userInfo.firstName || "",
                last_name: userInfo.lastName || "",
            };

            const res = await api.post("/auth/registration/", payload);
            console.log(res.data);

            setFirstName("");
            setLastName("");
            setUsername("");
            setEmail("");
            setPassword("")
            setConfirmPassword("")

            navigate("/verify-email", { replace: true, state: { email: userInfo.email } })
        } catch (err) {
            let msg = "Registration failed. Please try again.";
            
            if (err.response?.data) {
                const data = err.response.data;
                if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
                    msg = "Server error occurred. Please try again later.";
                } else {
                    for (const [key, value] of Object.entries(data)) {
                        if (Array.isArray(value) && value.length > 0) {
                            msg = value[0]; 
                            break;
                        } else if (typeof value === 'string') {
                            msg = value;
                            break;
                        }
                    }
                }
            }
            setError(msg);
            console.log("registration error", err.response?.data || err);
        } finally {
            setLoading(false);
        }
    }
    return (
        <div className="register-container my-5">
            <div className="register-card-shadow">
                {error && <Error error={error} />}
                <h2 className="register-title">Create your account</h2>
                <p className="register-subtitle">Fill in your details to start shopping with Shuttlex.</p>
                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="firstName" className="form-label">First Name</label>
                        <input type="text" value={firstName}
                            onChange={e => setFirstName(e.target.value)}
                            className="form-control" id="firstName"
                            placeholder="Enter your first name" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="lastName" className="form-label">Last Name</label>
                        <input type="text" value={lastName}
                            onChange={e => setLastName(e.target.value)}
                            className="form-control" id="lastName"
                            placeholder="Enter your last name" />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="username" className="form-label">Username</label>
                        <input type="username" value={username}
                            onChange={e => setUsername(e.target.value)}
                            className="form-control" id="username"
                            placeholder="Choose a username" required />
                    </div>
                    <div className="mb-3">
                        <label htmlFor="email" className="form-label">Email</label>
                        <input type="email" value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="form-control" id="email"
                            placeholder="Enter your email"
                            required
                        />
                        {getValidationEmailMessage(email) && (
                            <small className="text-danger d-block mt-1">{getValidationEmailMessage(email)}</small>
                        )}
                    </div>
                    <div className="mb-3">
                        <label htmlFor="password" className="form-label">Password</label>
                        <input type="password" value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="form-control" id="password"
                            placeholder="Create a password" required />
                        {getPasswordValidationMessage(password) && (
                            <small className="text-danger d-block mt-1">{getPasswordValidationMessage(password)}</small>
                        )}
                    </div>
                    <div className="mb-3">
                        <label htmlFor="confirmPassword" className="form-label">Confirm password</label>
                        <input type="password" value={confirmPassword}
                            onChange={e => setConfirmPassword(e.target.value)}
                            className="form-control" id="confirmPassword"
                            placeholder="Re-enter your password" required />
                        {getPasswordMatchMessage(password, confirmPassword) && (
                            <small className="text-danger d-block mt-1">{getPasswordMatchMessage(password, confirmPassword)}</small>
                        )}
                    </div>
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>{loading ? "Registering..." : "Register"}</button>
                </form>
                <div className="register-footer">
                    <p>Already have an account? <a href="/login">Log in</a></p>
                </div>
            </div>
        </div>
    )
}

export default RegisterPage