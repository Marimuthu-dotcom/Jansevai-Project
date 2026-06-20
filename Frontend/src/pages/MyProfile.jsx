import { useState ,useContext ,useEffect} from "react";
import styles from "../styles/MyProfile.module.css";
import { AuthContext } from "../context/CreateContext";
import axios from "axios";
import styles1 from "../styles/RecentComplaints.module.css";
import { SearchXIcon } from "lucide-react";
import styles2 from "../styles/Complaint.module.css";


const MY_ACTIVITY = [
  { id: 1, action: "Submitted",          detail: "Water leakage on 5th Main Road", time: "2h ago",   color: "#e02020" },
  { id: 2, action: "Complaint resolved", detail: "Street light near park fixed",   time: "3d ago",   color: "#22c55e" },
  { id: 3, action: "Commented",          detail: "on Garbage not collected issue",  time: "5d ago",   color: "#f59e0b" },
  { id: 4, action: "Submitted",          detail: "Pothole on 8th Cross",           time: "1w ago",   color: "#3b82f6" },
  { id: 5, action: "Joined",             detail: "JanSeva community",              time: "Mar 2024", color: "#8b5cf6" },
];

const SETTINGS = [
  { id: 1, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>), name: "Push Notifications", desc: "Receive complaint updates",       type: "toggle", defaultOn: true  },
  { id: 2, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" /></svg>), name: "Email Alerts",        desc: "Get email on status change",    type: "toggle", defaultOn: false },
  { id: 3, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>),                                                                          name: "Privacy",             desc: "Manage your data & visibility", type: "arrow"  },
  { id: 4, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>),                                       name: "Change Password",     desc: "Update your account password",  type: "arrow"  },
  { id: 5, icon: (<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>),    name: "Logout",              desc: "Sign out of your account",      type: "arrow"  },
];

const TABS = ["My Complaints", "Activity", "Settings"];

const GENDER_OPTIONS = ["Male", "Female", "Other", "Prefer not to say"];

function badgeClass(status) {
  if (status === "Pending")   
      return styles.pending;
  if (status === "In Progress")
     return styles.inProgress;
  return styles.resolved;
}

function Toggle({ defaultOn, storageKey }) 
{
  const [on, setOn] = useState(() => {
    const saved = sessionStorage.getItem(storageKey);
    return saved !== null ? saved === "true" : defaultOn;
  });

  const handleToggle = () => {
    const newValue = !on;
    setOn(newValue);
    sessionStorage.setItem(storageKey, newValue);
  };

  return (
    <button className={`${styles.toggle} ${on ? styles.toggleOn : styles.toggleOff}`} onClick={handleToggle}>
      <span className={`${styles.toggleKnob} ${on ? styles.toggleKnobOn : styles.toggleKnobOff}`} />
    </button>
  );
}


function MyProfile() {
  const [activeTab, setActiveTab]   = useState("My Complaints");
  const [isEditing, setIsEditing]   = useState(false); 
  const { user ,logout, token, myComplaints ,loading,activity} = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [closing, setClosing] = useState(false);
  const api = import.meta.env.VITE_API_URL;
  const [draft, setDraft] = useState({});

  
  useEffect(() => {
  if (user) {
    setProfile(user);
    setDraft(user);
    console.log(myComplaints);
  }
}, [user]);

  const handleEditClick = () => 
  {
    setDraft({ ...profile });
    setIsEditing(true);
  };

  const handleCancel = () => 
 {
    setDraft({ ...profile }); 
    setIsEditing(false);
  };

  const handleSave = async () => {

  const updatedFields = {};

  Object.keys(draft).forEach((key) => {
    if (draft[key] !== profile[key]) {
      updatedFields[key] = draft[key];
    }
  });

  console.log(updatedFields);

  if (Object.keys(updatedFields).length === 0) {
    setIsEditing(false);
    return;
  }

  try {
    const updatedProfile = await axios.patch(
      `${api}/api/auth/update-profile`,
      updatedFields,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );


    console.log("Profile updated successfully:", updatedProfile.data.message);
    
    setProfile((prev) => ({
      ...prev,
      ...updatedFields,
    }));

    setIsEditing(false);
  } catch (err) {
    console.log(err);
  }
};

  const handleDraftChange = (field, value) => 
 {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const p = profile; 
  const d = draft;  

  const handleToggleDropdown = (e) => {
    e.stopPropagation();
  
    if (showDropdown)
   {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setShowDropdown(false);
    }, 250); 
  } else 
  {
    setShowDropdown(true);
  }
};

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

