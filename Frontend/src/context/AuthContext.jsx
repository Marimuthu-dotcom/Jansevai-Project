import { useState ,useEffect, useRef, useCallback } from "react";
import socket from "../socket/socket.js";
import { AuthContext } from "./CreateContext.jsx";
import axios from "axios";
import api, { startAutoRefresh, stopAutoRefresh,resetAuthFlags } from "../api/api.js";

export const AuthProvider = ({ children }) => {

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() => localStorage.getItem("token"));
  console.log(token);

  const [members, setMembers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myComplaints, setMyComplaints] = useState([]);
  const [activity, setActivity] = useState([]);
  const [commentsCache, setCommentsCache] = useState({});
  const [supportersCache, setSupportersCache] = useState({});
  const [trends, setTrends] = useState({});
  const [categoryStats, setCategoryStats] = useState(null);
  const [statusDiff,setStatusDiff] = useState(null);
  const [statusPercentages,setStatusPercentages] = useState(null);
  const [statusCounts, setStatusCounts] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [chatMessages, setChatMessages] = useState({});  // Structure: { "kumar@mail.com": [msg1, msg2, ...], "ravi@mail.com": [...] }
  const [typingUsers, setTypingUsers] = useState({});   // Structure: { 105: true }   -> userId 105 typing pannikitu irukaan
  const [activeChatUser, setActiveChatUser] = useState(null); // Currently ChatBox open panni irukra member (email)

  const login = (accessToken) => {
    localStorage.setItem("token", accessToken);
    setToken(accessToken);
    startAutoRefresh();
  };

  const logout = async() => {
  //  Step 1: Stop auto refresh FIRST
  stopAutoRefresh();
  //  Step 2: Reset all flags
  resetAuthFlags();
  //  Step 3: Use plain axios (not api instance) to avoid interceptor loop
  try {
    await axios.post(
      `${import.meta.env.VITE_API_URL}/api/auth/logout`,
      {},
      { withCredentials: true }
    );
    console.log("Logout API success");
  } catch (err) {
    console.log("Logout error:", err.message);
  }
  
  // Step 4: Clear local state
  localStorage.removeItem("token");
  setUser(null);
  setToken(null);
  
};

  useEffect(() => {
    const fetchData = async () => {
      if (!token) {
        setLoading(false);
        setUser(null);
        return;
      }

      try {

        try {
          const userRes = await api.get(`/api/auth/me`);
          setUser(userRes.data);
        } 
        catch (err) 
        {
          if (err.response?.status === 401 || err.response?.status === 404) {
            console.log("Invalid token or user not found — logging out");
            logout();
            setLoading(false);
            return;
          }
          console.log("Network error:", err);
          setLoading(false);
          return;
        }

        const membersRes = await api.get(`/api/auth/users`);
        setMembers(membersRes.data);

        const complaintsRes = await api.get(`/api/auth/getComplaints`);
        setComplaints(complaintsRes.data);

        const myComplaintsRes = await api.get(`/api/auth/getMyComplaints`);
        setMyComplaints(myComplaintsRes.data);

        const activityRes = await api.get(`/api/auth/my-activities`);
        setActivity(activityRes.data);

        const res = await api.get(`/api/auth/category-stats`);
        setCategoryStats(res.data);

        const snapshotRes = await api.get(`/api/auth/status-snapshot`);
        setStatusCounts(snapshotRes.data.counts);
        setStatusPercentages(snapshotRes.data.percentages);
        setStatusDiff(snapshotRes.data.diff);

        const categoryTrends = await api.get(`/api/auth/category-trends`);
        setTrends(categoryTrends.data);

        const notifRes = await api.get(`/api/auth/notifications`);
        setNotifications(notifRes.data);

      } 
      catch (err) {
        console.log("Error:", err);
      } 
      finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

  useEffect(() => {
  if (user?.id) {
    socket.emit("join-room", user.id); //  You need to create a room after logging in.
  }
}, [user?.id]);

//  User online
useEffect(() => {
  socket.on("user-online", ({ userId }) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId
          ? { 
            ...m, 
            is_online: true 
          }
          : m
      )
    );
  });
  return () => socket.off("user-online");
}, []);

