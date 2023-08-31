const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");
const multer = require("multer");
const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcrypt");
const saltRounds = 10;
require("dotenv").config();
const session = require("express-session");
const admin = require("./router/admin");
const patient = require("./router/patients");
const Blog = require("./models/Blog");

const app = express();
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
app.use("/api/", admin);

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

// Connect to MongoDB
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Connected to MongoDB");
    const PORT = process.env.PORT || 8002;

    // Add any remaining routes you need here

    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB:", error);
  });
