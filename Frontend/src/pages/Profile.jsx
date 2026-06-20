import { useParams, useNavigate ,useLocation } from "react-router-dom";
import { useContext ,useState ,useEffect} from "react";
import styles from "../styles/Profile.module.css";
import GetIntial from "../components/GetIntial";
import { AuthContext } from "../context/CreateContext";
import { SearchXIcon } from "lucide-react";
import styles1 from "../styles/RecentComplaints.module.css";
import axios from "axios";

const getIconColor = (title) => {
  const category = title.trim().toLowerCase().replace(/\s+/g, "");

  if (category.includes("watersupply")) 
    return "#3fb3ed";
  if (category.includes("garbage")) 
    return "#0af962";
  if (category.includes("street")) 
    return "#ffe100";
  if (category.includes("road&safety")) 
    return "#a855f7";
  if (category.includes("publicsafety")) 
    return "#ea0808";
  if (category.includes("other")) 
    return "#1a1a1a";
  if (category.includes("environment")) 
    return "#00ff22";
  if (category.includes("drainage")) 
    return "#424242";
};

const getDotColor = (status) => {
  switch (status) {
    case "Pending":
      return "#ffc107";
    case "In Progress":
      return "#007bff";
    case "Resolved":
      return "#28a745";
    default:
      return "#6c757d";
  }
};

const getStatus = (status) => {
  if(status === "Pending") 
    return "Complaint Submitted";
  if(status === "In Progress") 
    return "Complaint In Progress";
  if(status === "Resolved") 
    return "Complaint Resolved";
}

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

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};


const STATIC_ACTIVITY = [
  { id: 1, action: "Submitted",         detail: "Water leakage on 5th Main Road", time: "2h ago",   color: "#e02020" },
  { id: 2, action: "Complaint resolved",detail: "Street light near park fixed",   time: "3d ago",   color: "#22c55e" },
  { id: 3, action: "Commented",         detail: "Garbage not collected issue",    time: "5d ago",   color: "#f59e0b" },
  { id: 4, action: "Submitted",         detail: "Pothole on 8th Cross",           time: "1w ago",   color: "#3b82f6" },
  { id: 5, action: "Joined",            detail: "JanSeva community",              time: "Mar 2024", color: "#8b5cf6" },
];

function getBadgeClass(status)
{
  if (status === "Pending")     
    return styles.badgePending;
  if (status === "In Progress")
    return styles.badgeInProgress;
  return styles.badgeResolved;
}

