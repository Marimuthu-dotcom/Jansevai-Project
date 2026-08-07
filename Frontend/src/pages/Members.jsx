import { useState, useMemo, useContext } from "react";
import styles from "../styles/Members.module.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/CreateContext";
import CM from "../assets/CM.jfif";
import {
  ClipboardList,
  RefreshCw,
  Users,
  CheckCircle2,
  Network,
  BadgeCheck,
  Loader2,
  AlertCircle,
} from "lucide-react";

const DISTRICTS = [
  "Ariyalur", "Chengalpattu", "Chennai", "Coimbatore", "Cuddalore",
  "Dharmapuri", "Dindigul", "Erode", "Kallakurichi", "Kanchipuram",
  "Kanyakumari", "Karur", "Krishnagiri", "Madurai", "Mayiladuthurai",
  "Nagapattinam", "Namakkal", "Nilgiris", "Perambalur", "Pudukkottai",
  "Ramanathapuram", "Ranipet", "Salem", "Sivaganga", "Tenkasi",
  "Thanjavur", "Theni", "Thoothukudi", "Tiruchirappalli", "Tirunelveli",
  "Tirupathur", "Tiruppur", "Tiruvallur", "Tiruvannamalai", "Tiruvarur",
  "Vellore", "Viluppuram", "Virudhunagar", "Other District"
];

/* ── UI Components ── */
function StatCard({ icon, label, value }) {
  return (
    <div className={styles.statCard}>
      <div className={styles.statIcon}>{icon}</div>
      <div className={styles.statInfo}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value.toLocaleString()}</span>
      </div>
    </div>
  );
}

