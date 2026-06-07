import { useLocation, useNavigate } from "react-router-dom";
import styles from "../styles/CommunityUpdates.module.css";
import roadCleaning from "../assets/roadCleaning.jfif";
import drainageCleaning from "../assets/drainageCleaning.jfif";

// ✅ Static community updates — same as dashboard
// Later DB-லிருந்து வரும்
const STATIC_UPDATES = [
  {
    id: 1,
    title: "Clean City Drive on 20th May",
    desc: "John Handle for a Cleaning Tomorrow",
    image: null,
    date: "May 20, 2026",
  },
  {
    id: 2,
    title: "Road Cleaning Initiative",
    desc: "Community volunteers gather for road cleaning",
    image: roadCleaning,
    date: "May 22, 2026",
  },
  {
    id: 3,
    title: "Drainage Maintenance Drive",
    desc: "Local drainage cleanup organized by residents",
    image: drainageCleaning,
    date: "May 24, 2026",
  },
];

function CommunityUpdates() {
  const location = useLocation();
  const navigate  = useNavigate();

  // ✅ Dashboard-லிருந்து pass ஆன updates எடு
  // இல்லன்னா static data use பண்றோம்
  const updates = location.state?.updates || STATIC_UPDATES;

  return (
    <div className={styles.mainContainer}>

      {/* Back Button */}
      <button className={styles.backBtn} onClick={() => navigate("/dashboard")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Dashboard
      </button>

      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>Community Updates</h1>
        <p className={styles.pageSubtitle}>
          {updates.length} update{updates.length !== 1 ? "s" : ""} available
        </p>
      </div>

      {/* Updates List */}
      <div className={styles.updateList}>
        {updates.length > 0 ? (
          updates.map((u) => (
            <div key={u.id} className={styles.updateCard}>

              {/* Image */}
              <div className={styles.updateImage}>
                {u.image ? (
                  <img src={u.image} alt={u.title} />
                ) : (
                  <div className={styles.imgPlaceholder}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="3" />
                      <circle cx="8.5" cy="8.5" r="1.5" />
                      <polyline points="21 15 16 10 5 21" />
                    </svg>
                  </div>
                )}
              </div>

              {/* Info */}
              <div className={styles.updateInfo}>
                <div className={styles.updateTitle}>{u.title}</div>
                <div className={styles.updateDesc}>{u.desc}</div>
                {u.date && (
                  <div className={styles.updateDate}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8"  y1="2" x2="8"  y2="6" />
                      <line x1="3"  y1="10" x2="21" y2="10" />
                    </svg>
                    {u.date}
                  </div>
                )}
              </div>

            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <p>No community updates found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default CommunityUpdates;