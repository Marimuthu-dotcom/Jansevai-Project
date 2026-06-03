import styles from "../styles/Members.module.css"
import GetIntial from "../components/GetIntial";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import socket from "../socket/socket.js";

function MemberCard({ member }) {
   const navigate = useNavigate();

   useEffect(() => {
   socket.on("new-member", (data) => {
      console.log(data);
   });
   return () => {
      socket.off("new-member");
   };

}, []);

  return (
    <div className={styles.memberCard} style={{animationDelay: `${member.id * 0.02}s`}}>

      {/* Avatar */}
      <div className={styles.avatarWrapper}>
        <div
          className={styles.avatarFallback}
          style={{ background: "rgba(228, 14, 14, 0.85)" }}
        >
          {GetIntial(member.username)}
        </div>
        <span
          className={`${styles.onlineDot} ${
            true ? styles.online : styles.offline
          }`}
        />
      </div>

      {/* Name */}
      <h3 className={styles.memberName}>{member.username}</h3>

      <span className={styles.roleBadge}>Volunteer</span>

      {/* Location */}
      <div className={styles.memberLocation}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
          <circle cx="12" cy="9" r="2.5" />
        </svg>
        {member.location}
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{member.contributions}</span>
          <span className={styles.statLabel}>Contributions</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{member.resolved}</span>
          <span className={styles.statLabel}>Resolved</span>
        </div>
        <div className={styles.statItem}>
          <span className={styles.statNum}>{member.reported}</span>
          <span className={styles.statLabel}>Reported</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className={styles.actionRow}>
        <button className={`${styles.actionBtn} ${styles.btnMessage}`}
                onClick={() => navigate(`/chat-box/${member.email}`, { 
            state: { member: member } 
          })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
          </svg>
          Message
        </button>
        <button className={`${styles.actionBtn} ${styles.btnProfile}`} 
                onClick={() => navigate(`/profile/${member.email}`, { 
                state: { member: member } 
              })}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
          Profile
        </button>
      </div>
    </div>
  );
}

export default MemberCard;
