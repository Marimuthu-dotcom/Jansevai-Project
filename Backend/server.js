const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
require("dotenv").config();
const http = require("http");
const { Server } = require("socket.io");
const db = require("./config/db");
const authRoutes = require("./routes/authRoutes");
const { setIo } = require("./socket/socket");
const path = require("path");
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
   cors: {
      origin: "*"
   }
});
const onlineUsers = new Map();

setIo(io);

app.use(cors({
  origin:      "http://localhost:5173", // ← exact origin
  credentials: true                     // ← cookie send aaganum
}));
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/uploads",express.static(path.join(__dirname, "uploads")));


io.on("connection", (socket) => {
   console.log("User Connected:", socket.id);

   socket.on("join-room", async (userId) => {
    socket.join(`user_${userId}`);
    socket.userId = userId;

    if (!onlineUsers.has(userId)) {
      onlineUsers.set(userId, new Set());
    }

    onlineUsers.get(userId).add(socket.id);

    if (onlineUsers.get(userId).size === 1) {
      await db.promise().query(
        `UPDATE users SET is_online = TRUE WHERE id = ?`,
        [userId]
      );

      io.emit("user-online", { 
         userId: Number(userId) 
      });
    }

    console.log(`User ${userId} joined room`);
  });

  socket.on("typing", ({ receiverId }) => {
    io.to(`user_${receiverId}`).emit("user-typing", 
      { 
        senderId: socket.userId 
      });
  });

  socket.on("stop-typing", ({ receiverId }) => {
    io.to(`user_${receiverId}`).emit("user-stop-typing", 
      { 
        senderId: socket.userId 
      });
  });
   
   socket.on("disconnect", async () => {
      const userId = socket.userId;
    if (!userId) 
      return;

   if (onlineUsers.has(userId)) {
      onlineUsers.get(userId).delete(socket.id);

      // ✅ Last tab-உம் close ஆனா மட்டும் offline
      if (onlineUsers.get(userId).size === 0) {
        onlineUsers.delete(userId);

        await db.promise().query(
          `UPDATE users 
           SET is_online = FALSE, last_seen = NOW() 
           WHERE id = ?`,
          [userId]
        );
        io.emit("user-offline", {
          userId:    Number(userId),
          last_seen: new Date()
        });
      }
    } 

      console.log("User Disconnected");
   });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});


