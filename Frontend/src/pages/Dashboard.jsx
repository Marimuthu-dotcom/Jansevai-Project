import { useState, useContext } from "react";
import { useNavigate,useOutletContext } from "react-router-dom";
import styles from "../styles/Dashboard.module.css";
import notification from "../assets/notification-bell.png";
import { 
  ChevronDown, 
  ClipboardList, 
  RefreshCw, 
  Clock, 
  CheckCircle2,
  MapPin,
  Droplets,
  ThumbsUp,
  MessageCircle,
  Flag,
  User,
  MoreVertical,
  ArrowRight,
  ShieldAlert,
  ChartPie,
  TrendingDown,
  TrendingUp
} from "lucide-react";
import water from "../assets/plumbing-maintenance.png";
import drainage from "../assets/pollution.png";
import road from "../assets/road.png";
import streetlight from "../assets/streetlight.png";
import garbage from "../assets/garbage.png"
import publicsafety from "../assets/public-safety.png";
import environment from "../assets/forest.png";
import fall from "../assets/fall.png"
import growth from "../assets/growth.png"
import stable from "../assets/minus.png"
import others from "../assets/other.png"
import { AuthContext } from "../context/CreateContext";
import StatusBadge from "../components/StatusBadge";
import styles1 from "../styles/RecentComplaints.module.css";
import styles2 from "../styles/Complaint.module.css";
import styles3 from "../styles/Categories.module.css";
import PriorityBadge from "../components/PriorityBadge.jsx"

