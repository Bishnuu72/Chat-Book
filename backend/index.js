const express = require('express');
const app = express();
require('dotenv').config();

const authRoutes = require("./routes/AuthRoutes");
const friendRoutes = require("./routes/FriendRoutes");
const messageRoutes = require("./routes/MessageRoutes");
const path = require("path");
const userRoutes = require("./routes/UserRoutes");
const postRoutes = require("./routes/PostRoutes");


const pool = require('./DB/db');
const cors = require("cors");

const { Server } = require("socket.io");
const { createServer } = require('node:http');
const { join } = require('node:path');

const server = createServer(app);
const io = new Server(server, {
  cors: { origin: "http://localhost:5173", credentials: true },
  connectionStateRecovery: {}
});

app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.sendFile(join(__dirname, 'index.html'));
});

// Socket.IO
io.on('connection', (socket) => {
  console.log('Socket connected:', socket.id);

  socket.on('join', (userId) => {
    socket.join(String(userId));
    console.log(`User ${userId} joined room`);
  });

  // Broadcast only (DB save happens in REST controller)
  socket.on('sendMessage', (msg) => {
    const payload = {
      ...msg,
      senderId: Number(msg.senderId),
      receiverId: Number(msg.receiverId),
      createdAt: msg.createdAt || new Date().toISOString(),
    };
    io.to(String(payload.receiverId)).emit('receiveMessage', payload);
    io.to(String(payload.senderId)).emit('receiveMessage', payload);
  });

  socket.on('disconnect', () => {
    console.log('Socket disconnected:', socket.id);
  });
});

app.use('/auth', authRoutes);
app.use("/api/friends", friendRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/users", userRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/posts", postRoutes);


server.listen(PORT, async () => {
  console.log(`Running server at ${PORT}`);
  try {
    await pool.getConnection();
    console.log("DB Connected");
  } catch (err) {
    console.log("DB Connection Failed");
    console.log(err);
  }
});
