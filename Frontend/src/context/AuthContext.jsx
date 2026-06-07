import { useState ,useEffect} from "react";
import axios from "axios";
import socket from "../socket/socket.js";
import { AuthContext } from "./CreateContext.jsx"

export const AuthProvider = ({ children }) => {
  const api = import.meta.env.VITE_API_URL;

  const [user, setUser] = useState(null);

  const [token, setToken] = useState(() =>
    localStorage.getItem("token")
  );

  const [members, setMembers] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [myComplaints, setMyComplaints] = useState([]);
  const [activity, setActivity] = useState([]);
  const [commentsCache, setCommentsCache] = useState({});
  const [supportersCache, setSupportersCache] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (token) {
          const userRes = await axios.get(
            `${api}/api/auth/me`,
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setUser(userRes.data);

        }

        const membersRes = await axios.get(
          `${api}/api/auth/users`
        );

        setMembers(membersRes.data);

        const complaintsRes = await axios.get(
          `${api}/api/auth/getComplaints`,{
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        );

        setComplaints(complaintsRes.data);

        const myComplaintsRes = await axios.get(
          `${api}/api/auth/getMyComplaints`,
          {
            headers: {
              Authorization: `Bearer ${token}` 
            },
          }
        );

        setMyComplaints(myComplaintsRes.data);

      const activityRes = await axios.get(
        `${api}/api/auth/my-activities`,
        {
          headers: {  Authorization: `Bearer ${token}` }
        }
      );
      setActivity(activityRes.data);

      } 
      catch (err) {
        console.log("Error:",err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

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

    console.log("Profile Updated:", data);

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

  const handleComplaint = (complaint) => {

    setComplaints(prev => [
      complaint,
      ...prev
    ]);

    if (complaint.user_email === user?.email) {

      setMyComplaints(prev => [
        complaint,
        ...prev
      ]);

    }
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

  const handleLikeUpdate = ({ complaintId, likesCount }) => {
    setComplaints((prev) => prev.map(item =>
        item.id === Number(complaintId) ? {  ...item,likes_count: likesCount}: item )
    );
  };

  socket.on("complaint-liked", handleLikeUpdate);

  return () => {
    socket.off("complaint-liked",handleLikeUpdate);
  };

}, []);

useEffect(() => {
  const handleStatusUpdate = (data) => {
    setComplaints(prev => prev.map(c =>
      c.id === data.complaintId
        ? {
            ...c,
            status: data.status,
            ...(data.resolvedImage && { resolved_image: data.resolvedImage })
          }
        : c
    ));
  };
  socket.on("status-updated", handleStatusUpdate);
  return () => socket.off("status-updated", handleStatusUpdate);
}, []);

  const login = (token) => {
    localStorage.setItem("token", token);
    setToken(token);
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
    setToken(null);
  };

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
        activity
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


