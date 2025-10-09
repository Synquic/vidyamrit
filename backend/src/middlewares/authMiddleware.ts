import { Request, Response, NextFunction } from "express";
import { auth } from "../configs/firebaseAdmin";
import { AuthRequest } from "../types/auth";
import User from "../models/UserModel";
export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("=== AUTH MIDDLEWARE DEBUG ===");
    const token = req.headers.authorization?.split(" ")[1];
    console.log("Token present:", !!token);
    if (!token) return res.status(401).json({ error: "No token provided" });

    const decoded = await auth.verifyIdToken(token);
    console.log("Token decoded successfully. UID:", decoded.uid);

    const user = await User.findOne({ uid: decoded.uid }).populate(
      "schoolId",
      "name type"
    );
    console.log("User found in DB:", !!user);
    console.log("User role:", user?.role);
    console.log("User school:", user?.schoolId);
    console.log("============================");

    if (!user)
      return res.status(403).json({ error: "User not found in database" });

    req.user = user;
    next();
  } catch (err) {
    console.log("Auth middleware error:", err);
    return res.status(403).json({ error: "Invalid token" });
  }
};