const getDotColor = (status) => {
  switch (status) {
    case "Pending":
      return "#ffc107";
    case "In Progress":
      return "#007bff";
    case "Resolved":
      return "#28a745";
    default:
      return "#6c757d";
  }
};

const getIconColor = (title) => {
  const category = title.trim().toLowerCase().replace(/\s+/g, "");
  console.log("Category :",category);

  if (category.includes("watersupply")) 
    return "#13a1e8";
  if (category.includes("garbage")) 
    return "#0af962";
  if (category.includes("street")) 
    return "#ffe100";
  if (category.includes("roads&safety")) 
    return "#a855f7";
  if (category.includes("publicsafety")) 
    return "#ea0808";
  if (category.includes("others")) 
    return "#1a1a1a";
  if (category.includes("environment")) 
    return "#00ff22";
  if (category.includes("drainage")) 
    return "#424242";
}

const getStatus = (status) => {
  if(status === "Pending") 
    return "Complaint Submitted";
  if(status === "In Progress") 
    return "Complaint In Progress";
  if(status === "Resolved") 
    return "Complaint Resolved";
}

  return (
    <div className={styles.mainContainer}>
      <div className={styles.layout}>
        <div className={styles.leftCol}>
          <div className={styles.profileCard}>

            <div className={styles.banner}>

                <button className={styles.editBtn} onClick={handleEditClick}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                  Edit Profile
                </button>

              <div className={styles.avatarWrap}>
                <div className={styles.avatar} style={{ background: "linear-gradient(135deg, #e02020, #c01a1a)" }}>
                  {p?.username?.charAt(0)?.toUpperCase()}
                </div>
                {true && <span className={styles.onlineDot} />}
              </div>

              {!isEditing ? (
                <h2 className={styles.profileName}>{p?.username}</h2>
              ) : (
                <input
                  className={styles.editNameInput}
                  value={d?.username||""}
                  onChange={(e) => handleDraftChange("username", e.target.value)}
                  placeholder="Full Name"
                />
              )}

              <span className={styles.roleBadge}>{p?.role}</span>
            </div>

            <div className={styles.cardBody}>

              {!isEditing ? (
                <div className={styles.bioCard}>{p?.bio}</div>
              ) : (
                <textarea
                  className={styles.editBioInput}
                  value={d?.bio||""}
                  onChange={(e) => handleDraftChange("bio", e.target.value)}
                  placeholder="Write something about yourself..."
                  rows={3}
                />
              )}

              <div className={styles.infoList}>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Phone</span>
                    {!isEditing ? (
                      <span className={styles.infoValue}>{p?.phone_number}</span>
                    ) : (
                      <input className={styles.editFieldInput} value={d?.phone_number||""}
                        onChange={(e) => handleDraftChange("phone_number", e.target.value)} placeholder="Phone number" />
                    )}
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                      <polyline points="22,6 12,13 2,6" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Email</span>
                      <span className={styles.infoValue}>{p?.email}</span>
                  </div>
                </div>

                <div className={styles.divider} />

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                      <circle cx="12" cy="9" r="2.5" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Location</span>
                    {!isEditing ? (
                      <span className={styles.infoValue}>{p?.location}</span>
                    ) : (
                      <input className={styles.editFieldInput} value={d?.location||""}
                        onChange={(e) => handleDraftChange("location", e.target.value)} placeholder="Your location" />
                    )}
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                      <line x1="16" y1="2" x2="16" y2="6" />
                      <line x1="8"  y1="2" x2="8"  y2="6" />
                      <line x1="3"  y1="10" x2="21" y2="10" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Joined</span>
                    <span className={styles.infoValue}>{p?.created_at?.slice(0, 10)}</span>
                  </div>
                </div>

                <div className={styles.infoRow}>
                  <div className={styles.infoIcon}>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </div>
                  <div className={styles.infoText}>
                    <span className={styles.infoLabel}>Age / Gender</span>
                    {!isEditing ? (
                      <span className={styles.infoValue}>{p?.age} yrs · {p?.gender}</span>
                    ) : (
                      <div className={styles.editAgeGenderRow}>
                        <input
                          className={styles.editAgeInput}
                          value={d?.age||""}
                          type="number"
                          min="1" max="120"
                          onChange={(e) => handleDraftChange("age", e.target.value)}
                          placeholder="Age"
                        />
                        <select
                          className={styles.editGenderSelect}
                          value={d?.gender||""}
                          onChange={(e) => handleDraftChange("gender", e.target.value)}
                        >
                          {GENDER_OPTIONS.map((g) => (
                            <option key={g} value={g}>{g}</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
            {isEditing && (
                <div className={styles.editActionRow}>
                  <button className={styles.cancelBtn} onClick={handleCancel}>
                    Cancel
                  </button>
                  <button className={styles.saveBtn} onClick={handleSave}>
                    Save
                  </button>
                </div>
              )}
          </div>

          <div className={styles.statsGrid}>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{myComplaints.length}</span>
              <span className={styles.statLabel}>Total Complaints</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{myComplaints.filter(c => c.status === "Resolved").length}</span>
              <span className={styles.statLabel}>Resolved</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{myComplaints.filter(c => c.status === "In Progress").length}</span>
              <span className={styles.statLabel}>In Progress</span>
            </div>
            <div className={styles.statCard}>
              <span className={styles.statNum}>{myComplaints.filter(c => c.status === "Pending").length}</span>
              <span className={styles.statLabel}>Pending</span>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.tabRow}>
            {TABS.map((tab) => (
              <button
                key={tab}
                className={`${styles.tab} ${activeTab === tab ? styles.tabActive : ""}`}
                onClick={() => setActiveTab(tab)}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === "My Complaints" && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>My Complaints</h3>
                <button className={styles.viewAllBtn}>View All</button>
              </div>
              {loading ? (
                          <div className={styles2.loadingContainer}>
                            <div className={styles2.spinner} />
                          </div>
                        ) : (<>
              <div className={styles.complaintList}>
                {myComplaints.length > 0 ? (
                myComplaints.map((c,i) => (
                  <div key={i} className={styles.complaintRow}>
                    <div className={styles.cIcon} style={{ backgroundColor: "rgba(185, 181, 181, 0.12)" }}>
                      <svg viewBox="0 0 24 24" fill="none" stroke={getIconColor(c.category)} strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8"  x2="12"   y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </div>
                    <div className={styles.cInfo}>
                      <div className={styles.cTitle}>{c.title}</div>
                      <div className={styles.cMeta}>{c.category} · {getTimeAgo(c.created_at)}</div>
                    </div>
                    <span className={`${styles.badge} ${badgeClass(c.status)}`}>{c.status}</span>
                  </div>)
                )):(
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
            </div>
          )}

          {activeTab === "Activity" && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Recent Activity</h3>
              </div>
              <div className={styles.activityList}>
                {activity.length > 0 ? (
                activity?.map((a, i) => (
                  <div key={i} className={styles.activityRow}>
                    <div className={styles.activityDot} style={{ background: getDotColor(a.status) }} />
                    <div className={styles.activityBody}>
                      <div className={styles.activityText}><strong>{getStatus(a.status)}</strong> — {a.title}</div>
                      <div className={styles.activityTime}>{getTimeAgo(a.updated_at)}</div>
                    </div>
                  </div>
                ))):(
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
            </div>
          )}

          {activeTab === "Settings" && (
            <div className={styles.sectionCard}>
              <div className={styles.sectionHeader}>
                <h3 className={styles.sectionTitle}>Settings</h3>
              </div>
              <div className={styles.settingsList}>
                {SETTINGS.map((s) => (
                  <div key={s.id} className={styles.settingRow}>
                    <div className={styles.settingLeft}>
                      <div className={styles.settingIcon}>{s.icon}</div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div className={styles.settingName}>{s.name}</div>
                        <div className={styles.settingDesc}>{s.desc}</div>
                      </div>
                    </div>
                    {s.type === "toggle" ? (
                      <Toggle defaultOn={s.defaultOn} storageKey={s.name} />
                    ) : (
                      <div className={styles.settingArrow} onClick={handleToggleDropdown}>
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="9 18 15 12 9 6" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
      {showDropdown && (
              <div className={`${styles.dropdownBox} ${!closing ? styles.fadeLeft : styles.fadeRight}`}>
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
                    navigate("/");// or navigate("/login")
                  }}
                >
                  Logout
                </button>
              </div>
            )}
    </div>
  );
}

export default MyProfile;
