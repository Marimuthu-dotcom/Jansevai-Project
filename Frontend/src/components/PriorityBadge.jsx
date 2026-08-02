import styles from "../styles/Categories.module.css";
function PriorityBadge({percent}) {
  let priority;
  let cls;
  console.log(percent)

  if (percent >= 35 && percent <=100) {
    priority = "High";
    cls = styles.badgeHigh;
  }
  else if (percent >= 10 && percent <=34) {
    priority = "Medium";
    cls = styles.badgeMedium;
  }
  else {
    priority = "Low";
    cls = styles.badgeLow;
  }
  return <span className={`${styles.statusBadge} ${cls}`}>{priority}</span>;
}

export default PriorityBadge;