// // src/pages/InviteMembers.jsx
// import { useState ,useContext} from "react";
// import { useNavigate } from "react-router-dom";
// import styles from "../styles/InviteMember.module.css";
// import { AuthContext } from "../context/CreateContext";

// function InviteMember() {
//   const navigate = useNavigate();
//   const { members } = useContext(AuthContext);
//   const [searchTerm, setSearchTerm] = useState("");
//   const [invitedMembers, setInvitedMembers] = useState([]);
//   const [selectedMembers, setSelectedMembers] = useState([]);

//   const filteredMembers = members.filter(member =>
//     member.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
//     member.location.toLowerCase().includes(searchTerm.toLowerCase())
//   );

//   const getAvatarColor = (name) => {

//   const firstLetter = name?.charAt(0).toUpperCase();

//   if ("ABC".includes(firstLetter)) {
//     return "linear-gradient(135deg, #e81b1b, #ad0a0a)";
//   }
//   else if ("DEF".includes(firstLetter)) {
//     return "linear-gradient(135deg, #2f10fb, #69b9ee)";
//   }
//   else if ("GHI".includes(firstLetter)) {
//     return "linear-gradient(135deg, #067622, #54f042)";
//   }
//   else if ("JKL".includes(firstLetter)) {
//     return "linear-gradient(135deg, #bb0aa7, #ef6bef)";
//   }
//   else if ("MNO".includes(firstLetter)) {
//     return "linear-gradient(135deg, #f07705, #efb010)";
//   }
//   else if ("PQR".includes(firstLetter)) {
//     return "linear-gradient(135deg, #694105, #efc268)";
//   }
//   else if ("STU".includes(firstLetter)) {
//     return "linear-gradient(135deg, #35ff08, #97fa8a)";
//   }
//   else {
//     // VWXYZ
//     return "linear-gradient(135deg, #2d3436, #636e72)";
//   }
// };


//   // Handle invite button click
//   const handleInvite = () => {
//     const invited = members.filter(member => selectedMembers.includes(member.id));
//     setInvitedMembers(invited);
//     alert(`Invitation sent to ${invited.length} member(s)!`);
//   };

//   // Handle send invitation to a single member
//   const handleSendInvite = (member) => {
//     alert(`Invitation sent to ${member.username}!`);

//   };

//   return (
//     <div className={styles.inviteContainer}>
//       <div className={styles.mainContainer}>
       
//         <div className={styles.pageHeader}>
//           <div className={styles.pageTitleBlock}>
//             <h2 className={styles.pageTitle}>Invite Members</h2>
//             <p className={styles.pageSubtitle}>Search and invite members to your team</p>
//           </div>
          
//           <button 
//             className={styles.backBtn}
//             onClick={() => navigate("/members")}
//           >
//             <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
//                 <line x1="19" y1="12" x2="5" y2="12"></line>
//                 <polyline points="12 19 5 12 12 5"></polyline>
//             </svg>
//           Back to Members
//           </button>
//         </div>

//         <div className={styles.searchSection}>
//           <div className={styles.searchBox}>
//             <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor">
//               <circle cx="11" cy="11" r="8" strokeWidth="2" />
//               <line x1="21" y1="21" x2="16.65" y2="16.65" strokeWidth="2" />
//             </svg>
//             <input
//               type="text"
//               placeholder="Search by name or location..."
//               value={searchTerm}
//               onChange={(e) => setSearchTerm(e.target.value)}
//               className={styles.searchInput}
//             />
//             {searchTerm && (
//               <button 
//                 className={styles.clearBtn}
//                 onClick={() => setSearchTerm("")}
//               >
//                 <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
//                     <line x1="18" y1="6" x2="6" y2="18"></line>
//                     <line x1="6" y1="6" x2="18" y2="18"></line>
//                 </svg>
//               </button>
//             )}
//           </div>
//         </div>

//         <p className={styles.resultsCount}>
//           Found <span>{filteredMembers.length}</span> member{filteredMembers.length !== 1 ? "s" : ""}
//         </p>

