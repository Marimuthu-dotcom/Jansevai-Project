import { useState, useMemo , useContext} from "react";
import styles from "../styles/Complaint.module.css";
import { Bell ,SearchXIcon} from "lucide-react";
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

const STATUSES = ["All Status", "Pending", "In Progress", "Resolved"];

// ── Main Component ──
function Complaints() {
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter,   setStatusFilter]   = useState("All Status");
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { user ,complaints ,loading} = useContext(AuthContext);
  const navigate = useNavigate();
  const { handleLogout } = useOutletContext();

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/complaint?search=${search}`);
    }
  };

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
                <form
              onSubmit={handleSearch}
              className={styles1.searchForm}
            >
              <input
                type="text"
                placeholder="Search complaint..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={styles1.searchInput}
              />
      
              <button
                type="submit"
                className={styles1.searchBtn}
              >
                Search
              </button>
            </form>
              </div>
      
            <div className={styles1.profileDiv}>
              <div className={styles1.notificationDiv}>
              <Bell size={23} />
              <span className={styles1.notificationBadge}>
                3
              </span>
            </div>
      
            <div className={styles1.profileContainer} onClick={(e) =>{ e.stopPropagation(); setShowDropdown(!showDropdown)}}>
            <div className={styles1.profiles}>
              {user?.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className={styles1.profileName}>{user?.username
                .charAt(0)
                .toUpperCase() +
              user?.username
                .slice(1)
                .toLowerCase()}</div>
              <div style={{ fontFamily: "Roboto, sans-serif", color:"gray",fontWeight:"500"}}>User</div>
            </div>
            {showDropdown && (
              <div className={styles1.dropdownBox}>
                <div className={styles1.dropdownEmail}>
                  {user?.email}
                </div>
      
                <button
                  className={styles1.logoutBtn}
                  onClick={() => {
                    sessionStorage.removeItem("showOtp");
                    sessionStorage.removeItem("showPasswordBox");
                    handleLogout();
                     // or navigate("/login")
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
        <h1 className={styles.pageTitle}>Complaints</h1>

        {/* Filters */}
        <div className={styles.filterBar}>
          {/* Category Dropdown */}
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
          filtered.map((complaint) => (
            <ComplaintCard key={complaint.id} complaint={complaint} />
          ))
        ) : (
          <div className={styles.emptyState}>
            <SearchXIcon />
            <p>No complaints found for the selected filters.</p>
          </div>
        )}
      </div>
      </>)}
    </div>
  );
}

export default Complaints;
