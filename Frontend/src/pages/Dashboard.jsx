import { useState,useContext } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/Dashboard.module.css";
import { Bell,ChevronDown,SearchXIcon,TrendingUp,TrendingDown,Minus} from "lucide-react";
import water from "../assets/plumbing-maintenance.png";
import drainage from "../assets/pollution.png";
import road from "../assets/road.png";
import streetlight from "../assets/streetlight.png";
import garbage from "../assets/garbage.png"
import publicsafety from "../assets/public-safety.png";
import environment from "../assets/forest.png";
import fall from "../assets/fall.png"
import growth from "../assets/growth.png"
import stable from "../assets/stability.png"
import others from "../assets/other.png"
import { AuthContext } from "../context/CreateContext";
import StatusBadge from "../components/StatusBadge";
import styles1 from "../styles/RecentComplaints.module.css" ;
import styles2 from "../styles/Complaint.module.css" ;

function Dashboard() {

  const [showDropdown, setShowDropdown] = useState(false);
  const { user ,logout ,complaints, loading ,trends ,statusDiff, statusPercentages ,statusCounts } = useContext(AuthContext);

  const navigate = useNavigate();


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

  if (days > 0) {
    return `${days}d ${hours}h`;
  }

  if (hours > 0) {
    return `${hours}h`;
  }

  return `${minutes}m`;
};

console.log(statusDiff);
console.log(statusPercentages);

const totalComplaints  = statusCounts?.total      ?? complaints?.length ?? 0;
const pendingCount     = statusCounts?.pending     ?? complaints?.filter(c => c.status === "Pending").length     ?? 0;
const inProgressCount  = statusCounts?.inProgress  ?? complaints?.filter(c => c.status === "In Progress").length ?? 0;
const resolvedCount    = statusCounts?.resolved    ?? complaints?.filter(c => c.status === "Resolved").length    ?? 0;

  const getCount = (category) => 
{
  return complaints?.filter(
    c => c.category?.trim().toLowerCase().includes(category.trim().toLowerCase())
  ).length || 0;
};

  const getDiffLabel = (val,per) => 
{
  if (val === undefined || val === null || val === 0)
    return (
      <span className={styles.percent} style={{ color: "gray", backgroundColor: "rgba(171, 168, 168, 0.37)" }}>
        — {per !== undefined && per !== null ? `${per}%` : "0%"}
      </span>
    );
  if (val > 0) 
    return (<span className={styles.percent} style={{color:"#16a34a",backgroundColor:"rgba(140, 244, 109, 0.24)"}}>▲ +{per}%</span> );
  return (<span className={styles.percent} style={{color:"#dc2626",backgroundColor:"rgba(247, 175, 175, 0.26)"}}>▼ -{per}%</span> );
};

const cardData = [
  { title: "Total Complaints", count: totalComplaints, diffKey: null ,percent: null },
  { title: "In Progress",      count: inProgressCount, diffKey: statusDiff?.inProgress ,percent: statusPercentages?.inProgress},
  { title: "Pending",          count: pendingCount,    diffKey: statusDiff?.pending ,percent:  statusPercentages?.pending},
  { title: "Resolved",         count: resolvedCount,   diffKey: statusDiff?.resolved ,percent:  statusPercentages?.resolved},
];

