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
  const [membersPage, setMembersPage] = useState({
    selectedDistrict: "",
    selectedWard: null,
    wards: [],
    currentGroup: null,
    tableMembers: [],
    isUngrouped: false,
    isInitialized: false, // ONE TIME flag
    error: null,
    pagination: 
    {
    currentPage: 1,
    pageSize: 5,
    totalCount: 0,
    totalPages: 0, 
    },
    activeFilter: 'all',
    tabCounts: 
    { 
      all: 0, 
      active: 0, 
      admin: 0, 
      inactive: 0 
    },
  });

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

  const getAvatarColor = (email) => {
  const colors = ["#e91212", "#1877e4", "#ed10db", "#f0c909", "#4efc09", "#fa8806", "#512b03", "#4aed0a"];
  let hash = 0;
  for (let i = 0; i < email.length; i++) 
    hash = email.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
};

const getInitials = (name) => {
  if (!name) 
    return "??";
  return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
};

const formatDate = (mysqlDate) => {
  if (!mysqlDate) return "-";
  const d = new Date(mysqlDate);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

const transformMember = (m) => ({
  id: m.id,
  name: m.username || "Unknown",
  email: m.email,
  initials: getInitials(m.username),
  color: getAvatarColor(m.email),
  role: m.role || "Member",
  is_online:m.is_online,
  joined: formatDate(m.joined_at),
  contact: m.contact || "-",
  location: m.location || "Unknown",
  status: m.status || "Active",
  role:m.role|| "Member",
  reported: m.reported || 0,
  resolved: m.resolved || 0,
  contributions: m.contributions || 0,
  age: m.age || null,
  gender:m.gender || null,
  date: formatDate(m.date) || null,
  Bio: m.bio || null
});

// ─── API Service ───────────────────────────────────
const groupApi = {
  getWardsByDistrict: async (district) => {
    const res = await api.get(`/api/auth/district/${encodeURIComponent(district)}/wards`);
    return res.data;
  },
  getGroupByWard: async (district, wardNumber) => {
    const res = await api.get(`/api/auth/ward/${encodeURIComponent(district)}/${wardNumber}`);
    return res.data;
  },
  getGroupMembers: async (groupId, page = 1, limit = 5, filter = 'all') => {
    const res = await api.get(`/api/auth/${groupId}/members?page=${page}&limit=${limit}&filter=${filter}`);
    return res.data;
  },
  getUngroupedMembers: async (district,page=1,limit=5) => {
    const res = await api.get(`/api/auth/district/${encodeURIComponent(district)}/ungrouped-members?page=${page}&limit=${limit}`);
    return res.data;
  },
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

  useEffect(() => {
    if (!user || membersPage.isInitialized) 
      return;

    const initializeMembersPage = async () => {
      setMembersPage(prev => ({ ...prev, error: null }));

      try {
        const userDistrict = user.district || ""; // Thoothukudi
        const userWard = user.ward_number || null; // 45th ward

        if (!userDistrict) 
          throw new Error("User district not found");

        // Wards fetch
        const wardsData = await groupApi.getWardsByDistrict(userDistrict); // [{},{},..]
        const districtWards = wardsData.wards || []; // 3

        // User ward exist aagutha check
        const userWardExists = districtWards.some((w) => String(w.ward_number) === String(userWard));

        const targetWard = userWardExists ? userWard : districtWards[0]?.ward_number || null;
        let membersData = { members: [], totalCount: 0, totalPages: 0 };

        let groupData = null;
        let transformedMembers = [];
        let isUngrouped = false;

        // Wards irundha
        if (districtWards.length > 0 && targetWard)  // (true)
        {
          groupData = await groupApi.getGroupByWard(userDistrict, targetWard);

          if (groupData?.id) 
          {
            membersData = await groupApi.getGroupMembers(groupData.id, 1, 5, 'all');
            transformedMembers = (membersData.members || []).map(transformMember);
          }
        } 
        // 4. Wards illana ungrouped
        else {
          isUngrouped = true;
          try {
            const ungroupedData = await groupApi.getUngroupedMembers(userDistrict, 1, 5);
            transformedMembers = (ungroupedData.members || []).map(transformMember);
          } 
          catch (e) 
          {
            console.warn("Ungrouped API not available");
          }
        }

        // 5. Global state update (ONE TIME)
        setMembersPage({
          selectedDistrict: userDistrict, // Thoothuk/udi
          selectedWard: targetWard, // 43th
          wards: districtWards, // [{43},{45},..]
          currentGroup: groupData, // {id: 12, group_name: "43th Ward", ...}
          tableMembers: transformedMembers, // [{id: 1, name: "Kumar", email: "}]
          tabCounts: membersData.tabCounts || { all: 0, active: 0, admin: 0, inactive: 0 },
          pagination: {
            currentPage: 1,
            pageSize: 5,
            totalCount: membersData.totalCount || 0,
            totalPages: membersData.totalPages || 0,
          },
          isUngrouped: isUngrouped,
          isInitialized: true, // 🔒 LOCK - idhu true aagum, init malli run aagadhu
          error: null,
          // loading: false,
        });

      } 
      catch (err) 
      {
        console.error("Init error:", err);
        setMembersPage(prev => ({
          ...prev,
          // loading: false,
          error: err.response?.data?.message || err.message,
        }));
      }
    };

    initializeMembersPage();
  }, [user, membersPage.isInitialized]);

  // ─── Manual District Change ─────────────────
  const handleDistrictChange = useCallback(async (district) => {
    if (district === membersPage.selectedDistrict) 
      return;

    setMembersPage(prev => 
      ({ ...prev, 
        error: null, 
        selectedDistrict: district, 
        selectedWard: null, 
        tableMembers: [], 
        currentGroup: null,
        activeFilter: 'all', 
        pagination: 
        { currentPage: 1, pageSize: 5, totalCount: 0, totalPages: 0 }, 
        tabCounts: { all: 0, active: 0, admin: 0, inactive: 0 },
      }
      )
    );

    try {
      const wardsData = await groupApi.getWardsByDistrict(district);
      const districtWards = wardsData.wards || [];

      if (districtWards.length > 0) {
        setMembersPage(prev => ({
          ...prev,
          wards: districtWards,
          isUngrouped: false,
          // loading: false,
        }));
      } 


      else 
      {
        // Wards illana → ungrouped auto load
        let transformed = [];
        let ungroupedData = { members: [], totalCount: 0, totalPages: 0 };

        try {
          ungroupedData = await groupApi.getUngroupedMembers(district, 1, 5);
          transformed = (ungroupedData.members || []).map(transformMember);
        } 
        catch(e) 
        { 
          console.warn(e); 
        }

        setMembersPage(prev => ({
          ...prev,
          wards: [],
          isUngrouped: true,
          tableMembers: transformed,
          pagination: 
         {
          currentPage: 1,
          pageSize: 5,
          totalCount: ungroupedData.totalCount || 0,
          totalPages: ungroupedData.totalPages || 0,
         },
         tabCounts:{ all: 0, active: 0, admin: 0, inactive: 0 },          // loading: false,
        }));
      }
    } 
    catch (err) 
    {
      setMembersPage(prev => ({
        ...prev,
        // loading: false,
        error: err.response?.data?.message || err.message,
        wards: [],
      }));
    }
  }, [membersPage.selectedDistrict]);

  // ─── Manual Ward Change ─────────────────────
  const handleWardChange = useCallback(async (wardNumber, page = 1, filter = 'all') => 
    {
    if (wardNumber === membersPage.selectedWard) 
      return;

    setMembersPage(prev => ({ 
      ...prev, 
      error: null, 
      selectedWard: wardNumber, 
      isUngrouped: false,
      activeFilter: filter 
    }));

    try {
      const groupData = await groupApi.getGroupByWard(membersPage.selectedDistrict, wardNumber);
      
      let membersData = { members: [], totalCount: 0, totalPages: 0, tabCounts:{ all: 0, active: 0, admin: 0, inactive: 0 } };
      let transformed = [];

      if (groupData?.id) 
      {
        membersData = await groupApi.getGroupMembers(groupData.id, page, 5, filter);
        transformed = (membersData.members || []).map(transformMember);
      }

      console.log("Members Recors:",membersData);
      setMembersPage(prev => ({
        ...prev,
        currentGroup: groupData,
        tableMembers: transformed,
        pagination: 
        {
        currentPage: membersData.currentPage || page,
        pageSize: 5,
        totalCount: membersData.totalCount || 0,
        totalPages: membersData.totalPages || 0,
        },
        tabCounts: membersData.tabCounts || { all: 0, active: 0, admin: 0, inactive: 0 },
        // loading: false,
      }));
    } 
    catch (err) 
    {
      setMembersPage(prev => ({
        ...prev,
        // loading: false,
        error: err.response?.data?.message || err.message,
        currentGroup: null,
        tableMembers: [],
        pagination: { currentPage: 1, pageSize: 5, totalCount: 0, totalPages: 0 },
      }));
    }
  }, [membersPage.selectedDistrict, membersPage.selectedWard]);

  const handlePageChange = useCallback(async (newPage) => {
   
    const { pagination, isUngrouped, selectedWard, selectedDistrict, activeFilter, currentGroup } = membersPage;
  
  // Boundary check
  if (newPage < 1 || newPage > pagination.totalPages) 
    return;
  
  setMembersPage(prev => ({ ...prev, loading: true, error: null }));

  try {
    let membersData;
    
    if (isUngrouped) {
      // Ungrouped members fetch
      membersData = await groupApi.getUngroupedMembers(selectedDistrict, newPage, 5);
    } else if (selectedWard && currentGroup?.id) {
      // Ward members fetch with page + filter
      membersData = await groupApi.getGroupMembers(currentGroup.id, newPage, 5, activeFilter);
    } else {
      setMembersPage(prev => ({ ...prev, loading: false }));
      return;
    }

    const transformed = (membersData.members || []).map(transformMember);
    
    setMembersPage(prev => ({
      ...prev,
      tableMembers: transformed,
      tabCounts: membersData.tabCounts || { all: 0, active: 0, admin: 0, inactive: 0 },
      pagination: {
        currentPage: membersData.currentPage || newPage,
        pageSize: 5,
        totalCount: membersData.totalCount || 0,
        totalPages: membersData.totalPages || 0,
      },
      loading: false,
    }));
    
  } catch (err) {
    console.error("Page change error:", err);
    setMembersPage(prev => ({
      ...prev,
      loading: false,
      error: err.response?.data?.message || err.message,
    }));
  }
}, [membersPage.pagination.totalPages, membersPage.isUngrouped, membersPage.selectedWard, membersPage.selectedDistrict, membersPage.activeFilter, membersPage.currentGroup?.id]);

// ═══════════════════════════════════════════
// HANDLE FILTER CHANGE (NEW FUNCTION - Tabs ku)
// ═══════════════════════════════════════════
const handleMemberFilterChange = useCallback(async (filter) => {
  // Same page number, but filter change → reset to page 1
  const { selectedWard, selectedDistrict, isUngrouped, currentGroup } = membersPage;
  
  setMembersPage(prev => 
    ({ ...prev,  
      error: null, 
      activeFilter: filter 
    }));

  try {
    let membersData;
    
    if (isUngrouped) 
    {
      membersData = await groupApi.getUngroupedMembers(selectedDistrict, 1, 5);
    } 
    else if (selectedWard && currentGroup?.id) 
    {
      membersData = await groupApi.getGroupMembers(currentGroup.id, 1, 5, filter);
    } 
    else 
    {
      setMembersPage(prev => ({ ...prev, loading: false }));
      return;
    }

    const transformed = (membersData.members || []).map(transformMember);
    
    setMembersPage(prev => ({
      ...prev,
      tableMembers: transformed,
      tabCounts: membersData.tabCounts || { all: 0, active: 0, admin: 0, inactive: 0 },
      pagination: {
        currentPage: 1,
        pageSize: 5,
        totalCount: membersData.totalCount || 0,
        totalPages: membersData.totalPages || 0,
      },
    }));
    
  } 
  catch (err) 
  {
    setMembersPage(prev => ({
      ...prev,
      error: err.response?.data?.message || err.message,
    }));
  }
}, [membersPage.selectedWard, membersPage.selectedDistrict, membersPage.isUngrouped, membersPage.currentGroup?.id]);

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
        membersPage,
        handleDistrictChange,
        handleWardChange,
        handlePageChange,
        handleMemberFilterChange,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

