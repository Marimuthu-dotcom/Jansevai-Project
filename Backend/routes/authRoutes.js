const express = require("express");
const router = express.Router();
const { registerUser , 
    verifyOtp ,
     savePassword ,
     loginUser ,
     googleSignUp ,
     googleLogin ,
     getMyProfile, 
     getAllUsers, 
     updateProfile ,
     createComplaint ,
     getComplaints,
     getMyComplaints,
     likeComplaint,
     getMemberComplaints,
     addComment,
     getComments,
     updateStatus,
     resolvedImage,
     getSupporters,
     getActivities,
     getMemberActivities,
     getCategories,
     getStatusSnapshot,
     getCategoryTrends,
     deleteComplaint,
     getNotification,
     readNotification,
     readAllNotification
  } = require("../controller/authController");
const { verifyToken } = require("../middleware/authMiddleware");
const upload = require("../upload/uploadMiddleware");

router.post("/register",registerUser);
router.post("/verify-otp",verifyOtp);
router.post("/save-password",savePassword);
router.post("/login",loginUser);
router.post("/google-signup",googleSignUp);
router.post("/google-login",googleLogin);
router.get("/me",verifyToken,getMyProfile);
router.patch("/update-profile",verifyToken,updateProfile);
router.get("/users",getAllUsers);
router.post("/addComplaint",verifyToken,upload.single("image"),createComplaint);
router.get("/getComplaints",verifyToken,getComplaints);
router.get("/getMyComplaints",verifyToken,getMyComplaints);
router.post("/likeComplaint/:id",verifyToken,likeComplaint);
router.get("/member-complaints/:email",getMemberComplaints);
router.get("/member-activity/:email",getMemberActivities)
router.post("/add-comments",verifyToken,addComment);
router.get("/get-comments/:complaintId",getComments);
router.post("/support/:id", verifyToken, updateStatus );
router.put("/status/:id",verifyToken,upload.single("resolvedImage"),resolvedImage);
router.get("/supporters/:id",getSupporters);
router.get("/my-activities",verifyToken,getActivities);
router.get("/category-stats", verifyToken, getCategories);
router.get("/status-snapshot",verifyToken,getStatusSnapshot);
router.get("/category-trends",verifyToken,getCategoryTrends);
router.delete("/deleteComplaint/:id", verifyToken, deleteComplaint);
router.get("/notifications", verifyToken,getNotification);
router.put("/read-all", verifyToken,readAllNotification);
router.put("/:id/read", verifyToken,readNotification);

module.exports = router;


