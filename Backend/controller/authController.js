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

    const userEmail = result.id;

    await db.promise().query(
      `INSERT INTO userDetails (id, user_email)
       VALUES (?, ?)`,
      [userEmail, email]
    );
    

    const jwtToken = jwt.sign(
      { id: userEmail,
        email: email, 
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

    console.log("1. Token received:", token ? "YES" : "NO");
    console.log("2. Token preview:", token?.slice(0, 30))

    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    });

    console.log("3. Ticket verified ✅");

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
        id: user.id,
        email: user.email,
        username: user.username
      },
      process.env.JWT_SECRET_KEY,
      {
        expiresIn: "7d"
      }

    );

    console.log("7. JWT created ✅");

    res.status(200).json({
      token: jwtToken
    });

  } catch (err) {
    
    console.log("❌ EXACT ERROR:", err.message);
    console.log("❌ ERROR NAME:", err.name);
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
     
   const {userEmail,password}=req.body;
   const [rows] = await db.promise().query("SELECT * FROM users WHERE email = ?", [userEmail]);

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

    const [[oldData]] = await db.promise().query(
                      `
                      SELECT COUNT(*) AS count
                      FROM complaints
                      WHERE category = ?
                      `,
                      [category]
                      ); 

   const oldCount = oldData.count; 

   const [[totalComplaint]] = await db.promise().query(
                      `
                      SELECT COUNT(*) AS count
                      FROM complaints`
                      );

   console.log("PrevTotal:",totalComplaint.count);

   await db.promise().query(
  `
  UPDATE category_snapshots
  SET prev_count = ?
  WHERE category = ?
  `,
  [oldCount, category] // 2 Drainage
);


    const [[snapshot]] = await db.promise().query(
  `SELECT pending, inProgress, resolved 
   FROM status_snapshots 
   WHERE id = 1`
);

   const prev_pending = snapshot.pending;
   const prev_inProgress = snapshot.inProgress;
   const prev_resolved = snapshot.resolved;


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

    const [[newData]] = await db.promise().query(
                      `
                      SELECT COUNT(*) AS count
                      FROM complaints
                      WHERE category = ?
                      `,
                      [category]
                      );

  const newCount = newData.count;

let trend = "stable";

if (newCount > oldCount) {
  trend = "up";
}
else if (newCount < oldCount) {
  trend = "down";
}

await db.promise().query(`
  UPDATE category_snapshots
  SET
    prev_count = current_count,
    trend = 'stable'
`);

await db.promise().query(
  `
  UPDATE category_snapshots
  SET
    prev_count = ?,
    current_count = ?,
    trend = ?
  WHERE category = ?
  `,
  [oldCount, newCount, trend, category] // 2, 3, up, Drainage
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

         const [[{ total: newTotal }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );
    const [[{ pending: newPending }]] = await db.promise().query(
      `SELECT COUNT(*) AS pending FROM complaints WHERE status = 'Pending'`
    );
    const [[{ inProgress: newInProgress }]] = await db.promise().query(
      `SELECT COUNT(*) AS inProgress FROM complaints WHERE status = 'In Progress'`
    );
    const [[{ resolved: newResolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    );

    const newSnapshot = {
      total:      newTotal,
      pending:    newTotal > 0 ? parseFloat(((newPending / newTotal) * 100).toFixed(1)) : 0, 
      inProgress: newTotal > 0 ? parseFloat(((newInProgress / newTotal) * 100).toFixed(1)) : 0, 
      resolved:   newTotal > 0 ? parseFloat(((newResolved / newTotal) * 100).toFixed(1)) : 0, 
    };

    // 4. COMPUTE DIFF — positive = increased, negative = decreased
    const diff = {
      pending:    parseFloat((newSnapshot.pending    - prev_pending).toFixed(1)), 
      inProgress: parseFloat((newSnapshot.inProgress - prev_inProgress).toFixed(1)), 
      resolved:   parseFloat((newSnapshot.resolved   - prev_resolved).toFixed(1)),
    };

    await db.promise().query(`
    UPDATE status_snapshots 
    SET 
      prev_pending    = ?,
      prev_inProgress = ?,
      prev_resolved   = ?,
      pending         = ?,
      inProgress      = ?,
      resolved        = ?
    WHERE id = 1
  `, [
    prev_pending,    // before update
    prev_inProgress,
    prev_resolved,
    newSnapshot.pending,     // after update
    newSnapshot.inProgress,
    newSnapshot.resolved
  ]);

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

    const [trendRows] = await db.promise().query(`
      SELECT category, trend
      FROM category_snapshots
    `);

    const trends = {};

    trendRows.forEach(row => {
      trends[row.category] = row.trend;
    });


    await updateCategorySnapshots();

    const [[{ total }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );

    console.log("updateTotal :",total);

    const [[{ resolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    );

    const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const [categoryRows] = await db.promise().query(
      `SELECT category, COUNT(*) AS count FROM complaints GROUP BY category`
    );

    const complaintTotal = total - totalComplaint.count;
    
    const complaintTrend = complaintTotal > 0 ? "up" : complaintTotal < 0 ?  "down" : null 

    let mostActiveCategory = "None";

    if (categoryRows.length > 0) {
      const max = categoryRows.reduce((a, b) =>
        a.count > b.count ? a : b
      );

      mostActiveCategory = max.category;
    }

    const countMap = {};

    categoryRows.forEach(row => {
      countMap[row.category] = row.count;
    });

    // DB-லிருந்து updated values fetch பண்ணு
    const [updatedSnaps] = await db.promise().query(
      `SELECT category, prev_percent, current_percent, trend, diff 
      FROM category_percentage`
    );

    const categoryData = {};

    updatedSnaps.forEach((s) => {
      categoryData[s.category] = {
        currentPercent: parseFloat(s.current_percent || 0),
        prevPercent87Y:    parseFloat(s.prev_percent    || 0),
        diff:           parseFloat(s.diff            || 0),
        trend:          s.trend || "stable",
        count:          countMap[s.category],
      };
    });
    
    const newActivity  = {
      id:         result.insertId,
      title,
      status:     "Pending",
      updated_at: new Date(),
    }

      const [allUsers] = await db.promise().query(
        `SELECT id FROM users WHERE email != ?`, [userEmail]
      );

      for (const u of allUsers) {

        await db.promise().query(
          `INSERT INTO notifications 
          (receiver_id, sender_name, type, title, description)
          VALUES (?, ?, ?, ?, ?)`,
          [
            u.id,
            username,
            "complaint",
            "New complaint submitted",
            `${username} reported: ${title}`
          ]
        );
      }

   res.status(201).json({ message:"Complaint created successfully"} );

    const io = getIo();

    io.emit("new-complaint",{
    complaint:newComplaint,
    trends ,
    categoryData ,
    total,
    complaintTotal,
    complaintTrend,
    resolvedRate,
    mostActiveCategory,
    newActivity
  });

    /* io.emit("category-stats-updated", { 
    categoryData,
    total,
    resolvedRate,
    mostActiveCategory }); */

    io.emit("pending-updated", {
        email: userEmail,
        pending: rows[0].reported
      });

      io.emit("status-updated", {
      counts: {
        total:      newTotal,
        pending:    newPending,
        inProgress: newInProgress,
        resolved:   newResolved,
      },
      percentages: newSnapshot,
      diff,
    });

    io.emit("new-notification", {
        sender_name: username,
        type:        "complaint",
        title:       "New complaint submitted",
        description: `${username} reported: ${title}`,
        is_read:     false,
        created_at:  new Date()
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
        c.resolved_url,
        c.status,
        c.likes_count,
        c.support_count,
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

      ORDER BY c.created_at ASC
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

     const sql = `SELECT id,title,category,location,status,created_at 
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

exports.getMemberActivities = async(req,res) =>{
   try{
    const { email } = req.params;
    console.log("Fetching complaints for:", email);

   const [activities] = await db.promise().query(
    `
    SELECT
      id,
      title,
      status,
      updated_at
    FROM complaints
    WHERE user_email = ?
    AND updated_at >= NOW() - INTERVAL 2 DAY
    ORDER BY updated_at DESC
    `,
    [email]
  );

   res.status(200).json(activities);
  }
  catch(err){
    res.status(500).json({  
      message: err.message
    });
  }
}

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

    await db.promise().query(
    `
    UPDATE complaints
    SET comments_count = (
      SELECT COUNT(*)
      FROM comments
      WHERE complaint_id = ?
    )
    WHERE id = ?
    `,
    [complaintId, complaintId]
  );

    const [[complaint]] = await db.promise().query(
    `
    SELECT comments_count
    FROM complaints
    WHERE id = ?
    `,
    [complaintId]
  );

    const newComment = {
      id: result.insertId,
      complaint_id: complaintId,
      user_email: email,
      username,
      comment_text: commentText,
      commentsCount: complaint.comments_count,
      created_at: new Date()
    };

    // addComment controller-ல
const [[info]] = await db.promise().query(
  `SELECT u.id AS posterId, c.title
   FROM complaints c
   JOIN users u ON c.user_email = u.email
   WHERE c.id = ?`,
  [complaintId]
);

// Own comment-க்கு notify வேண்டாம்
if (info.posterId !== req.user.id) {
  await db.promise().query(
    `INSERT INTO notifications
     (receiver_id, sender_name, type, title, description)
     VALUES (?, ?, ?, ?, ?)`,
    [
      info.posterId,
      username,
      "comment",
      "New Comment",
      `${username} commented on "${info.title}"`
    ]
  );
}

    const io = getIo();
    
    io.emit("new-comment", newComment);
    
    io.to(`user_${info.posterId}`).emit("new-notification", {
    sender_name: username,
    type:        "comment",
    title:       "New Comment",
    description: `${req.user.username} commented on "${info.title}"`,
    is_read:     false,
    created_at:  new Date()
  });

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

exports.updateStatus = async (req, res) => {
  const { id }  = req.params;
  const userEmail  = req.user.email;
  const username = req.user.username;
  
  try {
    // Already support பண்ணிருக்காரா check
    const [existing] = await db.promise().query(
      `SELECT id FROM complaint_supporters 
       WHERE complaint_id = ? AND user_email = ?`,
      [id, userEmail]
    );

    if (existing.length > 0) {
      // ✅ Already supported — remove (unsupport)
      await db.promise().query(
        `DELETE FROM complaint_supporters 
         WHERE complaint_id = ? AND user_email = ?`,
        [id, userEmail]
      );

      // Count update
      await db.promise().query(
        `UPDATE complaints 
         SET support_count = support_count - 1 
         WHERE id = ?`,
        [id]
      );

      const [complaint] = await db.promise().query(
        `SELECT support_count FROM complaints WHERE id = ?`, [id]
      );

      const io = getIo();

      io.emit("support-updated", {
        complaintId:  Number(id),
        supportCount: complaint[0].support_count,
        userEmail,
        action:       "removed"
      });

      return res.json(
        { message: "Unsupported", 
          supported: false });
    }

    // ✅ Support add
    await db.promise().query(
      `INSERT INTO complaint_supporters (complaint_id, user_email) VALUES (?, ?)`,
      [id, userEmail]
    );

    await db.promise().query(
      `UPDATE complaints 
       SET support_count = support_count + 1 
       WHERE id = ?`,
      [id]
    );

    // Supporters list எடு (avatars-க்காக)
    const [supporters] = await db.promise().query(`
      SELECT u.id, u.username 
      FROM complaint_supporters cs
      JOIN users u ON cs.user_email = u.email
      WHERE cs.complaint_id = ?
      ORDER BY cs.created_at DESC
      LIMIT 5
    `, [id]);

    const [complaint] = await db.promise().query(
      `SELECT support_count FROM complaints WHERE id = ?`, [id]
    );

    const [[info]] = await db.promise().query(
      `SELECT 
         u.id       AS posterId,
         u.username AS posterName,
         c.title
       FROM complaints c
       JOIN users u ON c.user_email = u.email
       WHERE c.id = ?`,
      [id]
    );

    // updateStatus (support) controller-ல
    if (info.posterId !== req.user.id) {
    await db.promise().query(
      `INSERT INTO notifications
      (receiver_id, sender_name, type, title, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        info.posterId,
        username,
        "support",
        "New Support",
        `${username} supported your complaint "${info.title}"`
      ]
    );
  }

     const io = getIo(); 
     
    io.emit("support-updated", {
      complaintId:  Number(id),
      supportCount: complaint[0].support_count,
      supporters,
      userEmail,
      action:       "added"
    });

    io.to(`user_${info.posterId}`).emit("new-notification", {
      type:        "support",
      title:       "New Support",
      description: `${username} supported your complaint`,
      is_read:     false,
      created_at:  new Date()
    });

    res.json({ message: "Supported", supported: true });

  } catch (err) {
    console.log(err);
    console.log("Error in support:", err);
    res.status(500).json({ message: "Failed" });
  }
};

exports.resolvedImage =  async (req, res) => {

  const { id }     = req.params;
  const { status } = req.body;
  const userEmail     = req.user.email;
  const username = req.user.username;

  try {

    const [[{ total }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );
    const [[{ pending }]] = await db.promise().query(
      `SELECT COUNT(*) AS pending FROM complaints WHERE status = 'Pending'`
    );
    const [[{ inProgress }]] = await db.promise().query(
      `SELECT COUNT(*) AS inProgress FROM complaints WHERE status = 'In Progress'`
    );
    const [[{ resolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    );

    const prevResolvedrate = total > 0 ? Math.round((resolved/total) * 100) : 0;

    const prevSnapshot = {
      total,
      pending:    total > 0 ? parseFloat(((pending / total) * 100).toFixed(1)) : 0, // 66.6
      inProgress: total > 0 ? parseFloat(((inProgress / total) * 100).toFixed(1)) : 0, // 16.6
      resolved:   total > 0 ? parseFloat(((resolved / total) * 100).toFixed(1)) : 0, // 16.6
    }

    const [complaints] = await db.promise().query(
      `SELECT user_email FROM complaints WHERE id = ?`,
      [id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    const complaintOwnerEmail = complaints[0].user_email;

    if (complaintOwnerEmail !== userEmail) {
      return res.status(403).json({
        message: "You are not authorized to update this complaint"
      });
    }

    let resolvedImage = null;

    // Resolved-ஆனா image upload பண்றோம்
    if (status === "Resolved" && req.file) {
      resolvedImage = `${req.protocol}://${req.get("host")}` + `/uploads/complaintImages/` + req.file.filename;; // or cloudinary URL
    }

    if (resolvedImage) {
      await db.promise().query(
        `UPDATE complaints 
         SET status = ?, resolved_url = ? 
         WHERE id = ?`,
        [status, resolvedImage, id]
      );

    } 
    else
   {
      await db.promise().query(
        `UPDATE complaints SET status = ? WHERE id = ?`,
        [status, id]
      );
    }

    const [[{ total: newTotal }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );
    const [[{ pending: newPending }]] = await db.promise().query(
      `SELECT COUNT(*) AS pending FROM complaints WHERE status = 'Pending'`
    );
    const [[{ inProgress: newInProgress }]] = await db.promise().query(
      `SELECT COUNT(*) AS inProgress FROM complaints WHERE status = 'In Progress'`
    );
    const [[{ resolved: newResolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    );

    const newSnapshot = {
      total:      newTotal,
      pending:    newTotal > 0 ? parseFloat(((newPending / newTotal) * 100).toFixed(1)) : 0, // 50
      inProgress: newTotal > 0 ? parseFloat(((newInProgress / newTotal) * 100).toFixed(1)) : 0, // 33.3
      resolved:   newTotal > 0 ? parseFloat(((newResolved / newTotal) * 100).toFixed(1)) : 0, // 16.6
    };

    // 4. COMPUTE DIFF — positive = increased, negative = decreased
    const diff = {
      pending:    parseFloat((newSnapshot.pending    - prevSnapshot.pending).toFixed(1)), // 50 - 66.6 = -16.6
      inProgress: parseFloat((newSnapshot.inProgress - prevSnapshot.inProgress).toFixed(1)), // 33.3 - 16.6 = 16.7
      resolved:   parseFloat((newSnapshot.resolved   - prevSnapshot.resolved).toFixed(1)), // 16.6 - 16.6 = 0
    };

  await db.promise().query(`
  UPDATE status_snapshots 
  SET 
    prev_pending    = ?,
    prev_inProgress = ?,
    prev_resolved   = ?,
    pending         = ?,
    inProgress      = ?,
    resolved        = ?
  WHERE id = 1
`, [
  prevSnapshot.pending,    // before update
  prevSnapshot.inProgress,
  prevSnapshot.resolved,
  newSnapshot.pending,     // after update
  newSnapshot.inProgress,
  newSnapshot.resolved
]);

const [[{ total: updatedTotal }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );

    const [[{ resolved : updatedResolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    );

    const resolvedRate = updatedTotal > 0 ? Math.round((updatedResolved / updatedTotal) * 100) : 0;

    const resolvedDiff = resolvedRate - prevResolvedrate  ; // 25.00 - 12.5

    const resolvedTrend =
    resolvedDiff > 0 ? "up" :
    resolvedDiff < 0 ? "down" :
    null;  // up

    console.log(updatedTotal);
    console.log(updatedResolved);
    console.log(resolvedRate);

    // resolvedImage controller-ல
    const [[complaintInfo]] = await db.promise().query(
      `SELECT u.id AS posterId, u.username AS posterName, c.title
      FROM complaints c
      JOIN users u ON c.user_email = u.email
      WHERE c.id = ?`,
      [id]
    );

    await db.promise().query(
      `INSERT INTO notifications
      (receiver_id, sender_name, type, title, description)
      VALUES (?, ?, ?, ?, ?)`,
      [
        complaintInfo.posterId,
        username,
        "status",
        "Status Updated",
        `Your complaint "${complaintInfo.title}" is now ${status}`
      ]
    );


    const io = getIo();

    io.emit("status-updated", {
      complaintId:    Number(id),
      status,
      resolved_url: resolvedImage,
      counts: {
        total:      newTotal,
        pending:    newPending,
        inProgress: newInProgress,
        resolved:   newResolved,
      },
      percentages: newSnapshot,
      diff,
      resolvedRate, // 25.00
      resolvedDiff, // 12.5
      resolvedTrend // up
    });

    // Specific user-க்கு மட்டும் notify
    io.to(`user_${complaintInfo.posterId}`).emit("new-notification", {
      sender_name: username,
      type:        "status",
      title:       "Status Updated",
      description: `Your complaint "${complaintInfo.title}" is now ${status}`,
      is_read:     false,
      created_at:  new Date()
    });

    res.json({ message: "Status updated" });

  } catch (err) {
   console.error("Status Update Error:", err);
   res.status(500).json({
    message: "Failed",
    error: err.message
  });
  }
};

// Get supporters for a complaint
exports.getSupporters = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.promise().query(`
      SELECT u.id, u.username
      FROM complaint_supporters cs
      JOIN users u ON cs.user_email = u.email
      WHERE cs.complaint_id = ?
      ORDER BY cs.created_at DESC
      LIMIT 5
    `, [id]);

    const [count] = await db.promise().query(
      `SELECT support_count FROM complaints WHERE id = ?`, [id]
    );

    res.json({
      supporters:   rows,
      supportCount: count[0]?.support_count || 0
    });
  } 
  catch (err) 
  {
    res.status(500).json({ message: "Failed" });
  }
};

exports.getActivities = async (req, res) => {
   try{
    const userEmail = req.user.email;

    const [rows] = await db.promise().query(
    `
    SELECT
      id,
      title,
      status,
      updated_at
    FROM complaints
    WHERE user_email = ?
      AND updated_at >= NOW() - INTERVAL 2 DAY
    ORDER BY updated_at DESC
    `,
    [userEmail]
  );

  res.status(200).json(rows);
   }
   catch(err){
    res.status(500).json({ message: "Failed to fetch activities" });
   }
};

// GET /api/auth/category-stats
exports.getCategories = async (req, res) => {
  try {

    const ALL_CATEGORIES = [
      "Water Supply",
      "Roads & Streets",
      "Street Lights",
      "Drainage",
      "Garbage",
      "Public Safety",
      "Environment",
      "Others",
    ];

    const [[{ total }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );

    const [[{ resolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    );

    const resolvedRate = total > 0 ? Math.round((resolved / total) * 100) : 0;

    const [categoryRows] = await db.promise().query(
      `SELECT category, COUNT(*) AS count FROM complaints GROUP BY category`
    );

    const countMap = {};

    categoryRows.forEach((r) => {
      countMap[r.category] = Number(r.count);
    });

    const [snapshots] = await db.promise().query(
      `SELECT category, prev_percent, current_percent, trend, diff FROM category_percentage`
    );

    const snapMap = {};

    snapshots.forEach((s) => {
      snapMap[s.category] = {
        prev_percent:    parseFloat(s.prev_percent),
        current_percent: parseFloat(s.current_percent),
        trend:           s.trend,
        diff:            parseFloat(s.diff),
      };
    });

    const categories = [];

    for (const name of ALL_CATEGORIES) {
      const count = countMap[name] || 0;

      const snap = snapMap[name];

      categories.push({
        name,
        count,
        currentPercent: snap?.current_percent ?? 0,
        prevPercent:    snap?.prev_percent    ?? 0,
        diff:           snap?.diff            ?? 0,
        trend:          snap?.trend           ?? "stable",
      });
    }

    const mostActive = categories.reduce(
      (max, cat) => (cat.count > max.count ? cat : max),
      { name: "N/A", count: 0 }
    ).name;

    res.json({
      total,
      resolved,
      resolvedRate,
      mostActive,
      categories,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
};

exports.getStatusSnapshot = async (req, res) => {
  try {

    const [[stats]] = await db.promise().query(`
      SELECT
        COUNT(*) AS total,
        SUM(status = 'Pending')     AS pending,
        SUM(status = 'In Progress') AS inProgress,
        SUM(status = 'Resolved')    AS resolved
      FROM complaints
    `); //  9 0 0

    const [[snap]] = await db.promise().query(`
      SELECT 
        pending, inProgress, resolved,
        prev_pending, prev_inProgress, prev_resolved
      FROM status_snapshots 
      WHERE id = 1
    `);  // 88.9 11.1 0 100 0 0
 
    const total = stats.total || 1; // 9

    // Live current percentages
    const currentPending    = parseFloat(((stats.pending    / total) * 100).toFixed(1));  // 100
    const currentInProgress = parseFloat(((stats.inProgress / total) * 100).toFixed(1));  // 0
    const currentResolved   = parseFloat(((stats.resolved   / total) * 100).toFixed(1));  // 0

    // snap.pending = already stored percentage (88.9, 11.1, 0)
    const snapPending    = parseFloat(snap.pending    || 0);
    const snapInProgress = parseFloat(snap.inProgress || 0);
    const snapResolved   = parseFloat(snap.resolved   || 0);

    const snapPrevPending    = parseFloat(snap.prev_pending    || 0); // 100
    const snapPrevInProgress = parseFloat(snap.prev_inProgress || 0); // 0
    const snapPrevResolved   = parseFloat(snap.prev_resolved   || 0); // 0

    // Status change ஆச்சா? — live vs stored snapshot compare
    const hasChanged =
      currentPending    !== snapPending    ||
      currentInProgress !== snapInProgress ||
      currentResolved   !== snapResolved;

    let percentages, diff;

    if (hasChanged) {
      // Live data use பண்ணு
      percentages = {
        pending:    currentPending,
        inProgress: currentInProgress,
        resolved:   currentResolved,
      }; // 100 0 0

      // Diff = current live % - prev snapshot %
      diff = {
        pending:    parseFloat((currentPending    - snapPending).toFixed(1)), // 100 - 88.9
        inProgress: parseFloat((currentInProgress - snapInProgress).toFixed(1)), // 11.9 - 11.9
        resolved:   parseFloat((currentResolved   - snapResolved).toFixed(1)), // 0-0
      }; 

      // Snapshot update — prev = old current, current = new live
      await db.promise().query(`
        UPDATE status_snapshots
        SET
          prev_pending    = pending,
          prev_inProgress = inProgress,
          prev_resolved   = resolved,
          pending         = ?,
          inProgress      = ?,
          resolved        = ?,
          last_updated    = NOW()
        WHERE id = 1
      `, [currentPending, currentInProgress, currentResolved]);

    } else {
      // No change — snapshot-ல இருக்கதே return பண்ணு
      percentages = {
        pending:    snapPending, // 88.9
        inProgress: snapInProgress, // 11.1
        resolved:   snapResolved, // 0
      };

      diff = {
        pending:    parseFloat((snapPending    - snapPrevPending).toFixed(1)), // 88.9 - 100
        inProgress: parseFloat((snapInProgress - snapPrevInProgress).toFixed(1)), // 11.1 - 0
        resolved:   parseFloat((snapResolved   - snapPrevResolved).toFixed(1)), // 0 - 0
      };
    }

    res.json({
      counts: {
        total:      stats.total,
        pending:    stats.pending,
        inProgress: stats.inProgress,
        resolved:   stats.resolved,
      },
      percentages,
      diff,
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

async function updateCategorySnapshots() {

  const ALL_CATEGORIES = 
  [
    "Water Supply", 
    "Roads & Streets", 
    "Street Lights",
    "Drainage", 
    "Garbage", 
    "Public Safety",
    "Environment", 
    "Others",
  ];

  // Total count
  const [[{ total }]] = await db.promise().query(
    `SELECT COUNT(*) AS total FROM complaints`
  ); // 0

  // Per category count
  const [categoryRows] = await db.promise().query(
    `SELECT category, COUNT(*) AS count
     FROM complaints GROUP BY category`
  );  // DRAINAGE- 0 LIGHTS- 0 ROADS- 0 WATER- 0 GARBAGE- 0 ENVIRON- 0 OTHER- 0 PUBLIC- 0

  const countMap = {};

  categoryRows.forEach((r) => 
    { countMap[r.category] = Number(r.count); }
);

  // Prev percentages — snapshot-லிருந்து
  const [snapshots] = await db.promise().query(
    `SELECT category, current_percent FROM category_percentage` 
  ); // DRAINAGE- 0 LIGHTS- 0 ROADS- 0 WATER- 100 GARBAGE- 0 ENVIRON- 0 OTHER- 0 PUBLIC- 0

  const prevMap = {};

  snapshots.forEach((s) => 
    {
    prevMap[s.category] = parseFloat(s.current_percent);
  });

  // Each category update
  for (const name of ALL_CATEGORIES) {
    const count          = countMap[name] || 0; // WATER - 1
    
    const currentPercent = total > 0
      ? parseFloat(((count / total) * 100).toFixed(2))
      : 0; // WATER - 0 

    const prevPercent    = prevMap[name] ?? 0; // WATER - 100

    const trend =
      currentPercent > prevPercent ? "up"   :
      currentPercent < prevPercent ? "down"  :
      "stable"; // down

    const diff = currentPercent - prevPercent; // -100 

    await db.promise().query(
      `UPDATE category_percentage
       SET prev_percent    = ?,
           current_percent = ?,
           diff            = ?,
           trend           = ?
       WHERE category      = ?`,
      [prevPercent, currentPercent, diff, trend, name]
    ); // 100 0 -100 down WATER
  }

}
exports.getCategoryTrends = async (req,res) =>{
try
{
  const [trendRows] = await db.promise().query(`
      SELECT category, trend
      FROM category_snapshots
    `);

    const trends = {};

    trendRows.forEach(row => {
      trends[row.category] = row.trend;
    });

    res.status(200).json(trends);
  }
  catch(err){
    res.status(500).json({ message: err.message });
  }
};
exports.deleteComplaint = async (req, res) => {
  try {
    const { id } = req.params;
    const userEmail = req.user.email; // ✅ Logged-in user

    const [[complaint]] = await db.promise().query(
      `SELECT user_email ,category FROM complaints WHERE id = ?`,
      [id]
    );

    const category = complaint.category;

    const [[totalComplaint]] = await db.promise().query(
                      `
                      SELECT COUNT(*) AS count
                      FROM complaints`
                      );

    const oldComplaintCount = totalComplaint.count;

    const [[oldData]] = await db.promise().query(
                      `
                      SELECT COUNT(*) AS count
                      FROM complaints
                      WHERE category = ?
                      `,
                      [category]
                      ); 

   const oldCount = oldData.count; 

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (complaint.user_email !== userEmail) {
      return res.status(403).json({ 
        message: "You can only delete your own complaint" 
      });
    }

    await db.promise().query(
      `DELETE FROM complaints WHERE id = ?`,
      [id]
    );

    const [[snapshot]] = await db.promise().query(
      `SELECT pending, inProgress, resolved 
      FROM status_snapshots 
      WHERE id = 1`
    ); 

   const prev_pending = snapshot.pending; // 100 
   const prev_inProgress = snapshot.inProgress; // 0
   const prev_resolved = snapshot.resolved; // 0

    const [[{ total: newTotal }]] = await db.promise().query(
      `SELECT COUNT(*) AS total FROM complaints`
    );  // 0

    const [[{ pending: newPending }]] = await db.promise().query(
      `SELECT COUNT(*) AS pending FROM complaints WHERE status = 'Pending'`
    ); // 0

    const [[{ inProgress: newInProgress }]] = await db.promise().query(
      `SELECT COUNT(*) AS inProgress FROM complaints WHERE status = 'In Progress'`
    ); // 0

    const [[{ resolved: newResolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    ); // 0

    const newSnapshot = {
      total:      newTotal, // 0
      pending:    newTotal > 0 ? parseFloat(((newPending / newTotal) * 100).toFixed(1)) : 0, // 0
      inProgress: newTotal > 0 ? parseFloat(((newInProgress / newTotal) * 100).toFixed(1)) : 0, // 0
      resolved:   newTotal > 0 ? parseFloat(((newResolved / newTotal) * 100).toFixed(1)) : 0, // 0
    };

    // 4. COMPUTE DIFF — positive = increased, negative = decreased
    const diff = {
      pending:    parseFloat((newSnapshot.pending    - prev_pending).toFixed(1)), // -100 
      inProgress: parseFloat((newSnapshot.inProgress - prev_inProgress).toFixed(1)), // 0
      resolved:   parseFloat((newSnapshot.resolved   - prev_resolved).toFixed(1)), // 0
    };

    await db.promise().query(`
    UPDATE status_snapshots 
    SET 
      prev_pending    = ?,
      prev_inProgress = ?,
      prev_resolved   = ?,
      pending         = ?,
      inProgress      = ?,
      resolved        = ?
    WHERE id = 1
  `, [
    prev_pending,    // before update // 100
    prev_inProgress, // 0
    prev_resolved, // 0
    newSnapshot.pending,     // after update // 0
    newSnapshot.inProgress, // 0
    newSnapshot.resolved // 0
  ]); 

    const [[newData]] = await db.promise().query(
                      `
                      SELECT COUNT(*) AS count
                      FROM complaints
                      WHERE category = ?
                      `,
                      [category]
                      );

  const newCount = newData.count;

  let trend = "stable";

if (newCount > oldCount) {
  trend = "up";
}
else if (newCount < oldCount) {
  trend = "down";
}

await db.promise().query(`
  UPDATE category_snapshots
  SET
    prev_count = current_count,
    trend = 'stable'
`);

await db.promise().query(
  `
  UPDATE category_snapshots
  SET
    prev_count = ?,
    current_count = ?,
    trend = ?
  WHERE category = ?
  `,
  [oldCount, newCount, trend, category] // 2, 3, up, Drainage
);

await updateCategorySnapshots();

const [trendRows] = await db.promise().query(`
      SELECT category, trend
      FROM category_snapshots
    `);

    const trends = {};

    trendRows.forEach(row => {
      trends[row.category] = row.trend;
    });

const [[{ resolved }]] = await db.promise().query(
      `SELECT COUNT(*) AS resolved FROM complaints WHERE status = 'Resolved'`
    ); // 0

    const resolvedRate = newTotal > 0 ? Math.round((resolved / newTotal) * 100) : 0; // 0

    const [categoryRows] = await db.promise().query(
      `SELECT category, COUNT(*) AS count FROM complaints GROUP BY category`
    );

    const complaintTotal = newTotal - oldComplaintCount; // 0
    
    const complaintTrend = complaintTotal > 0 ? "up" : complaintTotal < 0 ?  "down" : null 

    let mostActiveCategory = "None";

    if (categoryRows.length > 0) {
      const max = categoryRows.reduce((a, b) =>
        a.count > b.count ? a : b
      );

      mostActiveCategory = max.category;
    }

    const countMap = {};

    categoryRows.forEach(row => {
      countMap[row.category] = row.count;
    });

    // DB-லிருந்து updated values fetch பண்ணு
    const [updatedSnaps] = await db.promise().query(
      `SELECT category, prev_percent, current_percent, trend, diff 
      FROM category_percentage`
    );

    const categoryData = {};

    updatedSnaps.forEach((s) => 
    {
      categoryData[s.category] = {
        currentPercent: parseFloat(s.current_percent || 0),
        prevPercent:    parseFloat(s.prev_percent    || 0),
        diff:           parseFloat(s.diff            || 0),
        trend:          s.trend || "stable",
        count:          countMap[s.category],
      };
    });

    const io = getIo();

    io.emit("complaint-deleted", 
   { 
    complaintId: Number(id) ,
    counts: 
    {
        total:      newTotal,
        pending:    newPending,
        inProgress: newInProgress,
        resolved:   newResolved,
      },
      percentages: newSnapshot,
      diff,
      trends,
      categoryData ,
      newTotal,
      complaintTotal,
      complaintTrend,
      resolvedRate,
      mostActiveCategory
    });

    res.status(200).json({ message: "Complaint deleted successfully" });

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Failed to delete complaint" });
  }
};

exports.getNotification = async (req, res) => {

  try {
    const [rows] = await db.promise().query(
      `SELECT * FROM notifications
       WHERE receiver_id = ?
       ORDER BY created_at DESC
       LIMIT 50`,
      [req.user.id]
    );

    res.status(200).json(rows);
  } catch (err) 
  {
    res.status(500).json({ message: "Failed" });
  }
};

exports.readNotification = async (req, res) => {
  try{

  await db.promise().query(
    `UPDATE notifications SET is_read = TRUE
     WHERE id = ? AND receiver_id = ?`,
    [req.params.id, req.user.id]
  );
  res.status(200).json({ message: "Marked as read" });
}
catch(err){
  res.status(500).json("Caught Error :",err);
}
};

exports.readAllNotification = async (req, res) => {
  try{

  await db.promise().query(
    `UPDATE notifications SET is_read = TRUE
     WHERE receiver_id = ?`,
   [req.user.id]
  );

  res.status(200).json({message:"Message Read SuccessFully"})
}
catch(err){
  res.status(500).json("Failed to read :",err);
}

}
