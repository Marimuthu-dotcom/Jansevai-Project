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
     getComments
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
router.post("/add-comments",verifyToken,addComment);
router.get("/get-comments/:complaintId",getComments);

module.exports = router;
