import { Request, Response, NextFunction } from "express";
import { auth } from "../configs/firebaseAdmin";
import { AuthRequest } from "../types/auth";
import User from "../models/UserModel";
export const authMiddleware = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const token = req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ error: "No token provided" });

        const decoded = await auth.verifyIdToken(token);

    const user = await User.findOne({ uid: decoded.uid });
    if (!user) return res.status(403).json({ error: "User not found in database" });

    req.user = user;
    next();
    } catch (err) {
        return res.status(403).json({ error: "Invalid token" });
    }
};