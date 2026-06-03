const jwt = require("jsonwebtoken");
const db= require("../config/db");
require("dotenv").config();
const { sendOtpMail } = require("../utilis/sendMail");
const bcrypt=require("bcryptjs");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { getIo } = require("../socket/socket.js");

exports.googleSignUp = async (req, res) => {
  try {
    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID 
    });

    const payload = ticket.getPayload();
    const email = payload.email;
    const name = payload.name;

    const [existingUser] = await db.promise().query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    if (existingUser.length > 0) {
      return res.status(400).json({
        message: "Email already registered. Please login!"
      });
    }

    const [result] = await db.promise().query(
      `INSERT INTO users (username, email, is_verified)
       VALUES (?, ?, ?)`,
      [name, email, 1]
    );

    const userId = result.id;

    await db.promise().query(
      `INSERT INTO userDetails (id, user_email)
       VALUES (?, ?)`,
      [userId, email]
    );
    

    const jwtToken = jwt.sign(
      { email: email, 
        username: name }, 
      process.env.JWT_SECRET_KEY,
      { expiresIn: "7d" }
    );

     const io = getIo();
        
        io.emit("new-member", {
          name,
          email
        });

    res.status(201).json({ token: jwtToken });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Google registration failed" });
  }
};

exports.googleLogin = async (req, res) => {
  try {

    const { token } = req.body;

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    const payload = ticket.getPayload();

    const email = payload.email;

    // CHECK USER EXISTS
    const [existingUser] = await db.promise().query(
      `SELECT * FROM users WHERE email = ?`,
      [email]
    );

    // ACCOUNT NOT FOUND
    if (existingUser.length === 0) {
      return res.status(404).json({
        message: "Account does not exist. Please signup."
      });
    }

    const user = existingUser[0];

    // JWT
    const jwtToken = jwt.sign(
      {
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d"
      }
    );

    res.status(200).json({
      token: jwtToken
    });

  } catch (err) {

    console.log(err);

    res.status(500).json({
      message: "Google Login Failed"
    });

  }
};

exports.registerUser = async (req, res) => {

    try {
        const {username, email, phone} = req.body;

        const checkSql = `SELECT * FROM users WHERE email = ?`;

        const [existingUser] =
          await db.promise().query(checkSql,[email]);

        if (existingUser.length > 0) {
            return res.status(400).json({
                message: "Email already exists"
            });
        }

        const otp = Math.floor(100000 + Math.random() * 900000);
        const otpExpiry = new Date(Date.now() + 5 * 60 * 1000);

        await sendOtpMail(email,otp);

        const sql = `INSERT INTO users
                    (email, phone_number,username, otp,otp_expiry,is_verified)
                    VALUES (?, ?, ?, ?, ?,?)`;

        await db.promise().query( sql, [email, phone,username, otp, otpExpiry,0] );

        const token = jwt.sign(
        {
            email: email,
            username:username
        },
        process.env.JWT_SECRET_KEY,
        {
            expiresIn: "7d"
        }
        );

        const io = getIo();
        
        io.emit("new-member", {
          username,
          email,
          phone
        });        

        res.status(200).json({
            message: "Data Sent Successfully",
            token
        });

    } 
    catch (error) 
    {
        res.status(500).json({
          message: error.message
        });
    }
};

exports.verifyOtp = async (req, res) => {
  try {

    const { otp } = req.body;

    const token = req.headers.authorization?.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    const email = decoded.email;

    const sql =
      `SELECT * FROM users WHERE email = ?`;

    const [user] =
      await db.promise().query(sql, [email]);

    if (user.length === 0) {
      return res.status(404).json({
        message: "User not found"
      });
    }

    if (user[0].otp != otp) {
      return res.status(400).json({
        message: "Invalid OTP"
      });
    }

  await db.promise().query(
      `UPDATE users
      SET is_verified = ?
      WHERE email = ?`,
      [1, email]
    ); 

    res.status(200).json({
      message: "OTP Verified"
    });

  } 
  catch (error) {

    res.status(500).json({
      message: error.message
    });
  }
};

exports.savePassword = async (req, res) => {

  try {

    const { password, confirmPassword } = req.body;

    if(password !== confirmPassword){
      return res.status(400).json({
        message: "Passwords do not match"
      });
    }

    const token =
      req.headers.authorization.split(" ")[1];

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET_KEY
    );

    const email = decoded.email;

    const hashedPassword =
      await bcrypt.hash(password, 10);

    await db.promise().query(
      `UPDATE users
       SET password = ?
       WHERE email = ?`,
      [hashedPassword, email]
    );

    res.status(200).json({
      message: "Password saved successfully"
    });

  }
  catch(error){

    res.status(500).json({
      message: error.message
    });

  }
};

