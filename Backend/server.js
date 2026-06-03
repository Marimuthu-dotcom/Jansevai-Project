const express = require("express");
const cors = require("cors");
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

setIo(io);

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/uploads",express.static(path.join(__dirname, "uploads")));

io.on("connection", (socket) => {
   console.log("User Connected:", socket.id);
   
   socket.on("disconnect", () => {
      console.log("User Disconnected");
   });
});

const PORT = process.env.PORT || 8080;

server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

