import "./AuthPage.css";
import { useContext, useEffect, useState } from "react";
import api, { authApi } from "../../api";
import Error from "../ui/Error";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext.jsx";
import {
  doPasswordsMatch,
  getPasswordMatchMessage,
  getPasswordValidationMessage,
  getValidationEmailMessage,
  getValidationMessage,
  isValidInput,
  isValidPassword,
} from "../../utils/validation";

function AuthPage({ initialMode = "login" }) {
  const { setIsAuthenticated, setIsStaff, get_username, get_user_role } =
    useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [mode, setMode] = useState(initialMode);
  const [hasInteracted, setHasInteracted] = useState(false);

  const [emailOrUsername, setEmailOrUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [registerLoading, setRegisterLoading] = useState(false);
  const [registerError, setRegisterError] = useState("");

  useEffect(() => {
    setMode(initialMode);
    setHasInteracted(false);
  }, [initialMode]);

  function handleModeChange(nextMode) {
    if (nextMode === mode) return;

    setHasInteracted(true);
    setMode(nextMode);
    setLoginError("");
    setRegisterError("");

    const nextPath = nextMode === "register" ? "/register" : "/login";
    if (location.pathname !== nextPath) {
      window.history.replaceState(window.history.state, "", nextPath);
    }
  }

  async function handleLoginSubmit(event) {
    event.preventDefault();

    if (!isValidInput(emailOrUsername)) {
      setLoginError(getValidationMessage(emailOrUsername));
      return;
    }

    setLoginLoading(true);
    setLoginError("");

    try {
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      const payload = {
        username: emailOrUsername.trim(),
        password: loginPassword,
      };

      const res = await authApi.post("/auth/jwt/create/", payload);

      localStorage.setItem("access", res.data.access);
      localStorage.setItem("refresh", res.data.refresh);

      setEmailOrUsername("");
      setLoginPassword("");
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
        if (typeof data === "string" && data.includes("<!DOCTYPE")) {
          msg = "Server error occurred. Please try again later.";
        } else if (data.detail) {
          msg = data.detail;
        } else if (data.non_field_errors) {
          msg = Array.isArray(data.non_field_errors)
            ? data.non_field_errors[0]
            : data.non_field_errors;
        } else if (data.username) {
          msg = Array.isArray(data.username) ? data.username[0] : data.username;
        } else if (data.password) {
          msg = Array.isArray(data.password) ? data.password[0] : data.password;
        } else if (typeof data === "string") {
          msg = data;
        }
      }

      if (msg.toLowerCase().includes("not verified")) {
        navigate("/verify-email", { state: { email: emailOrUsername } });
      }

      setLoginError(msg);
      console.log("login error", err.response?.data || err);
    } finally {
      setLoginLoading(false);
    }
  }

  async function handleRegisterSubmit(event) {
    event.preventDefault();

    if (!doPasswordsMatch(password, confirmPassword)) {
      setRegisterError("Passwords do not match");
      return;
    }

    if (!isValidPassword(password)) {
      setRegisterError("Password must be at least 8 characters long");
      return;
    }

    setRegisterLoading(true);
    setRegisterError("");

    try {
      const payload = {
        username: username.trim(),
        email: email.trim(),
        password1: password,
        password2: confirmPassword,
        first_name: firstName || "",
        last_name: lastName || "",
      };

      const res = await api.post("/auth/registration/", payload);
      console.log(res.data);

      setFirstName("");
      setLastName("");
      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");

      navigate("/verify-email", { replace: true, state: { email } });
    } catch (err) {
      let msg = "Registration failed. Please try again.";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string" && data.includes("<!DOCTYPE")) {
          msg = "Server error occurred. Please try again later.";
        } else {
          for (const value of Object.values(data)) {
            if (Array.isArray(value) && value.length > 0) {
              msg = value[0];
              break;
            }
            if (typeof value === "string") {
              msg = value;
              break;
            }
          }
        }
      }

      setRegisterError(msg);
      console.log("registration error", err.response?.data || err);
    } finally {
      setRegisterLoading(false);
    }
  }

  return (
    <div
      className={`auth-shell ${mode === "register" ? "is-register" : ""} ${hasInteracted ? "has-interacted" : ""}`}
    >
      <div className="auth-panel">
        <div className="auth-main">
          <section className="auth-form-pane auth-pane-login">
            <div className="auth-form-inner">
              {loginError && <Error error={loginError} />}
              <p className="auth-eyebrow">Welcome back</p>
              <h2 className="auth-title">Log in to your account</h2>
              <p className="auth-subtitle">
                Continue shopping and track your orders.
              </p>

              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label htmlFor="login-emailOrUsername" className="form-label">
                    Email or Username
                  </label>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="form-control"
                    id="login-emailOrUsername"
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
                  <label htmlFor="login-password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="form-control"
                    id="login-password"
                    placeholder="Enter your password"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100 auth-primary"
                  disabled={loginLoading || !isValidInput(emailOrUsername)}
                >
                  {loginLoading ? "Logging in..." : "Login"}
                </button>
              </form>

              <div className="auth-footer">
                <Link to="/forgot-password">Forgot your password?</Link>
              </div>

              <div className="auth-inline-toggle">
                <span>New here?</span>
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => handleModeChange("register")}
                >
                  Create an account
                </button>
              </div>
            </div>
          </section>

          <section className="auth-form-pane auth-pane-register">
            <div className="auth-form-inner">
              {registerError && <Error error={registerError} />}
              <p className="auth-eyebrow">New to Shuttlex?</p>
              <h2 className="auth-title">Create your account</h2>
              <p className="auth-subtitle">
                Join the club to save favorites, track deliveries, and more.
              </p>

              <form onSubmit={handleRegisterSubmit}>
                <div className="mb-3 auth-grid">
                  <div>
                    <label htmlFor="register-firstName" className="form-label">
                      First Name
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                      id="register-firstName"
                      placeholder="First name"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-lastName" className="form-label">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control"
                      id="register-lastName"
                      placeholder="Last name"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="register-username" className="form-label">
                    Username
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control"
                    id="register-username"
                    placeholder="Choose a username"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label htmlFor="register-email" className="form-label">
                    Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-control"
                    id="register-email"
                    placeholder="Enter your email"
                    required
                  />
                  {getValidationEmailMessage(email) && (
                    <small className="text-danger d-block mt-1">
                      {getValidationEmailMessage(email)}
                    </small>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="register-password" className="form-label">
                    Password
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    id="register-password"
                    placeholder="Create a password"
                    required
                  />
                  {getPasswordValidationMessage(password) && (
                    <small className="text-danger d-block mt-1">
                      {getPasswordValidationMessage(password)}
                    </small>
                  )}
                </div>
                <div className="mb-3">
                  <label htmlFor="register-confirmPassword" className="form-label">
                    Confirm password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control"
                    id="register-confirmPassword"
                    placeholder="Re-enter your password"
                    required
                  />
                  {getPasswordMatchMessage(password, confirmPassword) && (
                    <small className="text-danger d-block mt-1">
                      {getPasswordMatchMessage(password, confirmPassword)}
                    </small>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn w-100 auth-primary"
                  disabled={registerLoading}
                >
                  {registerLoading ? "Registering..." : "Register"}
                </button>
              </form>

              <div className="auth-footer">
                <span>Already have an account?</span>
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => handleModeChange("login")}
                >
                  Log in
                </button>
              </div>
            </div>
          </section>

          <aside className="auth-overlay-slider">
            <div className="auth-overlay-panel">
              {mode === "register" ? (
                <>
                  <h3>Welcome back</h3>
                  <p>
                    Access your account to track orders, manage your gear, and stay ready for your next match !
                  </p>
                  <button
                    type="button"
                    className="btn auth-ghost"
                    onClick={() => handleModeChange("login")}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  <h3>First time here?</h3>
                  <p>
                    Shop with us and make every game better with the right gear by your side.
                  </p>
                  <button
                    type="button"
                    className="btn auth-ghost"
                    onClick={() => handleModeChange("register")}
                  >
                    Create account
                  </button>
                </>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
