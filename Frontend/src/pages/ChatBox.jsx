import { useState, useEffect, useRef, useContext } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/CreateContext.jsx";
import GetAvatarColor from "../components/GetAvatarColor.jsx";
import socket from "../socket/socket.js";
import styles from "../styles/ChatBox.module.css";
import api from "../api/api.js";

function ChatBox() 
{
  const { userEmail } = useParams(); // marimuthuk.ug.24.cs@francisxavier.ac.in
  const navigate = useNavigate();
  const location = useLocation();
  // ✅ Ellame Context-la irundhu vangaraom (AuthProvider.jsx la already irukku)
  const { user, token, chatMessages, typingUsers, setActiveChatUser, loadChatHistory, sendChatMessage, setChatMessages, markMessagesAsRead } = useContext(AuthContext);
  const [message, setMessage] = useState("");
  const [member, setMember] = useState(null); 
  const messagesEndRef = useRef(null);
  const typingTimeout = useRef(null);

  // ✅ STEP 1: Member set pannitu, Context function call panni DB history load
  useEffect(() => 
  {
    const memberFromState = location.state?.member;
    if (memberFromState)
    {
      setMember(memberFromState);
      setActiveChatUser(memberFromState.email);   // "Idhu ippo active chat" nu Context ku sollுrom marimuthuk.ug.24.cs@francisxavier.ac.in
      loadChatHistory(memberFromState.email);      // Context function - DB-la irundhu messages fetch
      markMessagesAsRead(memberFromState.email);
    }

    // Chat viட்டு poirochunga na, active chat clear pannunga (unread badge logic ku)
    return () => setActiveChatUser(null);
  }, [userEmail]);

  // ✅ STEP 2: Messages - localStorage illama, Context state-la irundhu direct ah edukkuரோம
  const messages = chatMessages[member?.email] || []; // marimuthuk.ug.24.cs@francisxavier.ac.in

  // ✅ STEP 3: Typing status - Context la irundhu real-time ah check pannுரோம்
  const isTyping = member && typingUsers[member.id];  

  // ChatBox.jsx — add this useEffect
useEffect(() => {
  if (!member?.email || !token) 
    return;

  // ✅ Mark existing messages as read when chat opens
  api.put(`/api/auth/mark-read`,
    { otherUserEmail: member.email });

  // ✅ Update local state instantly — no wait for server
  setChatMessages(prev => ({
    ...prev,
    [member.email]: (prev[member.email] || []).map(msg => ({
      ...msg,
      status: msg.sender_email !== user?.email ? "read" : msg.status
    }))
  })
);

}, [member?.email]); // fires every time you switch chat

  // ✅ STEP 4: Message send - localStorage save illama, Context function call
  const handleSendMessage = async () => {
    if (message.trim() === "") 
      return;

    await sendChatMessage(member.email, message);   // DB save + socket emit ellame Context handle pannும்
    setMessage("");

    // Message anuppina udane, typing status clear pannunga
    socket.emit("stop-typing", { receiverId: member.id });
    clearTimeout(typingTimeout.current);
  };

  // ✅ STEP 5: Typing event - real ah backend ku anuppுரோம் (fake illa)
  const handleMessageChange = (e) => {
    setMessage(e.target.value);

    socket.emit("typing", { receiverId: member.id });

    clearTimeout(typingTimeout.current);
    
    typingTimeout.current = setTimeout(() => {
      socket.emit("stop-typing", { receiverId: member.id });
    }, 3000);
  };

  const handleKeyPress = (e) => {
    if 
    (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const msgDate = new Date(date);
    const diffHours = (now - msgDate) / (1000 * 60 * 60);
    
    if (diffHours < 24) 
    {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } 
    else if (diffHours < 48) {
      return "Yesterday";
    } 
    else {
      return msgDate.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  // ✅ Auto-scroll - messages update aana udane
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView(
      { behavior: "smooth" }
  );
  }, [messages, isTyping]);

  if (!member) 
  {
    return <div className={styles.loading}>Loading...</div>;
  }

  return (
    <div className={styles.chatContainer}>
      <div className={styles.chatHeader}>
        <button className={styles.backBtn} onClick={() => navigate(-1)}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
        </button>
        
        <div className={styles.headerInfo}>
          <div 
            className={styles.headerAvatar}
            style={{ background: GetAvatarColor(member.username.charAt(0)) }}
          >
            {member.username.charAt(0)}
          </div>
          <div className={styles.headerDetails}>
            <h2 className={styles.headerName}>{member.username.toUpperCase()}</h2>
            <div className={styles.headerStatus}>
              <span className={`${styles.statusDot} ${member.is_online ? styles.online : styles.offline}`} />
              <span>{member.is_online ? "Online" : "Offline"}</span>
            </div>
          </div>
        </div>

        <button className={styles.menuBtn}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="21" cy="12" r="1" />
            <circle cx="13" cy="12" r="1" />
            <circle cx="5" cy="12" r="1" />
          </svg>
        </button>
      </div>

      <div className={styles.complaintBanner}>
        <div className={styles.bannerIcon}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z" />
            <circle cx="12" cy="9" r="2.5" />
          </svg>
        </div>
        <div className={styles.bannerContent}>
          <h4>📍 {member.location}</h4>
          <p>Volunteer • {member.contributions} contributions • {member.resolved} resolved</p>
        </div>
        <button className={styles.bannerBtn} onClick={() => navigate(`/profile/${member.email}`,{
          state: { member: member }
        })}>
          View Profile
        </button>
      </div>

      <div className={styles.messagesArea}>
        <div className={styles.messagesList}>
          {messages.map((msg, index) => {
            // ✅ localStorage senderId="current" ku badhula, real sender_email compare pannுரோம்
            const isOwnMessage = msg.sender_email === user?.email; // true
            const showDateSeparator = index === 0 || new Date(msg.created_at).toDateString() !== new Date(messages[index - 1]?.created_at).toDateString();
            
            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className={styles.dateSeparator}>
                    <span>{new Date(msg.created_at).toDateString() === new Date().toDateString() ? "Today" : new Date(msg.created_at).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={`${styles.messageRow} ${isOwnMessage ? styles.ownMessage : styles.otherMessage}`}>
                  {!isOwnMessage && (
                    <div 
                      className={styles.messageAvatar}
                      style={{ background: GetAvatarColor(member.username.charAt(0)) }}
                    >
                      {member.username.charAt(0)}
                    </div>
                  )}
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>{msg.message_text}</p>
                    <div className={styles.messageMeta}>
                      <span className={styles.messageTime}>{formatTime(msg.created_at)}</span>
                      {isOwnMessage && (
                        <span className={styles.messageStatus}>
                          {msg.status === "read" ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                              <path d="M18 6L7 17l-5-5" />
                              <path d="M22 10l-7.5 7.5L13 16" />
                            </svg>
                          ) : (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          
          {/* ✅ Idhu ippo REAL typing status - Context la irundhu varudhu, fake illa */}
          {isTyping && (
            <div className={`${styles.messageRow} ${styles.otherMessage}`}>
              <div 
                className={styles.messageAvatar}
                style={{ background: GetAvatarColor(member.username.charAt(0)) }}
              >
                {member.username.charAt(0)}
              </div>
              <div className={styles.typingIndicator}>
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className={styles.inputArea}>
        <div className={styles.inputContainer}>
          <button className={styles.attachBtn}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48" />
            </svg>
          </button>
          <textarea
            className={styles.messageInput}
            placeholder={`Message to ${member.username}...`}
            value={message}
            onChange={handleMessageChange}
            onKeyPress={handleKeyPress}
            rows="1"
          />
          <button 
            className={`${styles.sendBtn} ${message.trim() ? styles.active : ""}`}
            onClick={handleSendMessage}
            disabled={!message.trim()}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ChatBox;

