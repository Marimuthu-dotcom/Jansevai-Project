import {useState, useContext} from "react";
import { Outlet, NavLink } from "react-router-dom";
import styles from "../styles/Layout.module.css";
import logo from "../assets/admin.png";
import LoginPage from "../components/LoginPage";
import { AuthContext } from "../context/CreateContext";

import {
  LayoutDashboard,
  FileWarning,
  PlusCircle,
  FolderKanban,
  Users,
  UserCircle
} from "lucide-react";

function Layout() {

  const { token ,logout} = useContext(AuthContext);

  const navItems = [
  {
    name: "Dashboard",
    path: "/dashboard",
    icon: <LayoutDashboard size={20} />
  },
  {
    name: "Complaint",
    path: "/complaint",
    icon: <FileWarning size={20} />
  },
  {
    name: "Categories",
    path: "/categories",
    icon: <FolderKanban size={20} />
  },
  {
    name: "Add Complaint",
    path: "/add-complaint",
    icon: <PlusCircle size={20} />
  },
  {
    name: "Members",
    path: "/members",
    icon: <Users size={20} />
  },
  {
    name: "MyProfile",
    path: "/my-Profile",
    icon: <UserCircle size={20} />
  }
];

   const[closing,setClosing]=useState(false);
   const [isLoggingOut, setIsLoggingOut] = useState(false);
   const showLogin = !token && !isLoggingOut;

  const handleLoginSuccess = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
    }, 500);
  };

  const handleLogout = () => {
    setIsLoggingOut(true);
    logout();                    
    window.location.href = "/"; 
  };


  return (
    <div className={styles.app}>
      <div className={styles.appLayout}>
        <div className={styles.sideBar}>
            <div className={styles.logoSection}>
            <span className={styles.logo}>
              <img src={logo} alt="Logo" />
            </span>
            <span>
              <h2 className={styles.websiteName}>
              JanSevai
            </h2>
            </span>
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
                <span>{item.icon}</span>
                {item.name}
              </NavLink>
            ))}
          </nav>
         </div>
        </div>
        <div
          className={styles.contentPage}>
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

