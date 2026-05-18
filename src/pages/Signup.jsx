import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  deleteUser,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  PASSWORD_REQUIREMENT_TEXT,
  isPasswordStrong,
} from "../passwordPolicy";
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

const validateField = (name, value, extra = {}) => {
  switch (name) {
    case "nomborBadan":
      if (!value.trim()) return "Nombor Badan diperlukan";
      if (value.trim().length < 3) return "Minimum 3 aksara";
      if (!/^[a-zA-Z0-9]+$/.test(value.trim())) return "Nombor Badan hanya boleh mengandungi huruf dan nombor";
      return "";
    case "firstName":
      if (!value.trim()) return "Nama pertama diperlukan";
      return "";
    case "lastName":
      if (!value.trim()) return "Nama akhir diperlukan";
      return "";
    case "email":
      if (!value.trim()) return "Email diperlukan";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return "Masukkan alamat email yang sah";
      return "";
    case "password":
      if (!value) return "Kata laluan diperlukan";
      if (!isPasswordStrong(value)) return PASSWORD_REQUIREMENT_TEXT;
      return "";
    case "confirmPassword":
      if (!value) return "Sila sahkan kata laluan anda";
      if (value !== extra.password) return "Kata laluan tidak sepadan";
      return "";
    default:
      return "";
  }
};

const firebaseErrorMessage = (code) => {
  switch (code) {
    case "auth/email-already-in-use": return "Email ini sudah didaftarkan.";
    case "auth/invalid-email":        return "Sila masukkan alamat email yang sah.";
    case "auth/weak-password":        return PASSWORD_REQUIREMENT_TEXT;
    case "auth/network-request-failed": return "Ralat rangkaian. Semak sambungan anda dan cuba lagi.";
    case "auth/too-many-requests":    return "Terlalu banyak percubaan. Sila cuba lagi kemudian.";
    default:                          return "Gagal mencipta akaun. Sila cuba lagi.";
  }
};

