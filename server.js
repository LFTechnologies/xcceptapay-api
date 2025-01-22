require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cors());

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/crud_example";
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const userSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email:    { type: String, required: true, unique: true },
  password: { type: String, required: true },  // new password field
  balance:  { type: Number, default: 0 },
  wallet:   { type: String, default: "" },
  seed:     { type: String, default: "" },
  transaction_history: [
    {
      date:      { type: String, required: true },
      amount:    { type: Number, min: 0, required: true },
      recipient: { type: String, required: true },
      status:    { type: String, enum: ["Success", "Failed", "Pending"], default: "Pending" },
    },
  ],
  role: { type: String, enum: ["user", "admin"], default: "user" },
}, { timestamps: true });

const User = mongoose.model("User", userSchema);

// -------------------- Auth Middleware ---------------------
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "dev_secret");
    req.user = { id: decoded.id, role: decoded.role };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}

// -------------------- Auth Routes -------------------------
// Register
app.post("/auth/register", async (req, res) => {
  try {
    const { username, email, password, role } = req.body;
    // Check if email exists
    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Email already in use." });
    }
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({ username, email, password: hashedPassword, role });
    const savedUser = await newUser.save();
    return res.status(201).json(savedUser);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Login
app.post("/auth/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials" });

    // Generate JWT
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || "dev_secret",
      { expiresIn: "1d" }
    );
    return res.json({
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// -------------------- Protected CRUD Routes -------------------------

// CREATE: POST /users (admin only?)
app.post("/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }
  try {
    const { username, email, password, balance, wallet, seed, transaction_history, role } = req.body;
    // Hash the password if included
    let hashedPassword = "";
    if (password) {
      const salt = await bcrypt.genSalt(10);
      hashedPassword = await bcrypt.hash(password, salt);
    }
    const newUser = new User({ username, email, password: hashedPassword, balance, wallet, seed, transaction_history, role });
    const savedUser = await newUser.save();
    return res.status(201).json(savedUser);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// READ ALL: GET /users (admin only?)
app.get("/users", authMiddleware, async (req, res) => {
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "Forbidden: Admin only" });
  }
  try {
    const users = await User.find();
    return res.json(users);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// READ ONE: GET /users/:id (user can see own profile or admin can see any)
app.get("/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(user);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// UPDATE: PUT /users/:id
app.put("/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }

    const { username, email, password, balance, wallet, seed, transaction_history, role } = req.body;
    // If user wants to update password, hash it
    let updateData = { username, email, balance, wallet, seed, transaction_history, role };
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(updatedUser);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// DELETE: DELETE /users/:id
app.delete("/users/:id", authMiddleware, async (req, res) => {
  try {
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json({ message: "User deleted successfully" });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// PATCH /users/:id/transactions
app.patch("/users/:id/transactions", authMiddleware, async (req, res) => {
  try {
    // Only user themself or admin can add transactions
    if (req.user.id !== req.params.id && req.user.role !== "admin") {
      return res.status(403).json({ error: "Forbidden" });
    }
    const transaction = req.body; 
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { $push: { transaction_history: transaction } },
      { new: true, runValidators: true }
    );
    if (!updatedUser) {
      return res.status(404).json({ error: "User not found" });
    }
    return res.json(updatedUser);
  } catch (err) {
    return res.status(400).json({ error: err.message });
  }
});

// Start the Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
