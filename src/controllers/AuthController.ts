
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import bcrypt from "bcrypt";
import jwt, { SignOptions } from "jsonwebtoken";
import { AuthRequest } from "../middleware/auth";

export class AuthController {
  private userRepository = AppDataSource.getRepository(User);

  // Register a new user
  async register(req: Request, res: Response) {
    try {
      const { name, email, password, role } = req.body;

      // Validate input
      if (!name || !email || !password) {
        return res.status(400).json({ message: "Name, email and password are required" });
      }

      // Check if user already exists
      const existingUser = await this.userRepository.findOne({ where: { email } });
      if (existingUser) {
        return res.status(409).json({ message: "User with this email already exists" });
      }

      // Hash the password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create user
      const user = this.userRepository.create({
        name,
        email,
        password: hashedPassword,
        role: role && ["buyer", "seller", "admin"].includes(role) ? role : "buyer"
      });

      await this.userRepository.save(user);

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      res.status(500).json({ message: "Failed to register user" });
    }
  }

  // Login user
  async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      // Validate input
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user with password
      const user = await this.userRepository
        .createQueryBuilder("user")
        .addSelect("user.password")
        .where("user.email = :email", { email })
        .getOne();

      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Check password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Generate JWT token
      const token = jwt.sign(
        { id: user.id },
        process.env.JWT_SECRET || "default_secret",
        { expiresIn: process.env.JWT_EXPIRES_IN || "24h" } as SignOptions
      );

      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;

      res.json({
        message: "Login successful",
        user: userWithoutPassword,
        token
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  }

  // Get current user
  async getCurrentUser(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      res.json({ user: req.user });
    } catch (error) {
      console.error("Get current user error:", error);
      res.status(500).json({ message: "Failed to get user information" });
    }
  }

  // Update user profile
  async updateProfile(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { name, avatar } = req.body;
      const userId = req.user.id;

      const user = await this.userRepository.findOneBy({ id: userId });
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Update fields if provided
      if (name !== undefined) user.name = name;
      if (avatar !== undefined) user.avatar = avatar;

      await this.userRepository.save(user);

      res.json({
        message: "Profile updated successfully",
        user
      });
    } catch (error) {
      console.error("Update profile error:", error);
      res.status(500).json({ message: "Failed to update profile" });
    }
  }
}
