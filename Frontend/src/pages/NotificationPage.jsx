import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/NotificationPage.module.css";

const STATIC_NOTIFICATIONS = [
  {
    id: 1,
    title: "New complaint submitted",
    desc: "Water leakage on 5th Main Road has been reported.",
    time: "2h ago",
    category: "Complaint",
    type: "complaint",
    read: false,
    iconBg: "#e0f2fe",
    iconColor: "#0284c7",
    tagBg: "#e0f2fe",
    tagColor: "#0284c7",
  },
  {
    id: 2,
    title: "Status updated",
    desc: "Drainage overflow — BTM Layout is now In Progress.",
    time: "3h ago",
    category: "Status",
    type: "status",
    read: false,
    iconBg: "#fff7ed",
    iconColor: "#ea580c",
    tagBg: "#fff7ed",
    tagColor: "#ea580c",
  },
  {
    id: 3,
    title: "Complaint resolved",
    desc: "Pothole on 2nd Cross Road has been marked as Resolved.",
    time: "5h ago",
    category: "Resolved",
    type: "resolved",
    read: false,
    iconBg: "#dcfce7",
    iconColor: "#16a34a",
    tagBg: "#dcfce7",
    tagColor: "#16a34a",
  },
  {
    id: 4,
    title: "New support received",
    desc: "12 people supported your complaint on Water Supply issue.",
    time: "1d ago",
    category: "Support",
    type: "support",
    read: true,
    iconBg: "#fdf4ff",
    iconColor: "#a855f7",
    tagBg: "#fdf4ff",
    tagColor: "#a855f7",
  },
  {
    id: 5,
    title: "New message received",
    desc: "Arun Kumar sent you a message about the drainage issue.",
    time: "1d ago",
    category: "Message",
    type: "message",
    read: true,
    iconBg: "#eff6ff",
    iconColor: "#3b82f6",
    tagBg: "#eff6ff",
    tagColor: "#3b82f6",
  },
  {
    id: 6,
    title: "New member joined",
    desc: "Priya Sharma joined as a Volunteer in your area.",
    time: "2d ago",
    category: "Member",
    type: "member",
    read: true,
    iconBg: "#f0fdf4",
    iconColor: "#16a34a",
    tagBg: "#f0fdf4",
    tagColor: "#16a34a",
  },
];

const TABS = ["All", "Unread", "Complaint", "Status", "Message"];

function NotifIcon({ type, iconBg, iconColor }) {
  const icons = 
  {
    complaint: (
      <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    ),
    status: (
      <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
      </svg>
    ),
    resolved: (
      <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
        <polyline points="22 4 12 14.01 9 11.01" />
      </svg>
    ),
    support: (
      <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <path d="M14 9V5a3 3 0 00-3-3l-4 9v11h11.28a2 2 0 002-1.7l1.38-9a2 2 0 00-2-2.3z" />
        <path d="M7 22H4a2 2 0 01-2-2v-7a2 2 0 012-2h3" />
      </svg>
    ),
    message: (
      <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
      </svg>
    ),
    member: (
      <svg viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="2">
        <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 00-3-3.87" />
        <path d="M16 3.13a4 4 0 010 7.75" />
      </svg>
    ),
  };

  return (
    <div className={styles.notifIcon} style={{ background: iconBg }}>
      {icons[type]}
    </div>
  );
}

function NotificationPage() {
  const navigate   = useNavigate();
  const [activeTab, setActiveTab] = useState("All");
  const [notifications, setNotifications] = useState(STATIC_NOTIFICATIONS);

  const handleMarkRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => 
    {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const filtered = useMemo(() => 
  {
    if (activeTab === "All")    
        return notifications;
    if (activeTab === "Unread") 
        return notifications.filter((n) => !n.read);
    return notifications.filter(
      (n) => n.category.toLowerCase() === activeTab.toLowerCase()
    );
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

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
          filtered.map((notif) => (
            <div
              key={notif.id}
              className={`${styles.notifItem} ${!notif.read ? styles.unread : ""}`}
              onClick={() => handleMarkRead(notif.id)}
            >
              {!notif.read && <div className={styles.unreadDot} style={{"--count": `"${unreadCount}"`}}/>}

              <NotifIcon
                type={notif.type}
                iconBg={notif.iconBg}
                iconColor={notif.iconColor}
              />

              <div className={styles.notifContent}>
                <div className={styles.notifTitle}>{notif.title}</div>
                <div className={styles.notifDesc}>{notif.desc}</div>
                <div className={styles.notifMeta}>
                  <span className={styles.notifTime}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                    {notif.time}
                  </span>
                  <span
                    className={styles.notifTag}
                    style={{ background: notif.tagBg, color: notif.tagColor }}
                  >
                    {notif.category}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 01-3.46 0" />
            </svg>
            <p>No notifications found.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationPage;