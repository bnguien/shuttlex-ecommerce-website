import "./LoginPage.css";
import { useState, useContext } from "react";
import { authApi } from "../../api";
import Error from "../ui/Error";
import { useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import { isValidInput, getValidationMessage } from "../../utils/validation";

function LoginPage() {
  const { setIsAuthenticated, setIsStaff, get_username, get_user_role } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();

    if (!isValidInput(emailOrUsername)) {
      setError(getValidationMessage(emailOrUsername));
      return;
    }

    setLoading(true);
    setError("");

    try {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      const payload = {
        username: emailOrUsername.trim(),
        password,
      };

      const res = await authApi.post("/auth/jwt/create/", payload);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      setEmailOrUsername("");
      setPassword("");
      setIsAuthenticated(true);

      await get_username();

      let isAdmin = false;
      try {
        const roleResponse = await get_user_role();
        isAdmin = roleResponse?.data?.is_staff || roleResponse?.data?.is_superuser;
        setIsStaff(!!isAdmin);
      } catch (roleErr) {
        console.log("role fetch error", roleErr);
      }
      
      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        const from = location?.state?.from?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      let msg = "Login failed. Please try again.";
        
      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === 'string' && data.includes('<!DOCTYPE')) {
          msg = "Server error occurred. Please try again later.";
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.non_field_errors) {
          msg = Array.isArray(data.non_field_errors) ? data.non_field_errors[0] : data.non_field_errors;
        } else if (data.username) {
          msg = Array.isArray(data.username) ? data.username[0] : data.username;
        } else if (data.password) {
          msg = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (typeof data === 'string') {
          msg = data;
        }
      }
        
      if (msg.toLowerCase().includes("not verified")) {
        navigate("/verify-email", { state: { email: emailOrUsername } })
      }

      setError(msg);
      console.log("login error", err.response?.data || err);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container my-5">
      <div className="login-card-shadow">
        {error && <Error error={error} />}

        <h2 className="login-title">Welcome Back</h2>
        <p className="login-subtitle">Please login to your account</p>

        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label htmlFor="emailOrUsername" className="form-label">
              Email or Username
            </label>
            <input
              type="text"
              value={emailOrUsername}
              onChange={(e) => setEmailOrUsername(e.target.value)}
              className="form-control"
              id="emailOrUsername"
              placeholder="Enter your email or username"
              required
            />
            {getValidationMessage(emailOrUsername) && (
              <small className="text-danger d-block mt-1">
                {getValidationMessage(emailOrUsername)}
              </small>
            )}
          </div>

          <div className="mb-3">
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-control"
              id="password"
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary w-100"
            disabled={loading || !isValidInput(emailOrUsername)}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            <a href="/forgot-password">Forgot your password?</a>
          </p>
          <p>
            Don't have an account? <a href="#">Sign up</a>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
