// components/WarningToast.jsx
import styles from "../styles/WarningToast.module.css";
import warning from "../assets/crisis.png";

function WarningToast({ message, onClose }) {
  return (
    <div className={styles.toast}>
      <div className={styles.iconWrapper}>
        <img src={warning} alt="Warning" />
      </div>
      <span className={styles.message}>{message}</span>
      <button className={styles.closeBtn} onClick={onClose}>✕</button>
    </div>
  );
}

export default WarningToast;