function Dashboard() {

  const [showDropdown, setShowDropdown] = useState(false);
  const { user, complaints, loading, trends, statusDiff, statusPercentages, statusCounts, notifications, categoryStats } = useContext(AuthContext);
  const categoryMap = {};
  const { handleLogout } = useOutletContext();

  (categoryStats?.categories || []).forEach((cat) => {
    categoryMap[cat.name] = {
      priority: cat.currentPercent,
      trend: cat.trend,
      diff: cat.diff
    };
  });
  const navigate = useNavigate();

  const notificationsCount = notifications.filter((n) => !n.is_read).length || 0;
  const recentComplaints = complaints?.filter((complaint) => {
    const complaintDate = complaint.created_at.slice(0, 10);
    const today = new Date();
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(today.getDate() - 7);
    return complaintDate >= twoDaysAgo.toISOString().slice(0, 10);
  });

  const getTimeAgo = (createdAt) => {
    const now = new Date();
    const created = new Date(createdAt);
    const diffMs = now - created;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor(
      (diffMs % (1000 * 60 * 60)) / (1000 * 60)
    );
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const formatDate = (createdAt) => {
    const date = new Date(createdAt);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const totalComplaints = statusCounts?.total ?? complaints?.length ?? 0;
  const pendingCount = statusCounts?.pending ?? complaints?.filter(c => c.status === "Pending").length ?? 0;
  const inProgressCount = statusCounts?.inProgress ?? complaints?.filter(c => c.status === "In Progress").length ?? 0;
  const resolvedCount = statusCounts?.resolved ?? complaints?.filter(c => c.status === "Resolved").length ?? 0;

  const getCount = (category) => {
    return complaints?.filter(
      c => c.category?.trim().toLowerCase().includes(category.trim().toLowerCase())
    ).length || 0;
  };

  const getDiffLabel = (val, per) => {
    if (val === undefined || val === null || val === 0)
      return (
        <span className={styles.trendText} style={{ color: "#6b7280" }}>
          — {per !== undefined && per !== null ? `${per}%` : "0%"}
        </span>
      );
    if (val > 0)
      return (<span className={styles.trendText} style={{ color: "#16a34a" }}><span style={{ color: "#16a34a" }}>↑</span> {per}%</span>);
    return (<span className={styles.trendText} style={{ color: "#dc2626" }}><span style={{ color: "#dc2626" }}>↓</span> {per}%</span>);
  };

  const statusCards = [
    {
      title: "Total Complaints",
      count: totalComplaints,
      diffKey: null,
      percent: null,
      icon: ClipboardList,
      iconBg: "#dc262620",
      iconColor: "#dc2626",
      countColor: "#dc2626"
    },
    {
      title: "In Progress",
      count: inProgressCount,
      diffKey: statusDiff?.inProgress,
      percent: statusPercentages?.inProgress,
      icon: RefreshCw,
      iconBg: "#2563eb20",
      iconColor: "#2563eb",
      countColor: "#2563eb"
    },
    {
      title: "Pending",
      count: pendingCount,
      diffKey: statusDiff?.pending,
      percent: statusPercentages?.pending,
      icon: Clock,
      iconBg: "#d9770620",
      iconColor: "#d97706",
      countColor: "#d97706"
    },
    {
      title: "Resolved",
      count: resolvedCount,
      diffKey: statusDiff?.resolved,
      percent: statusPercentages?.resolved,
      icon: CheckCircle2,
      iconBg: "#16a34a20",
      iconColor: "#16a34a",
      countColor: "#16a34a"
    },
  ];

  const reportCards = [
    { title: "Water Supply", image: water, border: "rgb(22, 131, 232)" },
    { title: "Street Lights", image: streetlight, border: "rgb(242, 230, 7)" },
    { title: "Roads & Streets", image: road, border: "black" },
    { title: "Drainage", image: drainage, border: "rgb(165, 164, 164)" },
    { title: "Garbage", image: garbage, border: "rgb(151, 238, 114)" },
    { title: "Public Safety", image: publicsafety, border: "rgb(240, 12, 12)" },
    { title: "Environment", image: environment, border: "rgb(12, 236, 61)" },
    { title: "Others", image: others, border: "rgb(189, 134, 6)" }
  ];

  return (
    <div className={styles.mainDashboard}>
      <div className={styles.dashboardHeader}>
          <h2 className={styles.pageTitle}>Dashboard</h2>

        <div className={styles.profileDiv}>
          <div className={styles.notificationDiv} onClick={(e) => { e.stopPropagation(); navigate("/notification") }}>
            <img src={notification} alt="" />
            {notificationsCount > 0 && (
              <span className={styles.notificationBadge}>
                {notificationsCount}
              </span>
            )}
          </div>

          <div className={styles.profileContainer} onClick={(e) => { e.stopPropagation(); setShowDropdown(!showDropdown) }}>
            <div className={styles.profiles}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles.profileName}>{user?.username?.toUpperCase()}</div>
              <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color: "gray", fontWeight: "500" }}>User</div>
            </div>
            {showDropdown && (
              <div className={styles.dropdownBox}>
                <div className={styles.dropdownEmail}>
                  {user?.email}
                </div>

                <button
                  className={styles.logoutBtn}
                  onClick={() => {
                    handleLogout();
                  }}
                >
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className={styles.mainDiv}>
        <div className={styles.welcomeSection}>
          <p>
            Manage and track public complaints efficiently
            from one centralized dashboard.
          </p>
        </div>

        {/* ====== STATUS CARDS - NEW DESIGN ====== */}
        <div className={styles.statusCardContainer}>
          {statusCards.map((card, i) => {
            const IconComponent = card.icon;
            return (
              <div key={i} className={styles.statusCard}>
                <div className={styles.statusCardContent}>
                  <div
                    className={styles.statusCardIcon}
                    style={{ backgroundColor: card.iconBg }}
                  >
                    <IconComponent size={22} color={card.iconColor} strokeWidth={2} />
                  </div>
                  <div className={styles.statusCardInfo}>
                    <p className={styles.statusCardTitle}>{card.title}</p>
                    <p
                      className={styles.statusCardCount}
                      style={{ color: card.countColor }}
                    >
                      {card.count.toLocaleString()}
                    </p>
                    {card.title === "Total Complaints" ? (
                      <span className={styles.trendText} style={{ color: "#6b7280" }}>
                        — 0%
                      </span>
                    ) : (
                      getDiffLabel(card.diffKey, card.percent)
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* ====== RECENT COMPLAINTS - NEW DESIGN ====== */}
        <div className={styles.recentComplaintsWrapper}>
          <div className={styles.recentComplaintsHeader}>
            <span className={styles.recentComplaintsTitle}>Recent Complaints</span>
            <button
              className={styles.viewAllBtn}
              onClick={() => navigate("/recent-complaints", {
                state: { complaints: recentComplaints }
              })}
            >
              View All <ArrowRight size={16} />
            </button>
          </div>

          {loading ? (
            <div className={styles2.loadingContainer}>
              <div className={styles2.spinner} />
            </div>
          ) : (
            <div className={styles.recentComplaintsList}>
              {recentComplaints?.length > 0 ? (
                recentComplaints.map((c, i) => (
                  <div key={i} className={styles.recentComplaintCard}>
                    {/* Left: Image */}
                    <div className={styles.recentComplaintImage}>
                      {c.image_url ? (
                        <img src={c.image_url} alt="Complaint" />
                      ) : (
                        <div className={styles.recentComplaintImgPlaceholder}>
                          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <rect x="3" y="3" width="18" height="18" rx="3" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <polyline points="21 15 16 10 5 21" />
                          </svg>
                        </div>
                      )}
                    </div>

                    {/* Middle: Content */}
                    <div className={styles.recentComplaintBody}>
                      <div className={styles.recentComplaintTop}>
                        <h3 className={styles.recentComplaintTitle}>{c.title}</h3>
                        <div className={styles.recentComplaintMeta}>
                          <span className={styles.recentComplaintLocation}>
                            <MapPin size={14} color="#9ca3af" />
                            {c.location}
                          </span>
                        </div>
                        <div className={styles.recentComplaintBadges}>
                          <span className={styles.categoryBadge}>
                            <Droplets size={14} color="#3b82f6" />
                            {c.category}
                          </span>
                          <span className={`${styles.idBadge} ${styles.ward}`}>Ward: {c.wardNo}</span>
                          <span className={styles.idBadge}>ID: #{c.id}</span>
                        </div>
                      </div>

                      <div className={styles.recentComplaintStats}>
                        <div className={styles.statItem}>
                          <span className={styles.icons}><ThumbsUp size={18} color="#16a34a" /></span>
                          <span className={styles.statValue}>{c.support_count || 0}</span>
                          <span className={styles.statLabel}>Supports</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.icons}><MessageCircle size={16} color="#6b7280" /></span>
                          <span className={styles.statValue}>{c.comments_count || 0}</span>
                          <span className={styles.statLabel}>Comments</span>
                        </div>
                        <div className={styles.statItem}>
                          <span className={styles.icons}><User size={16} color="#7c3aed" /></span>
                          <span className={styles.statValue}>{c.username || "Unassigned"}</span>
                          <span className={styles.statLabel}>Assigned To</span>
                        </div>
                        
                      </div>
                    </div>

                    {/* Right: Status + Menu */}
                    <div className={styles.recentComplaintRight}>
                      <div className={styles.statusBadgeNew}>
                        <Clock size={14} />
                        {c.status}
                      </div>
                     <div className={styles.statItemTime}>
                          <div style={{ paddingBottom:"5px"}}><Clock size={14} color="#9ca3af" /></div>
                          <div className={styles.timeGroup}>
                            <span className={styles.timeAgo}>{getTimeAgo(c.created_at)} ago</span>
                            <span className={styles.timeDate}>{formatDate(c.created_at)}</span>
                          </div>
                        </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className={styles1.emptyState}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                  <p>No recent complaints found.</p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.complaintsReportsBox}>
          <div className={styles.stateBar} style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", fontWeight: "500" }}>
            <div>Trending Issue</div>
            <div className={styles.stateMeaning}>
              <span className={styles.icon} >
                <span className={styles.iconImg}><img src={growth} alt="" /></span>{" Increment"}
              </span>
              <span className={styles.icon}>
                <span className={styles.iconImg}><img src={fall} alt="" /></span>{" Decrement"}
              </span>
              <span className={styles.icon}>
                <span className={styles.iconImg} ><img src={stable} alt="" /></span>{" Stable"}
              </span>
            </div>
          </div>

          <div className={styles.complaintsReportsList}>
            {reportCards.map((card, index) => {
              const catData = categoryMap[card.title] || {
                priority: 0,
                trend: "stable",
                diff: 0
              };
              const percent = totalComplaints > 0 ? Math.round((getCount(card.title) / totalComplaints) * 100) : 0;
              return (
                <div
                  key={index}
                  className={styles.reportsItem}
                  style={{ borderLeft: `5px solid ${card.border}` }}
                >
                  <div className={styles.reports}>
                    <span className={styles.stateIcon}>{
                      trends[card.title] === "up" ? <span className={styles.icon}>
                        <span className={`${styles.iconImg} ${styles.up}`}><img src={growth} alt="" />
                        </span>
                      </span>
                        : trends[card.title] === "down" ?
                          <span className={styles.icon}>
                            <span className={`${styles.iconImg} ${styles.down}`}><img src={fall} alt="" /></span>
                          </span> :
                          <span className={styles.icon}>
                            <span className={`${styles.iconImg} ${styles.stable}`}><img src={stable} alt="" /></span>
                          </span>
                    }</span>
                    <div style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: "6px",
                      marginTop: "10px",
                    }}>
                      <div style={{ width: "50px", height: "50px" }}>
                        <img src={card.image} alt={card.title} />
                      </div>
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "6px",
                        marginTop: "15px"
                      }}>
                        <h2 style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          fontWeight: "700",
                          fontSize: "17px",
                          color: "rgb(34,65,76)"
                        }}>
                          {card.title}
                        </h2>
                        <p style={{
                          fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
                          fontSize: "14px",
                          fontWeight: "500",
                          color: "gray"
                        }}>
                          {getCount(card.title)} Complaints
                        </p>
                      </div>
                    </div>
                    <div className={styles.moreDetails}>
                      <div className={styles.status}><span className={styles.iconSize}><ShieldAlert /></span>Priority : <span><PriorityBadge percent={catData.priority} /></span></div>
                      <div className={styles.status}><span className={styles.iconSize}><ChartPie /></span>Percentage : <span>{`${catData.priority}%`}</span></div>
                      <div className={styles.status}><span className={styles.iconSize}><TrendingUp /></span>Trend : <span style={{
                        color: catData.trend === "up" ? "#16a34a" : "#e02020",
                        fontWeight: 700,
                        fontSize: 13,
                      }}>{catData.trend === "up" ? "▲" : "▼"} {catData.diff}</span></div>
                    </div>
                  </div>
                  <div className={styles.progressBarBg}>
                    <div
                      className={styles.progressBarFill}
                      style={{ width: `${percent}%`, backgroundColor: card.border }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard;