//  User offline
useEffect(() => {
  socket.on("user-offline", ({ userId, last_seen }) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === userId
          ? { ...m,
              is_online: false,
              last_seen 
            }
          : m
      )
    );
  });
  return () => socket.off("user-offline");
}, []);


useEffect(() => 
{
  socket.on("complaint-deleted", (data) =>
    {
    setComplaints((prev) => prev.filter((c) => c.id !== data.complaintId));
    setMyComplaints((prev) => prev.filter((c) => c.id !== data.complaintId));
    setStatusDiff(data.diff);
    setStatusPercentages(data.percentages); 
    setStatusCounts(data.counts);
    setTrends(data.trends);
    

    if (data.categoryData) 
    {
    setCategoryStats((prev) => 
    {
      if (!prev) 
        return prev;

      const updatedCategories = prev.categories.map((cat) => 
      {
        const updated = data.categoryData[cat.name];

        if (!updated) 
          return cat;

        return {
          ...cat,
          count: updated.count,
          currentPercent: updated.currentPercent,
          prevPercent:    updated.prevPercent,
          diff:           updated.diff,
          trend:          updated.trend,
        };
      });

      return { 
      ...prev,
      total: data.newTotal,
      resolvedRate: data.resolvedRate,
      mostActive: data.mostActiveCategory, 
      complaintDiff: data.complaintTotal,
      complaintTrend:data.complaintTrend,
      categories: updatedCategories
    };
    });
  }
  });

  return () => socket.off("complaint-deleted");
}, []);

  useEffect(() => {

  const handleNewComment = (comment) => {
    setCommentsCache(prev => ({ ...prev,
       [comment.complaint_id]: [
        ...(prev[comment.complaint_id] || []),
        comment
      ]
    }));
    
    setComplaints(prev =>
    prev.map(c =>
      c.id === comment.complaint_id
        ? {
            ...c,
            comments_count: (comment.commentsCount || 0)
          }
        : c
    )
  );
  };


  socket.on("new-comment", handleNewComment);
  return () => socket.off("new-comment", handleNewComment);
}, []);


  useEffect(() => {

  socket.on("profile-updated", (data) => {

    setMembers((prev) =>
      prev.map((member) =>
        member.email === data.email
          ? {
              ...member,
              ...data.updates
            }
          : member
      )
    );

    setUser((prev) => {

      if (!prev) return prev;

      if (prev.email === data.email) {
        return {
          ...prev,
          ...data.updates
        };
      }

      return prev;
    });

  });

  return () => {
    socket.off("profile-updated");
  };

}, []);

useEffect(() => {

  socket.on("new-member", (member) => {

    setMembers((prev) => [
      ...prev,
      member
    ]);

  });

  return () => {
    socket.off("new-member");
  };

}, []);

// இப்படி replace பண்ணு
/* useEffect(() => {
  socket.on("category-stats-updated", (data) => {
    if (!data?.categoryData) 
      return;

    setCategoryStats((prev) => 
    {
      if (!prev) 
        return prev;

      const updatedCategories = prev.categories.map((cat) => 
      {
        const updated = data.categoryData[cat.name];

        if (!updated) 
          return cat;

        return {
          ...cat,
          count: updated.count,
          currentPercent: updated.currentPercent,
          prevPercent:    updated.prevPercent,
          diff:           updated.diff,
          trend:          updated.trend,
        };
      });

      return { 
      ...prev,
      total: data.total,
      resolvedRate: data.resolvedRate,
      mostActive: data.mostActiveCategory, 
      categories: updatedCategories };
    });
  });

  return () => socket.off("category-stats-updated");
}, []); */

useEffect(() => {
  const handleSupportUpdate = (data) => {
    // Complaints array update
    setComplaints(prev => prev.map(c =>
      c.id === data.complaintId
        ? { ...c, support_count: data.supportCount }
        : c
    ));
    // Supporters cache update
    setSupportersCache(prev => ({
      ...prev,
      [data.complaintId]: {
        supportCount: data.supportCount,
        supporters: data.supporters
      }
    }));
  };
  socket.on("support-updated", handleSupportUpdate);
  return () => socket.off("support-updated", handleSupportUpdate);
}, []);

