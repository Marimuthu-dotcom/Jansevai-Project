const jwt = require("jsonwebtoken");
const db= require("../config/db");
require("dotenv").config();
const { sendOtpMail } = require("../utilis/sendMail");
const bcrypt=require("bcryptjs");
const { OAuth2Client } = require('google-auth-library');
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const { getIo } = require("../socket/socket.js");

const generateAccessToken = (user) =>{
  return jwt.sign(
      { id: user.id, 
        email: user.email, 
        username: user.username 
      },
      process.env.JWT_SECRET_KEY,
      { expiresIn: "15m" }
    );
}

const generateRefreshToken = async(user) => {
   const refreshToken = jwt.sign(
      { id: user.id, 
        email: user.email, 
        username: user.username },
      process.env.JWT_REFRESH_KEY,
      { expiresIn: "7d" }
    );

    await db.promise().query(
      `UPDATE users SET refresh_token = ? WHERE id = ?`,
      [refreshToken, user.id]
    );

    return refreshToken;
}

const sendRefreshCookie = async(res,refreshToken) =>{
  res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",       // production-la true (HTTPS)
      sameSite: "Strict",
      maxAge:   7 * 24 * 60 * 60 * 1000
    });
}
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

    console.log("Result :",result);
    console.log("Result[0] :",result[0]);

    const insertedId = result.insertId;

    await db.promise().query(
      `INSERT INTO userDetails (user_email)
       VALUES (?)`,
      [email]
    );
    
    const user ={
      id:insertedId,
      email:email,
      username:name
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user)
    await sendRefreshCookie(res,refreshToken);

     const io = getIo();
        
        io.emit("new-member", {
          name,
          email
        });

    res.status(201).json({ accessToken });

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

    const ticket = await client.verifyIdToken(
    {
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID
    }
    );

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
    const accessToken = generateAccessToken(user);
    const refreshToken = await generateRefreshToken(user)
    await sendRefreshCookie(res,refreshToken);


    console.log("7. JWT created ✅");

    res.status(200).json({ accessToken });

  } catch (err) {
    
    console.log("❌ EXACT ERROR:", err.message);
    console.log("❌ ERROR NAME:", err.name);
    console.log(err);

    res.status(500).json({
      message: "Google Login Failed"
    });

  }
};

// ✅ New function — refreshToken
exports.refreshToken = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;
  console.log("Refresh Toke Get from Cookies:",req.cookies?.refreshToken);

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);

    const [[user]] = await db.promise().query(
      `SELECT * FROM users WHERE id = ? AND refresh_token = ?`,
      [decoded.id, refreshToken]
    );

    if (!user) {
      return res.status(403).json({ message: "Invalid refresh token" });
    }

    // ✅ New Access Token
    const newAccessToken = generateAccessToken(user);

    console.log("✅ New accessToken generated for:", user.email);

    // ✅ "accessToken" key — frontend match
    res.json({ newAccessToken });

  } catch (err) {
    console.log("Refresh error:", err.message);
    return res.status(403).json({ message: "Refresh token expired" });
  }
};