exports.loginUser=async(req,res)=>{
try{
     
   const {userId,password}=req.body;
   const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [userId]);

if (!rows.length) {
  return res.status(404).json({ message: "Account does not exist" });
}

const user = rows[0];

const isMatch = await bcrypt.compare(password, user.password);

if (!isMatch) {
  return res.status(401).json({ message: "Invalid password" });
}

const token = jwt.sign(
   { 
    email: user.email,
    username: user.username },
   process.env.JWT_SECRET_KEY,
  {
  expiresIn: "7d",
  });

       res.status(200).json({ token });
   }
   catch(error){
      res.status(500).json({
      message: error.message
    });
   }
};

exports.getMyProfile = async (req, res) => {

    try {
        const email = req.user.email;

        const sql = `
        SELECT 
            users.id,
            users.username,
            users.email,
            users.phone_number,
            users.role,
            users.created_at,
            userDetails.location,
            userDetails.bio,
            userDetails.age,
            userDetails.gender,
            userDetails.contributions,
            userDetails.resolved,
            userDetails.reported
        FROM users
        INNER JOIN userDetails
        ON users.email = userDetails.user_email

        WHERE users.email = ?
        `;

        const [result] = await db.promise().query(sql, [email]);


        res.json(result[0]);

    }
    catch(err) {

        res.status(500).json({
            message: err.message
        });

    }

};

exports.getAllUsers = async (req, res) => {

  try {
    const sql = `
      SELECT
        users.id,
        users.username,
        users.email,
        users.phone_number,
        users.role,
        users.created_at,

        userDetails.location,
        userDetails.bio,
        userDetails.age,
        userDetails.gender,
        userDetails.contributions,
        userDetails.resolved,
        userDetails.reported

      FROM users

      INNER JOIN userDetails
      ON users.email = userDetails.user_email
    `;

    const [result] = await db.promise().query(sql);

    res.json(result);

  }
  catch (err) {

    res.status(500).json({
      message: err.message
    });

  }

};

exports.updateProfile = async (req, res) => {
  try {
    const userEmail = req.user.email;
    const updates = req.body;

    const userFields = {};
    const userDetailsFields = {};

    Object.entries(updates).forEach(([key, value]) => {

      if (key === "username" || key === "phone_number") {
        userFields[key] = value;  //users
      } else {
        userDetailsFields[key] = value;  //userDetails
      }

    });

    // Update users table
    if (Object.keys(userFields).length > 0) {

      const fields = [];
      const values = [];

      Object.entries(userFields).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
      });

      values.push(userEmail);

      await db.promise().query(
        `UPDATE users
         SET ${fields.join(", ")}
         WHERE email = ?`,
        values
      );
    }

    // Update userDetails table
    if (Object.keys(userDetailsFields).length > 0) {

      const fields = [];
      const values = [];

      Object.entries(userDetailsFields).forEach(([key, value]) => {
        fields.push(`${key} = ?`);
        values.push(value);
      });

      values.push(userEmail);

      await db.promise().query(
        `UPDATE userDetails
         SET ${fields.join(", ")}
         WHERE user_email = ?`,
        values
      );
    }

    const io = getIo();

    io.emit("profile-updated", {
      email: userEmail,
      updates :req.body
     });

    res.status(200).json({
      message: "Profile updated successfully"
    });


  } catch (error) {
    console.log(error);

    res.status(500).json({
      message: "Error updating profile"
    });
  }
};