function WardCard({ ward, selected, onClick }) {
  return (
    <div className={`${styles.wardCard} ${selected ? styles.wardCardActive : ""}`} onClick={onClick}>
      <div className={styles.wardIcon} style={{ backgroundColor: "#e0202015", color: "#e02020" }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className={styles.wardInfo}>
        <span className={styles.wardName}>{ward.ward_number ? `${ward.ward_number}th Ward` : ward.group_name}</span>
        <span className={styles.wardLocation}>{ward.area_locality}</span>
        <span className={styles.wardCount}>{ward.member_count || 0} Members</span>
      </div>
    </div>
  );
}

function MemberAvatar({ initials, color, status }) {
  return (
    <div className={styles.avatarWrap}>
      <div className={styles.avatarCircle} style={{ backgroundColor: color }}>{initials}</div>
      <span className={`${styles.statusDot} ${styles[status.toLowerCase()]}`} />
    </div>
  );
}

function RoleBadge({ role }) {
  return (
    <span className={`${styles.roleBadge} ${role === "Volunteer" ? styles.roleVolunteer : styles.roleMember}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  return (
    <span className={`${styles.statusBadge} ${Boolean(status) === true ? styles.statusActive : styles.statusInactive}`}>
      {Boolean(status) === true ? "Online" : "Offline"}
    </span>
  );
}

/* ── Main Page ── */
function Members() {
  const navigate = useNavigate();
  const { membersPage, handleDistrictChange, handleWardChange, handlePageChange, handleMemberFilterChange } = useContext(AuthContext);
  const {
    selectedDistrict,
    selectedWard,
    wards,
    currentGroup,
    tableMembers,
    isUngrouped,
    error,
    pagination,
    activeFilter,
    tabCounts
  } = membersPage;

  // const [activeTableTab, setActiveTableTab] = useState("All Members");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredMembers = useMemo(() => {
    let data = [...tableMembers];
    console.log("List of Members:",data);

    if (searchQuery.trim()) 
    {
      data = data.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    return data;
  }, [tableMembers,searchQuery]);

  const { currentPage, pageSize, totalCount, totalPages } = pagination;

  // "Showing 1 to 5 of 40 members"
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalCount);

  // Page numbers array [1, 2, 3, 4, 5, 6, 7, 8]
  const pageNumbers = Array.from({ length: totalPages }, (_, i) => i + 1);

  const TABLE_TABS = [
  { label: "All Members" ,filter: 'all'},
  { label: "Active",filter: 'active'},
  { label: "Admin", filter: 'admin' },
  { label: "Inactive",filter: 'inactive' },
];
  // ── Dynamic Stats ──
  const activeCount = tableMembers.filter(m => Boolean(m.is_online) === true).length;
  const totalReported = tableMembers.reduce((sum, m) => sum + (m.reported || 0), 0);
  const totalResolved = tableMembers.reduce((sum, m) => sum + (m.resolved || 0), 0);

  const adminInfo = currentGroup ? {
    name: currentGroup.councillor_name || "Unknown",
    role: "Group Admin",
    email: currentGroup.admin_email || "-",
    phone: currentGroup.councillor_contact || "-",
    avatar: currentGroup.logo_url || CM,
    } : { name: "No Admin", role: "-", email: "-", phone: "-", avatar: CM };

  return (
    <div className={styles.pageWrapper}>
      
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.pageTitle}>Members</h1>
          <svg className={styles.headerIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/>
          </svg>
          <p className={styles.pageSubtitle}>Manage and connect with your team across Tamil Nadu</p>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.inviteBtn} onClick={() => navigate("/invite-member")}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" width="16" height="16">
              <line x1="12" y1="5" x2="12" y2="19"/>
              <line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            Invite Member
          </button>
          <div className={styles.notifBell}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="20" height="20">
              <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
              <path d="M13.73 21a2 2 0 01-3.46 0"/>
            </svg>
            <span className={styles.notifBadge}>12</span>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={styles.statsRow}>
        <StatCard icon={<Users/>} label="Total Members" value={tabCounts.all || 0} />
        <StatCard icon={<BadgeCheck />} label="Active Members" value={tabCounts.active || 0} />
        <StatCard icon={<Network />} label="Groups" value={wards.length || 0} />
      </div>

      {/* District Selector */}
      <div className={styles.districtBar}>
        {DISTRICTS.map((d) => (
          <button
            key={d}
            className={`${styles.districtBtn} ${selectedDistrict?.toLowerCase() === d.toLowerCase() ? styles.districtBtnActive : ""}`}
            onClick={() => handleDistrictChange(d)}
          >
            {d}
          </button>
        ))}
      </div>

      

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, margin: "0 24px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Wards Section */}
      <div className={styles.wardsSection}>
        <h3 className={styles.wardsTitle}>
          {selectedDistrict || "Select District"} District - Counsillor Ward <span>({wards.length} Wards)</span>
        </h3>
        <div className={styles.wardsGrid}>
          {wards.length > 0 && wards.map((w) => (
            <WardCard
              key={w.id}
              ward={w}
              selected={selectedWard === w.ward_number}
              onClick={() => handleWardChange(w.ward_number)}
            />
          ))}

          <div className={`${styles.ungroupedCard} ${isUngrouped ? styles.wardCardActive : ""}`}>
            <div className={styles.ungroupedIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className={styles.ungroupedInfo}>
              <span className={styles.ungroupedName}>Ungrouped Members</span>
              <span className={styles.ungroupedCount}>
                {isUngrouped ? `${tableMembers.length} Members` : (wards.length === 0 ? "0 Members" : "No Wards")}
              </span>
            </div>
            <svg className={styles.ungroupedArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainContent}>

        {/* Left Panel */}
        <div className={styles.leftPanel}>
          <div className={styles.adminCard}>
            <span className={styles.adminTag}>Group Admin</span>
            <div className={styles.adminAvatar}>
              <img src={adminInfo.avatar} alt={adminInfo.name} />
              <span className={styles.adminOnline} />
            </div>
            <div className={styles.adminNameRow}>
              <h4>{adminInfo.name}</h4>
              <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="#e02020" width="16" height="16">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
              </svg>
            </div>
            <p className={styles.adminRole}>{adminInfo.role}</p>
            <div className={styles.adminContact}>
              <span>✉ {adminInfo.email}</span>
              <span>📞 {adminInfo.phone}</span>
            </div>
            <button className={styles.viewProfileBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              View Profile
            </button>
          </div>

          <div className={styles.overviewCard}>
            <h4>Group Overview</h4>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewItem}>
                <span className={styles.overviewIcon}><Users /></span>
                <span className={styles.overviewValue}>{tabCounts.all}</span>
                <span className={styles.overviewLabel}>Total Members</span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewIcon}><ClipboardList /></span>
                <span className={styles.overviewValue}>{totalReported}</span>
                <span className={styles.overviewLabel}>Complaints</span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewIcon}><CheckCircle2 /></span>
                <span className={styles.overviewValue}>{totalResolved}</span>
                <span className={styles.overviewLabel}>Resolved</span>
              </div>
              <div className={styles.overviewItem}>
                <span className={styles.overviewIcon}><RefreshCw /></span>
                <span className={styles.overviewValue}>{Math.max(0, totalReported - totalResolved)}</span>
                <span className={styles.overviewLabel}>In Progress</span>
              </div>
            </div>
            <button className={styles.analyticsBtn}>View Analytics →</button>
          </div>
        </div>

        {/* Right Panel */}
        <div className={styles.rightPanel}>
          <div className={styles.tableHeader}>
            <h3>
              {isUngrouped ? `Ungrouped Members in ${selectedDistrict}` : `Members in Ward ${selectedWard || "—"}`}
              <span>({membersPage.tabCounts.all || 0})</span>
            </h3>
            <div className={styles.tableActions}>
              <div className={styles.searchBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input type="text" placeholder="Search member..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
              </div>
              <button className={styles.filterBtn}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                  <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
                </svg>
                Filter
              </button>
              <button className={styles.moreBtn}>⋮</button>
            </div>
          </div>

          <div className={styles.filterTabs}>
            {TABLE_TABS.map((t) => (
              <button key={t.label} className={`${styles.filterTab} ${activeFilter=== t.filter ? styles.filterTabActive : ""}`} onClick={() => handleMemberFilterChange(t.filter)}>
                {t.label}
                <span className={styles.filterTabCount}>{membersPage.tabCounts[t.filter] || 0}</span>
              </button>
            ))}
          </div>

          <div className={styles.tableWrap}>
            <table className={styles.membersTable}>
              <thead>
                <tr><th>Member</th><th>Role</th><th>Joined On</th><th>Contact</th><th>Status</th><th>Activity</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                      {isUngrouped ? "No ungrouped members." : selectedWard ? "No members found." : "Select a ward."}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className={styles.memberCell}>
                          <MemberAvatar initials={m.initials} color={m.color} status={m.status} />
                          <div className={styles.memberCellInfo}>
                            <span className={styles.memberCellName}>{m.name}</span>
                            <span className={styles.memberCellEmail}>{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={m.role} /></td>
                      <td className={styles.cellMuted}>{m.joined}</td>
                      <td className={styles.cellMuted}>{m.contact}</td>
                      <td><StatusBadge status={m.is_online} /></td>
                      <td>
                        <div className={styles.activityCell}>
                          <span>Reported <b>{m.reported}</b></span>
                          <span>Resolved <b>{m.resolved}</b></span>
                        </div>
                      </td>
                      <td>
                        <div className={styles.actionCell}>
                          <button className={styles.msgBtn}>
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                              <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/>
                            </svg>
                          </button>
                          <button className={styles.moreRowBtn}>⋮</button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

           {totalPages > 0 && (
        <div className={styles.pagination}>
          <span className={styles.pageInfo}>
            Showing {startItem} to {endItem} of {totalCount} members
          </span>
          
          <div className={styles.pageControls}>
            {/* Previous Button */}
            <button 
              className={styles.pageBtn} 
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              style={{ opacity: currentPage === 1 ? 0.5 : 1, cursor: currentPage === 1 ? 'not-allowed' : 'pointer' }}
            >
              ⟨
            </button>

            {/* Page Numbers */}
            {pageNumbers.map((pageNum) => (
              <button
                key={pageNum}
                className={`${styles.pageBtn} ${currentPage === pageNum ? styles.pageBtnActive : ""}`}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </button>
            ))}

            {/* Next Button */}
            <button 
              className={styles.pageBtn}
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              style={{ opacity: currentPage === totalPages ? 0.5 : 1, cursor: currentPage === totalPages ? 'not-allowed' : 'pointer' }}
            >
              ⟩
            </button>
          </div>

          <div className={styles.pageSize}>
            <span>{currentPage} / {totalPages}</span>
          </div>
        </div>
      )}
        </div>
      </div>
    </div>
  );
}

export default Members;
