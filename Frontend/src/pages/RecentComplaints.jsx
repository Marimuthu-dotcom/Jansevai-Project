import { useLocation, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/CreateContext";
import StatusBadge from "../components/StatusBadge";
import styles from "../styles/RecentComplaints.module.css";

function RecentComplaints() {
  const location = useLocation();
  const navigate  = useNavigate();
  const { complaints } = useContext(AuthContext);

  // ✅ Dashboard-லிருந்து pass ஆன complaints எடு
  // இல்லன்னா AuthContext-லிருந்து எடு
  const data = location.state?.complaints || complaints || [];

  const getTimeAgo = (createdAt) => {
    const now     = new Date();
    const created = new Date(createdAt);
    const diffMs  = now - created;
    const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0)  return `${days}d ${hours}h ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

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
        <h1 className={styles.pageTitle}>Recent Complaints</h1>
        <p className={styles.pageSubtitle}>
          {data.length} complaint{data.length !== 1 ? "s" : ""} from last 2 days
        </p>
      </div>

      {/* Complaint List */}
      <div className={styles.complaintList}>
        {data.length > 0 ? (
          data.map((c, i) => (
            <div
              key={i}
              className={styles.complaintCard}
              onClick={() => navigate(`/complaint/${c.id}`)}
            >
              {/* Image */}
              <div className={styles.complaintImage}>
                {c.image_url ? (
                  <img src={c.image_url} alt={c.title} />
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
              <div className={styles.complaintInfo}>
                <div className={styles.complaintTitle}>{c.title}</div>
                <div className={styles.complaintMeta}>
                  {/* Location */}
                  {c.location && (
                    <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                        <circle cx="12" cy="9" r="2.5" />
                      </svg>
                      {c.location}
                    </span>
                  )}
                  {/* Time */}
                  <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {getTimeAgo(c.created_at)}
                  </span>
                </div>
              </div>

              {/* Status Badge */}
              <StatusBadge status={c.status} />
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>No recent complaints found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecentComplaints;