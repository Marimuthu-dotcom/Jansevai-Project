import {BrowserRouter,Routes,Route} from "react-router-dom";
import Layout from "./pages/Layout";
import Dashboard from "./pages/Dashboard";
import Complaint from "./pages/Complaint";
import Members from "./pages/Members";
import Categories from "./pages/Categories";
import AddComplaint from "./pages/AddComplaint";
import Profile from "./pages/Profile";
import MyProfile from "./pages/MyProfile";
import ComplaintDetails from "./pages/ComplaintDetails";
import ChatBox from "./pages/ChatBox";
import NotificationPage from "./pages/NotificationPage";
import InviteMember from "./pages/InviteMember";
import RecentComplaints from "./pages/RecentComplaints";
import { Navigate } from "react-router-dom";
function App() {

  return (
    <BrowserRouter>
    <Routes>
         <Route path="/" element={<Layout />}>
         <Route
            index
            element={<Navigate to="/dashboard" />}
          />
          <Route
            path="dashboard"
            element={<Dashboard />}
          />
          <Route
            path="complaint"
            element={<Complaint />}
          />
          <Route
            path="members"
            element={<Members />}
          />
          <Route 
            path="profile/:userEmail" 
            element={<Profile />} />
          <Route 
            path="my-profile" 
            element={<MyProfile />} />
          <Route
            path="categories"
            element={<Categories />}
          />
          <Route 
            path="complaint/:id" 
            element={<ComplaintDetails />} 
          />
          <Route
            path="chat-box/:email"
            element={<ChatBox />}
          />
          <Route
            path="add-complaint"
            element={<AddComplaint />}
          />
          <Route
            path="notification"
            element={<NotificationPage />}
          />
          <Route
            path="invite-member"
            element={<InviteMember />}
          />
          <Route 
            path="/recent-complaints"  
            element={<RecentComplaints />} 
          />
         </Route>
    </Routes>
    </BrowserRouter>
  )
}

export default App;
