import styles from "../styles/Categories.module.css";
function PriorityBadge({ priority }) {
  const cls =
    priority === "High"   ? styles.badgeHigh :
    priority === "Medium" ? styles.badgeMedium :
                            styles.badgeLow;
  return <span className={`${styles.statusBadge} ${cls}`}>{priority}</span>;
}

export default PriorityBadge;