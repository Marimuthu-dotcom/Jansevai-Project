import styles from "../styles/Categories.module.css";
function CategoryCard({ cat, total }) {
  const percent = Math.round((cat.count / total) * 100);

  return (
    <div
      className={styles.categoryCard}
      style={{ "--accent": cat.accent, "--iconBg": cat.iconBg ,animationDelay: `${cat.id * 0.05}s`}}
    >
      {/* Top Row — Icon + Change */}
      <div className={styles.cardTop}>
        <div className={styles.iconBox}>{cat.icon}</div>
        <span className={`${styles.changeChip} ${cat.trend === "up" ? styles.up : styles.down}`}>
          {cat.trend === "up" ? "▲" : "▼"} {cat.change}
        </span>
      </div>

      {/* Name */}
      <p className={styles.categoryName}>{cat.name}</p>

      {/* Count */}
      <div className={styles.complaintCount}>{cat.count}</div>
      <div className={styles.countLabel}>Complaints</div>

      {/* Progress Bar */}
      <div className={styles.progressBarBg}>
        <div
          className={styles.progressBarFill}
          style={{ width: `${percent||0}%` }}
        />
      </div>
    </div>
  );
}

export default CategoryCard;