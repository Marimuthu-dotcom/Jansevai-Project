// components/ConfirmDialog.jsx
import styles from "../styles/ConfirmDialog.module.css";
import Delete from "../assets/delete.png";

function ConfirmDialog({ message, onConfirm, onCancel ,confirmClosing}) {
  return (
    <div className={styles.overlay}>
      <div className={`${styles.dialog} ${confirmClosing ? styles.dropdownOut : styles.dropdownIn}`}
      onClick={(e) => e.stopPropagation()}>
        {/* Icon */}
        <div className={styles.iconWrapper}>
          <img src={Delete} alt="Delete" />
        </div>

        <h3 className={styles.title}>Delete Complaint</h3>
        <p className={styles.message}>{message}</p>

        <div className={styles.btnRow}>
          <button className={styles.cancelBtn} onClick={onCancel}>
            Cancel
          </button>
          <button className={styles.confirmBtn} onClick={onConfirm}>
            Delete
          </button>
        </div>

      </div>
    </div>
  );
}

export default ConfirmDialog;