import { useRef, useState ,useContext} from "react";
import styles from "../styles/OtpPage.module.css";
import axios from "axios";
import { Eye, EyeOff } from "lucide-react";
import { AuthContext } from "../context/AuthContext";

function OtpPage({loginClose,token ,setMessage,setMessageType}) {

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
 const [showPasswordBox, setShowPasswordBox] = useState(() => {
  return sessionStorage.getItem("showPasswordBox") === "true";
});
  const { login } = useContext(AuthContext);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordData, setPasswordData] = useState({
                                          password: "",
                                          confirmPassword: ""
                                          });

  const [loading, setLoading] = useState(false);

  const [success, setSuccess] = useState(false);

  const inputRefs = useRef([]);

  const handleChange = (value, index) => {
    // only numbers
    if (!/^\d*$/.test(value)) 
        return;

    const newOtp = [...otp];
    newOtp[index] = value;

    setOtp(newOtp);


    // move to next input
    if (value && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (e, index) => {
    // move back on backspace
    if (
      e.key === "Backspace" &&
      !otp[index] &&
      index > 0
    ) {
      inputRefs.current[index - 1].focus();
    }
  };

  const handlePasswordChange = (e) => {

    setPasswordData({
      ...passwordData,
      [e.target.name]: e.target.value
    });

  };

  const handleSubmit = async(e) => {
    e.preventDefault();

    const finalOtp = otp.join("");

    try {

    const response = await axios.post(
      `${api}/api/auth/verify-otp`,
      {
        otp: finalOtp
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    console.log(response.data);

    setMessage("Proceed");

    setMessageType("success");

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);


    setShowPasswordBox(true);
    sessionStorage.setItem("showPasswordBox", "true");

  } 
  catch (error) {

    console.log(error);

    setMessage(
      error.response?.data?.message ||
      "Invalid OTP"
    );

    setMessageType("error");

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 3000);
  }


    console.log(finalOtp);
  };

  const handleSavePassword = async (e) => {

    e.preventDefault();

    try {

      setLoading(true);

      await axios.post(`${api}/api/auth/save-password`,{
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setLoading(false);
      setSuccess(true);

      setTimeout(()=>{
          loginClose(token);
          login(token);
      },3000);

      

    } 
    catch (error) {
    
      setLoading(false);
      setMessage("Password Does not Match");
      setMessageType("error");

      setTimeout(()=>{
          setMessage("");
          setMessageType("");
      },3000);

      console.log(error);

    }

  };

  const api = import.meta.env.VITE_API_URL;

  return (
    <div className={styles.otpContainer}>

      {loading && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
        </div>
      )}

      {success? (
        <div className={styles.successBox}>
          ✅ Account Created Successfully
        </div>):

  !showPasswordBox ?
      (
        <>
        <h2>Enter OTP</h2>
      <form onSubmit={handleSubmit}>
        <div className={styles.otpInputs}>

          {otp.map((digit, index) => (
            <input
              key={index}
              type="text"
              maxLength={1}
              value={digit}
              ref={(el) => (inputRefs.current[index] = el)}
              onChange={(e) =>
                handleChange(e.target.value, index)
              }
              onKeyDown={(e) =>
                handleKeyDown(e, index)
              }
            />
          ))}

        </div>

        <button type="submit">
          Verify OTP
        </button>

      </form>
      </>
      ) : (

        <>
          <h2>Create Password</h2>

          <form  onSubmit={handleSavePassword}>

            <div className={styles.inputBox}>

            <input
              type={showPassword ? "text" : "password"}
              name="password"
              value={passwordData.password}
              onChange={handlePasswordChange}
              required
            />

            <label>Password</label>

            <span
              className={styles.eyeIcon}
              onClick={() =>
                setShowPassword(!showPassword)
              }
            >
              {showPassword ? <Eye size={20} color="gray"/> : <EyeOff size={20} color="gray"/>}
            </span>

          </div>

          <div className={styles.inputBox}>

            <input
              type={showConfirmPassword ? "text" : "password"}
              name="confirmPassword"
              value={passwordData.confirmPassword}
              onChange={handlePasswordChange}
              required
            />

            <label>Confirm Password</label>

            <span
              className={styles.eyeIcon}
              onClick={() =>
                setShowConfirmPassword(!showConfirmPassword)
              }
            >
              {showConfirmPassword ? (
                <Eye size={20} color="gray" />
              ) : (
                <EyeOff size={20} color="gray" />
              )}
            </span>

          </div>

            <button
              type="submit"
            >
              Save Password
            </button>

          </form>
        </>

      )
    }

    </div>
  );
}

export default OtpPage;

