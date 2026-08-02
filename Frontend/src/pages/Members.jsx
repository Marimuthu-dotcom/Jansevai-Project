import { useState, useMemo, useEffect, useCallback } from "react";
import styles from "../styles/Members.module.css";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/CreateContext";
import CM from "../../../Backend/uploads/complaintImages/1785425536971-350414623.jfif";
import api from "../api/api.js";
import { 
  ClipboardList, 
  RefreshCw, 
  Users, 
  CheckCircle2,
  Network,
  BadgeCheck
} from "lucide-react";

/* ── Static Data ────────────────────────────────────────────── */
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

const TABLE_TABS = [
  { label: "All Members" },
  { label: "Active" },
  { label: "Volunteers" },
  { label: "Admins" },
  { label: "Inactive" },
];

/* ── Helpers ────────────────────────────────────────────────── */
function getInitials(name) {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
}

function getColor(str) {
  const colors = ["#fca5a5", "#93c5fd", "#c4b5fd", "#fde047", "#f9a8d4", "#86efac", "#fdba74", "#a5f3fc"];
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getWardColor(id) {
  const colors = ["#e02020", "#2563eb", "#16a34a", "#9333ea", "#ea580c", "#0891b2", "#db2777", "#7c3aed"];
  return colors[(id % colors.length)];
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/* ── Components ─────────────────────────────────────────────── */
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
    <div
      className={`${styles.wardCard} ${selected ? styles.wardCardActive : ""}`}
      onClick={onClick}
    >
      <div className={styles.wardIcon} style={{ backgroundColor: ward.color + "15", color: ward.color }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className={styles.wardInfo}>
        <span className={styles.wardName}>{ward.name}</span>
        <span className={styles.wardLocation}>{ward.location}</span>
        <span className={styles.wardCount}>{ward.members} Members</span>
      </div>
    </div>
  );
}

function MemberAvatar({ initials, color, status }) {
  return (
    <div className={styles.avatarWrap}>
      <div className={styles.avatarCircle} style={{ backgroundColor: color }}>
        {initials}
      </div>
      <span className={`${styles.statusDot} ${styles[status.toLowerCase()]}`} />
    </div>
  );
}

function RoleBadge({ role }) {
  const isVolunteer = role === "Volunteer";
  return (
    <span className={`${styles.roleBadge} ${isVolunteer ? styles.roleVolunteer : styles.roleMember}`}>
      {role}
    </span>
  );
}

function StatusBadge({ status }) {
  const active = status === "Active";
  return (
    <span className={`${styles.statusBadge} ${active ? styles.statusActive : styles.statusInactive}`}>
      {status}
    </span>
  );
}

/* ── Main Page ──────────────────────────────────────────────── */
function Members() {
  const { user, wardsByDistrict } = useContext(AuthContext);
  const navigate = useNavigate();

  const [selectedDistrict, setSelectedDistrict] = useState(null);
  const [selectedWardId,   setSelectedWardId]   = useState(null); // number | 'ungrouped'
  const [groupDetails,     setGroupDetails]     = useState(null);
  const [groupMembers,     setGroupMembers]     = useState([]);
  const [membersLoading,   setMembersLoading]   = useState(false);
  const [activeTableTab,   setActiveTableTab]   = useState("All Members");
  const [searchQuery,      setSearchQuery]      = useState("");
  const [initialSetupDone, setInitialSetupDone] = useState(false);

  const currentWards = wardsByDistrict[selectedDistrict] || [];
  const selectedWardObj = currentWards.find(w => w.id === selectedWardId);

  /* ── Select Ungrouped ── */
  const selectUngrouped = useCallback((district) => {
    setSelectedDistrict(district);
    setSelectedWardId('ungrouped');
    setActiveTableTab("All Members");
    setSearchQuery("");
    setGroupDetails(null);
    setGroupMembers([]);
  }, []);

  /* ── API: Select a real ward ── */
  const handleWardSelect = useCallback(async (ward, district) => {
    setSelectedDistrict(district);
    setSelectedWardId(ward.id);
    setActiveTableTab("All Members");
    setSearchQuery("");
    setMembersLoading(true);
    try {
      const [groupRes, membersRes] = await Promise.all([
        api.get(`/api/groups/ward/${district}/${ward.ward_number}`),
        api.get(`/api/groups/${ward.id}/members`),
      ]);
      setGroupDetails(groupRes.data);
      setGroupMembers(membersRes.data.members || []);
    } catch (err) {
      console.log("Ward select error:", err);
      setGroupDetails(null);
      setGroupMembers([]);
    } finally {
      setMembersLoading(false);
    }
  }, []);

  /* ── Click a district tab ── */
  const handleDistrictSelect = useCallback((district) => {
    const wards = wardsByDistrict[district] || [];
    if (wards.length > 0) {
      handleWardSelect(wards[0], district);
    } else {
      selectUngrouped(district);
    }
  }, [wardsByDistrict, handleWardSelect, selectUngrouped]);

  /* ── Auto-select user's own group on first load ── */
  useEffect(() => {
    if (initialSetupDone) return;
    if (!user || !wardsByDistrict || Object.keys(wardsByDistrict).length === 0) return;

    let targetDistrict = null;
    let targetWard = null;

    // If user belongs to a district, try to locate their ward
    if (user.district) {
      targetDistrict = user.district;
      const districtWards = wardsByDistrict[targetDistrict] || [];
      if (user.ward_number) {
        targetWard = districtWards.find(
          w => String(w.ward_number) === String(user.ward_number)
        );
      }
    }

    if (targetDistrict && targetWard) {
      // User has a real ward group → open it
      handleWardSelect(targetWard, targetDistrict);
    } else if (targetDistrict) {
      // User has district but no ward (or ward not in DB yet)
      const wards = wardsByDistrict[targetDistrict] || [];
      if (wards.length > 0) {
        handleWardSelect(wards[0], targetDistrict);
      } else {
        selectUngrouped(targetDistrict);
      }
    } else {
      // User has no district info → default to first static district
      const firstDistrict = DISTRICTS[0];
      const wards = wardsByDistrict[firstDistrict] || [];
      if (wards.length > 0) {
        handleWardSelect(wards[0], firstDistrict);
      } else {
        selectUngrouped(firstDistrict);
      }
    }

    setInitialSetupDone(true);
  }, [user, wardsByDistrict, initialSetupDone, handleWardSelect, selectUngrouped]);

  /* ── Derived: filter & counts ── */
  const filteredMembers = useMemo(() => {
    let data = groupMembers;
    if (activeTableTab === "Active")      data = data.filter(m => m.status === "Active");
    if (activeTableTab === "Volunteers")  data = data.filter(m => m.role === "Volunteer");
    if (activeTableTab === "Admins")      data = data.filter(m => m.role === "Admin");
    if (activeTableTab === "Inactive")    data = data.filter(m => m.status === "Inactive");
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      data = data.filter(m =>
        (m.username?.toLowerCase().includes(q)) ||
        (m.email?.toLowerCase().includes(q))
      );
    }
    return data;
  }, [activeTableTab, searchQuery, groupMembers]);

  const tabCounts = useMemo(() => ({
    "All Members": groupMembers.length,
    "Active":      groupMembers.filter(m => m.status === "Active").length,
    "Volunteers":  groupMembers.filter(m => m.role === "Volunteer").length,
    "Admins":      groupMembers.filter(m => m.role === "Admin").length,
    "Inactive":    groupMembers.filter(m => m.status === "Inactive").length,
  }), [groupMembers]);

  const groupStats = useMemo(() => [
    { label: "Total Members", value: groupMembers.length, icon: <Users /> },
    { label: "Complaints",    value: groupMembers.reduce((s, m) => s + (m.reported || 0), 0), icon: <ClipboardList /> },
    { label: "Resolved",      value: groupMembers.reduce((s, m) => s + (m.resolved || 0), 0), icon: <CheckCircle2 /> },
    { label: "In Progress",   value: groupMembers.reduce((s, m) => s + ((m.reported || 0) - (m.resolved || 0)), 0), icon: <RefreshCw /> },
  ], [groupMembers]);

  const isUngrouped = selectedWardId === 'ungrouped';

  return (
    <div className={styles.pageWrapper}>
      
      {/* ── Header ── */}
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

      {/* ── Stats Row ── */}
      <div className={styles.statsRow}>
        <StatCard icon={<Users/>} label="Total Members" value={groupMembers.length} />
        <StatCard icon={<BadgeCheck />} label="Active Members" value={groupMembers.filter(m => m.status === "Active").length} />
        <StatCard icon={<Network />} label="Groups" value={currentWards.length} />
      </div>

      {/* ── District Selector (STATIC) ── */}
      <div className={styles.districtBar}>
        {DISTRICTS.map((d) => (
          <button
            key={d}
            className={`${styles.districtBtn} ${selectedDistrict === d ? styles.districtBtnActive : ""}`}
            onClick={() => handleDistrictSelect(d)}
          >
            {d}
          </button>
        ))}
      </div>

      {/* ── Wards Section ── */}
      <div className={styles.wardsSection}>
        <h3 className={styles.wardsTitle}>
          {selectedDistrict || "District"} District - Counsillor Ward <span>(Councillor Wards)</span>
        </h3>
        <div className={styles.wardsGrid}>
          {/* Dynamic wards for the selected district */}
          {currentWards.map((w) => (
            <WardCard
              key={w.id}
              ward={{
                id: w.id,
                name: w.group_name || `Ward ${w.ward_number}`,
                location: w.area_locality || w.group_name,
                members: w.member_count,
                color: getWardColor(w.id),
                icon: "🏛️"
              }}
              selected={selectedWardId === w.id}
              onClick={() => handleWardSelect(w, selectedDistrict)}
            />
          ))}

          {/* Ungrouped card — ALWAYS rendered */}
          <div
            className={`${styles.ungroupedCard} ${isUngrouped ? styles.wardCardActive : ""}`}
            onClick={() => selectUngrouped(selectedDistrict)}
          >
            <div className={styles.ungroupedIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className={styles.ungroupedInfo}>
              <span className={styles.ungroupedName}>Ungrouped Members</span>
              <span className={styles.ungroupedCount}>0 Members</span>
            </div>
            <svg className={styles.ungroupedArrow} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
              <polyline points="9 18 15 12 9 6"/>
            </svg>
          </div>
        </div>
      </div>

      {/* ── Main Content: Left + Right ── */}
      <div className={styles.mainContent}>

        {/* ── Left Panel ── */}
        <div className={styles.leftPanel}>
          
          {/* Admin Card */}
          <div className={styles.adminCard}>
            <span className={styles.adminTag}>Group Admin</span>
            <div className={styles.adminAvatar}>
              <img 
                src={groupDetails?.admin_avatar || CM} 
                alt={groupDetails?.admin_name || "Admin"} 
              />
              <span className={styles.adminOnline} />
            </div>
            <div className={styles.adminNameRow}>
              <h4>{groupDetails?.admin_name || (isUngrouped ? "No Admin" : "—")}</h4>
              {!isUngrouped && (
                <svg className={styles.shieldIcon} viewBox="0 0 24 24" fill="#e02020" width="16" height="16">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              )}
            </div>
            <p className={styles.adminRole}>{groupDetails?.admin_role || "Group Admin"}</p>
            <div className={styles.adminContact}>
              <span>✉ {groupDetails?.admin_email || "—"}</span>
              <span>📞 {groupDetails?.admin_phone || "—"}</span>
            </div>
            <button className={styles.viewProfileBtn}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
              </svg>
              View Profile
            </button>
          </div>

          {/* Group Overview */}
          <div className={styles.overviewCard}>
            <h4>Group Overview</h4>
            <div className={styles.overviewGrid}>
              {groupStats.map((s, i) => (
                <div key={i} className={styles.overviewItem}>
                  <span className={styles.overviewIcon}>{s.icon}</span>
                  <span className={styles.overviewValue}>{s.value}</span>
                  <span className={styles.overviewLabel}>{s.label}</span>
                </div>
              ))}
            </div>
            <button className={styles.analyticsBtn}>
              View Analytics →
            </button>
          </div>

        </div>

        {/* ── Right Panel ── */}
        <div className={styles.rightPanel}>
          
          {/* Table Header */}
          <div className={styles.tableHeader}>
            <h3>
              {isUngrouped 
                ? "Ungrouped Members" 
                : `Members in Ward ${selectedWardObj?.ward_number || selectedWardId || ""}`
              } 
              <span>({groupMembers.length})</span>
            </h3>
            <div className={styles.tableActions}>
              <div className={styles.searchBox}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="16" height="16">
                  <circle cx="11" cy="11" r="8"/>
                  <line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
                <input
                  type="text"
                  placeholder="Search member..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
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

          {/* Filter Tabs */}
          <div className={styles.filterTabs}>
            {TABLE_TABS.map((t) => (
              <button
                key={t.label}
                className={`${styles.filterTab} ${activeTableTab === t.label ? styles.filterTabActive : ""}`}
                onClick={() => setActiveTableTab(t.label)}
              >
                {t.label}
                <span className={styles.filterTabCount}>{tabCounts[t.label] || 0}</span>
              </button>
            ))}
          </div>

          {/* Members Table */}
          <div className={styles.tableWrap}>
            <table className={styles.membersTable}>
              <thead>
                <tr>
                  <th>Member</th>
                  <th>Role</th>
                  <th>Joined On</th>
                  <th>Contact</th>
                  <th>Status</th>
                  <th>Activity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {membersLoading ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                      Loading members...
                    </td>
                  </tr>
                ) : filteredMembers.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "40px", color: "#888" }}>
                      {isUngrouped ? "No ungrouped members" : "No members found"}
                    </td>
                  </tr>
                ) : (
                  filteredMembers.map((m) => (
                    <tr key={m.id}>
                      <td>
                        <div className={styles.memberCell}>
                          <MemberAvatar initials={getInitials(m.username)} color={getColor(m.email)} status={m.status} />
                          <div className={styles.memberCellInfo}>
                            <span className={styles.memberCellName}>{m.username}</span>
                            <span className={styles.memberCellEmail}>{m.email}</span>
                          </div>
                        </div>
                      </td>
                      <td><RoleBadge role={m.role} /></td>
                      <td className={styles.cellMuted}>{formatDate(m.joined_at)}</td>
                      <td className={styles.cellMuted}>{m.contact || "—"}</td>
                      <td><StatusBadge status={m.status} /></td>
                      <td>
                        <div className={styles.activityCell}>
                          <span>Reported <b>{m.reported || 0}</b></span>
                          <span>Resolved <b>{m.resolved || 0}</b></span>
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

          {/* Pagination */}
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Showing {groupMembers.length > 0 ? 1 : 0} to {filteredMembers.length} of {groupMembers.length} members
            </span>
            <div className={styles.pageControls}>
              <button className={styles.pageBtn}>⟨</button>
              <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
              <button className={styles.pageBtn}>⟩</button>
            </div>
            <div className={styles.pageSize}>
              <span>1 / page</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="12" height="12">
                <polyline points="6 9 12 15 18 9"/>
              </svg>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Members;