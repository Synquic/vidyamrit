import { Response, NextFunction } from "express";
import { AuthRequest } from "../types/auth";
import { UserRole } from "../configs/roles";

export const roleMiddleware = (...allowedRoles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    console.log("=== ROLE MIDDLEWARE DEBUG ===");
    console.log("User in request:", req.user);
    console.log("User role:", req.user?.role);
    console.log("Allowed roles:", allowedRoles);
    console.log("============================");

    const user = req.user;

    if (!user) {
      console.log("Role middleware: No user found");
      return res.status(401).json({ error: "Unauthorized - No user found" });
    }

    if (!allowedRoles.includes(user.role)) {
      console.log("Role middleware: Insufficient permissions");
      return res.status(403).json({
        error: "Forbidden - Insufficient permissions",
        // requiredRoles: allowedRoles,
        // userRole: user.role
      });
    }

    console.log("Role middleware: Access granted");
    next();
  };
};
