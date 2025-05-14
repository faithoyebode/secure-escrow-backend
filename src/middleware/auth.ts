
import { Request, Response, NextFunction } from "express";
import * as jwt from "jsonwebtoken";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";

export interface AuthRequest extends Request {
  user?: User;
}

// Middleware to authenticate token
export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({ message: "Authentication token is required" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret") as { id: string };
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOneBy({ id: decoded.id });

    if (!user) {
      return res.status(401).json({ message: "Invalid token" });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ message: "Invalid or expired token" });
  }
};

// Middleware to check if user is an admin
export const isAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "admin") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Admin rights required" });
  }
};

// Middleware to check if user is a seller
export const isSeller = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (req.user && req.user.role === "seller") {
    next();
  } else {
    return res.status(403).json({ message: "Access denied: Seller rights required" });
  }
};