//         <div className={styles.membersGrid}>
//           {filteredMembers.map((member, index) => (
//             <div key={member.id} className={styles.memberInviteCard} style={{ animationDelay: `${index * 0.10}s` }}>
//               <div className={styles.memberInfo}>
//                 <div 
//                   className={styles.avatar}
//                   style={{ background: getAvatarColor(member.username) }}
//                 >
//                   {member.username.charAt(0)}
//                 </div>
//                 <div className={styles.memberDetails}>
//                   <h3 className={styles.memberName}>{member.username}</h3>
//                   <p className={styles.memberLocation}>{member.location}</p>
//                   <div className={styles.memberStats}>
//                     <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
//                         <polyline points="22 4 12 14.01 9 11.01"></polyline>
//                         </svg> {member.resolved} resolved
//                     </span>
//                     <span><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//                             <path d="M17 3l4 4-7 7H10v-4l7-7z"></path>
//                             <path d="M4 20h16"></path>
//                             </svg> {member.reported} reported
//                     </span>
//                   </div>
//                 </div>
//               </div>
              
//               <button 
//                 className={styles.inviteMemberBtn}
//                 onClick={() => handleSendInvite(member)}
//               >
//                 Send Invite
//               </button>
//             </div>
//           ))}
//         </div>

//         {/* No Results Message */}
//         {filteredMembers.length === 0 && (
//           <div className={styles.noResults}>
//             <p>No members found matching "{searchTerm}"</p>
//             <button onClick={() => setSearchTerm("")}>Clear Search</button>
//           </div>
//         )}

//         {/* Selected Members Section (Optional: For bulk invites) */}
//         {selectedMembers.length > 0 && (
//           <div className={styles.bulkInviteSection}>
//             <p>{selectedMembers.length} member(s) selected</p>
//             <button className={styles.bulkInviteBtn} onClick={handleInvite}>
//               Invite Selected ({selectedMembers.length})
//             </button>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

// export default InviteMember;

