import { Heart, MessageCircle} from "lucide-react";
import styles from "../styles/Complaint.module.css";
import StatusBadge from "../components/StatusBadge";
import { useNavigate } from "react-router-dom";
import { useState,useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

function ComplaintCard({ complaint }) {

 const navigate = useNavigate();
const [liked, setLiked] = useState(complaint.isLiked);
const [likes, setLikes] = useState(complaint.likes_count);
 const { token } = useContext(AuthContext);
 const api = import.meta.env.VITE_API_URL;

 const handleLike = async (e) => {
   e.stopPropagation();
   try {

      const res = await axios.post(
         `${api}/api/auth/likeComplaint/${complaint.id}`,
         {},
         {
            headers: {
               Authorization: `Bearer ${token}`
            }
         }
      );

      if (res.data.liked) {
         setLiked(true);
         setLikes(prev => prev + 1);
      } else {
         setLiked(false);
         setLikes(prev => prev - 1);
      }

   } catch (err) {
      console.log(err);
   }
};

const handleCardClick = () => {
    navigate(`/complaint/${complaint.id}`);
  };

  return (
    <div className={styles.card} onClick={handleCardClick} style={{animationDelay: `${complaint.id * 0.05}s`}}>
      {complaint.image_url ? (
        <img
          src={complaint.image_url}
          alt={complaint.title}
          className={styles.cardImg}
        />
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
        <span className={styles.categoryTag}>{complaint.category}</span>

        <div className={styles.cardTop}>
          <h3 className={styles.cardTitle}>{complaint.title}</h3>
          <StatusBadge status={complaint.status} />
        </div>

        {/* Location */}
        <div className={styles.cardLocation}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
          {complaint.location}
        </div>

        {/* Footer */}
        <div className={styles.cardFooter}>
          <div className={styles.cardMeta}>
            {/* Likes */}
            <span className={styles.metaItem}>
              <Heart size={15} onClick={handleLike} color={liked ? "#ff0000" : "gray"}
                                   fill={liked ? "#ff0000" : "none"}/>
              {likes}
            </span>
            {/* Comments */}
            <span className={styles.metaItem}>
              <MessageCircle size={15} color="gray"/>
              {complaint.comments_count}
            </span>
          </div>
          <span className={styles.cardTime}>{complaint.created_at.slice(0,10)}</span>
        </div>
      </div>
    </div>
  );
}

export default ComplaintCard;
