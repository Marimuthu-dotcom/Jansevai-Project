import { useState, useMemo } from "react";
import styles from "../styles/Members.module.css";
import MemberCard from "../components/MemberCard";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

export const MEMBERS = [
  {
    id: 1,
    name: "Arun Kumar",
    location: "Jayanagar, Bangalore",
    contributions: 48,
    resolved: 36,
    reported: 12,
    online: true,
    avatarColor: "#e02020",
  },
  {
    id: 2,
    name: "Priya Dharma",
    location: "HSR Layout, Bangalore",
    contributions: 35,
    resolved: 28,
    reported: 7,
    online: true,
    avatarColor: "#8b5cf6",
  },
  {
    id: 3,
    name: "Suresh Patel",
    location: "Koramangala, Bangalore",
    contributions: 36,
    resolved: 30,
    reported: 6,
    online: false,
    avatarColor: "#f59e0b",
  },
  {
    id: 4,
    name: "Priya Sharma",
    location: "BTM Layout, Bangalore",
    contributions: 22,
    resolved: 18,
    reported: 4,
    online: true,
    avatarColor: "#06b6d4",
  },
  {
    id: 5,
    name: "Vikram Reddy",
    location: "JP Nagar, Bangalore",
    contributions: 24,
    resolved: 20,
    reported: 4,
    online: false,
    avatarColor: "#10b981",
  },
  {
    id: 6,
    name: "Anita Desai",
    location: "Indiranagar, Bangalore",
    contributions: 16,
    resolved: 12,
    reported: 4,
    online: true,
    avatarColor: "#e02020",
  },
  {
    id: 7,
    name: "Ramesh Babu",
    location: "Whitefield, Bangalore",
    contributions: 14,
    resolved: 10,
    reported: 4,
    online: false,
    avatarColor: "#6366f1",
  },
  {
    id: 8,
    name: "Meena Iyer",
    location: "Banashankari, Bangalore",
    contributions: 19,
    resolved: 15,
    reported: 4,
    online: true,
    avatarColor: "#f43f5e",
  },
];

const TABS = ["All", "Volunteer"];


function Members() {
  const [activeTab, setActiveTab] = useState("All");
  const {members} = useContext(AuthContext);
  const filtered = useMemo(() => members, [members]);
  const navigate = useNavigate();

  return (
    <div className={styles.memberContainer}>
    <div className={styles.mainContainer}>

      {/* Header */}
      <div className={styles.pageHeader}>
        <div className={styles.pageTitleBlock}>
          <h1 className={styles.pageTitle}>Members</h1>
          <p className={styles.pageSubtitle}>Manage and connect with your team</p>
        </div>

        <button className={styles.inviteBtn} onClick={()=>{navigate("/invite-member")}}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Invite Member
        </button>
      </div>

      <div className={styles.tabBar}>
        {TABS.map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab}
            <span style={{ marginLeft: 5, opacity: 0.75 }}>
              ({filtered.length})
            </span>
          </button>
        ))}
      </div>

      {/* Results count */}
      <p className={styles.resultsCount}>
        Showing <span>{filtered.length}</span> member{filtered.length !== 1 ? "s" : ""}
      </p>

      {/* Members Grid */}
      <div className={styles.membersGrid}>
        {filtered.map((member) => (
          <MemberCard key={member.id} member={member} />
        ))}
      </div>

    </div>
    </div>
  );
}

export default Members;