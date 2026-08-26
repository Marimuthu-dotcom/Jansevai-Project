import { useState, useEffect, useContext } from "react";
import logo from "../assets/admin.png";
import styles from "../styles/LoginPage.module.css";
import OtpPage from "../components/OtpPage";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../context/CreateContext";
import styles1 from "../styles/OtpPage.module.css";
import { GoogleLogin } from "@react-oauth/google";
import SuccessAnimation from "../components/SuccessAnimation"; // We'll create this

function LoginPage({ loginClose, closing }) {
  const [message, setMessage] = useState("");
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [messageType, setMessageType] = useState("");
  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || "";
  });
  const [showOtp, setShowOtp] = useState(() => {
    return sessionStorage.getItem("showOtp") === "true";
  });
  const [isLogin, setIsLogin] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    phone: ""
  });
  const [loginData, setLoginData] = useState({
    userId: "",
    password: ""
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showGoogle,setShowGoogle] = useState(true);

  const api = import.meta.env.VITE_API_URL;

  const handleChange = (e, setState, state) => {
    setState({
      ...state,
      [e.target.name]: e.target.value
    });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const res = await axios.post(`${api}/api/auth/login`, loginData);
      const token = res.data.token;
      setLoading(false);
      setSuccess(true);
      setTimeout(() => {
        loginClose(token);
        login(token);
        setSuccess(false);
      }, 2500);
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Login Failed");
      setMessageType("error");
      setTimeout(() => { setMessage(""); setMessageType(""); }, 2000);
    }
  };

  const handleGoogleLogin = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post(`${api}/api/auth/google-login`,
        { token: credentialResponse.credential },
        { withCredentials: true });
      const { accessToken } = res.data;

      setLoading(false);
      setSuccess(true);
      setShowGoogle(false);
      setTimeout(() => {
        loginClose(accessToken);
        login(accessToken);
        // setSuccess(false);
      }, 2500);
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Google Login Failed");
      setMessageType("error");
      setTimeout(() => { setMessage(""); setMessageType(""); }, 2000);
    }
  };

  const handleGoogleSignUp = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post(`${api}/api/auth/google-signup`,
        { token: credentialResponse.credential },
        { withCredentials: true });
      const { accessToken } = res.data;

      setLoading(false);
      setSuccess(true);
      setShowGoogle(false);
      setTimeout(() => {
        loginClose(accessToken);
        login(accessToken);
        // setSuccess(false);
      }, 2500);
    } catch (err) {
      setLoading(false);
      setMessage(err.response?.data?.message || "Google SignUp Failed");
      setMessageType("error");
      setTimeout(() => { setMessage(""); setMessageType(""); }, 2000);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${api}/api/auth/register`, formData);
      const token = response.data.token;
      setToken(token);
      localStorage.setItem("token", token);

      setMessage("Proceed");
      setMessageType("success");
      setShowOtp(true);
      sessionStorage.setItem("showOtp", "true");

      setTimeout(() => { setMessage(""); setMessageType(""); }, 2000);
    } catch (error) {
      setMessage(error.response?.data?.message || "Something went wrong");
      setMessageType("error");
      setTimeout(() => { setMessage(""); setMessageType(""); }, 2000);
    }
  };

  useEffect(() => {
    const otpState = sessionStorage.getItem("showOtp") === "true";
    setShowOtp(otpState);
  }, []);

  const handleGoogleSuccess = (credentialResponse) => {
    if (isLogin) {
      handleGoogleLogin(credentialResponse);
    } else {
      handleGoogleSignUp(credentialResponse);
    }
  };

  return (
    <div className={`${styles.loginOverlay} ${closing ? styles.overlayOut : styles.overlayIn}`}>
      <div className={`${styles.loginBox} ${closing ? styles.boxOut : styles.boxIn}`}>
        <div className={styles.logoSection}>
          <span className={styles.logo}>
            <img src={logo} alt="Logo" />
          </span>
          <span>
            <h2 className={styles.websiteName}>JanSeva</h2>
          </span>
        </div>
        <div className={styles.registerForm}>
          {loading && (
            <div className={styles1.loadingOverlay}>
              <div className={styles1.spinner}></div>
            </div>
          )}

          {success ? (
            <SuccessAnimation />
          ) : showOtp ? (
            <OtpPage 
              loginClose={loginClose} 
              token={token} 
              setMessage={setMessage} 
              setMessageType={setMessageType} 
              closing={closing}
            />
          ) : !isLogin ? (
            <>
              <h2>Create Account</h2>
              <form className={styles.form} autoComplete="off" onSubmit={handleSubmit}>
                <div className={styles.inputGroup}>
                  <label>Username</label>
                  <input
                    type="text"
                    placeholder="Enter username"
                    autoComplete="new-password"
                    name="username"
                    value={formData.username}
                    onChange={(e) => handleChange(e, setFormData, formData)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    autoComplete="new-password"
                    name="email"
                    value={formData.email}
                    onChange={(e) => handleChange(e, setFormData, formData)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Phone Number</label>
                  <input
                    type="tel"
                    placeholder="Enter phone number"
                    maxLength={10}
                    onInput={(e) => {
                      e.target.value = e.target.value.replace(/\D/g, "");
                    }}
                    name="phone"
                    value={formData.phone}
                    onChange={(e) => handleChange(e, setFormData, formData)}
                  />
                </div>

                <button type="submit" className={styles.createBtn}>
                  Create Account
                </button>
              </form>
              <p>
                Already have an account?
                <span onClick={() => setIsLogin(true)}> Login</span>
              </p>
            </>
          ) : (
            <>
              <h2>Login</h2>
              <form className={styles.form} autoComplete="off" onSubmit={handleLogin}>
                <div className={styles.inputGroup}>
                  <label>Email</label>
                  <input
                    type="email"
                    placeholder="Enter email"
                    autoComplete="off"
                    name="userId"
                    value={loginData.userId}
                    onChange={(e) => handleChange(e, setLoginData, loginData)}
                  />
                </div>

                <div className={styles.inputGroup}>
                  <label>Password</label>
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter password"
                    autoComplete="new-password"
                    name="password"
                    value={loginData.password}
                    onChange={(e) => handleChange(e, setLoginData, loginData)}
                  />
                  <span
                    className={styles.eyeIcon}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <Eye size={25} color="gray" /> : <EyeOff size={25} color="gray" />}
                  </span>
                </div>
                <button type="submit" className={styles.createBtn}>
                  Login
                </button>
              </form>
              <p>
                Don't have an account?
                <span onClick={() => setIsLogin(false)}> Register</span>
              </p>
            </>
          )}
          {showGoogle && (<div className={styles.divider}>
            <span>OR</span>
          </div>)}

          {showGoogle && (<GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={() => setMessage("Google Authentication Failed")}
          />)}
        </div>
      </div>
      {message && messageType === "error" && (
        <div className={styles.errorMessage}>{message}</div>
      )}
    </div>
  );
}

export default LoginPage;