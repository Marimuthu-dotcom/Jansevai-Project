import { Heart, MessageCircle, Trash2 } from "lucide-react";
import styles from "../styles/Complaint.module.css";
import StatusBadge from "../components/StatusBadge";
import ConfirmDialog from "../components/ConfirmDialog"; // ✅ import
import { useNavigate } from "react-router-dom";
import { useState, useContext, useEffect } from "react";
import { AuthContext } from "../context/CreateContext";
import { getOrdinal } from "../pages/Complaint.jsx";
import api from "../api/api.js";

function ComplaintCard({ complaint,index }) {
  const navigate = useNavigate();

  const [liked,setLiked]       = useState(Boolean(complaint.isLiked));
  const [likes,setLikes]       = useState(complaint.likes_count);
  const [deleting,setDeleting]    = useState(false);
  const [showConfirm,setShowConfirm] = useState(false);
  const [confirmClosing,setConfirmClosing] = useState(false);

  const { token, user } = useContext(AuthContext);

  const isOwner = complaint?.user_email === user?.email; 

  // Delete btn click — dialog காட்டு
  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setShowConfirm(true); //browser confirm இல்ல — custom dialog!
    setConfirmClosing(false); // ✅ confirm dialog open
  };

  // Dialog-ல Cancel
  const handleCancel = () => {
    setConfirmClosing(true); // ✅ confirm dialog close
    setTimeout(() =>{ 
      setShowConfirm(false);
      setConfirmClosing(false);
    },250);
  };

  //  Dialog-ல Confirm — actual delete
  const handleConfirmDelete = async () => {
    setConfirmClosing(true);
    setDeleting(true);
    try {
      await api.delete(
        `/api/auth/deleteComplaint/${complaint.id}` );
     setShowConfirm(false);
      // Socket "complaint-deleted" emit ஆகும் — AuthContext handle பண்ணும்
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Failed to delete");
      setDeleting(false);
    }
  };

  const handleLike = async (e) => {
    e.stopPropagation();
    try {
      const res = await api.post(
        `/api/auth/likeComplaint/${complaint.id}` );
      setLiked(res.data.liked);
      setLikes(res.data.likesCount); 
    } catch (err) {
      console.log(err);
    }
  };

 useEffect(() => {
  setLiked(Boolean(complaint.isLiked));
  setLikes(complaint.likes_count);
}, [complaint.isLiked, complaint.likes_count]);

  const handleCardClick = () => {
    navigate(`/complaint/${complaint.id}`);
  };

  return (
    <>
      {/* Confirm Dialog — showConfirm true-ஆனா காட்டும் */}
      {showConfirm && (
        <ConfirmDialog
          message="Are you sure you want to delete this complaint? This action cannot be undone."
          onConfirm={handleConfirmDelete}
          onCancel={handleCancel}
          confirmClosing={confirmClosing}
        />
      )}

      <div
        className={styles.card}
        onClick={handleCardClick}
        style={{
          animationDelay: `${index * 0.2}s`,
          opacity:        deleting ? 0.5 : 1,
          pointerEvents:  deleting ? "none" : "auto",
        }}
      >
        {complaint.image_url ? (
          <img src={complaint.image_url} alt={complaint.title} className={styles.cardImg} />
        ) : (
          <div className={styles.cardImgPlaceholder}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
          </div>
        )}

        <div className={styles.cardBody}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span className={styles.categoryTag}>{complaint.category}</span>

            {/* ✅ Owner மட்டும் delete btn பார்க்கலாம் */}
            {isOwner && (
              <button
                className={styles.deleteBtn}
                onClick={handleDeleteClick} // ✅ handleDeleteClick — dialog திறக்கும்
                disabled={deleting}
                title="Delete complaint"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>

          <div className={styles.cardTop}>
            <h3 className={styles.cardTitle}>{complaint.title}</h3>
            <StatusBadge status={complaint.status} />
          </div>

          <div className={styles.cardLocation}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
              <circle cx="12" cy="9" r="2.5" />
            </svg>
            {complaint.location}
          </div>

          <div className={styles.wardNo}>
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building-2"
            >
              <path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18" />
              <path d="M6 12H4a2 2 0 0 0-2 2v8h20v-8a2 2 0 0 0-2-2h-2" />
              <path d="M10 6h4" />
              <path d="M10 10h4" />
              <path d="M10 14h4" />
              <path d="M10 18h4" />
            </svg>
            {`Ward: ${getOrdinal(1326)||"1326th Ward"}`}
          </div>

          <div className={styles.cardFooter}>
            <div className={styles.cardMeta}>
              <span className={styles.metaItem}>
                <Heart
                  size={15}
                  onClick={handleLike}
                  color={liked ? "#ff0000" : "gray"}
                  fill={liked  ? "#ff0000" : "none"}
                />
                {likes}
              </span>
              <span className={styles.metaItem}>
                <MessageCircle size={15} color="gray" />
                {complaint.comments_count}
              </span>
            </div>
            <span className={styles.cardTime}>
              {complaint.created_at.slice(0, 10)}
            </span>
          </div>
        </div>
      </div>
    </>
  );
}

export default ComplaintCard;