import { createContext, useState ,useEffect} from "react";
import axios from "axios";
import socket from "../socket/socket.js";

export const AuthContext = createContext();

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

      } 
      catch (err) {
        console.log(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [token]);

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
        myComplaints
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};


