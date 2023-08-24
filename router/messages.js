const express = require("express");
const app = express();
const messageRouter = express.Router();
const Message = require("../models/Message");
const { Server } = require("socket.io");
const http = require("http");
const cors = require("cors");
app.use(cors({ origin: "http://localhost:5173" }));

const server = http.createServer(express);

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
  },
});

messageRouter.post("/messages", async (req, res) => {
  const { room, author, message, time } = req.body;

  try {
    const newMessage = new Message({
      room: room,
      author: author,
      message: message,
      time: time,
    });

    await newMessage.save();

    io.to(room).emit("receive_message", newMessage); // Emit the message through socket.io

    res.status(201).json({ message: "Message sent and stored successfully" });
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Failed to send and store the message" });
  }
});

messageRouter.get("/messages", async (req, res) => {
  const { room } = req.query;

  console.log("Received request to fetch messages for room:", room);

  try {
    const messages = await Message.find({ room });
    console.log("Found messages:", messages);
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
});
messageRouter.get("/messages/authors", async (req, res) => {
  try {
    const authors = await Message.find().distinct("author");
    const authorsWithRoomIDs = await Message.find().select("author room");
    res.status(200).json({ authors: authorsWithRoomIDs });
  } catch (error) {
    console.error("Error fetching authors:", error);
    res.status(500).json({ error: "Failed to fetch authors" });
  }
});

messageRouter.get("/admin/:author", async (req, res) => {
  try {
    const author = req.params.author;
    const messages = await Message.find({
      room: author, // Use your field name that represents the user's ID or room
      author: "Admin",
    }).sort({ time: 1 });

    res.json({ messages });
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});
messageRouter.get("/messages/sent", async (req, res) => {
  const { room, author } = req.query;

  try {
    const messages = await Message.find({ room, author }).sort({ time: 1 });
    res.status(200).json({ messages });
  } catch (error) {
    console.error("Error fetching sent messages:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

// Send admin reply
messageRouter.post("/admin-reply", async (req, res) => {
  try {
    const { userRoomId, message } = req.body;

    // Create a new message for admin reply
    const newMessage = new Message({
      room: userRoomId,
      author: "Admin",
      message: message,
      time: new Date().toISOString(),
    });

    // Save the message to the database
    await newMessage.save();

    io.to(userRoomId).emit("receive_message", newMessage); // Emit the message through socket.io

    res.json({ message: newMessage });
  } catch (error) {
    console.error("Error sending admin reply:", error);
    res.status(500).json({ error: "An error occurred" });
  }
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", async (data) => {
    // Save the message to MongoDB
    const message = new Message({
      room: data.room,
      author: data.author,
      message: data.message,
      time: data.time,
    });
    await message.save();

    // Emit the received message to other users in the room
    io.to(data.room).emit("receive_message", data);
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

module.exports = messageRouter;
