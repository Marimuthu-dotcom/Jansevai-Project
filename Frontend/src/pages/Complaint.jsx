import { useState, useMemo , useContext} from "react";
import styles from "../styles/Complaint.module.css";
import notification from "../assets/notification-bell.png";
import styles1 from "../styles/Dashboard.module.css";
import { AuthContext } from "../context/CreateContext";
import ComplaintCard from "../components/ComplaintCard"
import { useNavigate,useOutletContext } from "react-router-dom";

export const DUMMY_COMPLAINTS = [
  {
    id: 1,
    title: "Water leakage on 5th Main Road",
    category: "Water Supply",
    location: "Jayanagar, Bangalore",
    status: "In Progress",
    likes: 0,
    comments: 0,
    time: "2h ago",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=200&fit=crop",
  },
  {
    id: 2,
    title: "Garbage not collected",
    category: "Garbage",
    location: "HSR Layout, Bangalore",
    status: "Pending",
    likes: 0,
    comments: 0,
    time: "4h ago",
    image: "https://images.unsplash.com/photo-1532996122724-e3c354a0b15b?w=400&h=200&fit=crop",
  },
  {
    id: 3,
    title: "Street light not working",
    category: "Street Lights",
    location: "Koramangala, Bangalore",
    status: "In Progress",
    likes: 0,
    comments: 0,
    time: "5h ago",
    image: null,
  },
  {
    id: 4,
    title: "Drainage overflow near school",
    category: "Drainage",
    location: "JP Nagar, Bangalore",
    status: "Pending",
    likes: 0,
    comments: 0,
    time: "12h ago",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=200&fit=crop",
  },
  {
    id: 5,
    title: "Potholes on 2nd Cross Road",
    category: "Roads & Streets",
    location: "BTM Layout, Bangalore",
    status: "Pending",
    likes: 0,
    comments: 0,
    time: "12h ago",
    image: "https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?w=400&h=200&fit=crop",
  },
  {
    id: 6,
    title: "Water supply issue in colony",
    category: "Water Supply",
    location: "Banashankari, Bangalore",
    status: "Resolved",
    likes: 0,
    comments: 0,
    time: "24h ago",
    image: null,
  },
];

const CATEGORIES = [
  "All Categories",
  "Water Supply",
  "Garbage",
  "Street Lights",
  "Drainage",
  "Roads & Streets",
  "Public Safety",
  "Environment",
  "Others",
];
const DISTRICT = [
  "All Districts",
  "Ariyalur",
  "Chengalpattu",
  "Chennai",
  "Coimbatore",
  "Cuddalore",
  "Dharmapuri",
  "Dindigul",
  "Erode",
  "Kallakurichi",
  "Kanchipuram",
  "Kanyakumari",
  "Karur",
  "Krishnagiri",
  "Madurai",
  "Mayiladuthurai",
  "Nagapattinam",
  "Namakkal",
  "Nilgiris",
  "Perambalur",
  "Pudukkottai",
  "Ramanathapuram",
  "Ranipet",
  "Salem",
  "Sivaganga",
  "Tenkasi",
  "Thanjavur",
  "Theni",
  "Thoothukudi",
  "Tiruchirappalli",
  "Tirunelveli",
  "Tirupathur",
  "Tiruppur",
  "Tiruvallur",
  "Tiruvannamalai",
  "Tiruvarur",
  "Vellore",
  "Viluppuram",
  "Virudhunagar",
  "Other District"
];


export function getOrdinal(num) {
  const mod10 = num % 10; 
  const mod100 = num % 100; 

  if (mod10 === 1 && mod100 !== 11) 
    return `${num}st`;
  if (mod10 === 2 && mod100 !== 12) 
    return `${num}nd`;
  if (mod10 === 3 && mod100 !== 13) 
    return `${num}rd`;

  return `${num}th`;
}

const WARD = [
  "All",
  ...Array.from({ length: 1326 }, (_, i) => getOrdinal(i + 1))
];
const STATUSES = ["All Status", "Pending", "In Progress", "Resolved"];

// ── Main Component ──
function Complaints() {
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter,   setStatusFilter]   = useState("All Status");
  const [showDropdown, setShowDropdown] = useState(false);
  const { user ,complaints ,loading,notifications} = useContext(AuthContext);
  const navigate = useNavigate();
  const { handleLogout } = useOutletContext();
  const notificationsCount = notifications.filter((n) => !n.is_read).length || 0;


  const filtered = useMemo(() => {
    return complaints.filter((c) => {
      const categoryMatch =
        categoryFilter === "All Categories" || c.category === categoryFilter;
      const statusMatch =
        statusFilter === "All Status" || c.status === statusFilter;
      return categoryMatch && statusMatch;
    });
  }, [categoryFilter, statusFilter ,complaints]);

  return (
    <div className={styles1.complaintContainer}>
      <div className={styles1.dashboardHeader}>
              <div className={styles1.searchDiv}>
                <h2>Complaints</h2>
                </div>
      
            <div className={styles1.profileDiv}>
              <div className={styles1.notificationDiv} onClick={(e) =>{ e.stopPropagation(); navigate("/notification")}}>
              <img src={notification} alt="" />
              {notificationsCount > 0 && (
                        <span className={styles1.notificationBadge}>
                            {notificationsCount}
                        </span>
              )}
            </div>
      
            <div className={styles1.profileContainer} onClick={(e) =>{ e.stopPropagation(); setShowDropdown(!showDropdown)}}>
            <div className={styles1.profiles}>
              {user?.username?.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles1.profileName}>{user ? user?.username?.toUpperCase() : (null)}</div>
              <div style={{ fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif", color:"gray",fontWeight:"500"}}>User</div>
            </div>
            {showDropdown && (
              <div className={styles1.dropdownBox}>
                <div className={styles1.dropdownEmail}>
                  {user?.email}
                </div>
      
                <button
                  className={styles1.logoutBtn}
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
      <div className={styles.pageHeader}>
        {/* Filters */}
        <div className={styles.filterBar}>
          {/* Category Dropdown */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {DISTRICT.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {WARD.map((s) => (
              <option key={s} value={s}>{`${s} Ward`}</option>
            ))}
          </select>

          <select
            className={styles.filterSelect}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Dropdown */}
          <select
            className={styles.filterSelect}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>

          {/* Filter Button */}
          <button
            className={styles.filterBtn}
            onClick={() => {
              setCategoryFilter("All Categories");
              setStatusFilter("All Status");
            }}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            Reset
          </button>
        </div>
      </div>

      {loading ? (
  <div className={styles.loadingContainer}>
    <div className={styles.spinner} />
  </div>
) : (<>
      <p className={styles.resultsCount}>
        Showing <span>{filtered.length}</span> complaint{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Grid */}
      <div className={styles.grid}>
        {filtered.length > 0 ? (
          filtered.map((complaint,index) => (
            <ComplaintCard key={index} index={index} complaint={complaint} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <svg viewBox="0 0 24 24" fill="none" stroke="gray" strokeWidth="1.5">
                                    <circle cx="11" cy="11" r="8" />
                                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <p>No complaints found for the selected filters.</p>
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}

export default Complaints;
