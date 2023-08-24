const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const http = require("http");
const { Server } = require("socket.io");
const Message = require("./models/Message");
const patient = require("./router/patients");
const messageRouter = require("./router/messages");
const path = require("path");
const multer = require("multer");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");
const saltRounds = 10;
require("dotenv").config();
const session = require("express-session");
const admin = require("./router/admin");

const app = express();
const server = http.createServer(app); // Move this line here

app.use(cors({ origin: "http://localhost:5173" }));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ limit: "10mb", extended: true }));
app.use(
  session({
    secret: "bcfe2f72f6e98f78bfc122e2721c0f40a88803a429b99d8403a1a9b053eec1bf", // Replace with your actual secret key
    resave: false,
    saveUninitialized: true,
    cookie: {
      secure: false, // Set to true if using HTTPS
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    },
  })
);
app.use("/api/patients", patient);
app.use("/api/", messageRouter);
app.use("/api/", admin);

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
  },
  introduction: {
    type: String,
  },
  mainContentOne: {
    type: String,
  },
  mainContentTwo: {
    type: String,
  },
  mainContentThree: {
    type: String,
  },
  conclusion: {
    type: String,
  },
  name: {
    type: String,
  },
  datePublished: {
    type: Date,
  },
  filePath: {
    type: String,
  },
});

const Blog = mongoose.model("Blog", blogSchema);
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  roomID: {
    type: String,
    unique: true,
    required: true,
  },
});

const User = mongoose.model("User", userSchema);
// Import the uuid package

app.post("/api/register", async (req, res) => {
  const { username, password } = req.body;

  try {
    const roomID = uuidv4(); // Generate a unique room ID for the user
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const user = new User({
      username,
      password: hashedPassword,
      roomID, // Store the unique room ID in the database
    });

    await user.save();
    return res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    console.error("Error registering user:", error);
    return res.status(500).json({ error: "Failed to register user" });
  }
});

app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  try {
    const user = await User.findOne({ username: username.trim() });

    if (!user) {
      console.log("User not found");
      return res.status(404).json({ message: "User not found" });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log("Invalid credentials");
      return res.status(401).json({ message: "Invalid credentials" });
    }

    let userData;

    // Define the admin username and password directly in the route
    const adminUsername = "Dental Admin";
    const adminPassword = "dentalpassword";

    if (username === adminUsername && password === adminPassword) {
      console.log("Admin login");
      userData = {
        _id: user._id,
        username: user.username,
        isAdmin: true,
        roomID: "78cacda6-88c-990", // Assign a default roomID for admin
      };

      return res.status(200).json({
        message: "Admin Login Success",
        userData,
      });
    } else {
      console.log("User login");
      userData = {
        _id: user._id,
        username: user.username,
        roomID: user.roomID,
      };

      return res.status(200).json({
        message: "User Login Success",
        userData,
      });
    }
  } catch (error) {
    console.error("Error logging in:", error);
    return res.status(500).json({ error: "Failed to login" });
  }
});

console.log("Fixed admin username from env:", process.env.FIXED_ADMIN_USERNAME);
console.log("Fixed admin password from env:", process.env.FIXED_ADMIN_PASSWORD);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "./uploads");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const upload = multer({ storage: storage });
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.post("/api/upload", upload.single("image"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file provided" });
  }

  const {
    title,
    introduction,
    mainContentOne,
    mainContentTwo,
    mainContentThree,
    conclusion,
    name,
    datePublished,
  } = req.body;
  const filePath = req.file.path;

  try {
    const image = new Blog({
      title,
      introduction,
      mainContentOne,
      mainContentTwo,
      mainContentThree,
      conclusion,
      filePath,
      name,
      datePublished, // Save the 'datePublished' field to the database
    });
    await image.save();

    return res
      .status(200)
      .json({ message: "File uploaded successfully", filePath: filePath });
  } catch (error) {
    console.error("Error saving image to the database:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while uploading the file", error });
  }
});
// Add this route before the "app.get('/api/images', async (req, res) => {...}" route
app.get("/api/posts/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;
    const post = await Blog.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    res.status(200).json(post);
  } catch (error) {
    console.error("Error fetching post:", error);
    res.status(500).json({ error: "Failed to fetch post" });
  }
});
app.get("/api/images", async (req, res) => {
  try {
    const images = await Blog.find();
    return res.status(200).json(images);
  } catch (error) {
    console.error("Error fetching images from the database:", error);
    return res
      .status(500)
      .json({ message: "An error occurred while fetching images" });
  }
});

const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
  },
});

io.on("connection", (socket) => {
  console.log(`User Connected: ${socket.id}`);

  socket.on("join", (room) => {
    socket.join(room);
    console.log(`User with ID: ${socket.id} joined room: ${room}`);
  });

  socket.on("send_message", async (data) => {
    try {
      // Save the message to MongoDB
      const newMessage = new Message({
        room: data.room,
        author: data.author,
        message: data.message,
        time: data.time,
      });

      await newMessage.save();

      // Emit the newly created message object instead of the original data
      io.to(data.room).emit("receive_message", newMessage);
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log("User Disconnected", socket.id);
  });
});

app.use((req, res, next) => {
  req.io = io;
  next();
});
// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 8002;

    app.get("/messages", async (req, res) => {
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

    app.post("/messages", async (req, res) => {
      const { room, author, message, time } = req.body;

      try {
        const newMessage = new Message({
          room: room,
          author: author,
          message: message,
          time: time,
        });

        await newMessage.save();

        req.io.to(room).emit("receive_message", newMessage);

        res
          .status(201)
          .json({ message: "Message sent and stored successfully" });
      } catch (error) {
        console.error("Error saving message:", error);
        res.status(500).json({ error: "Failed to send and store the message" });
      }
    });

    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