// ✅ New function — logout
exports.logoutUser = async (req, res) => {
  const refreshToken = req.cookies?.refreshToken;

  if (refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_KEY);

      await db.promise().query(
        `UPDATE users SET refresh_token = NULL WHERE id = ?`,
        [decoded.id]
      );
    } catch (err) {
      console.log("Logout token error:", err.message);
    }
  }

  res.clearCookie("refreshToken", {
    httpOnly: true,
    secure:   process.env.NODE_ENV === "production",
    sameSite: "Strict"
  });

  res.json({ message: "Logged out" });
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

        const [sql] = `INSERT INTO users
                    (email, phone_number,username, otp,otp_expiry,is_verified)
                    VALUES (?, ?, ?, ?, ?,?)`;

        await db.promise().query( sql, [email, phone,username, otp, otpExpiry,0] );

        const insertedId = sql.insertId;

        const user ={
          id:insertedId,
          email:email,
          username:username
        }

        const accessToken = generateAccessToken(user);
        const refreshToken = await generateRefreshToken(user)
        await sendRefreshCookie(res,refreshToken);

        const io = getIo();
        
        io.emit("new-member", {
          username,
          email,
          phone
        });        

        res.status(200).json({
            message: "Data Sent Successfully",
            accessToken
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

const accessToken = generateAccessToken(user);
const refreshToken = await generateRefreshToken(user)
await sendRefreshCookie(res,refreshToken);

       res.status(200).json({ accessToken });
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
            u.id,
            u.username,
            u.email,
            u.phone_number,
            u.role,
            u.created_at,
            ud.location,
            ud.bio,
            ud.age,
            ud.gender,
            ud.contributions,
            ud.resolved,
            ud.reported,
            wg.id AS group_id, 
            wg.district,
            wg.ward_number,
            wg.group_name,
            gm.role AS group_role,
            gm.status AS group_status
        FROM users u INNER JOIN userDetails ud ON u.email = ud.user_email
        LEFT JOIN group_members gm ON u.email = gm.user_email AND gm.status = 'Active'
        LEFT JOIN ward_groups wg ON gm.group_id = wg.id
        WHERE u.email = ?
        ORDER BY CAST(wg.ward_number AS UNSIGNED) ASC
        LIMIT 1
        `;

        const [result] = await db.promise().query(sql, [email]);

        if (!result[0]) {
          return res.status(404).json({ message: "User not found" });
        }

        console.log(result);
        console.log(result[0]);
        res.json(result[0]);

    } catch(err) {
        res.status(500).json({ message: err.message });
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
        users.is_online,
        users.last_seen,
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
    console.log(updates);

    Object.entries(updates).forEach(([key, value]) => {

      if (key === "phone_number") {
        userFields[key] = value;  //users
      }
      else if (key === "username") {
        userFields[key] = value;
        userDetailsFields[key] = value;
      }  else {
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
      console.log("Fields to update in userDetails:", fields);
      console.log(values);

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
    const { category,title,location,wardNo,description } = req.body;

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
        wardNo,
        description,
        image_url
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        userEmail,
        username,
        phoneNumber,
        category,
        title,
        location,
        wardNo,
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
      wardNo,
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

    if (categoryRows.length > 0) 
    {
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

      const [[member]] = await db.promise().query(`
      SELECT
          reported,
          contributions,
          resolved
      FROM userDetails
      WHERE user_email = ?
      `, [userEmail]);

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
    
    io.emit("member-updated", {
    email: userEmail,
    reported: member.reported,
    contributions: member.contributions,
    resolved: member.resolved
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
        c.user_email,
        c.category,
        c.title,
        c.username,
        c.phone_number,
        c.location,
        c.wardNo,
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

     const sql = `SELECT id,title,category,location,wardNo,status,created_at 
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

        io.emit("complaint-liked",{ 
          complaintId, 
          likesCount: complaint.likes_count,
          userEmail,
          liked: false
        });

         return res.json({
            liked:false,
            likesCount:complaint.likes_count
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

        io.emit("complaint-liked", { 
           complaintId,
           likesCount: complaint.likes_count,
           userEmail,
           liked: true
          });

      res.json({
         liked: true,
         likesCount:complaint.likes_count
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
      wardNo,
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

      const [[complaintOwner]] = await db.promise().query(
      `SELECT user_email
      FROM complaints
      WHERE id = ?`,
      [id]
    );

    if (complaintOwner.user_email === userEmail) {
      return res.status(400).json({
        message: "You cannot support your own complaint."
      });
    } 

    if (existing.length > 0) {
      console.log("Inside Unsupport Block");
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

    const [result] = await db.promise().query(
    `UPDATE userDetails
    SET contributions = contributions - 1
    WHERE user_email = ?`,
    [userEmail]
    );

    console.log(result);

  const [[member]] = await db.promise().query(`
      SELECT
          reported,
          contributions,
          resolved
      FROM userDetails
      WHERE user_email = ?
      `, [userEmail]);
      
      const io = getIo();

      io.emit("support-updated", {
        complaintId:  Number(id),
        supportCount: complaint[0].support_count,
        userEmail,
        action:       "removed"
      });
      
      io.emit("member-updated", {
      email: userEmail,
      reported: member.reported,
      contributions: member.contributions,
      resolved: member.resolved
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

  await db.promise().query(
    `UPDATE userDetails
     SET contributions = contributions + 1
     WHERE user_email = ?`,
    [userEmail]
  );

  const [[member]] = await db.promise().query(`
      SELECT
          reported,
          contributions,
          resolved
      FROM userDetails
      WHERE user_email = ?
      `, [userEmail]);

     const io = getIo(); 
     
    io.emit("support-updated", {
      complaintId:  Number(id),
      supportCount: complaint[0].support_count,
      supporters,
      userEmail,
      action:       "added"
    });

    io.emit("member-updated", {
    email: userEmail,
    reported: member.reported,
    contributions: member.contributions,
    resolved: member.resolved
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

    const [[complaints]] = await db.promise().query(
      `SELECT user_email, status FROM complaints WHERE id = ?`,
      [id]
    );

    if (complaints.length === 0) {
      return res.status(404).json({
        message: "Complaint not found"
      });
    }

    const complaintOwnerEmail = complaints.user_email;
    const oldStatus = complaints.status;

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

    if (oldStatus !== "Resolved" && status === "Resolved") {

  await db.promise().query(
    `UPDATE userDetails
     SET resolved = resolved + 1
     WHERE user_email = ?`,
    [userEmail]
  );

}

// Resolved -> Pending/In Progress
else if (oldStatus === "Resolved" && status !== "Resolved") {

  await db.promise().query(
    `UPDATE userDetails
     SET resolved =
       CASE
         WHEN resolved > 0 THEN resolved - 1
         ELSE 0
       END
     WHERE user_email = ?`,
    [userEmail]
  );

}

    const [[member]] = await db.promise().query(`
      SELECT
          reported,
          contributions,
          resolved
      FROM userDetails
      WHERE user_email = ?
      `, [userEmail]);

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

    io.emit("member-updated", {
    email: userEmail,
    reported: member.reported,
    contributions: member.contributions,
    resolved: member.resolved
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
      `SELECT user_email ,category, status FROM complaints WHERE id = ?`,
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

    await db.promise().query(
  `UPDATE userDetails
   SET reported = CASE WHEN reported > 0 THEN reported - 1 ELSE 0 END,
       contributions = CASE WHEN contributions > 0 THEN contributions - 1 ELSE 0 END
   WHERE user_email = ?`,
  [userEmail]
);

if (complaint.status === "Resolved") {
  await db.promise().query(
    `UPDATE userDetails
     SET 
       resolved      = CASE WHEN resolved      > 0 THEN resolved      - 1 ELSE 0 END
     WHERE user_email = ?`,
    [userEmail]
  );
}

const [[member]] = await db.promise().query(`
      SELECT
          reported,
          contributions,
          resolved
      FROM userDetails
      WHERE user_email = ?
      `, [userEmail]);
      

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
    }
  );

  io.emit("member-updated", {
      email: userEmail,
      reported: member.reported,
      contributions: member.contributions,
      resolved: member.resolved
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
};

exports.sendMessages = async (req, res) => {
  try {
    const senderEmail = req.user.email;      // maripavin
    const { receiverEmail, text } = req.body; // marimuthuk , Hii

    const [result] = await db.promise().query(
      `INSERT INTO messages (sender_email, receiver_email, message_text, status)
       VALUES (?, ?, ?, 'sent')`,
      [senderEmail, receiverEmail, text] //  maripavin, marimuthuk, "Hii!"
    );

    const [[receiver]] = await db.promise().query(
      `SELECT id FROM users WHERE email = ?`,
      [receiverEmail]
    ); 

    const newMessage = {
      id: result.insertId,
      sender_email: senderEmail, // maripavin
      receiver_email: receiverEmail, // marimuthuk
      message_text:text, // Hii
      status: "sent",
      created_at: new Date()
    };

    const io = getIo();

    io.to(`user_${receiver.id}`).emit("receive-message", newMessage);

    // Sender ku confirmation
    res.status(201).json(newMessage);

  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Message send failed" });
  }
};

// Chat history fetch
exports.getMessages = async (req, res) => {
  try {
    const currentUserEmail = req.user.email; // maripavin7@gmail.com
    const { otherUserEmail } = req.params; // marimuthuk.ug.24.cs2francisxavier.ac.in

    const [messages] = await db.promise().query(
      `SELECT * FROM messages 
       WHERE (sender_email = ? AND receiver_email = ?) 
          OR (sender_email = ? AND receiver_email = ?)
       ORDER BY created_at ASC`,
      [currentUserEmail, otherUserEmail, otherUserEmail, currentUserEmail]
    );

    res.json(messages);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.markAsRead = async (req, res) => {
  try {
    const currentUserEmail = req.user.email; // maripavin7@gmail.com
    const { otherUserEmail } = req.body; // marimuthuk.ug.24.cs@francisxavier.ac.in

    await db.promise().query(
      `UPDATE messages SET status = 'read' 
       WHERE sender_email = ? AND receiver_email = ? AND status != 'read'`,
      [otherUserEmail, currentUserEmail] 
    );

    const [[sender]] = await db.promise().query(
      `SELECT id FROM users WHERE email = ?`, [otherUserEmail]
    ); // 2

    const io = getIo();

    io.to(`user_${sender.id}`).emit("messages-read", 
      { readerEmail: currentUserEmail }
    );

    res.json({ message: "Marked as read" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Ella conversations list-um venum na (chat list page ku)
exports.getConversationsList = async (req, res) => {
  try {
    const currentUserEmail = req.user.email;

    const [rows] = await db.promise().query(
      `SELECT * FROM messages 
       WHERE sender_email = ? OR receiver_email = ?
       ORDER BY created_at DESC`,
      [currentUserEmail, currentUserEmail]
    );

    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createWardGroup = async (req, res) => {
  try {
    // 1. Extract text fields from req.body
    const {
      groupName,
      wardNumber,
      area,
      town,
      district,
      state,
      pincode,
      description,
      visibility,
      councillorName,
      councillorContact,
      emergencyContact,
      maxMembers,
      allowJoinWithoutApproval,
      enableDiscussions,
      rules,
      categories, // This comes as JSON string from frontend
    } = req.body;

    const email = req.user.email;

    console.log("Logo:",req.files?.logo?.[0]);
    console.log("Cover:",req.files?.cover?.[0]);

    // 2. Extract file paths from req.files
    const logo_url = req.files?.logo?.[0] ? `${req.protocol}://${req.get("host")}/uploads/complaintImages/${req.files.logo[0].filename}` : null;

    const cover_image_url = req.files?.cover?.[0] ? `${req.protocol}://${req.get("host")}/uploads/complaintImages/${req.files.cover[0].filename}` : null;

    // 3. Parse categories JSON string back to array
    let selectedCategoryIds = [];

    if (categories) {
      selectedCategoryIds = JSON.parse(categories);
    }

    console.log("Categories",selectedCategoryIds);

    // 4. Insert into ward_groups table
    const [result] = await db.promise().query(
      `INSERT INTO ward_groups 
        (group_name, ward_number, area_locality, town_city, district, state, 
         pincode, description, visibility, logo_url, cover_image_url, 
         councillor_name, councillor_contact, emergency_contact, max_members, 
         allow_join_without_approval, enable_discussions, rules_guidelines, admin_email, member_count) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        groupName,
        wardNumber,
        area || null,
        town,
        district,
        state,
        pincode,
        description || null,
        visibility || "Public",
        logo_url,
        cover_image_url,
        councillorName || null,
        councillorContact || null,
        emergencyContact || null,
        maxMembers || 500,
        allowJoinWithoutApproval === "true" || allowJoinWithoutApproval === true ? 1 : 0,
        enableDiscussions === "true" || enableDiscussions === true ? 1 : 0,
        rules || null,
        email,
        1
      ]
    );

    const newGroupId = result.insertId;

    await db.promise().query(
    `INSERT INTO group_members
    (group_id, user_email, role, status)
    VALUES (?, ?, ?, ?)`,
    [
      newGroupId,
      email,
      "Admin",
      "Active"
    ]
  );

    // 5. Insert categories into junction table (if you have one)
    // NOTE: Your ward_groups table doesn't have a categories column.
    // You need a separate table like ward_group_categories
    if (selectedCategoryIds.length > 0) {

      const values = selectedCategoryIds.map((catId) => [newGroupId, catId]);
      await db.promise().query(
        `INSERT INTO group_categories (group_id, category) VALUES ?`,
        [values]
      );
    }

    res.status(200).json({
      success: true,
      message: "Ward group created successfully",
      groupId: newGroupId
    });

  } catch (error) {
    console.error("Error creating ward group:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};


// GET /api/groups/district/:district/wards
exports.getWardsByDistrict = async (req, res) => {
  try {
    const { district } = req.params; // Thoothukudi

    const [wards] = await db.promise().query(
      `SELECT *
       FROM ward_groups
       WHERE district = ?
       ORDER BY CAST(ward_number AS UNSIGNED) ASC`,
      [district]
    );

    res.json({ wards });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};   

// GET /api/groups/ward/:district/:wardNumber
exports.getGroupByWard = async (req, res) => {
  try {
    const { district, wardNumber } = req.params; // Thoothukudi, 45 

    const [[group]] = await db.promise().query(
      `SELECT
         wg.*,
         u.username  AS admin_name,
         u.email     AS admin_email,
         u.phone_number     AS admin_phone,
         u.role      AS admin_role,
         u.is_online
       FROM ward_groups wg JOIN users u ON wg.admin_email = u.email
       WHERE wg.district = ? AND wg.ward_number = ?`,
      [district, wardNumber]
    );

    if (!group) {
      return res.status(404).json({ message: "Group not found" });
    }

    res.json(group);
    console.log(group);
  } 
  catch (err) {
    console.error("Error fetching group by ward:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/groups/:groupId/members
exports.getGroupMembers = async (req, res) => {
  try {
    const { groupId } = req.params; // 1
    
    const page = parseInt(req.query.page) || 1; // 1
    const limit = parseInt(req.query.limit) || 5; // 5
    const offset = (page - 1) * limit; // (0) * 5 = 0

    const filter = req.query.filter || 'all'; // all

    let whereClause = "WHERE gm.group_id = ?"; 

    const countParams = [groupId]; // [1]
    const dataParams = [groupId]; // [1]

    if (filter === 'active') 
    {
      whereClause += " AND u.is_online = true";
    }
    else if (filter === 'inactive')
    {
      whereClause += " AND u.is_online = false";
    } 
    else if (filter === 'admin')
    {
      whereClause += " AND gm.role = 'Admin'";
    }

    const [[countResult]] = await db.promise().query(
      `SELECT COUNT(*) as total 
       FROM group_members gm 
       JOIN users u ON gm.user_email = u.email 
       ${whereClause}`,
      countParams
    );

    const totalCount = countResult.total;

    const [members] = await db.promise().query(
      `SELECT 
      gm.id, 
      gm.role, 
      gm.joined_at, 
      gm.status, 
      gm.role,
      u.username, 
      u.email, 
      u.is_online, 
      u.phone_number AS contact, 
      ud.location AS location,
      ud.age AS age,
      ud.gender AS gender,
      ud.joined_date AS date,
      ud.bio AS bio,
      COALESCE(ud.reported, 0) AS reported, 
      COALESCE(ud.resolved, 0) AS resolved,
      COALESCE(ud.contributions, 0) AS contributions
      FROM group_members gm 
      JOIN users u ON gm.user_email = u.email 
      LEFT JOIN userDetails ud ON gm.user_email = ud.user_email 
      ${whereClause}
      ORDER BY gm.joined_at DESC 
      LIMIT ? OFFSET ?`,
      [...dataParams, limit, offset]
    );

    const [[tabCountsResult]] = await db.promise().query(
      `SELECT 
         COUNT(*) as all_count,
         SUM(CASE WHEN u.is_online = true THEN 1 ELSE 0 END) as active_count,
         SUM(CASE WHEN gm.role = 'Admin' THEN 1 ELSE 0 END) as admin_count,
         SUM(CASE WHEN u.is_online = false THEN 1 ELSE 0 END) as inactive_count
       FROM group_members gm 
       JOIN users u ON gm.user_email = u.email 
       WHERE gm.group_id = ?`,
      [groupId]
    );

    res.json({
      members,
      totalCount,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(totalCount / limit),
      tabCounts: {
        all: tabCountsResult.all_count || 0,
        active: tabCountsResult.active_count || 0,
        admin: tabCountsResult.admin_count || 0,
        inactive: tabCountsResult.inactive_count || 0,
      }
    });

  } catch (err) {
    console.error("Error fetching members:", err);
    res.status(500).json({ message: err.message });
  }
};

// GET /api/groups/district/:district/ungrouped-members
exports.getUngroupedMembers = async (req, res) => {
  try {
    const { district } = req.params;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    // Count total
    const [[countResult]] = await db.promise().query(
      `SELECT COUNT(*) as total 
       FROM users u LEFT JOIN userDetails ud ON u.email = ud.user_email
       WHERE u.district = ? AND (u.ward_number IS NULL OR u.ward_number = '' OR u.ward_number = '0')`,
      [district]
    );

    // Paginated data
    const [members] = await db.promise().query(
      `SELECT 
       u.id, 
       u.username, 
       u.email, 
       u.role, 
       u.is_online, 
       u.phone_number AS contact, 
       u.created_at AS joined_at,
       ud.location AS location,
       COALESCE(ud.reported, 0) AS reported,
       COALESCE(ud.resolved, 0) AS resolved,
       COALESCE(ud.contributions, 0) AS contributions
       FROM users u LEFT JOIN userDetails ud ON u.email = ud.user_email
       WHERE u.district = ? AND (u.ward_number IS NULL OR u.ward_number = '' OR u.ward_number = '0')
       ORDER BY u.created_at DESC
       LIMIT ? OFFSET ?`,
      [district, limit, offset]
    );

    const [[tabCountsResult]] = await db.promise().query(
      `SELECT 
         COUNT(*) as all_count,
         SUM(CASE WHEN u.is_online = true THEN 1 ELSE 0 END) as active_count,
         SUM(CASE WHEN u.role = 'Admin' THEN 1 ELSE 0 END) as admin_count,
         SUM(CASE WHEN u.is_online = false THEN 1 ELSE 0 END) as inactive_count
       FROM users u
       WHERE u.district = ? AND (u.ward_number IS NULL OR u.ward_number = '' OR u.ward_number = '0')`,
      [district]
    );

    res.json({
      members,
      totalCount: countResult.total,
      currentPage: page,
      pageSize: limit,
      totalPages: Math.ceil(countResult.total / limit),
      tabCounts: {
        all: tabCountsResult.all_count || 0,
        active: tabCountsResult.active_count || 0,
        admin: tabCountsResult.admin_count || 0,
        inactive: tabCountsResult.inactive_count || 0,
      }
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
