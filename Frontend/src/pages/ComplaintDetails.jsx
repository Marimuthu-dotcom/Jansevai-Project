import { useState ,useContext ,useEffect} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Heart, MessageCircle, ThumbsUp } from "lucide-react";
import styles from "../styles/ComplaintDetails.module.css";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import socket from "../socket/socket.js";
const SUPPORTERS = [
  { initials: "RK", color: "#e02020" },
  { initials: "PD", color: "#8b5cf6" },
  { initials: "SP", color: "#f59e0b" },
  { initials: "VR", color: "#10b981" },
];

// Status Timeline steps
const TIMELINE = [
  { label: "Complaint Submitted", time: "2 hours ago",    state: "done"    },
  { label: "Under Review",        time: "1 hour ago",     state: "done"    },
  { label: "In Progress",         time: "30 minutes ago", state: "active"  },
  { label: "Resolved",            time: "Pending",        state: "pending" },
];

function dotClass(state) {
  if (state === "done")   
     return styles.dotDone;
  if (state === "active")  
    return styles.dotActive;
  return styles.dotPending;
}

function ComplaintDetails() {
  const { id }   = useParams();        
  const navigate = useNavigate();

  const { complaints ,token} = useContext(AuthContext);
  const complaint = complaints.find((c) => c.id === Number(id));
  const api = import.meta.env.VITE_API_URL;
  const [liked, setLiked]   = useState(false);
  const [likes, setLikes]   = useState(complaint?.likes_count || 0);

  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState("");

  const [supported, setSupported] = useState(false);
  const [supportCount, setSupportCount] = useState(45);

  useEffect(() => {

  const fetchComments = async () => {

    const res = await axios.get(
      `${api}/api/auth/get-comments/${id}`
    );

    setComments(res.data);
  };

  fetchComments();

}, [id]);

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

  const handleLike = () => {
    setLikes((l) => liked ? l - 1 : l + 1);
    setLiked((v) => !v);
  };

  const handleSupport = () => {
    setSupportCount((n) => supported ? n - 1 : n + 1);
    setSupported((v) => !v);
  };

  const handlePostComment = async() => {
   if (!commentText.trim()) return;

  try {
     await axios.post(
      `${api}/api/auth/add-comments`,
      {
        complaintId: complaint.id,
        commentText
      },
      {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );

    setCommentText("");

  } catch(err) {
    console.log(err);
  }
  };

  useEffect(() => {

  const handleNewComment = (comment) => {

    if (comment.complaint_id === complaint.id) {

      setComments(prev => [...prev, comment ]);

    }
  };

  socket.on("new-comment", handleNewComment);

  return () => {
    socket.off("new-comment", handleNewComment);
  };

}, [complaint?.id]);

if (!complaint) {
    return (
      <div className={styles.notFound}>
        <p>Complaint not found.</p>
        <button onClick={() => window.history.back()}>← Back to Complaints</button>
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
                  padding: "4px 10px",
                  borderRadius: 20,
                  fontSize: 11,
                  fontWeight: 700,
                  background:
                    complaint.status === "Pending"     ? "#f4dada" :
                    complaint.status === "In Progress" ? "#e0f2fe" : "#dcfce7",
                  color:
                    complaint.status === "Pending"     ? "#f60e0e" :
                    complaint.status === "In Progress" ? "#0284c7" : "#16a34a",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}>
                  {complaint.status}
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

                <span className={styles.complaintId}>#CPL7234</span>
              </div>

              <div className={styles.divider} />

              <p className={styles.sectionLabel}>Description</p>
              <p className={styles.description}>
                {complaint.description}
              </p>

              <div className={styles.actionBar}>
                <button
                  className={`${styles.actionBtn} ${liked ? styles.actionBtnActive : ""}`}
                  onClick={handleLike}
                >
                  <Heart
                    size={16}
                    fill={liked ? "#e02020" : "none"}
                    color={liked ? "#e02020" : "#888"}
                  />
                  {likes} Likes
                </button>

                <button className={styles.actionBtn}>
                  <MessageCircle size={16} color="#888" />
                  {comments.length} Comments
                </button>
              </div>
            </div>

            <div className={styles.commentsSection}>
              <div className={styles.divider} />
              <p className={styles.commentsTitle}>Comments ({comments.length})</p>

              <div className={styles.commentList}>
                {comments.map((c) => (
                  <div key={c.id} className={styles.commentItem}>
                    <div
                      className={styles.commentAvatar}
                      style={{ background: getAvatarColor(c.username) ,color:"white",fontSize:"15px"}}
                    >
                      {c.username.charAt(0).toUpperCase()}
                    </div>
                    <div className={styles.commentBody}>
                      <div className={styles.commentHeader}>
                        <span className={styles.commentName}>{c.username}</span>
                        <span className={styles.commentTime}>{c.created_at.slice(0,10)}</span>
                      </div>
                      <p className={styles.commentText}>{c.comment_text}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className={styles.commentInputRow}>
                <input
                  type="text"
                  className={styles.commentInput}
                  placeholder="Write a comment..."
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                />
                <button className={styles.postBtn} onClick={handlePostComment}>
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className={styles.rightCol}>
          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Assigned To</p>
            <div className={styles.assignedRow}>
              <div className={styles.assignedLeft}>
                <div
                  className={styles.assignedAvatar}
                  style={{ background: getAvatarColor(complaint.username) }}
                >
                  {complaint.username.charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className={styles.assignedName}>{complaint.username}</div>
                  <div className={styles.assignedRole}>Volunteer</div>
                </div>
              </div>
              <div className={styles.contactWrapper}>
              <button className={styles.contactBtn}>
                Contact
              </button>

              <div className={styles.contactPopup}>
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 10.8a19.79 19.79 0 01-3.07-8.67A2 2 0 012 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.09 7.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
                </svg>

                <span className={styles.phoneNo}>+91 {complaint.phone_number}</span>
              </div>
            </div>
            </div>
          </div>

          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Support This Complaint</p>
            <div className={styles.supportCount}>{supportCount}</div>
            <div className={styles.supportSub}>people support this</div>

            <div className={styles.supportAvatars}>
              {SUPPORTERS.map((s, i) => (
                <div
                  key={i}
                  className={styles.supportAvatar}
                  style={{ background: s.color, zIndex: SUPPORTERS.length - i }}
                >
                  {s.initials}
                </div>
              ))}
            </div>

            <button
              className={styles.supportBtn}
              onClick={handleSupport}
              style={supported ? { background: "#16a34a" } : {}}
            >
              <ThumbsUp size={15} />
              {supported ? "Supported ✓" : "Support This"}
            </button>
          </div>

          <div className={styles.rightCard}>
            <p className={styles.rightCardTitle}>Status Timeline</p>
            <div className={styles.timelineList}>
              {TIMELINE.map((t, i) => (
                <div key={i} className={styles.timelineItem}>
                  <div className={`${styles.timelineDot} ${dotClass(t.state)}`} />
                  <div className={styles.timelineInfo}>
                    <div className={styles.timelineStatus}>{t.label}</div>
                    <div className={styles.timelineTime}>{t.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default ComplaintDetails;