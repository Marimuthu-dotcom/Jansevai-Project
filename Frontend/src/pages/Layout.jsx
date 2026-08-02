import {useState, useContext} from "react";
import { Outlet, NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react"; 
import styles from "../styles/Layout.module.css";
import logo from "../assets/admin.png";
import LoginPage from "../components/LoginPage";
import { AuthContext } from "../context/CreateContext";

function Layout() {

  const { token ,logout,login} = useContext(AuthContext);

  const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-house-icon lucide-house">
          <path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/>
          <path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
  },
  {
    name: "Complaint",
    path: "/complaint",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-text-align-justify-icon lucide-text-align-justify">
      <path d="M3 5h17"/>
      <path d="M3 12h17"/>
      <path d="M3 19h17"/>
      </svg>
  },
  {
    name: "Categories",
    path: "/categories",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-notepad-text-icon lucide-notepad-text">
      <path d="M8 2v4"/>
      <path d="M12 2v4"/>
      <path d="M16 2v4"/>
      <rect width="16" height="18" x="4" y="4" rx="2"/>
      <path d="M8 10h6"/>
      <path d="M8 14h8"/>
      <path d="M8 18h5"/>
      </svg>
  },
  {
    name: "Add Complaint",
    path: "/add-complaint",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-sticky-note-plus-icon lucide-sticky-note-plus">
      <path d="M15 3v5a1 1 0 0 0 1 1h5"/>
      <path d="M18 15v6"/>
      <path d="M21 12.356V9a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 15 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7.355"/>
      <path d="M21 18h-6"/></svg>
  },
  {
    name: "Members",
    path: "/members",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-users-icon lucide-users">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
      <path d="M16 3.128a4 4 0 0 1 0 7.744"/>
      <path d="M22 21v-2a4 4 0 0 0-3-3.87"/>
      <circle cx="9" cy="7" r="4"/>
      </svg>
  },
  {
    name: "Add Groups",
    path: "/add-groups",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-network">
  <circle cx="12" cy="5" r="2" />
  <circle cx="5" cy="19" r="2" />
  <circle cx="19" cy="19" r="2" />
  <path d="M12 7v5" />
  <path d="M12 12 7 17" />
  <path d="M12 12l5 5" />
</svg>
  },
  {
    name: "My Profile",
    path: "/my-profile",
    icon: <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 26 26" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-circle-user-round-icon lucide-circle-user-round">
      <path d="M17.925 20.056a6 6 0 0 0-11.851.001"/>
      <circle cx="12" cy="11" r="4"/>
      <circle cx="12" cy="12" r="10"/>
      </svg>
  }
];

   const[closing,setClosing]=useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
   const [isLoggingOut, setIsLoggingOut] = useState(false);
   const showLogin = !token && !isLoggingOut;

  const handleLoginSuccess = (newToken) => {
  setClosing(true);
  setTimeout(() => {
    login(newToken);
    setClosing(false);
  }, 400);
};

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();                    
    window.location.href = "/"; 
  };


  return (
    <div className={styles.app}>
      <div className={styles.appLayout}>
        <div className={`${styles.sideBar} ${!sidebarOpen ? styles.sideBarClosed : ""}`}>
          <button
            className={styles.toggleBtn}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen
              ? <ChevronLeft  size={16} />   // ← close arrow
              : <ChevronRight size={16} />   // → open arrow
            }
          </button>
          
            <div className={styles.logoSection}>
            <span className={styles.logo}>
              <img src={logo} alt="Logo" />
            </span>
            
          {sidebarOpen && (
            <span>
              <h2 className={styles.websiteName}>
              JanSevai
            </h2>
            </span>
            )}
          </div> 
          <div>
          <nav className={styles.navMenu}>
            {navItems.map((item)=> (
              <NavLink
                key={item.name}
                to={item.path.toLowerCase()}
                className={({ isActive }) => {
                if (item.name === "Members") {
                  const isMembersActive = location.pathname.startsWith('/members') || 
                                          location.pathname.startsWith('/chat-box') ||
                                          location.pathname.startsWith('/profile') ||
                                          location.pathname.startsWith('/invite-member');
                  
                  return isMembersActive
                    ? `${styles.navItem} ${styles.active}`
                    : styles.navItem;
                }

                else if (item.name === "Dashboard") {
                const isDashboardActive = location.pathname.startsWith('/dashboard') || 
                                          location.pathname.startsWith('/notification') ||
                                          location.pathname.startsWith('/community-updates') ||
                                          location.pathname.startsWith('/recent-complaints');
                
                return isDashboardActive
                  ? `${styles.navItem} ${styles.active}`
                  : styles.navItem;
              }

                 return isActive
                  ? `${styles.navItem} ${styles.active}`
                  : styles.navItem;

                }}
              >
                <span className={styles.icon}>
                  {item.icon}
                </span>
                {sidebarOpen && (
                  <span className={styles.navText}>{item.name}</span>
                )}
              </NavLink>
            ))}
          </nav>
         </div>
        </div>
        <div className={`${styles.contentPage} ${!sidebarOpen ? styles.contentExpanded : ""}`}>
            <Outlet context={{ handleLogout }}/>
        </div>
        {(showLogin|| closing) && (
          <LoginPage loginClose={handleLoginSuccess} closing={closing}/>
        )}
      </div>
    </div>
  );
}

export default Layout;

