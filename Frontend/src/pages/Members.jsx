import { useState, useMemo, useEffect, useCallback } from "react";
import styles from "../styles/Members.module.css";
import { useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/CreateContext";
import CM from "../../../Backend/uploads/complaintImages/1785425536971-350414623.jfif";
import api from "../api/api.js"; // Your axios instance
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

/* ─────────────────────────────────────────────
   STATIC DATA
   ───────────────────────────────────────────── */
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
  { label: "All Members", count: 0 },
  { label: "Active", count: 0 },
  { label: "Volunteers", count: 0 },
  { label: "Admins", count: 0 },
  { label: "Inactive", count: 0 },
];

/* ─────────────────────────────────────────────
   API SERVICE (Exact match to your backend)
   ───────────────────────────────────────────── */
const groupApi = {
  /** GET /api/groups/district/:district/wards */
  getWardsByDistrict: async (district) => {
    const res = await api.get(`/api/auth/district/${encodeURIComponent(district)}/wards`);
    return res.data; // { wards: [{ id, ward_number, district, group_name, ... }, ...] }
  },

  /** GET /api/groups/ward/:district/:wardNumber */
  getGroupByWard: async (district, wardNumber) => {
    const res = await api.get(`/api/auth/ward/${encodeURIComponent(district)}/${wardNumber}`);
    return res.data; // { id, ward_number, district, admin_name, admin_email, admin_phone, admin_role, ... }
  },

  /** GET /api/groups/:groupId/members */
  getGroupMembers: async (groupId) => {
    const res = await api.get(`/api/auth/${groupId}/members`);
    return res.data; // { members: [{ id, username, email, role, status, joined_at, contact, reported, resolved }, ...] }
  },

  /** GET /api/groups/district/:district/ungrouped-members 
   *  (Create this endpoint in backend if not exists)
   */
  getUngroupedMembers: async (district) => {
    const res = await api.get(`/api/auth/district/${encodeURIComponent(district)}/ungrouped-members`);
    return res.data; // { members: [...] }
  },
};

/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