export default function Signup() {
  const navigate = useNavigate();

  const [nomborBadan, setNomborBadan] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBlur = (name, value) => {
    setTouched((prev) => ({ ...prev, [name]: true }));
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, { password }),
    }));
  };

  const revalidate = (name, value) => {
    if (!touched[name]) return;
    setErrors((prev) => ({
      ...prev,
      [name]: validateField(name, value, { password }),
    }));
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setFormError("");

    const allTouched = {
      nomborBadan: true, firstName: true, lastName: true,
      email: true, password: true, confirmPassword: true,
    };
    setTouched(allTouched);

    const newErrors = {
      nomborBadan:     validateField("nomborBadan", nomborBadan),
      firstName:       validateField("firstName", firstName),
      lastName:        validateField("lastName", lastName),
      email:           validateField("email", email),
      password:        validateField("password", password),
      confirmPassword: validateField("confirmPassword", confirmPassword, { password }),
    };
    setErrors(newErrors);

    if (Object.values(newErrors).some(Boolean)) return;

    const cleanNomborBadan = nomborBadan.trim();
    const cleanFirstName   = firstName.trim();
    const cleanLastName    = lastName.trim();
    const cleanEmail       = email.trim().toLowerCase();
    const fullName         = `${cleanFirstName} ${cleanLastName}`;
    let createdUser = null;

    try {
      setLoading(true);

      const nomborBadanKey = cleanNomborBadan.toLowerCase();
      const nomborBadanClaim = await getDoc(doc(db, "usernames", nomborBadanKey));

      if (nomborBadanClaim.exists()) {
        setErrors((prev) => ({ ...prev, nomborBadan: "Nombor Badan ini telah didaftarkan" }));
        return;
      }

      const credential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      createdUser = credential.user;

      await updateProfile(createdUser, { displayName: fullName });
      await createdUser.getIdToken(true);

      const batch = writeBatch(db);
      batch.set(doc(db, "users", createdUser.uid), {
        username:  cleanNomborBadan,
        firstName: cleanFirstName,
        lastName:  cleanLastName,
        email:     cleanEmail,
        role:      "user",
        createdAt: serverTimestamp(),
      });
      batch.set(doc(db, "usernames", nomborBadanKey), {
        uid:   createdUser.uid,
        email: cleanEmail,
      });
      await batch.commit();

      navigate("/dashboard", { replace: true });
    } catch (err) {
      try {
        if (createdUser) await deleteUser(createdUser);
      } catch {
        // cleanup best-effort
      }
      setFormError(firebaseErrorMessage(err.code));
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

            <p className="signup-heading">Daftar Akaun</p>

            <form onSubmit={handleSignup} className="login-form" noValidate>

              <div className="form-group">
                <label>Nombor Badan</label>
                <input
                  type="text"
                  value={nomborBadan}
                  autoComplete="username"
                  onChange={(e) => { setNomborBadan(e.target.value); revalidate("nomborBadan", e.target.value); }}
                  onBlur={() => handleBlur("nomborBadan", nomborBadan)}
                />
                {touched.nomborBadan && errors.nomborBadan && (
                  <span className="field-error">{errors.nomborBadan}</span>
                )}
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nama Pertama</label>
                  <input
                    type="text"
                    value={firstName}
                    autoComplete="given-name"
                    onChange={(e) => { setFirstName(e.target.value); revalidate("firstName", e.target.value); }}
                    onBlur={() => handleBlur("firstName", firstName)}
                  />
                  {touched.firstName && errors.firstName && (
                    <span className="field-error">{errors.firstName}</span>
                  )}
                </div>

                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nama Akhir</label>
                  <input
                    type="text"
                    value={lastName}
                    autoComplete="family-name"
                    onChange={(e) => { setLastName(e.target.value); revalidate("lastName", e.target.value); }}
                    onBlur={() => handleBlur("lastName", lastName)}
                  />
                  {touched.lastName && errors.lastName && (
                    <span className="field-error">{errors.lastName}</span>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Email <span style={{ fontSize: 11, color: "#94a3b8", fontWeight: 400 }}>(untuk pemulihan kata laluan)</span></label>
                <input
                  type="email"
                  value={email}
                  autoComplete="email"
                  onChange={(e) => { setEmail(e.target.value); revalidate("email", e.target.value); }}
                  onBlur={() => handleBlur("email", email)}
                />
                {touched.email && errors.email && (
                  <span className="field-error">{errors.email}</span>
                )}
              </div>

              <div className="form-group">
                <label>Kata Laluan</label>
                <div className="password-field">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    autoComplete="new-password"
                    onChange={(e) => {
                      setPassword(e.target.value);
                      revalidate("password", e.target.value);
                      if (touched.confirmPassword) {
                        setErrors((prev) => ({
                          ...prev,
                          confirmPassword: validateField("confirmPassword", confirmPassword, { password: e.target.value }),
                        }));
                      }
                    }}
                    onBlur={() => handleBlur("password", password)}
                  />
                  <button type="button" className="eye-button" onClick={() => setShowPassword((v) => !v)}>
                    {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.password && errors.password && (
                  <span className="field-error">{errors.password}</span>
                )}
              </div>

              <div className="form-group">
                <label>Sahkan Kata Laluan</label>
                <div className="password-field">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    autoComplete="new-password"
                    onChange={(e) => { setConfirmPassword(e.target.value); revalidate("confirmPassword", e.target.value); }}
                    onBlur={() => handleBlur("confirmPassword", confirmPassword)}
                  />
                  <button type="button" className="eye-button" onClick={() => setShowConfirmPassword((v) => !v)}>
                    {showConfirmPassword ? <EyeSlashIcon /> : <EyeIcon />}
                  </button>
                </div>
                {touched.confirmPassword && errors.confirmPassword && (
                  <span className="field-error">{errors.confirmPassword}</span>
                )}
              </div>

              {formError && <p className="login-error-msg">{formError}</p>}

              <button type="submit" className="login-btn" disabled={loading}>
                {loading ? "Mencipta Akaun..." : "Daftar"}
              </button>

              <button type="button" className="signup-btn" onClick={() => navigate("/login")}>
                Kembali ke Log Masuk
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