useEffect(() => {

  const handleComplaint = ({
    complaint,
    trends,
    categoryData,
    total,
    resolvedRate,
    complaintTotal,
    complaintTrend,
    mostActiveCategory,
    newActivity
    }) => {

    setComplaints(prev => [
      complaint,
      ...prev
    ]);

    setTrends(trends);


    if (categoryData) {
    setCategoryStats((prev) => 
    {
      if (!prev) 
        return prev;

      const updatedCategories = prev.categories.map((cat) => 
      {
        const updated = categoryData[cat.name];

        if (!updated) 
          return cat;

        return {
          ...cat,
          count: updated.count,
          currentPercent: updated.currentPercent,
          prevPercent:    updated.prevPercent,
          diff:           updated.diff,
          trend:          updated.trend,
        };
      });

      return { 
      ...prev,
      total: total,
      resolvedRate: resolvedRate,
      mostActive: mostActiveCategory, 
      complaintDiff: complaintTotal,
      complaintTrend,
      categories: updatedCategories
    };
    });
  }

    if (complaint.user_email === user?.email) {

      setMyComplaints(prev => [
        complaint,
        ...prev
      ]);

    }

    setActivity((prev) => [newActivity, ...prev]);
  };

  const handlePendingUpdate = (data) => {

    if (data.email === user?.email) {

      setUser(prev => ({
        ...prev,
        reported: data.pending
      }));

    }
  };

  socket.on("new-complaint", handleComplaint);
  socket.on("pending-updated", handlePendingUpdate);

  return () => {
    socket.off("new-complaint", handleComplaint);
    socket.off("pending-updated", handlePendingUpdate);
  };

}, [user?.email]);

useEffect(() => {

  const handleLikeUpdate = ({ complaintId, likesCount,userEmail,liked }) => {
    setComplaints((prev) =>
      prev.map(item =>
        item.id === Number(complaintId) ? 
          {  ...item,
            likes_count: likesCount,
            isLiked: userEmail === user?.email 
            ? liked 
            : item.isLiked,
          }:
        item )
    );
  };

  socket.on("complaint-liked", handleLikeUpdate);

  return () => {
    socket.off("complaint-liked",handleLikeUpdate);
  };

}, [user?.email]);

useEffect(() => {
  const handleStatusUpdate = (data) => {
    setComplaints(prev => prev.map(c =>
      c.id === data.complaintId
        ? {
            ...c,
            status: data.status,
            ...(data.resolved_url && { resolved_url: data.resolved_url })
          }
        : c
    ));

    setActivity((prev) => prev.map((a) =>
        a.id === data.complaintId
          ? {
              ...a,
              status:     data.status,
              updated_at: new Date().toISOString(),
            }
          : a
      )
    );

    setMyComplaints((prev)=> prev.map((a)=>
        a.id === data.complaintId
          ? {
              ...a,
              status:     data.status
            }
          : a
    ));
  
  setStatusDiff(data.diff);
  setStatusPercentages(data.percentages); 
  setStatusCounts(data.counts);

  if (data.status === "Resolved") {
  setCategoryStats(prev => {
    if (!prev) 
      return prev;

    return {
      ...prev,
      resolvedRate: data.resolvedRate,
      resolvedDiff: data.resolvedDiff,
      resolvedTrend: data.resolvedTrend
    };
  });
}


 setActivity((prev) => {
      const exists = prev.some((a) => a.id === data.complaintId);

      if (exists) {
        // Already இருக்கு — status மாத்து
        return prev.map((a) =>
          a.id === data.complaintId
            ? { ...a, status: data.status, updated_at: new Date().toISOString() }
            : a
        );
      }

      // Activity list-ல இல்ல — own complaint-ஆ இருந்தா புதுசா add பண்ணு
      if (data.complaintTitle && data.userEmail === user?.email) {
        return [
          {
            id:         data.complaintId,
            title:      data.complaintTitle,
            status:     data.status,
            updated_at: new Date().toISOString(),
          },
          ...prev,
        ];
      }

      return prev; // வேற யாருக்கோ உள்ள complaint — touch பண்ணாதே
    });

  };
  socket.on("status-updated", handleStatusUpdate);
  return () => socket.off("status-updated", handleStatusUpdate);
}, []);

useEffect(() => {

    const handleMemberUpdated = (data) => {

        setMembers(prev =>
            prev.map(member =>
                member.email === data.email
                    ? {
                        ...member,
                        reported: data.reported,
                        contributions: data.contributions,
                        resolved: data.resolved
                    }
                    : member
            )
        );

    };

    socket.on("member-updated", handleMemberUpdated);

    return () => {
        socket.off("member-updated", handleMemberUpdated);
    };

}, []);