// Generate avatar color from email string
const getAvatarColor = (email) => {
  const colors = ["#fca5a5", "#93c5fd", "#c4b5fd", "#fde047", "#f9a8d4", "#86efac", "#fdba74", "#67e8f9"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

// Get initials from username
const getInitials = (name) => {
  if (!name) return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

// Format date from MySQL datetime
const formatDate = (mysqlDate) => {
  if (!mysqlDate) return "-";
  const d = new Date(mysqlDate);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// Transform backend member → frontend table format
const transformMember = (m) => ({
  id: m.id,
  name: m.username || "Unknown",
  email: m.email,
  initials: getInitials(m.username),
  color: getAvatarColor(m.email),
  role: m.role || "Member",
  joined: formatDate(m.joined_at),
  contact: m.contact || "-",
  status: m.status || "Active",
  reported: m.reported || 0,
  resolved: m.resolved || 0,
});

/* ─────────────────────────────────────────────
   UI COMPONENTS
   ───────────────────────────────────────────── */

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
      <div className={styles.wardIcon} style={{ backgroundColor: "#e0202015", color: "#e02020" }}>
        <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div className={styles.wardInfo}>
        <span className={styles.wardName}>{ward.ward_number ? `${ward.ward_number}th Ward` : ward.group_name}</span>
        <span className={styles.wardLocation}>{ward.district}</span>
        <span className={styles.wardCount}>{ward.members_count || 0} Members</span>
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

/* ─────────────────────────────────────────────
   MAIN MEMBERS PAGE
   ───────────────────────────────────────────── */

function Members() {
  const { user } = useContext(AuthContext); // { id, email, district, ward }
  const navigate = useNavigate();

  /* ── Selection States ── */
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [selectedWard, setSelectedWard] = useState(null); // ward_number (string)
  
  /* ── Data States ── */
  const [wards, setWards] = useState([]);               // from ward_groups table
  const [currentGroup, setCurrentGroup] = useState(null); // group object from getGroupByWard
  const [tableMembers, setTableMembers] = useState([]); // transformed members
  const [isUngrouped, setIsUngrouped] = useState(false);

  /* ── UI States ── */
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeTableTab, setActiveTableTab] = useState("All Members");
  const [searchQuery, setSearchQuery] = useState("");
  const [isInitialized, setIsInitialized] = useState(false);

  /* ═══════════════════════════════════════════
     STEP 1: INITIALIZE ON WEBSITE LOAD
     Runs ONLY when user data is available.
     Does NOT depend on selectedDistrict/selectedWard.
     ═══════════════════════════════════════════ */
  useEffect(() => {
    if (!user || isInitialized) return;

    const initializeMemberPage = async () => {
      setLoading(true);
      setError(null);

      try {
        // 1. Read user's district and ward from AuthContext
        const userDistrict = user.district || "";
        const userWard = user.ward || null;

        if (!userDistrict) {
          throw new Error("User district not found");
        }

        // 2. Set selected district in UI
        setSelectedDistrict(userDistrict);

        // 3. Fetch wards for user's district from ward_groups table
        const wardsData = await groupApi.getWardsByDistrict(userDistrict);
        const districtWards = wardsData.wards || [];
        setWards(districtWards);

        // 4. If district has wards
        if (districtWards.length > 0) {
          // Check if user's ward exists in fetched wards
          const userWardExists = districtWards.some(
            (w) => String(w.ward_number) === String(userWard)
          );

          // Use user's ward if exists, otherwise fallback to first ward
          const targetWardNumber = userWardExists ? userWard : districtWards[0].ward_number;

          // 5. Set selected ward
          setSelectedWard(targetWardNumber);
          setIsUngrouped(false);

          // 6. Fetch group details for this district + ward
          const groupData = await groupApi.getGroupByWard(userDistrict, targetWardNumber);
          setCurrentGroup(groupData);

          // 7. Fetch members using group id
          if (groupData && groupData.id) {
            const membersData = await groupApi.getGroupMembers(groupData.id);
            const transformed = (membersData.members || []).map(transformMember);
            setTableMembers(transformed);
          }
        }
        // 8. If district has NO wards → load ungrouped members
        else {
          setSelectedWard(null);
          setCurrentGroup(null);
          setIsUngrouped(true);

          try {
            const ungroupedData = await groupApi.getUngroupedMembers(userDistrict);
            const transformed = (ungroupedData.members || []).map(transformMember);
            setTableMembers(transformed);
          } catch (ungroupedErr) {
            // If ungrouped endpoint doesn't exist yet, just show empty
            console.warn("Ungrouped endpoint not available:", ungroupedErr);
            setTableMembers([]);
          }
        }

        setIsInitialized(true);
      } 
      catch (err) 
      {
        console.error("Initialization error:", err);
        setError(err.response?.data?.message || err.message || "Failed to load data");
      } finally {
        setLoading(false);
      }
    };

    initializeMemberPage();
  }, [user]);

  /* ═══════════════════════════════════════════
     STEP 2: MANUAL DISTRICT SELECTION
     Called when user clicks a district button.
     NO useEffect involved.
     ═══════════════════════════════════════════ */
  const handleDistrictChange = useCallback(
    async (district) => {
      if (district === selectedDistrict) 
        return;

      setLoading(true);
      setError(null);
      setSelectedDistrict(district);
      setSelectedWard(null);
      setCurrentGroup(null);
      setTableMembers([]);

      try {
        // 1. Fetch wards for newly selected district
        const wardsData = await groupApi.getWardsByDistrict(district);
        const districtWards = wardsData.wards || [];
        setWards(districtWards);

        // 2. If wards exist → show them, WAIT for user to select ward
        if (districtWards.length > 0) {
          setIsUngrouped(false);
          // Do NOT fetch members here. Wait for handleWardChange().
        }
        // 3. If NO wards → load ungrouped members automatically
        else {
          setIsUngrouped(true);
          try {
            const ungroupedData = await groupApi.getUngroupedMembers(district);
            const transformed = (ungroupedData.members || []).map(transformMember);
            setTableMembers(transformed);
          } catch (ungroupedErr) {
            console.warn("Ungrouped endpoint not available:", ungroupedErr);
            setTableMembers([]);
          }
        }
      } catch (err) {
        console.error("District change error:", err);
        setError(err.response?.data?.message || err.message || "Failed to load district");
        setWards([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedDistrict]
  );

  /* ═══════════════════════════════════════════
     STEP 3: MANUAL WARD SELECTION
     Called when user clicks a ward card.
     NO useEffect involved.
     ═══════════════════════════════════════════ */
  const handleWardChange = useCallback(
    async (wardNumber) => {
      // Prevent duplicate calls
      if (wardNumber === selectedWard) return;

      setLoading(true);
      setError(null);
      setSelectedWard(wardNumber);
      setIsUngrouped(false);

      try {
        // 1. Fetch group by district + wardNumber
        const groupData = await groupApi.getGroupByWard(selectedDistrict, wardNumber);
        setCurrentGroup(groupData);

        // 2. Fetch members by group id
        if (groupData && groupData.id) {
          const membersData = await groupApi.getGroupMembers(groupData.id);
          const transformed = (membersData.members || []).map(transformMember);
          setTableMembers(transformed);
        } else {
          setTableMembers([]);
        }
      } catch (err) {
        console.error("Ward change error:", err);
        setError(err.response?.data?.message || err.message || "Failed to load ward members");
        setCurrentGroup(null);
        setTableMembers([]);
      } finally {
        setLoading(false);
      }
    },
    [selectedDistrict, selectedWard]
  );

  /* ═══════════════════════════════════════════
     TABLE FILTERING (Client-side)
     ═══════════════════════════════════════════ */
  const filteredMembers = useMemo(() => {
    let data = [...tableMembers];

    if (activeTableTab === "Active")
      data = data.filter((m) => m.status === "Active");
    if (activeTableTab === "Volunteers")
      data = data.filter((m) => m.role === "Volunteer");
    if (activeTableTab === "Admins")
      data = data.filter((m) => m.role === "Admin");
    if (activeTableTab === "Inactive")
      data = data.filter((m) => m.status === "Inactive");

    if (searchQuery.trim()) {
      data = data.filter((m) =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return data;
  }, [tableMembers, activeTableTab, searchQuery]);

  /* ── Dynamic Admin Info from API ── */
  const adminInfo = currentGroup ? {
    name: currentGroup.admin_name || "Unknown",
    role: currentGroup.admin_role || "Group Admin",
    email: currentGroup.admin_email || "-",
    phone: currentGroup.admin_phone || "-",
    avatar: CM, // You can replace with dynamic avatar if available
  } : "No Admin Info";

  /* ── Dynamic Stats ── */
  const activeCount = tableMembers.filter(m => m.status === "Active").length;
  const totalReported = tableMembers.reduce((sum, m) => sum + (m.reported || 0), 0);
  const totalResolved = tableMembers.reduce((sum, m) => sum + (m.resolved || 0), 0);

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
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
        <StatCard icon={<Users/>} label="Total Members" value={tableMembers.length} />
        <StatCard icon={<BadgeCheck />} label="Active Members" value={activeCount} />
        <StatCard icon={<Network />} label="Groups" value={wards.length} />
      </div>

      {/* ── District Selector ── */}
      <div className={styles.districtBar}>
        {DISTRICTS.map((d) => (
          <button
            key={d}
            className={`${styles.districtBtn} ${selectedDistrict === d ? styles.districtBtnActive : ""}`}
            onClick={() => handleDistrictChange(d)}
            disabled={loading}
          >
            {d}
          </button>
        ))}
      </div>

      {/* ── Loading / Error States ── */}
      {loading && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "16px 24px", color: "#6b7280" }}>
          <Loader2 size={20} className="spin" style={{ animation: "spin 1s linear infinite" }} />
          <span>Loading...</span>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "12px 24px", background: "#fef2f2", color: "#dc2626", borderRadius: 8, margin: "0 24px" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
          <button 
            onClick={() => window.location.reload()} 
            style={{ marginLeft: "auto", background: "#dc2626", color: "white", border: "none", padding: "4px 12px", borderRadius: 4, cursor: "pointer" }}
          >
            Retry
          </button>
        </div>
      )}

      {/* ── Wards Section ── */}
      <div className={styles.wardsSection}>
        <h3 className={styles.wardsTitle}>
          {selectedDistrict || "Select District"} District - Counsillor Ward <span>({wards.length} Wards)</span>
        </h3>
        <div className={styles.wardsGrid}>
          {/* Render fetched wards dynamically from API */}
          {wards.length > 0 && wards.map((w) => (
            <WardCard
              key={w.id}
              ward={w}
              selected={selectedWard === w.ward_number}
              onClick={() => handleWardChange(w.ward_number)}
            />
          ))}

          {/* Ungrouped Members Card */}
          <div
            className={`${styles.ungroupedCard} ${isUngrouped ? styles.wardCardActive : ""}`}
            onClick={() => {
              if (wards.length === 0) return; // Already auto-loaded
              // Optional: manual click to view ungrouped
            }}
          >
            <div className={styles.ungroupedIcon}>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="22" height="22">
                <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <div className={styles.ungroupedInfo}>
              <span className={styles.ungroupedName}>Ungrouped Members</span>
              <span className={styles.ungroupedCount}>
                {isUngrouped ? `${tableMembers.length} Members` : (wards.length === 0 ? "Loading..." : "No Wards → Ungrouped")}
              </span>
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
          
          {/* Admin Card - Dynamic from API */}
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

          {/* Group Overview - Dynamic Stats */}
          <div className={styles.overviewCard}>
            <h4>Group Overview</h4>
            <div className={styles.overviewGrid}>
              <div className={styles.overviewItem}>
                <span className={styles.overviewIcon}><Users /></span>
                <span className={styles.overviewValue}>{tableMembers.length}</span>
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
                ? `Ungrouped Members in ${selectedDistrict}` 
                : `Members in Ward ${selectedWard || "—"}`
              } 
              <span>({filteredMembers.length})</span>
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
                <span className={styles.filterTabCount}>
                  {t.label === "All Members" ? filteredMembers.length : t.count}
                </span>
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
                {filteredMembers.length === 0 && !loading ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: "center", padding: "40px", color: "#9ca3af" }}>
                      {isUngrouped
                        ? "No ungrouped members in this district."
                        : selectedWard
                        ? "No members found in this ward."
                        : "Select a ward to view members."}
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
                      <td><StatusBadge status={m.status} /></td>
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

          {/* Pagination */}
          <div className={styles.pagination}>
            <span className={styles.pageInfo}>
              Showing {filteredMembers.length > 0 ? 1 : 0} to {filteredMembers.length} of {tableMembers.length} members
            </span>
            <div className={styles.pageControls}>
              <button className={styles.pageBtn}>⟨</button>
              <button className={`${styles.pageBtn} ${styles.pageBtnActive}`}>1</button>
              <button className={styles.pageBtn}>⟩</button>
            </div>
            <div className={styles.pageSize}>
              <span>{filteredMembers.length} / page</span>
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