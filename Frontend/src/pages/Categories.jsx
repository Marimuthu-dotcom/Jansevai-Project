import styles1 from "../styles/Dashboard.module.css";
import styles from "../styles/Categories.module.css";
import PriorityBadge from "../components/PriorityBadge";
import CategoryCard from "../components/CategoryCard";
import {
  Droplets,
  Road,
  LeafyGreen
} from "lucide-react";

const CATEGORIES = [
  {
    id: 1,
    name: "Roads & Streets",
    count: 210,
    change: "+12%",
    trend: "up",
    accent: "#3b82f6",
    iconBg: "#eff6ff",
    priority: "High",
    icon:<Road />,
  },
  {
    id: 2,
    name: "Water Supply",
    count: 180,
    change: "+8%",
    trend: "up",
    accent: "#06b6d4",
    iconBg: "#ecfeff",
    priority: "High",
    icon: <Droplets />
  },
  {
    id: 3,
    name: "Garbage",
    count: 156,
    change: "-5%",
    trend: "down",
    accent: "#22c55e",
    iconBg: "#f0fdf4",
    priority: "Medium",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
  },
  {
    id: 4,
    name: "Street Lights",
    count: 134,
    change: "+3%",
    trend: "up",
    accent: "#f59e0b",
    iconBg: "#fffbeb",
    priority: "Medium",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="5" />
        <line x1="12" y1="1" x2="12" y2="3" />
        <line x1="12" y1="21" x2="12" y2="23" />
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
        <line x1="1" y1="12" x2="3" y2="12" />
        <line x1="21" y1="12" x2="23" y2="12" />
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
      </svg>
    ),
  },
  {
    id: 5,
    name: "Drainage",
    count: 120,
    change: "+4%",
    trend: "up",
    accent: "#8b5cf6",
    iconBg: "#f5f3ff",
    priority: "High",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 6,
    name: "Public Safety",
    count: 98,
    change: "-2%",
    trend: "down",
    accent: "#ef4444",
    iconBg: "#fef2f2",
    priority: "High",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  {
    id: 7,
    name: "Environment",
    count: 76,
    change: "+6%",
    trend: "up",
    accent: "#10b981",
    iconBg: "#ecfdf5",
    priority: "Low",
    icon: <LeafyGreen />
  },
  {
    id: 8,
    name: "Others",
    count: 94,
    change: "+1%",
    trend: "up",
    accent: "#6366f1",
    iconBg: "#eef2ff",
    priority: "Low",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
];

const TOTAL = CATEGORIES.reduce((sum, c) => sum + c.count, 0);

// ── Stats ──
const STATS = [
  { label: "Total Categories", value: "8",   change: null },
  { label: "Total Complaints", value: "1,248", change: "+12.5%", trend: "up" },
  { label: "Most Active",      value: "Roads", change: null },
  { label: "Resolved Rate",    value: "68%",  change: "+4.2%", trend: "up" },
];

// ── Priority Badge ──

// ── Category Card ─
// ── Main Component ──
function Categories() {
  return (
    <div className={`${styles1.categoriesContainer} ${styles.mainContainer}`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Categories</h1>
        <p className={styles.pageSubtitle}>Browse complaint categories and their statistics</p>
      </div>

      {/* Stats Row */}
      <div className={styles.statsRow}>
        {STATS.map((s, i) => (
          <div className={styles.statCard} key={i} style={{ animationDelay: `${i * 0.07}s` }}>
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
            {s.change && (
              <span className={`${styles.statChange} ${s.trend === "up" ? styles.up : styles.down}`}>
                {s.trend === "up" ? "▲" : "▼"} {s.change} from last month
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Category Cards */}
      <h2 className={styles.sectionTitle}>All Categories</h2>
      <div className={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} total={TOTAL}/>
        ))}
      </div>

      {/* Overview Table */}
      <div className={styles.overviewSection}>
        <h2 className={styles.overviewTitle}>Category Overview</h2>
        <table className={styles.overviewTable}>
          <thead>
            <tr>
              <th>Category</th>
              <th>Complaints</th>
              <th>Share</th>
              <th>Priority</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {CATEGORIES.map((cat) => {
              const percent = Math.round((cat.count / TOTAL) * 100);
              return (
                <tr key={cat.id}>
                  {/* Name */}
                  <td>
                    <div className={styles.dotLabel}>
                      <span className={styles.dot} style={{ background: cat.accent }} />
                      {cat.name}
                    </div>
                  </td>

                  {/* Count */}
                  <td>
                    <div className={styles.tableBar}>
                      <div className={styles.tableBarBg}>
                        <div
                          className={styles.tableBarFill}
                          style={{ width: `${percent}%`, background: cat.accent }}
                        />
                      </div>
                      <span className={styles.tableCount}>{cat.count}</span>
                    </div>
                  </td>

                  {/* Share % */}
                  <td>{percent}%</td>

                  {/* Priority */}
                  <td>
                    <PriorityBadge priority={cat.priority} />
                  </td>

                  {/* Trend */}
                  <td>
                    <span
                      style={{
                        color: cat.trend === "up" ? "#16a34a" : "#e02020",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {cat.trend === "up" ? "▲" : "▼"} {cat.change}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
}

export default Categories;