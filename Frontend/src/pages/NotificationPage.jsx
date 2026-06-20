import { useState, useMemo, useContext } from "react"; // ✅ useContext add
import axios from "axios";                              // ✅ axios add
import { useNavigate } from "react-router-dom";
import styles from "../styles/NotificationPage.module.css";
import { AuthContext } from "../context/CreateContext"; // ✅ add

// TYPE_STYLES — iconBg, iconColor map
const TYPE_STYLES = {
  complaint: { iconBg: "#e0f2fe", iconColor: "#0284c7", tagBg: "#e0f2fe", tagColor: "#0284c7" },
  status:    { iconBg: "#fff7ed", iconColor: "#ea580c", tagBg: "#fff7ed", tagColor: "#ea580c" },
  resolved:  { iconBg: "#dcfce7", iconColor: "#16a34a", tagBg: "#dcfce7", tagColor: "#16a34a" },
  support:   { iconBg: "#fdf4ff", iconColor: "#a855f7", tagBg: "#fdf4ff", tagColor: "#a855f7" },
  message:   { iconBg: "#eff6ff", iconColor: "#3b82f6", tagBg: "#eff6ff", tagColor: "#3b82f6" },
  member:    { iconBg: "#f0fdf4", iconColor: "#16a34a", tagBg: "#f0fdf4", tagColor: "#16a34a" },
  comment:   { iconBg: "#fff7ed", iconColor: "#ea580c", tagBg: "#fff7ed", tagColor: "#ea580c" },
};

const TABS = ["All", "Unread", "Complaint", "Status", "Message"];

// getTimeAgo helper
function getTimeAgo(createdAt) {
  const now     = new Date();
  const created = new Date(createdAt);
  const diffMs  = now - created;
  const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours   = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  if (days > 0)  return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return `${minutes}m ago`;
}

function NotifIcon({ type }) {
  const style = TYPE_STYLES[type] || TYPE_STYLES.complaint;
  const icons = {
    complaint: <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>,
    status:    <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>,
    resolved:  <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>,
    support:   <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3z"/></svg>,
    message:   <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
    member:    <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/></svg>,
    comment:   <svg viewBox="0 0 24 24" fill="none" stroke={style.iconColor} strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>,
  };
  return (
    <div className={styles.notifIcon} style={{ background: style.iconBg }}>
      {icons[type] || icons.complaint}
    </div>
  );
}

function NotificationPage() {
  const [activeTab, setActiveTab] = useState("All");
  const { notifications, setNotifications, token } = useContext(AuthContext); // ✅
  const api = import.meta.env.VITE_API_URL;

  // ✅ Mark single read
  const handleMarkRead = async (id, is_read) => {
    if (is_read) return; // already read — skip API call
    try {
      await axios.put(
        `${api}/api/auth/${id}/read`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ Mark all read
  const handleMarkAllRead = async () => {
    try {
      await axios.put(
        `${api}/api/auth/read-all`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.log(err);
    }
  };

  // ✅ is_read use பண்றோம்
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const filtered = useMemo(() => {
    if (activeTab === "All")    return notifications;
    if (activeTab === "Unread") return notifications.filter((n) => !n.is_read);
    return notifications.filter(
      (n) => n.type?.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab, notifications]);

  return (
    <div className={styles.mainContainer}>
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleBlock}>
          <h1 className={styles.pageTitle}>Notifications</h1>
          <p className={styles.pageSubtitle}>
            You have {unreadCount} unread notification{unreadCount !== 1 ? "s" : ""}
          </p>
        </div>
        {unreadCount > 0 && (
          <button className={styles.markAllBtn} onClick={handleMarkAllRead}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Mark all as read
          </button>
        )}
      </div>

      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            {tab === "Unread" && unreadCount > 0 && (
              <span className={styles.tabBadge}>{unreadCount}</span>
            )}
          </button>
        ))}
      </div>

      <div className={styles.notificationList}>
        {filtered.length > 0 ? (
          filtered.map((notif) => {
            const typeStyle = TYPE_STYLES[notif.type] || TYPE_STYLES.complaint;
            return (
              <div
                key={notif.id}
                className={`${styles.notifItem} ${!notif.is_read ? styles.unread : ""}`} // ✅ is_read
                onClick={() => handleMarkRead(notif.id, notif.is_read)}
              >
                {!notif.is_read && <div className={styles.unreadDot} />} {/* ✅ is_read */}

                <NotifIcon type={notif.type} />

                <div className={styles.notifContent}>
                  <div className={styles.notifTitle}>{notif.title}</div>
                  <div className={styles.notifDesc}>{notif.description}</div> {/* ✅ description */}
                  <div className={styles.notifMeta}>
                    <span className={styles.notifTime}>
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <polyline points="12 6 12 12 16 14"/>
                      </svg>
                      {getTimeAgo(notif.created_at)} {/* ✅ created_at */}
                    </span>
                    <span
                      className={styles.notifTag}
                      style={{ background: typeStyle.tagBg, color: typeStyle.tagColor }}
                    >
                      {notif.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <p>No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPage;