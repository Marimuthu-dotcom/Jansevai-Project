import styles from "../styles/Complaint.module.css";
function StatusBadge({ status }) {
  const cls =
    status === "Pending"     ? styles.badgePending :
    status === "In Progress" ? styles.badgeInProgress :
                               styles.badgeResolved;
  return <span className={`${styles.badge} ${cls}`}>{status}</span>;
}

export default StatusBadge;