// src/pages/InviteMembers.jsx
// src/pages/InviteMembers.jsx
import { useState, useContext, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import styles from "../styles/InviteMember.module.css";
import { AuthContext } from "../context/CreateContext";

// Tamil Nadu Districts (39)
const TAMIL_NADU_DISTRICTS = [
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
  "Virudhunagar"
];

// Ward numbers (1-200)
const WARD_NUMBERS = [
  "All Wards",
  ...Array.from({ length: 200 }, (_, i) => `Ward ${i + 1}`)
];

function InviteMember() {
  const navigate = useNavigate();
  const { members } = useContext(AuthContext);
  
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDistrict, setSelectedDistrict] = useState("All Districts");
  const [selectedRole, setSelectedRole] = useState("All Roles");
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [selectedWard, setSelectedWard] = useState("All Wards");
  const [sortBy, setSortBy] = useState("Name: A-Z");

  // Get unique roles for filters
  const roles = useMemo(() => {
    const roleSet = new Set(members.map(m => m.role || "Member"));
    return ["All Roles", ...Array.from(roleSet)];
  }, [members]);

  // Get status options
  const statusOptions = ["All Status", "Online", "Offline"];

  // Filter and sort members
  const filteredMembers = useMemo(() => {
    let result = [...members];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(m => 
        m.username?.toLowerCase().includes(term) ||
        m.location?.toLowerCase().includes(term) ||
        m.role?.toLowerCase().includes(term) ||
        m.ward?.toLowerCase().includes(term)
      );
    }

    // District filter
    if (selectedDistrict !== "All Districts") {
      result = result.filter(m => m.location === selectedDistrict);
    }

    // Role filter
    if (selectedRole !== "All Roles") {
      result = result.filter(m => m.role === selectedRole);
    }

    // Status filter
    if (selectedStatus === "Online") {
      result = result.filter(m => m.is_online === true);
    } else if (selectedStatus === "Offline") {
      result = result.filter(m => m.is_online === false);
    }

    // Ward filter
    if (selectedWard !== "All Wards") {
      const wardNumber = parseInt(selectedWard.replace("Ward ", ""));
      result = result.filter(m => parseInt(m.ward_number) === wardNumber);
    }

    // Sorting
    if (sortBy === "Name: A-Z") {
      result.sort((a, b) => (a.username || "").localeCompare(b.username || ""));
    } else if (sortBy === "Name: Z-A") {
      result.sort((a, b) => (b.username || "").localeCompare(a.username || ""));
    } else if (sortBy === "Most Active") {
      result.sort((a, b) => (b.resolved || 0) - (a.resolved || 0));
    }

    return result;
  }, [members, searchTerm, selectedDistrict, selectedRole, selectedStatus, selectedWard, sortBy]);

  const getAvatarColor = (name) => {
    const firstLetter = name?.charAt(0).toUpperCase() || "A";
    const colors = {
      'A': "linear-gradient(135deg, #e81b1b, #ad0a0a)",
      'B': "linear-gradient(135deg, #e81b1b, #ad0a0a)",
      'C': "linear-gradient(135deg, #e81b1b, #ad0a0a)",
      'D': "linear-gradient(135deg, #2f10fb, #69b9ee)",
      'E': "linear-gradient(135deg, #2f10fb, #69b9ee)",
      'F': "linear-gradient(135deg, #2f10fb, #69b9ee)",
      'G': "linear-gradient(135deg, #067622, #54f042)",
      'H': "linear-gradient(135deg, #067622, #54f042)",
      'I': "linear-gradient(135deg, #067622, #54f042)",
      'J': "linear-gradient(135deg, #bb0aa7, #ef6bef)",
      'K': "linear-gradient(135deg, #bb0aa7, #ef6bef)",
      'L': "linear-gradient(135deg, #bb0aa7, #ef6bef)",
      'M': "linear-gradient(135deg, #f07705, #efb010)",
      'N': "linear-gradient(135deg, #f07705, #efb010)",
      'O': "linear-gradient(135deg, #f07705, #efb010)",
      'P': "linear-gradient(135deg, #694105, #efc268)",
      'Q': "linear-gradient(135deg, #694105, #efc268)",
      'R': "linear-gradient(135deg, #694105, #efc268)",
      'S': "linear-gradient(135deg, #35ff08, #97fa8a)",
      'T': "linear-gradient(135deg, #35ff08, #97fa8a)",
      'U': "linear-gradient(135deg, #35ff08, #97fa8a)",
      'V': "linear-gradient(135deg, #2d3436, #636e72)",
      'W': "linear-gradient(135deg, #2d3436, #636e72)",
      'X': "linear-gradient(135deg, #2d3436, #636e72)",
      'Y': "linear-gradient(135deg, #2d3436, #636e72)",
      'Z': "linear-gradient(135deg, #2d3436, #636e72)",
    };
    return colors[firstLetter] || "linear-gradient(135deg, #2d3436, #636e72)";
  };

  const getInitials = (name) => {
    if (!name) return "?";
    return name.charAt(0).toUpperCase();
  };

  const handleSendInvite = (member) => {
    alert(`Invitation sent to ${member.username}!`);
  };

  const clearAllFilters = () => {
    setSearchTerm("");
    setSelectedDistrict("All Districts");
    setSelectedRole("All Roles");
    setSelectedStatus("All Status");
    setSelectedWard("All Wards");
  };

  const hasActiveFilters = () => {
    return searchTerm || 
           selectedDistrict !== "All Districts" || 
           selectedRole !== "All Roles" || 
           selectedStatus !== "All Status" || 
           selectedWard !== "All Wards";
  };

  return (
    <div className={styles.inviteContainer}>
      <div className={styles.mainContainer}>
        {/* Header */}
        <div className={styles.pageHeader}>
          <div className={styles.pageTitleBlock}>
            <h2 className={styles.pageTitle}>Invite Members</h2>
            <p className={styles.pageSubtitle}>Find and invite members from your community</p>
          </div>
          <button 
            className={styles.backBtn}
            onClick={() => navigate("/members")}
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
            Back to Members
          </button>
        </div>

        {/* Search Bar */}
        <div className={styles.searchSection}>
          <div className={styles.searchBox}>
            <svg className={styles.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              placeholder="Search by name, role, district, or ward..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={styles.searchInput}
            />
          </div>
        </div>

        {/* Filter Row */}
        <div className={styles.filterRow}>
          <div className={styles.filterGroup}>
            {/* District Dropdown - 39 Districts */}
            <select 
              className={styles.filterSelect}
              value={selectedDistrict}
              onChange={(e) => setSelectedDistrict(e.target.value)}
            >
              {TAMIL_NADU_DISTRICTS.map(district => (
                <option key={district} value={district}>{district}</option>
              ))}
            </select>

            {/* Ward Dropdown */}
            <select 
              className={styles.filterSelect}
              value={selectedWard}
              onChange={(e) => setSelectedWard(e.target.value)}
            >
              {WARD_NUMBERS.map(ward => (
                <option key={ward} value={ward}>{ward}</option>
              ))}
            </select>

            {/* Role Dropdown */}
            <select 
              className={styles.filterSelect}
              value={selectedRole}
              onChange={(e) => setSelectedRole(e.target.value)}
            >
              {roles.map(role => (
                <option key={role} value={role}>{role}</option>
              ))}
            </select>

            {/* Status Dropdown */}
            <select 
              className={styles.filterSelect}
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              {statusOptions.map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </div>

          {hasActiveFilters() && (
            <button className={styles.clearFiltersBtn} onClick={clearAllFilters}>
              Clear all
            </button>
          )}
        </div>

        {/* Results Info */}
        <div className={styles.resultsBar}>
          <p className={styles.resultsCount}>
            Showing <span>{filteredMembers.length}</span> of {members.length} members
          </p>
          <div className={styles.sortGroup}>
            <label>Sort by:</label>
            <select 
              className={styles.sortSelect}
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="Name: A-Z">Name: A-Z</option>
              <option value="Name: Z-A">Name: Z-A</option>
              <option value="Most Active">Most Active</option>
            </select>
          </div>
        </div>

        {/* Members Grid */}
        <div className={styles.membersGrid}>
          {filteredMembers.map((member, index) => {
            const isOnline = member.is_online === true;
            return (
              <div 
                key={member.id} 
                className={styles.memberInviteCard} 
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <div className={styles.cardHeader}>
                  <div className={styles.statusBadge}>
                    <span className={`${styles.statusDot} ${isOnline ? styles.statusOnline : styles.statusOffline}`} />
                    <span className={styles.statusText}>{isOnline ? "Online" : "Offline"}</span>
                  </div>
                </div>
                
                <div className={styles.cardBody}>
                  <div className={styles.memberInfo}>
                    <div 
                      className={styles.avatar}
                      style={{ background: getAvatarColor(member.username) }}
                    >
                      {getInitials(member.username)}
                    </div>
                    <div className={styles.memberDetails}>
                      <h3 className={styles.memberName}>{member.username || "Unknown"}</h3>
                      <p className={styles.memberRole}>{member.role || "Member"}</p>
                      <p className={styles.memberLocation}>
                        <span className={styles.locationIcon}>📍</span>
                        {member.location || "Unknown"} 
                        {member.ward_number && ` • Ward ${member.ward_number}`}
                      </p>
                      <div className={styles.memberStats}>
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                            <polyline points="22 4 12 14.01 9 11.01" />
                          </svg> 
                          {member.resolved || 0} resolved
                        </span>
                        <span>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M17 3l4 4-7 7H10v-4l7-7z" />
                            <path d="M4 20h16" />
                          </svg> 
                          {member.reported || 0} reported
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className={styles.cardActions}>
                  <button 
                    className={styles.inviteMemberBtn}
                    onClick={() => handleSendInvite(member)}
                  >
                    Send Invite
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* No Results */}
        {filteredMembers.length === 0 && (
          <div className={styles.noResults}>
            <div className={styles.noResultsIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" width="48" height="48">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            <h3>No members found</h3>
            <p>We couldn't find any members matching your search criteria.</p>
            <button className={styles.clearAllFiltersBtn} onClick={clearAllFilters}>
              Clear all filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default InviteMember;