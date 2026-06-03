import { useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Dashboard.module.css";
import { Bell,ChevronDown,SearchXIcon } from "lucide-react";
import water from "../assets/plumbing-maintenance.png";
import drainage from "../assets/pollution.png";
import road from "../assets/road.png";
import streetlight from "../assets/streetlight.png";
import roadCleaning from "../assets/roadCleaning.jfif";
import drainageCleaning from "../assets/drainageCleaning.jfif";
import { AuthContext } from "../context/AuthContext";
import StatusBadge from "../components/StatusBadge";
import styles1 from "../styles/complaint.module.css" ;

function Dashboard() {

  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const { user ,logout ,complaints} = useContext(AuthContext);

  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();

    if (search.trim()) {
      navigate(`/complaint?search=${search}`);
    }
  };

  const recentComplaints = complaints?.filter((complaint) => {
  const complaintDate = complaint.created_at.slice(0, 10);

  const today = new Date();
  const twoDaysAgo = new Date();

  twoDaysAgo.setDate(today.getDate() - 2);

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

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

const getColor = (process) => {
  if (process === "Pending") return "rgb(237, 15, 15)";
  if (process === "In Progress") return "rgb(15, 193, 237)";
  if (process === "Resolved") return "rgb(40, 231, 15)";
  return "black"; 
};

const totalComplaints = complaints?.length || 0;

const pendingCount =
  complaints?.filter((c) => c.status === "Pending").length || 0;

const inProgressCount =
  complaints?.filter((c) => c.status === "In Progress").length || 0;

const resolvedCount =
  complaints?.filter((c) => c.status === "Resolved").length || 0;

  const cardData = [
  { title: "Total Complaints", count: totalComplaints },
  { title: "In Progress", count: inProgressCount },
  { title: "Pending", count: pendingCount },
  { title: "Resolved", count: resolvedCount },
];

  return (
    <div className={styles.mainDashboard}>
      <div className={styles.dashboardHeader}>
        <div className={styles.searchDiv}>
          <form
        onSubmit={handleSearch}
        className={styles.searchForm}
      >
        <input
          type="text"
          placeholder="Search complaint..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={styles.searchInput}
        />

        <button
          type="submit"
          className={styles.searchBtn}
        >
          Search
        </button>
      </form>
        </div>

      <div className={styles.profileDiv}>
        <div className={styles.notificationDiv} onClick={(e) =>{ e.stopPropagation(); navigate("/notification")}}>
        <Bell size={23} />
        <span className={styles.notificationBadge}>
          3
        </span>
      </div>

      <div className={styles.profileContainer} onClick={(e) =>{ e.stopPropagation(); setShowDropdown(!showDropdown)}}>
      <div className={styles.profiles}>
        {user?.username?.charAt(0).toUpperCase()}
      </div>
      <div>
        <div className={styles.profileName}>{user?.username
          ?.charAt(0)
          .toUpperCase() +
        user?.username
          ?.slice(1)
          .toLowerCase()}</div>
        <div style={{ fontFamily: "Roboto, sans-serif", color:"gray",fontWeight:"500"}}>User</div>
      </div>
      {showDropdown && (
        <div className={styles.dropdownBox}>
          <div className={styles.dropdownEmail}>
            {user?.email}
          </div>

          <button
            className={styles.logoutBtn}
            onClick={() => {
              logout();
              sessionStorage.removeItem("token");
              sessionStorage.removeItem("showOtp");
              sessionStorage.removeItem("showPasswordBox");
              navigate("/");
              window.location.reload(); 
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
    <h1>Good Morning, Muthu 👋</h1>

    <p>
      Manage and track public complaints efficiently
      from one centralized dashboard.
    </p>
  </div>

  <div className={styles.cardContainer}>
   {cardData.map((p,i)=>(
    <div key={i} className={styles.card}>
      <p className={styles.process}>{p.title}</p>
      <p style={{ fontFamily: "Roboto, sans-serif" ,fontWeight:"700", fontSize:"25px" ,color:getColor(p.title)}}>{p.count}</p>
      <p style={{ fontFamily: "Roboto, sans-serif" ,fontWeight:"700", fontSize:"12px" ,color:"#16a34a"}}>+12% per month</p>
    </div>
   ))}
  </div>
  <div className={styles.dashboardGraph}>
        <div className={styles.complaintsDashboard1}>
          <div className={styles.complaintsHeader}>
            <span style={{fontFamily: "Roboto, sans-serif",fontWeight: "500",color:"black" }}>Recent Complaints</span>
            <span className={styles.viewAll} 
            >
              View All <ChevronDown size={16} />
            </span>
          </div>
          <div className={styles.complaintsList}>
            {recentComplaints?.length > 0 ? (
              recentComplaints.map((c,i) => (
            <div key={i} className={styles.complaintItem}>
              <div className={styles.complaintImage}>
                {c.image_url ?(
                      <img src={c.image_url} alt="Complaint"/>
                    ):
                   (<div className={styles.cardImgPlaceholder}>
                           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                               <rect x="3" y="3" width="18" height="18" rx="3" />
                               <circle cx="8.5" cy="8.5" r="1.5" />
                               <polyline points="21 15 16 10 5 21" />
                             </svg> 
                  </div>
                  )
                }
              </div>
              <div className={styles.complaintCategory}>
                <span className={styles.complaintTitle}>{c.title}</span>
                <span className={styles.complaintTime}>{getTimeAgo(c.created_at)}</span>
                <StatusBadge status={c.status} />
              </div>
            </div>
              ))
            ):(
              <div className={styles1.emptyState}>
                          <SearchXIcon />
                          <p>No complaints found for the selected filters.</p>
                        </div>
            )
            }
          </div>
          <div className={styles.bottomDiv}></div>
        </div>
        <div className={styles.complaintsDashboard2}>
          <div className={styles.complaintsHeader}>
            <span style={{fontFamily: "Roboto, sans-serif",fontWeight: "500",color:"black" }}>Community Updates</span>
          </div>
          <div style={{gap:"15px"}} className={styles.complaintsList}>
            <div className={styles.complaintItem}>
              <div className={styles.complaintImage}>
                    <div className={styles.cardImgPlaceholder}>
                             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                               <rect x="3" y="3" width="18" height="18" rx="3" />
                               <circle cx="8.5" cy="8.5" r="1.5" />
                               <polyline points="21 15 16 10 5 21" />
                             </svg>
                  </div>
              </div>
              <div className={styles.orderdetails}>
                <h3 style={{fontSize:"15px",fontFamily: "Roboto, sans-serif",fontWeight: "500" }}>Clean City Drive on 20th May</h3>
                <p style={{fontSize:"13px",fontFamily: "Roboto, sans-serif",fontWeight: "400",color:"rgb(165, 164, 164)" }}>John Handle for a Cleaning Tomorrow</p>
              </div>
            </div>
            <div style={{gap:"10px"}} className={styles.complaintItem}>
              <div className={styles.complaintImage}>
                   <img src={drainageCleaning} alt="Admin" />
              </div>
              <div className={styles.orderdetails}>
                <h3 style={{fontSize:"15px",fontFamily: "Roboto, sans-serif",fontWeight: "500"}}>Mamsnbsbdbbbfbfb</h3>
                <p style={{fontSize:"13px",fontFamily: "Roboto, sans-serif",fontWeight: "400",color:"rgb(165, 164, 164)" }}>Mari snsbdbdb</p>
              </div>
            </div>
            <div className={styles.complaintItem}>
              <div className={styles.complaintImage}>
                   <img src={roadCleaning} alt="Admin" />
              </div>
              <div className={styles.orderdetails}>
                <h3 style={{fontSize:"15px",fontFamily: "Roboto, sans-serif",fontWeight: "500"}}>Mamsnbsbdbbbfbfb</h3>
                <p style={{fontSize:"13px",fontFamily: "Roboto, sans-serif",fontWeight: "400",color:"rgb(165, 164, 164)" }}>Mari snsbdbdb</p>
              </div>
            </div>
          </div>
          <div className={styles.bottomDiv}></div>
        </div>
  </div>
        <div className={styles.complaintsReportsBox}>
          <div style={{fontFamily: "Roboto, sans-serif",fontWeight: "500" }}>Trending Issue</div>
          <div className={styles.complaintsReportsList}>
           <div className={styles.reportsItem} style={{borderLeft:"5px solid rgb(22, 131, 232)"}}>
             <div style={{width:"57px",height:"57px"}}>
              <img src={water} alt="water" />
             </div>
             <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",marginTop:"15px",paddingLeft:"10px"}}>
              <h2 style={ {fontFamily:"Roboto, sans-serif" ,fontWeight:"700" ,fontSize:"19px",color:"red"}}>Water Supply</h2>
             <p style={{fontFamily:"Roboto, sans-serif" ,fontSize:"14px" ,fontWeight:"500" ,color:"gray"}}>34 Complaints</p>
             </div>
          </div>
          <div className={styles.reportsItem} style={{borderLeft:"5px solid rgb(242, 230, 7)"}}>
            <div style={{width:"57px",height:"57px"}}>
              <img src={streetlight} alt="water" />
             </div>
             <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",marginTop:"15px",paddingLeft:"10px"}}>
              <h2 style={ {fontFamily:"Roboto, sans-serif" ,fontWeight:"700" ,fontSize:"19px",color:"red"}}>Street Light</h2>
             <p style={{fontFamily:"Roboto, sans-serif" ,fontSize:"14px" ,fontWeight:"500" ,color:"gray"}}>34 Complaints</p>
             </div>
          </div>
          <div className={styles.reportsItem} style={{borderLeft:"5px solid black"}}>
            <div style={{width:"57px",height:"57px"}}>
              <img src={road} alt="water" />
             </div>
             <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",marginTop:"15px"}}>
              <h2 style={ {fontFamily:"Roboto, sans-serif" ,fontWeight:"700" ,fontSize:"19px",color:"red"}}>Road Repair</h2>
             <p style={{fontFamily:"Roboto, sans-serif" ,fontSize:"14px" ,fontWeight:"500" ,color:"gray"}}>34 Complaints</p>
             </div>
          </div>
          <div className={styles.reportsItem} style={{borderLeft:"5px solid rgb(145, 145, 145)"}}>
            <div style={{width:"57px",height:"57px"}}>
              <img src={drainage} alt="water" />
             </div>
             <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",marginTop:"15px"}}>
              <h2 style={ {fontFamily:"Roboto, sans-serif" ,fontWeight:"700" ,fontSize:"19px",color:"red"}}>Drainage Clean</h2>
             <p style={{fontFamily:"Roboto, sans-serif" ,fontSize:"14px" ,fontWeight:"500" ,color:"gray"}}>34 Complaints</p>
             </div>
          </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard; 