exports.createComplaint = async (req, res) => {

  try {
    const { category,title,location,description } = req.body;

    const userEmail = req.user.email;

    let imageUrl = null;

    const [phone] = await db.promise().query(
      `SELECT phone_number , username FROM users WHERE email = ?`,
      [userEmail]
    );

    const phoneNumber = phone[0].phone_number;
    const username = phone[0].username;
    
    if (req.file) {
      imageUrl =`${req.protocol}://${req.get("host")}` + `/uploads/complaintImages/` + req.file.filename;}

    const [result] = await db.promise().query(
      `
      INSERT INTO complaints
      (
        user_email,
        username,
        phone_number,
        category,
        title,
        location,
        description,
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userEmail,
        username,
        phoneNumber,
        category,
        title,
        location,
        description,
        imageUrl
      ]
    );

    await db.promise().query(
    `
      UPDATE userDetails
      SET reported = reported + 1
      WHERE user_email = ?
      `,
      [userEmail]
    );

    const [rows] = await db.promise().query(
      `
      SELECT reported
      FROM userDetails
      WHERE user_email = ?
      `,
      [userEmail]
      );

    res.status(201).json({ message:"Complaint created successfully"} );

    const newComplaint = {
      id: result.insertId,
      user_email: userEmail,
      username,
      phone_number: phoneNumber,
      category,
      title,
      location,
      description,
      image_url: imageUrl,
      status: "Pending",
      created_at: new Date()
    };

    const io = getIo();

    io.emit("new-complaint", newComplaint);
    io.emit("pending-updated", {
        email: userEmail,
        pending: rows[0].reported
      });
    console.log("Emitted Complaint:", newComplaint);

  }
  catch(err)
   {
    console.log(err);

    res.status(500).json({
      message: err.message
    });

  }

};

exports.getComplaints = async (req, res) => {

  const userEmail = req.user.email;

  try {

    const sql = `
      SELECT
        c.id,
        c.category,
        c.title,
        c.username,
        c.phone_number,
        c.location,
        c.description,
        c.image_url,
        c.status,
        c.likes_count,
        c.comments_count,
        c.created_at,

        CASE
          WHEN cl.user_email IS NOT NULL THEN true
          ELSE false
        END AS isLiked

      FROM complaints c

      LEFT JOIN complaint_likes cl
      ON c.id = cl.complaint_id
      AND cl.user_email = ?

      ORDER BY c.created_at DESC
    `;

    const [result] =
      await db.promise().query(sql, [userEmail]);

    res.json(result);

  } catch (err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getMyComplaints = async (req, res) => {
 try{
    const userEmail = req.user.email;

     const sql = `SELECT title,category,location,status,created_at 
                 FROM complaints
                 WHERE user_email = ? 
                 ORDER BY created_at DESC`;

    const [result] = await db.promise().query(sql, [userEmail]);

    res.json(result);
 }
 catch(err){ 
   res.status(500).json({
      message: err.message
    });
 }
};


exports.likeComplaint = async (req, res) => {

   const complaintId = req.params.id;
   const userEmail = req.user.email;

   try {

      const [existing] = await db.promise().query(
         `
         SELECT *
         FROM complaint_likes
         WHERE complaint_id = ?
         AND user_email = ?
         `,
         [complaintId, userEmail]
      );

      if (existing.length > 0) {

         await db.promise().query(
            `
            DELETE FROM complaint_likes
            WHERE complaint_id = ?
            AND user_email = ?
            `,
            [complaintId, userEmail]
         );

         await db.promise().query(
            `
            UPDATE complaints
            SET likes_count = likes_count - 1
            WHERE id = ?
            `,
            [complaintId]
         );

         const io = getIo();

        const [[complaint]] = await db.promise().query(
            `
            SELECT likes_count
            FROM complaints
            WHERE id=?
            `,
            [complaintId]
        );

        io.emit("complaint-liked",{ complaintId, likesCount: complaint.likes_count});

         return res.json({
            liked: false
         });
      }

      //like
      await db.promise().query(
         `
         INSERT INTO complaint_likes
         (complaint_id,user_email)
         VALUES (?,?)
         `,
         [complaintId, userEmail]
      );

      await db.promise().query(
         `
         UPDATE complaints
         SET likes_count = likes_count + 1
         WHERE id = ?
         `,
         [complaintId]
      );
  
       const io = getIo();

        const [[complaint]] = await db.promise().query(
        `
        SELECT likes_count
        FROM complaints
        WHERE id = ?
        `,
        [complaintId]
        );

        io.emit("complaint-liked", { complaintId, likesCount: complaint.likes_count });

      res.json({
         liked: true
      });

   } catch (err) {

      res.status(500).json({
         message: err.message
      });

   }
};

exports.getMemberComplaints = async (req, res) => {

  try{
    const { email } = req.params;
    console.log("Fetching complaints for:", email);
   const [complaints] = await db.promise().query(
      `
      SELECT *
      FROM complaints
      WHERE user_email = ?
      ORDER BY created_at DESC
      `,
      [email]
   );

   res.json(complaints);
  }
  catch(err){
    res.status(500).json({  
      message: err.message
    });
  }
};
exports.addComment = async (req, res) => {

  try {

    const { complaintId, commentText } = req.body;
    const email = req.user.email;

    const [user] = await db.promise().query(
      `SELECT username FROM users WHERE email = ?`,
      [email]
    );

    const username = user[0].username;

    const [result] = await db.promise().query(
      `
      INSERT INTO comments
      (complaint_id,user_email,username,comment_text)
      VALUES (?,?,?,?)
      `,
      [complaintId,email,username,commentText]
    );

    const newComment = {
      id: result.insertId,
      complaint_id: complaintId,
      user_email: email,
      username,
      comment_text: commentText,
      created_at: new Date()
    };

    const io = getIo();
    
    io.emit("new-comment", newComment);

    res.status(201).json(newComment);

  } catch(err) {
    res.status(500).json({
      message: err.message
    });
  }
};

exports.getComments = async (req,res) => {

  const { complaintId } = req.params;

  const [comments] = await db.promise().query(
    `
    SELECT *
    FROM comments
    WHERE complaint_id = ?
    ORDER BY created_at ASC
    `,
    [complaintId]
  );

  res.json(comments);
};