const reportCards = [
  {
    title: "Water Supply",
    image: water,
    border: "rgb(22, 131, 232)"
  },
  {
    title: "Street Light",
    image: streetlight,
    border: "rgb(242, 230, 7)"
  },
  {
    title: "Roads & Streets",
    image: road,
    border: "black"
  },
  {
    title: "Drainage",
    image: drainage,
    border: "rgb(165, 164, 164)"
  },
  {
    title: "Garbage",
    image: garbage,
    border: "rgb(151, 238, 114)"
  },
  {
    title: "Public Safety",
    image: publicsafety,
    border: "rgb(240, 12, 12)"
  },
  {
    title: "Environment",
    image: environment,
    border: "rgb(12, 236, 61)"
  },
  {
    title: "Others",
    image: others,
    border: "rgb(189, 134, 6)"
  }
]; 

  return (
    <div className={styles.mainDashboard}>
      <div className={styles.dashboardHeader}>
        <div className={styles.searchDiv}>
          <h2>Dashboard</h2>
        </div>

      <div className={styles.profileDiv}>
        <div className={styles.notificationDiv} onClick={(e) =>{ e.stopPropagation(); navigate("/notification")}}>
        <Bell size={27} />
        <span className={styles.notificationBadge}>
          3
        </span>
      </div>

      <div className={styles.profileContainer} onClick={(e) =>{ e.stopPropagation(); setShowDropdown(!showDropdown)}}>
      <div className={styles.profiles}>
        {user?.username.charAt(0).toUpperCase()}
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
    

    <p>
      Manage and track public complaints efficiently
      from one centralized dashboard.
    </p>
  </div>

  <div className={styles.cardContainer}>
   {cardData.map((p,i)=>(
    <div key={i} className={styles.card}>
      <p className={styles.process}>{p.title}</p>
      <p style={{ fontFamily: "Roboto, sans-serif" ,fontWeight:"700", fontSize:"25px" ,color:"rgb(43,54,54)"}}>{p.count}</p>
      {p.title !== "Total Complaints"? getDiffLabel(p.diffKey ,p.percent) : null}
    </div>
   ))}
  </div>
  <div className={styles.dashboardGraph}>
        <div className={styles.complaintsDashboard1}>
          <div className={styles.complaintsHeader}>
            <span style={{fontFamily: "Roboto, sans-serif",fontWeight: "500",color:"black" }}>Recent Complaints</span>
          </div>
          {loading ? (
            <div className={styles2.loadingContainer}>
              <div className={styles2.spinner} />
            </div>
          ) : (<>
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
                <div style={{display:"flex",flexDirection:"column",justifyContent:"center",alignItems:"flex-start",gap:"5px"}}>
                <span className={styles.complaintTitle}>{c.title}</span>
                <span className={styles.cardLocation}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                  <circle cx="12" cy="9" r="2.5" />
                </svg>
                {c.location}
                </span>
                </div>
                <span className={styles.complaintDate}>{c.category}</span>
                <span className={styles.complaintTime}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </svg>
                  {getTimeAgo(c.created_at)} Ago
                </span>
                <span style={{display:"flex",justifyContent:"flex-end"}}><StatusBadge status={c.status} /></span>
              </div>
            </div>
              ))
            ):(
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
          </>)}
          <div className={styles.bottomDiv}>
            <button
            className={styles.moreBtn}
            onClick={() => navigate("/recent-complaints",{
      state: { complaints: recentComplaints }
    })}
          >
            More <ChevronDown size={13} />
          </button>
          </div>
        </div>
  </div>
        <div className={styles.complaintsReportsBox}>
          <div className={styles.stateBar} style={{fontFamily: "Roboto, sans-serif",fontWeight: "500" }}>
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
        {reportCards.map((card, index) => (
          <div
            key={index}
            className={styles.reportsItem}
            style={{
              borderLeft: `5px solid ${card.border}`
            }}
          >
            <span className={styles.stateIcon}>{
              
             trends[card.title] === "up" ? <span className={styles.icon}>
                                           <span className={`${styles.iconImg} ${styles.up}`}><img src={growth} alt="" />
                                           </span>
                                           </span> 
                                          : trends[card.title] === "down" ?
                                          <span className={styles.icon}>
                                            <span className={`${styles.iconImg} ${styles.down}`}><img src={fall} alt="" /></span>
                                          </span>: 
                                           <span className={styles.icon}>
                                            <span className={`${styles.iconImg} ${styles.stable}`}><img src={stable} alt="" /></span>
                                          </span>
            }</span>
            
            <div style={{ width: "57px", height: "57px" }}>
              <img src={card.image} alt={card.title} />
            </div>

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "6px",
                marginTop: "15px"
              }}
            >
              <h2
                style={{
                  fontFamily: "Roboto, sans-serif",
                  fontWeight: "700",
                  fontSize: "17px",
                  color: "rgb(34,65,76)"
                }}
              >
                {card.title}
              </h2>

              <p
                style={{
                  fontFamily: "Roboto, sans-serif",
                  fontSize: "14px",
                  fontWeight: "500",
                  color: "gray"
                }}
              >
                {getCount(card.title)} Complaints
              </p>
            </div>
          </div>
        ))}
</div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard; 
