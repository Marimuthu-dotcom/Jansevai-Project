// src/pages/InviteMembers.jsx
import { useState ,useContext} from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/InviteMember.module.css";
import { AuthContext } from "../context/CreateContext";

function InviteMember() {
  const navigate = useNavigate();
  const { members } = useContext(AuthContext);
  const [searchTerm, setSearchTerm] = useState("");
  const [invitedMembers, setInvitedMembers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  const filteredMembers = members.filter(member =>
    member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getAvatarColor = (name) => {

  const firstLetter = name?.charAt(0).toUpperCase();

  if ("ABC".includes(firstLetter)) {
    return "linear-gradient(135deg, #e81b1b, #ad0a0a)";
  }
  else if ("DEF".includes(firstLetter)) {
    return "linear-gradient(135deg, #2f10fb, #69b9ee)";
  }
  else if ("GHI".includes(firstLetter)) {
    return "linear-gradient(135deg, #067622, #54f042)";
  }
  else if ("JKL".includes(firstLetter)) {
    return "linear-gradient(135deg, #bb0aa7, #ef6bef)";
  }
  else if ("MNO".includes(firstLetter)) {
    return "linear-gradient(135deg, #f07705, #efb010)";
  }
  else if ("PQR".includes(firstLetter)) {
    return "linear-gradient(135deg, #694105, #efc268)";
  }
  else if ("STU".includes(firstLetter)) {
    return "linear-gradient(135deg, #35ff08, #97fa8a)";
  }
  else {
    // VWXYZ
    return "linear-gradient(135deg, #2d3436, #636e72)";
  }
};

  const toggleMemberSelection = (memberId) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    );
  };

  // Handle invite button click
  const handleInvite = () => {
    const invited = members.filter(member => selectedMembers.includes(member.id));
    setInvitedMembers(invited);
    alert(`Invitation sent to ${invited.length} member(s)!`);
  };

  // Handle send invitation to a single member
  const handleSendInvite = (member) => {
    alert(`Invitation sent to ${member.username}!`);

  };

  return (
    <div className={styles.inviteContainer}>
      <div className={styles.mainContainer}>
       
        <div className={styles.pageHeader}>
          <div className={styles.pageTitleBlock}>
            <h1 className={styles.pageTitle}>Invite Members</h1>
            <p className={styles.pageSubtitle}>Search and invite members to your team</p>
          </div>
          
          <button 
            className={styles.backBtn}
            onClick={() => navigate("/members")}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          Back to Members
          </button>
        </div>

        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="8" strokeWidth="2" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
            </svg>
            <input
              type="text"
              placeholder="Search by name or location..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
            {searchTerm && (
              <button 
                className={styles.clearBtn}
                onClick={() => setSearchTerm("")}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
          </div>
        </div>

        <p className={styles.resultsCount}>
          Found <span>{filteredMembers.length}</span> member{filteredMembers.length !== 1 ? "s" : ""}
        </p>

        <div className={styles.membersGrid}>
          {filteredMembers.map((member, index) => (
            <div key={member.id} className={styles.memberInviteCard} style={{ animationDelay: `${index * 0.10}s` }}>
              <div className={styles.memberInfo}>
                <div 
                  className={styles.avatar}
                  style={{ background: getAvatarColor(member.username) }}
                >
                  {member.username.charAt(0)}
                </div>
                <div className={styles.memberDetails}>
                  <h3 className={styles.memberName}>{member.username}</h3>
                  <p className={styles.memberLocation}>{member.location}</p>
                  <div className={styles.memberStats}>
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                        <polyline points="22 4 12 14.01 9 11.01"></polyline>
                        </svg> {member.resolved} resolved
                    </span>
                    <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z"></path>
                            <path d="M4 20h16"></path>
                            </svg> {member.reported} reported
                    </span>
                  </div>
                </div>
              </div>
              
              <button 
                className={styles.inviteMemberBtn}
                onClick={() => handleSendInvite(member)}
              >
                Send Invite
              </button>
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {filteredMembers.length === 0 && (
          <div className={styles.noResults}>
            <p>No members found matching "{searchTerm}"</p>
            <button onClick={() => setSearchTerm("")}>Clear Search</button>
          </div>
        )}

        {/* Selected Members Section (Optional: For bulk invites) */}
        {selectedMembers.length > 0 && (
          <div className={styles.bulkInviteSection}>
            <p>{selectedMembers.length} member(s) selected</p>
            <button className={styles.bulkInviteBtn} onClick={handleInvite}>
              Invite Selected ({selectedMembers.length})
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteMember;