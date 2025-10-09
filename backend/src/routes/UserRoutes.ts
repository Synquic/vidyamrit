import { Router } from "express";
import { getCurrentUser } from "../controllers/userController";
import { authMiddleware } from "../middlewares/authMiddleware";
import { registerUser } from "../controllers/userController";

const userRouter = Router();

// Common user routes (profile, auth)
userRouter.get("/me", authMiddleware, getCurrentUser);
userRouter.post("/register", authMiddleware, registerUser); // we register user in our db with firebase uid
// login- handled by firebase.

// Get users with optional filtering (for fetching tutors, etc.)
userRouter.get("/", authMiddleware, async (req, res) => {
  try {
    const { role, schoolId } = req.query;

    // Build filter object
    const filter: any = {};
    if (role) {
      filter.role = role;
    }
    if (schoolId) {
      filter.schoolId = schoolId;
    }

    const User = require("../models/UserModel").default;
    const users = await User.find(filter)
      .populate("schoolId", "name type")
      .exec();

    // Format response to match frontend expectations
    const formattedUsers = users.map((user: any) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNo: user.phoneNo,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Get single user by ID
userRouter.get("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const User = require("../models/UserModel").default;
    const user = await User.findById(id)
      .populate("schoolId", "name type")
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNo: user.phoneNo,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(formattedUser);
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Update user by ID
userRouter.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNo, schoolId } = req.body;

    const User = require("../models/UserModel").default;
    const user = await User.findByIdAndUpdate(
      id,
      { name, phoneNo, schoolId, updatedAt: new Date() },
      { new: true }
    )
      .populate("schoolId", "name type")
      .exec();

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const formattedUser = {
      id: user._id,
      name: user.name,
      email: user.email,
      phoneNo: user.phoneNo,
      role: user.role,
      schoolId: user.schoolId,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };

    res.json(formattedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Delete user by ID
userRouter.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const User = require("../models/UserModel").default;
    const user = await User.findByIdAndDelete(id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Optionally delete from Firebase as well
    try {
      const { auth } = require("../configs/firebaseAdmin");
      await auth.deleteUser(user.uid);
    } catch (firebaseError) {
      console.error("Error deleting from Firebase:", firebaseError);
      // Continue even if Firebase deletion fails
    }

    res.status(204).send();
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default userRouter;
