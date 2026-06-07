import { useState, useContext, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, ThumbsUp } from "lucide-react";
import GetAvatarColor from "../components/GetAvatarColor.jsx";
import styles from "../styles/ComplaintDetails.module.css";
import { AuthContext } from "../context/CreateContext";
import axios from "axios";

const TIMELINE_LABELS = [
  "Complaint Submitted",
  "Under Review",
  "In Progress",
  "Resolved"
];

function getTimelineState(status, label) {
  const order = {
    "Complaint Submitted": 0,
    "Under Review":        1,
    "In Progress":         2,
    "Resolved":            3,
  };
  const statusOrder = {
    "Pending":     1,
    "In Progress": 2,
    "Resolved":    3,
  };
  const current = statusOrder[status] || 1;
  const step    = order[label];
  if (step <  current) return "done";
  if (step === current) return "active";
  return "pending";
}

function dotClass(state, styles) {
  if (state === "done")   return styles.dotDone;
  if (state === "active") return styles.dotActive;
  return styles.dotPending;
}

function ComplaintDetails() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const api      = import.meta.env.VITE_API_URL;

  const {
    complaints,
    token,
    user,
    commentsCache,
    setCommentsCache,
    supportersCache,
    setSupportersCache,
  } = useContext(AuthContext);

  //  useState இல்லை — complaints மாறும்போது automatically update
  const complaint = complaints.find((c) => c.id === Number(id)) || null;

  //  Cache-லயிருந்து derive
  const comments     = commentsCache[id]              || [];
  const supportCount = supportersCache[id]?.supportCount || 0;
  const supporters   = supportersCache[id]?.supporters   || [];

  //  supporters-லயிருந்து derive — useState இல்லை
  const supported = supporters.some((s) => s.id === user?.id);

  const [liked,         setLiked]        = useState(false);
  const [likes,         setLikes]        = useState(complaint?.likes_count || 0);
  const [commentText,   setCommentText]  = useState("");
  const [currentStatus, setCurrentStatus] = useState(complaint?.status || "Pending");
  const [statusLoading, setStatusLoading] = useState(false);
  const [resolvedImage, setResolvedImage] = useState(null);
  const fileInputRef = useRef(null);

  //  complaint.status மாறும்போது currentStatus sync
  useEffect(() => {
    if (complaint?.status) {
      setCurrentStatus(complaint.status);
    }
  }, [complaint?.status]);

  //  Comments — cache இல்லன்னா மட்டும் fetch
  useEffect(() => {
    if (commentsCache[id]) 
      return;
    const fetchComments = async () => {
      try {
        const res = await axios.get(`${api}/api/auth/get-comments/${id}`);
        setCommentsCache((prev) => ({ ...prev, [id]: res.data }));
      } catch (err) {
        console.log(err);
      }
    };
    fetchComments();
  }, [id]);

  //  Supporters — cache இல்லன்னா மட்டும் fetch
  useEffect(() => {
    if (supportersCache[id]) 
      return;
    const fetchSupporters = async () => {
      try {
        const res = await axios.get(`${api}/api/auth/supporters/${id}`);
        setSupportersCache((prev) => ({
          ...prev,
          [id]: {
            supportCount: res.data.supportCount,
            supporters:   res.data.supporters,
          },
        }));
      } catch (err) {
        console.log(err);
      }
    };
    fetchSupporters();
  }, [id]);

  //  Socket events — AuthContext handle பண்றது, இங்க வேண்டாம்

  const getTimeAgo = (createdAt) => {
    const now     = new Date();
    const created = new Date(createdAt);
    const diffMs  = now - created;
    const days    = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours   = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0)  return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h`;
    return `${minutes}m`;
  };

  const handleLike = () => {
    setLikes((l) => liked ? l - 1 : l + 1);
    setLiked((v) => !v);
  };

  //  Support — socket cache update பண்ணும், setSupported வேண்டாம்
  const handleSupport = async () => {
    try {
      await axios.post(
        `${api}/api/auth/support/${id}`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) 
    {
      console.log(err);
    }
  };

  const handleStatusChange = async (newStatus) => {
    if (newStatus === "Resolved" && !resolvedImage) {
      fileInputRef.current?.click();
      return;
    }
    setStatusLoading(true);
    try {
      await axios.put(
        `${api}/api/auth/status/${id}`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentStatus(newStatus);
    } catch (err) {
      console.log(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handleResolvedImageSelect = async (e) => {
    const file = e.target.files[0];

    if (!file) 
      return;
    setResolvedImage(file);
    setStatusLoading(true);
    try {
      const formData = new FormData();
      formData.append("status", "Resolved");
      formData.append("resolvedImage", file);

      await axios.put(
        `${api}/api/auth/status/${id}`,
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCurrentStatus("Resolved");
    } catch (err) {
      console.log(err);
    } finally {
      setStatusLoading(false);
    }
  };

  const handlePostComment = async () => {
    if (!commentText.trim()) 
      return;
    try {
      await axios.post(
        `${api}/api/auth/add-comments`,
        { complaintId: complaint.id, commentText },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCommentText("");
    } catch (err) {
      console.log(err);
    }
  };

const [showAllComments, setShowAllComments] = useState(false);

// Derive — 2 or all
const visibleComments = showAllComments ? comments : comments.slice(0, 2);
const hiddenCount     = comments.length - 2;

  if (!complaint) {
    return (
      <div className={styles.notFound}>
        <p>Complaint not found.</p>
        <button onClick={() => window.history.back()}>← Back</button>
      </div>
    );
  }

  return (
    <div className={styles.mainContainer}>
      <button className={styles.backBtn} onClick={() => navigate("/complaint")}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to Complaints
      </button>

      <div className={styles.layout}>
        <div>
          <div className={styles.card}>

            {complaint.image_url ? (
              <img src={complaint.image_url} alt={complaint.title} className={styles.mainImg} />
            ) : (
              <div className={styles.imgPlaceholder}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="3" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <polyline points="21 15 16 10 5 21" />
                </svg>
              </div>
            )}

            <div className={styles.cardBody}>
              <span className={styles.categoryTag}>{complaint.category}</span>

              <div className={styles.titleRow}>
                <h1 className={styles.title}>{complaint.title}</h1>
                <span style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                  background: currentStatus === "Pending"     ? "#f4dada" :
                              currentStatus === "In Progress" ? "#e0f2fe" : "#dcfce7",
                  color:      currentStatus === "Pending"     ? "#f60e0e" :
                              currentStatus === "In Progress" ? "#0284c7" : "#16a34a",
                  whiteSpace: "nowrap", flexShrink: 0,
                }}>
                  {currentStatus}
                </span>
              </div>

              <div className={styles.metaRow}>
                <span className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
                    <circle cx="12" cy="9" r="2.5" />
                  </svg>
                  {complaint.location}
                </span>
                <span className={styles.metaItem}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  Reported {getTimeAgo(complaint.created_at)}
                </span>
                <span className={styles.complaintId}>#CPL{complaint.id}</span>
              </div>

              <div className={styles.divider} />
              <p className={styles.sectionLabel}>Description</p>
              <p className={styles.description}>{complaint.description}</p>

              {currentStatus === "Resolved" && complaint.resolved_image && (
                <div style={{ marginTop: 12 }}>
                  <p className={styles.sectionLabel}>Resolution Proof</p>
                  <img
                    src={complaint.resolved_image}
                    alt="Resolved"
                    style={{ width: "100%", borderRadius: 10, marginTop: 6 }}
                  />
                </div>
              )}

              <div className={styles.actionBar}>
                <button
                  className={`${styles.actionBtn} ${liked ? styles.actionBtnActive : ""}`}
                  onClick={handleLike}
                >
                  <Heart size={16} fill={liked ? "#e02020" : "none"} color={liked ? "#e02020" : "#888"} />
                  {likes} Likes
                </button>
                <button className={styles.actionBtn}>
                  <MessageCircle size={16} color="#888" />
                  {complaint.comments_count} Comments
                </button>
              </div>
            </div>

            {/* Comments Section — இந்த part மட்டும் replace பண்ணு */}
          <div className={styles.commentsSection}>
            <div className={styles.divider} />
            <p className={styles.commentsTitle}>Comments ({complaint.comments_count})</p>

            <div className={styles.commentList}>
              {visibleComments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <div
                    className={styles.commentAvatar}
                    style={{ background: GetAvatarColor(c.username), color: "white", fontSize: "15px" }}
                  >
                    {c.username.charAt(0).toUpperCase()}
                  </div>
                  <div className={styles.commentBody}>
                    <div className={styles.commentHeader}>
                      <span className={styles.commentName}>{c.username}</span>
                      <span className={styles.commentTime}>{c.created_at.slice(0, 10)}</span>
                    </div>
                    <p className={styles.commentText}>{c.comment_text}</p>
                  </div>
                </div>
              ))}

              {!showAllComments && hiddenCount > 0 && (
                <button
                  className={styles.moreCommentsBtn}
                  onClick={() => setShowAllComments(true)}
                >
                  more... ({hiddenCount} more comment{hiddenCount !== 1 ? "s" : ""})
                </button>
              )}

              {/* ✅ Show less btn — எல்லாம் காட்டும்போது */}
              {showAllComments && comments.length > 2 && (
                <button
                  className={styles.moreCommentsBtn}
                  onClick={() => setShowAllComments(false)}
                >
                  Show less 
                </button>
              )}

            </div>

            {/* Comment Input */}
            <div className={styles.commentInputRow}>
              <input
                type="text"
                className={styles.commentInput}
                placeholder="Write a comment..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
              />
              <button className={styles.postBtn} onClick={handlePostComment}>Post</button>
            </div>
          </div>
          </div>
        </div>

        <div className={styles.rightCol}>

          {/* Assigned To */}
          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Assigned To</p>
            <div className={styles.assignedRow}>
              <div className={styles.assignedLeft}>
                <div
                  className={styles.assignedAvatar}
                  style={{ background: GetAvatarColor(complaint.username) }}
                >
                  {complaint.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={styles.assignedName}>{complaint.username}</div>
                  <div className={styles.assignedRole}>Volunteer</div>
                </div>
              </div>
              <div className={styles.contactWrapper}>
                <button className={styles.contactBtn}>Contact</button>
                <div className={styles.contactPopup}>
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                  </svg>
                  <span className={styles.phoneNo}>+91 {complaint.phone_number}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Support Card */}
          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Support This Complaint</p>
            <div className={styles.supportCount}>{supportCount}</div>
            <div className={styles.supportSub}>
              {supportCount === 0 ? "No supporters yet — be the first!" : "people support this"}
            </div>
            {supporters.length > 0 && (
              <div className={styles.supportAvatars}>
                {supporters.map((s, i) => (
                  <div
                    key={s.id}
                    className={styles.supportAvatar}
                    style={{ background: GetAvatarColor(s.username), zIndex: supporters.length - i }}
                    title={s.username}
                  >
                    {s.username.charAt(0).toUpperCase()}
                  </div>
                ))}
              </div>
            )}
            <button
              className={styles.supportBtn}
              onClick={handleSupport}
              style={supported ? { background: "#16a34a" } : {}}
            >
              <ThumbsUp size={15} />
              {supported ? "Supported ✓" : "Support This"}
            </button>
          </div>

          {/* Status Update Card */}
          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Update Status</p>
            <div className={styles.currentStatusRow}>
              <span>Current:</span>
              <span style={{
                padding: "3px 10px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                background: currentStatus === "Pending"     ? "#f4dada" :
                            currentStatus === "In Progress" ? "#e0f2fe" : "#dcfce7",
                color:      currentStatus === "Pending"     ? "#f60e0e" :
                            currentStatus === "In Progress" ? "#0284c7" : "#16a34a",
              }}>
                {currentStatus}
              </span>
            </div>
            <div className={styles.statusBtns}>
              {currentStatus === "Pending" && (
                <button
                  className={styles.statusChangeBtn}
                  style={{ background: "#e0f2fe", color: "#0284c7" }}
                  onClick={() => handleStatusChange("In Progress")}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Updating..." : "▶ Mark In Progress"}
                </button>
              )}
              {currentStatus === "In Progress" && (
                <button
                  className={styles.statusChangeBtn}
                  style={{ background: "#dcfce7", color: "#16a34a" }}
                  onClick={() => handleStatusChange("Resolved")}
                  disabled={statusLoading}
                >
                  {statusLoading ? "Updating..." : "✓ Mark Resolved"}
                </button>
              )}
              {currentStatus === "Resolved" && (
                <div className={styles.resolvedMsg}>This complaint is resolved!</div>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: "none" }}
              onChange={handleResolvedImageSelect}
            />
            {resolvedImage && (
              <div style={{ marginTop: 10, fontSize: 12, color: "#16a34a" }}>
                📎 {resolvedImage.name} selected
              </div>
            )}
          </div>

          {/* Status Timeline */}
          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Status Timeline</p>
            <div className={styles.timelineList}>
              {TIMELINE_LABELS.map((label, i) => {
                const state = getTimelineState(currentStatus, label);
                return (
                  <div key={i} className={styles.timelineItem}>
                    <div className={`${styles.timelineDot} ${dotClass(state, styles)}`} />
                    <div className={styles.timelineInfo}>
                      <div className={styles.timelineStatus}>{label}</div>
                      <div className={styles.timelineTime}>
                        {state === "done"   ? "Completed ✓"  :
                         state === "active" ? "In progress..." : "Pending"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ComplaintDetails;