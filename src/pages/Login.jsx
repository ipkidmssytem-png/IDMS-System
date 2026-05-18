import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import "./auth.css";

function EyeIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M2 12C3.8 7.8 7.4 5 12 5s8.2 2.8 10 7c-1.8 4.2-5.4 7-10 7s-8.2-2.8-10-7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

function EyeSlashIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path d="M3 3L21 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M10.6 10.7A3 3 0 0 0 12 15a3 3 0 0 0 2.3-.9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M9.9 5.2A10.8 10.8 0 0 1 12 5c4.6 0 8.2 2.8 10 7a12.6 12.6 0 0 1-4 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M6.1 6.1A12.7 12.7 0 0 0 2 12c1.8 4.2 5.4 7 10 7 1.2 0 2.4-.2 3.4-.6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

const validateField = (name, value) => {
  if (name === "nomborBadan") {
    const t = value.trim();
    if (!t) return "Nombor Badan diperlukan";
    if (t.length < 3) return "Minimum 3 aksara";
    if (!/^[a-zA-Z0-9]+$/.test(t)) return "Nombor Badan hanya boleh mengandungi huruf dan nombor";
  }
  if (name === "password") {
    if (!value) return "Kata laluan diperlukan";
  }
  return "";
};

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [nomborBadan, setNomborBadan] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loginError, setLoginError] = useState("");
  const [loading, setLoading] = useState(false);
  const [registrationNotice, setRegistrationNotice] = useState(false);

  useEffect(() => {
    if (location.state?.registrationComplete) {
      setRegistrationNotice(true);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, location.pathname, navigate]);

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({ ...prev, [name]: validateField(name, value) }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    const nomborBadanErr = validateField("nomborBadan", nomborBadan);
    const passwordErr = validateField("password", password);
    setErrors({ nomborBadan: nomborBadanErr, password: passwordErr });
    setTouched({ nomborBadan: true, password: true });

    if (nomborBadanErr || passwordErr) return;

    try {
      setLoading(true);

      const key = nomborBadan.trim().toLowerCase();
      const claimSnap = await getDoc(doc(db, "usernames", key));

      if (!claimSnap.exists()) {
        setLoginError("Nombor Badan atau kata laluan tidak sah.");
        return;
      }

      const emailToUse = claimSnap.data().email || "";
      if (!emailToUse) {
        setLoginError("Akaun tidak dijumpai. Sila hubungi pentadbir anda.");
        return;
      }

      await signInWithEmailAndPassword(auth, emailToUse, password);
      navigate("/dashboard");
    } catch {
      setLoginError("Nombor Badan atau kata laluan tidak sah.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-overlay">
        <div className="login-wrapper">
          <div className="login-card">

            <h1 className="idms-title">IDMS</h1>
            <p className="idms-subtitle">INTEGRATED DOCUMENT MANAGEMENT SYSTEM</p>
            <p className="idms-unit">POLIS DIRAJA MALAYSIA &middot; IPK PERAK</p>

            <div className="login-divider-gold"></div>

            {registrationNotice && (
              <p className="signup-success-msg" role="status">
                &#10003; Akaun berjaya dicipta. Sila log masuk dengan Nombor Badan dan kata laluan anda.
              </p>
            )}

            <form onSubmit={handleLogin} className="login-form" noValidate>

              <div className="form-group">
                <label>Nombor Badan</label>
                <input
                  type="text"
                  value={nomborBadan}
                  autoComplete="username"
                  onChange={(e) => {
                    setNomborBadan(e.target.value);
                    if (touched.nomborBadan) {
                      setErrors((prev) => ({
                        ...prev,
                        nomborBadan: validateField("nomborBadan", e.target.value),
                      }));
                    }
                  }}
                  onBlur={() => handleBlur("nomborBadan", nomborBadan)}
                />
                {touched.nomborBadan && errors.nomborBadan && (
                  <span className="field-error">{errors.nomborBadan}</span>
                )}
              </div>

              <div className="form-group">
                <label>Kata Laluan</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="current-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (touched.password) {
                        setErrors((prev) => ({
                          ...prev,
                          password: validateField("password", e.target.value),
                        }));
                      }
                    }}
                    onBlur={() => handleBlur("password", password)}
                  />
                  <button
                    type="button"
                    className="eye-button"
                    onClick={() => setShowPassword((v) => !v)}
                  >
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <div className="login-meta-row">
                <span></span>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => navigate("/forgot-password")}
                >
                  Lupa Kata Laluan?
                </button>
              </div>

              {loginError && (
                <p className="login-error-msg">&#9432; {loginError}</p>
              )}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Log Masuk..." : "Log Masuk"}
              </button>

              <button
                type="button"
                className="signup-btn"
                onClick={() => navigate("/signup")}
              >
                Daftar Akaun
              </button>

            </form>

            <footer className="login-footer">
              © {new Date().getFullYear()} Unit Teknologi Maklumat, IPK Perak
            </footer>
          </div>
        </div>
      </div>
    </div>
  );
}
