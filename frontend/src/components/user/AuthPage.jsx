import "./AuthPage.css";
import { useEffect, useState } from "react";
import api, { authApi } from "../../api";
import Error from "../ui/Error";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
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
  const { setIsAuthenticated, refreshUserData } =
    useAuthStore();
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
      window.dispatchEvent(new Event("cart:refresh"));

      const refreshed = await refreshUserData();
      const isAdmin = !!refreshed?.isStaff;

      if (isAdmin) {
        navigate("/admin/dashboard", { replace: true });
      } else {
        const fromState = location?.state?.from;
        const from = typeof fromState === "string"
          ? fromState
          : fromState?.pathname || "/";
        navigate(from, { replace: true });
      }
    } catch (err) {
      let msg = "Đăng nhập thất bại. Vui lòng thử lại.";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string" && data.includes("<!DOCTYPE")) {
          msg = "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
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
      let msg = "Đăng ký thất bại. Vui lòng thử lại.";

      if (err.response?.data) {
        const data = err.response.data;
        if (typeof data === "string" && data.includes("<!DOCTYPE")) {
          msg = "Máy chủ gặp lỗi. Vui lòng thử lại sau.";
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
              <p className="auth-eyebrow">Chào mừng quay lại</p>
              <h2 className="auth-title">Đăng nhập tài khoản</h2>
              <p className="auth-subtitle">
                Tiếp tục mua sắm và theo dõi đơn hàng của bạn.
              </p>

              <form onSubmit={handleLoginSubmit}>
                <div className="mb-3">
                  <label htmlFor="login-emailOrUsername" className="form-label">
                    Email hoặc tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={emailOrUsername}
                    onChange={(e) => setEmailOrUsername(e.target.value)}
                    className="form-control"
                    id="login-emailOrUsername"
                    placeholder="Nhập email hoặc tên đăng nhập"
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
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="form-control"
                    id="login-password"
                    placeholder="Nhập mật khẩu"
                    required
                  />
                </div>

                <button
                  type="submit"
                  className="btn w-100 auth-primary"
                  disabled={loginLoading || !isValidInput(emailOrUsername)}
                >
                  {loginLoading ? "Đang đăng nhập..." : "Đăng nhập"}
                </button>
              </form>

              <div className="auth-footer">
                <Link to="/forgot-password">Quên mật khẩu?</Link>
              </div>

              <div className="auth-inline-toggle">
                <span>Bạn mới ở đây?</span>
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => handleModeChange("register")}
                >
                  Tạo tài khoản
                </button>
              </div>
            </div>
          </section>

          <section className="auth-form-pane auth-pane-register">
            <div className="auth-form-inner">
              {registerError && <Error error={registerError} />}
              <p className="auth-eyebrow">Mới đến với ShuttleX?</p>
              <h2 className="auth-title">Tạo tài khoản của bạn</h2>
              <p className="auth-subtitle">
                Tham gia ngay để lưu yêu thích, theo dõi giao hàng và nhiều hơn nữa.
              </p>

              <form onSubmit={handleRegisterSubmit}>
                <div className="mb-3 auth-grid">
                  <div>
                    <label htmlFor="register-firstName" className="form-label">
                      Tên
                    </label>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="form-control"
                      id="register-firstName"
                      placeholder="Nhập tên"
                    />
                  </div>
                  <div>
                    <label htmlFor="register-lastName" className="form-label">
                      Họ
                    </label>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="form-control"
                      id="register-lastName"
                      placeholder="Nhập họ"
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="register-username" className="form-label">
                    Tên đăng nhập
                  </label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="form-control"
                    id="register-username"
                    placeholder="Chọn tên đăng nhập"
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
                    placeholder="Nhập email"
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
                    Mật khẩu
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="form-control"
                    id="register-password"
                    placeholder="Tạo mật khẩu"
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
                    Xác nhận mật khẩu
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-control"
                    id="register-confirmPassword"
                    placeholder="Nhập lại mật khẩu"
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
                  {registerLoading ? "Đang đăng ký..." : "Đăng ký"}
                </button>
              </form>

              <div className="auth-footer">
                <span>Đã có tài khoản?</span>
                <button
                  type="button"
                  className="btn btn-link p-0"
                  onClick={() => handleModeChange("login")}
                >
                  Đăng nhập
                </button>
              </div>
            </div>
          </section>

          <aside className="auth-overlay-slider">
            <div className="auth-overlay-panel">
              {mode === "register" ? (
                <>
                  <h3>Chào mừng quay lại</h3>
                  <p>
                    Truy cập tài khoản để theo dõi đơn hàng, quản lý dụng cụ và sẵn sàng cho trận đấu tiếp theo!
                  </p>
                  <button
                    type="button"
                    className="btn auth-ghost"
                    onClick={() => handleModeChange("login")}
                  >
                    Đăng nhập
                  </button>
                </>
              ) : (
                <>
                  <h3>Lần đầu đến với ShuttleX?</h3>
                  <p>
                    Mua sắm cùng chúng tôi để mỗi trận đấu đều tốt hơn với dụng cụ phù hợp.
                  </p>
                  <button
                    type="button"
                    className="btn auth-ghost"
                    onClick={() => handleModeChange("register")}
                  >
                    Tạo tài khoản
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
