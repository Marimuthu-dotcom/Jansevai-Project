import { useContext } from "react";
import styles1 from "../styles/Dashboard.module.css";
import styles from "../styles/Categories.module.css";
import PriorityBadge from "../components/PriorityBadge";
import CategoryCard from "../components/CategoryCard";
import { Droplets, Road, LeafyGreen } from "lucide-react";
import { AuthContext } from "../context/CreateContext";

const CATEGORY_CONFIG = {
  "Roads & Streets": {
    accent: "black",
    iconBg: "#eff6ff",
    icon: <Road />,
  },
  "Water Supply": {
    accent: "rgb(22, 131, 232)",
    iconBg: "#ecfeff",
    icon: <Droplets />,
  },
  "Garbage": {
    accent: "rgb(151, 238, 114)",
    iconBg: "#f0fdf4",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <polyline points="3 6 5 6 21 6" />
        <path d="M19 6l-1 14H6L5 6" />
        <path d="M10 11v6M14 11v6" />
        <path d="M9 6V4h6v2" />
      </svg>
    ),
  },
  "Street Lights": {
    accent: "rgb(242, 230, 7)",
    iconBg: "#fffbeb",
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
  "Drainage": {
    accent: "rgb(165, 164, 164)",
    iconBg: "#f5f3ff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  "Public Safety": {
    accent: "rgb(240, 12, 12)",
    iconBg: "#fef2f2",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
      </svg>
    ),
  },
  "Environment": {
    accent: "rgb(12, 236, 61)",
    iconBg: "#ecfdf5",
    icon: <LeafyGreen />,
  },
  "Others": {
    accent: "rgb(189, 134, 6)",
    iconBg: "#eef2ff",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="1" />
        <circle cx="19" cy="12" r="1" />
        <circle cx="5" cy="12" r="1" />
      </svg>
    ),
  },
};

function Categories() {
  const { categoryStats, loading } = useContext(AuthContext);

  if (loading || !categoryStats) {
    return <div className={styles.loading}> Loading categories...</div>;
  }
 
  const { total, resolvedRate, mostActive, categories ,resolvedDiff ,resolvedTrend ,complaintDiff,complaintTrend} = categoryStats;

  console.log(categories);

  const CATEGORIES = categories.map((cat, i) => 
{
  const config = CATEGORY_CONFIG[cat.name] || CATEGORY_CONFIG["Others"];

  return {
    id:     i + 1,
    name:   cat.name,         
    count:  cat.count,
    trend:  cat.trend,
    change: `${cat.currentPercent ?? 0}%`, 
    diff : `${cat.diff < 0 ? `${"-"+" "+Math.abs(cat.diff)}`:`${"+"+" "+cat.diff}`}`,
    ...config,
  };
});

  // Total for percentage calculations
  const TOTAL = total;

  // ── Top 4 Stats Cards ──
  const STATS = [
    {
      label: "Total Categories",
      value: categories.length.toString(),
      change: null,
      trend: null
    },
    {
      label: "Total Complaints",
      value: total.toLocaleString(),
      change:complaintTrend ? `${Math.round(Math.abs(complaintDiff))}` : null,
      trend: complaintTrend
    },
    {
      label: "Most Active",
      value: mostActive,
      change: null,
      trend: null
    },
    {
      label: "Resolved Rate",
      value: `${resolvedRate}%`,
      change: resolvedTrend ? `${Math.abs(resolvedDiff).toFixed(1)}%` : null,
      trend: resolvedTrend
    },
  ];

  return (
    <div className={`${styles1.categoriesContainer} ${styles.mainContainer}`}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Categories</h1>
        <p className={styles.pageSubtitle}>
          Browse complaint categories and their statistics
        </p>
      </div>

      <div className={styles.statsRow}>
        {STATS.map((s, i) => (
          <div
            className={styles.statCard}
            key={i}
            style={{ animationDelay: `${i * 0.07}s` }}
          >
            <span className={styles.statLabel}>{s.label}</span>
            <span className={styles.statValue}>{s.value}</span>
            {s.change && (
              <span
                className={`${styles.statChange} ${
                  s.trend === "up" ? styles.up : styles.down
                }`}
              >
                {s.trend === "up" ? "▲" : "▼"} {s.change}
              </span>
            )
            }
          </div>
        ))}
      </div>

      <h2 className={styles.sectionTitle}>All Categories</h2>
      <div className={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <CategoryCard key={cat.id} cat={cat} total={TOTAL} />
        ))}
      </div>

      {/* ── Overview Table ── */}
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
              // ✅ Share % = (category count / total complaints) * 100
              const percent = TOTAL > 0
                ? Math.round((cat.count / TOTAL) * 100)
                : 0;

              return (
                <tr key={cat.id}>
                  <td>
                    <div className={styles.dotLabel}>
                      <span
                        className={styles.dot}
                        style={{ background: cat.accent }}
                      />
                      {cat.name}
                    </div>
                  </td>
                  <td>
                    <div className={styles.tableBar}>
                      <div className={styles.tableBarBg}>
                        <div
                          className={styles.tableBarFill}
                          style={{
                            width: `${percent||0}%`,
                            background: cat.accent,
                          }}
                        />
                      </div>
                      <span className={styles.tableCount}>{cat.count||0}</span>
                    </div>
                  </td>
                  <td>{percent || 0}%</td>
                  <td>
                    <PriorityBadge percent={percent}/>
                  </td>
                  <td>
                    <span
                      style={{
                        color: cat.trend === "up" ? "#16a34a" : "#e02020",
                        fontWeight: 700,
                        fontSize: 13,
                      }}
                    >
                      {cat.trend === "up" ? "▲" : "▼"} {cat.diff}
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