const activeChatUserRef = useRef(null);

useEffect(() => {
  activeChatUserRef.current = activeChatUser;
}, [activeChatUser]);

//  Receive message listener
useEffect(() => {
  const handleReceiveMessage = (msg) => {
    
    setChatMessages(prev => ({
      ...prev,
      [msg.sender_email]: [...(prev[msg.sender_email] || []), msg]
    }));

    if (activeChatUserRef.current === msg.sender_email) {
              markMessagesAsRead(msg.sender_email);
            }
  };

  socket.on("receive-message", handleReceiveMessage);

  return () => { socket.off("receive-message", handleReceiveMessage); }
}, [activeChatUser, token]);

//  Typing indicator listeners
useEffect(() => {
  const handleUserTyping = ({ senderId }) => {
    setTypingUsers(prev => ({ ...prev, [senderId]: true }));
  };

  const handleUserStopTyping = ({ senderId }) => {
    setTypingUsers(prev => ({ ...prev, [senderId]: false }));
  };

  socket.on("user-typing", handleUserTyping);
  socket.on("user-stop-typing", handleUserStopTyping);

  return () => {
    socket.off("user-typing", handleUserTyping);
    socket.off("user-stop-typing", handleUserStopTyping);
  };
}, []);

  const loadChatHistory = async (otherUserEmail) => { // marimuthuk.ug.24.cs@francisxavier.ac.in
  try {
    const res = await api.get(
      `/api/auth/messages/${otherUserEmail}`);

    setChatMessages(prev => (
      { ...prev, [otherUserEmail]: res.data }));

    console.log("Received Messages:",chatMessages);
      
  } catch (err) {
    console.log("Chat history load error:", err);
  }
};

const sendChatMessage = async (receiverEmail, text) => {
  try {
    const res = await api.post(
      `/api/auth/send`, { receiverEmail, text },
    );

    setChatMessages(prev => ({
      ...prev,
      [receiverEmail]: [...(prev[receiverEmail] || []), res.data]
    }));

    console.log("Message sent to:", chatMessages);

    return res.data;
  } catch (err) {
    console.log("Send message error:", err);
  }
};

const markMessagesAsRead = async (otherUserEmail) => {
  try {
    //  STEP 1: API call pannурோm், complete aagum varaikkum WAIT pannурோм்
    await api.put(
      `/api/auth/mark-read`,
      { otherUserEmail }
    );

    //  STEP 2: API SUCCESS aana APPARAM mattum, local state update pannурோm்
    setChatMessages(prev => ({
      ...prev,
      [otherUserEmail]: (prev[otherUserEmail] || []).map(msg => ({
        ...msg,
        status: msg.sender_email !== user?.email ? "read" : msg.status
      }))
    }));
    

  } catch (err) {
    console.log("Mark as read error:", err);
    // API fail aana, state touch pannадhу (UI la "read" nа kaamikkаmал, actual DB status matchа vைchirukkும்)
  }
};

//  ADD PANNUNGA - "messages-read" listener
useEffect(() => {
  const handleMessagesRead = ({ readerEmail }) => {
    // Naan andha readerEmail ku anuppина messages ellame "read" ah maathurom
    setChatMessages(prev => ({
      ...prev,
      [readerEmail]: (prev[readerEmail] || []).map(msg =>
        msg.sender_email === user?.email ? { ...msg, status: "read" } : msg
      )
    }));
  };

  socket.on("messages-read", handleMessagesRead);

  return () => socket.off("messages-read", handleMessagesRead);
}, [user?.email]);

  return (
    <AuthContext.Provider
      value={{
        user,
        setUser,
        login,
        logout,
        token,
        members,
        loading,
        complaints,
        commentsCache,
        setCommentsCache,
        supportersCache,
        setSupportersCache,
        myComplaints,
        activity,
        trends,
        categoryStats,
        statusDiff,
        statusPercentages,
        statusCounts,
        notifications,
        setNotifications,
        chatMessages,
        typingUsers,
        activeChatUser,
        setActiveChatUser,
        loadChatHistory,
        sendChatMessage,
        setChatMessages,
        markMessagesAsRead,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

