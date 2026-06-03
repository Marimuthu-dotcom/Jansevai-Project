import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import styles from "../styles/ChatBox.module.css";

function ChatBox() 
{
  const { userEmail } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [member, setMember] = useState(null);
  const messagesEndRef = useRef(null);
  const [isTyping, setIsTyping] = useState(false);

  useEffect(() => 
  {
    const memberFromState = location.state?.member;
    
    if (memberFromState)
    {
      setMember(memberFromState);
      loadMessagesForUser(memberFromState.email);
      console.log("Loaded member from state:", memberFromState.email);
    }
    else 
    {
      const savedMembers = localStorage.getItem("members");
      if (savedMembers) 
      {
        const foundMember = JSON.parse(savedMembers);
        if (foundMember) 
          {
          setMember(foundMember);
          loadMessagesForUser(foundMember.email);
        }
      }
    }
  }, [userEmail]);

  const loadMessagesForUser = (memberId) => {
    const savedMessages = localStorage.getItem(`chat_messages_${memberId}`);
    if (savedMessages) 
    {
      setMessages(JSON.parse(savedMessages));
    } 
    else
     {
      setMessages([
        {
          id: 1,
          senderId: memberId,
          text: `Hello! How can I help you with your complaint?`,
          timestamp: new Date(),
          read: true
        }
      ]);

      console.log("Loaded messages from localStorage for memberId:", messages);
    }
  };

  const saveMessages = (updatedMessages) => 
  {
    if (member) 
    {
      localStorage.setItem(`chat_messages_${member.email}`, JSON.stringify(updatedMessages));
    }
  };

  const handleSendMessage = () => {
    if
     (message.trim() === "") 
       return;

    const newMessage = 
    {
      id: messages.length + 1,
      senderId: "current",
      text: message,
      timestamp: new Date(),
      read: false
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    saveMessages(updatedMessages);
    setMessage("");
    
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      const replyMessage = 
      {
        id: updatedMessages.length + 1,
        senderId: member?.email,
        text: `Welcome ${member?.username}! Your complaint is being reviewed. We will get back to you shortly.`,
        timestamp: new Date(),
        read: false
      };
      const finalMessages = [...updatedMessages, replyMessage];
      setMessages(finalMessages);
      saveMessages(finalMessages);
    }, 2000);
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
            style={{ background: member.avatarColor }}
          >
            {member.username.charAt(0)}
          </div>
          <div className={styles.headerDetails}>
            <h2 className={styles.headerName}>{member.username}</h2>
            <div className={styles.headerStatus}>
              <span className={`${styles.statusDot} ${member.online ? styles.online : styles.offline}`} />
              <span>{member.online ? "Online" : "Offline"}</span>
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
            const isOwnMessage = msg.senderId === "current";
            const showDateSeparator = index === 0 || new Date(msg.timestamp).toDateString() !== new Date(messages[index - 1]?.timestamp).toDateString();
            
            return (
              <div key={msg.id}>
                {showDateSeparator && (
                  <div className={styles.dateSeparator}>
                    <span>{new Date(msg.timestamp).toDateString() === new Date().toDateString() ? "Today" : new Date(msg.timestamp).toLocaleDateString()}</span>
                  </div>
                )}
                <div className={`${styles.messageRow} ${isOwnMessage ? styles.ownMessage : styles.otherMessage}`}>
                  {!isOwnMessage && (
                    <div 
                      className={styles.messageAvatar}
                      style={{ background: member.avatarColor }}
                    >
                      {member.username.charAt(0)}
                    </div>
                  )}
                  <div className={styles.messageBubble}>
                    <p className={styles.messageText}>{msg.text}</p>
                    <div className={styles.messageMeta}>
                      <span className={styles.messageTime}>{formatTime(msg.timestamp)}</span>
                      {isOwnMessage && (
                        <span className={styles.messageStatus}>
                          {msg.read ? (
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 6L9 17l-5-5" />
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
          
          {isTyping && (
            <div className={`${styles.messageRow} ${styles.otherMessage}`}>
              <div 
                className={styles.messageAvatar}
                style={{ background: member.avatarColor }}
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
            onChange={(e) => setMessage(e.target.value)}
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