function Profile() {

  const { userEmail }    = useParams();  
  console.log("Profile page for:", userEmail);
  const { myComplaints } = useContext(AuthContext); 
  const navigate   = useNavigate();
  const location   = useLocation();
  const member = location.state?.member;
  const [memberComplaints, setMemberComplaints] = useState([]);
  const [memberActivity,setMemberActivity] = useState([]);
  const api = import.meta.env.VITE_API_URL;

  if (!member) {
    return (
      <div className={styles.notFound}>
        <p>Member not found.</p>
        <button onClick={() => navigate("/members")}>
            ← Back to Members</button>
      </div>
    );
  }

  console.log(member);

  useEffect(() => {

   const fetchComplaints = async () => {

      try {

         const res = await axios.get(
            `${api}/api/auth/member-complaints/${userEmail}`
         );

         setMemberComplaints(res.data);
         console.log("Fetched member complaints:", res.data);

         const activityRes = await axios.get(
            `${api}/api/auth/member-activity/${userEmail}`
         );

         setMemberActivity(activityRes.data);

      } catch (err) {
         console.log(err);
      }
   };

   fetchComplaints();

}, [userEmail]);

  return (
    <div className={styles.mainContainer}>

      <button className={styles.backBtn} onClick={() => navigate("/members")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Members
      </button>
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          {/* Profile Card */}
          <div className={styles.profileCard}>
            {/* Red Banner Top */}
            <div className={styles.profileCardTop}>
              <div className={styles.avatarSection}>
                <div className={styles.avatarWrapper}>
                  {/* ✅ Dynamic — member-ஓட color + initials */}
                  <div
                    className={styles.avatarCircle}
                    style={{ background: member.avatarColor }}
                  >
                    {GetIntial(member.username)}
                  </div>
                  <span className={`${styles.onlineDot} ${true ? styles.online : styles.offline}`} />
                </div>
                {/* ✅ Dynamic name */}
                <h2 className={styles.profileName}>{member.username}</h2>
                <span className={styles.roleBadge}>Volunteer</span>
              </div>
            </div>

            {/* Info List */}
            <div className={styles.profileCardBody}>
              <div className={styles.infoList}>

                {/* ✅ Dynamic — Phone */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Phone</span>
                    <span className={styles.infoValue}>{member.phone_number?member.phone_number:"----------"}</span>
                  </div>
                </div>

                {/* ✅ Dynamic — Email */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Email</span>
                    <span className={styles.infoValue}>{member.email?member.email:"----------"}</span>
                  </div>
                </div>

                <div className={styles.divider} />

                {/* ✅ Dynamic — Location */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Location</span>
                    <span className={styles.infoValue}>{member.location?member.location:"----------"}</span>
                  </div>
                </div>

                {/* ✅ Dynamic — Joined Date */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8" y1="2" x2="8" y2="6" />
                      <line x1="3" y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Joined</span>
                    <span className={styles.infoValue}>{member.created_at?member.created_at.slice(0,10):"----------"}</span>
                  </div>
                </div>

                {/* ✅ Dynamic — Age */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Age / Gender</span>
                    <span className={styles.infoValue}>{member.age} yrs · {member.gender}</span>
                  </div>
                </div>

                {/* ✅ Dynamic — Bio */}
                <div className={styles.infoItem}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Bio</span>
                    <span className={styles.infoValue} style={{ whiteSpace: "normal", fontSize: 12 }}>
                      {member.bio?member.bio:"----------"}
                    </span>
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── Stats Mini Grid — ✅ Dynamic from member ── */}
          <div className={styles.statsGrid}>
            <div className={styles.statMini}>
              <span className={styles.statMiniNum}>{memberComplaints.length}</span>
              <span className={styles.statMiniLabel}>Total Complaints</span>
            </div>
            <div className={styles.statMini}>
              <span className={styles.statMiniNum}>{memberComplaints.filter(s => s.status === "Resolved").length}</span>
              <span className={styles.statMiniLabel}>Resolved</span>
            </div>
            <div className={styles.statMini}>
              <span className={styles.statMiniNum}>{memberComplaints.filter(s => s.status === "In Progress").length}</span>
              <span className={styles.statMiniLabel}>In Progress</span>
            </div>
            <div className={styles.statMini}>
              <span className={styles.statMiniNum}>
                {memberComplaints.filter(s => s.status === "Pending").length}
              </span>
              <span className={styles.statMiniLabel}>Pending</span>
            </div>
          </div>

        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className={styles.rightCol}>

          {/* My Complaints — Static for now */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>My Complaints</h3>
              <button className={styles.viewAllBtn}>View All</button>
            </div>

            <div className={styles.complaintList}>
              {memberComplaints.length > 0 ?
              (memberComplaints.map((c) => (
                <div key={c.id} className={styles.complaintRow}>
                  <div className={styles.complaintRowIcon} style={{ background: "rgba(185, 181, 181, 0.12)" }}>
                    <svg viewBox="0 0 24 24" fill="none" stroke={getIconColor(c.category)} strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  </div>
                  <div className={styles.complaintRowInfo}>
                    <div className={styles.complaintRowTitle}>{c.title}</div>
                    <div className={styles.complaintRowMeta}>
                      {c.category} · {getTimeAgo(c.created_at)}
                    </div>
                  </div>
                  <span className={`${styles.badge} ${getBadgeClass(c.status)}`}>
                    {c.status}
                  </span>
                </div>
        
              ))) : (
                <div className={styles1.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <p>No recent complaints found.</p>
                          </div>
              )
              }
            </div>
          </div>

          {/* Recent Activity — Static for now */}
          <div className={styles.sectionCard}>
            <div className={styles.sectionHeader}>
              <h3 className={styles.sectionTitle}>Recent Activity</h3>
            </div>
            <div className={styles.activityList}>
              {memberActivity.length > 0 ?
              (memberActivity.map((a,i) => (
                <div key={i} className={styles.activityItem}>
                  <div className={styles.activityDot} style={{ background: getDotColor(a.status) }} />
                  <span className={styles.activityText}>
                    <strong>{getStatus(a.status)}</strong> — {a.title}
                  </span>
                  <span className={styles.activityTime}>{getTimeAgo(a.updated_at)}</span>
                </div>
              ))):
              (
               <div className={styles1.emptyState}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                              <circle cx="11" cy="11" r="8" />
                              <line x1="21" y1="21" x2="16.65" y2="16.65" />
                            </svg>
                            <p>No recent complaints found.</p>
                </div> 
              )
            }
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default Profile;
