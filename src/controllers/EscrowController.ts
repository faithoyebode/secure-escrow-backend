
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Escrow, TransactionStatus } from "../entity/Escrow";
import { Product } from "../entity/Product";
import { User } from "../entity/User";
import { AuthRequest } from "../middleware/auth";
import { LessThan } from "typeorm";
import { WalletController } from "./WalletController";
import { EscrowProduct } from "../entity/EscrowProduct";

// Define the type for product items in request
interface ProductItem {
  productId: string;
  quantity: number;
}

export class EscrowController {
  private escrowRepository = AppDataSource.getRepository(Escrow);
  private escrowProductRepository = AppDataSource.getRepository(EscrowProduct);
  private productRepository = AppDataSource.getRepository(Product);
  private userRepository = AppDataSource.getRepository(User);
  private walletController = new WalletController();

  // Get all escrows (admin only)
  async getAllEscrows(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const escrows = await this.escrowRepository.find({
        relations: ["escrowProducts", "escrowProducts.product", "buyer", "seller"],
      });

      // Transform to match frontend model
      const transformedEscrows = escrows.map((escrow) => {
        const products = escrow.escrowProducts.map(ep => ({
          id: ep.id,
          productId: ep.productId,
          productName: ep.product.name,
          productImage: ep.product.image,
          price: ep.price,
          quantity: ep.quantity
        }));

        return {
          id: escrow.id,
          products: products,
          amount: escrow.amount,
          buyerId: escrow.buyerId,
          buyerName: escrow.buyer.name,
          sellerId: escrow.sellerId,
          sellerName: escrow.seller.name,
          status: escrow.status,
          expiryDate: escrow.expiryDate?.toISOString(),
          createdAt: escrow.createdAt.toISOString(),
          updatedAt: escrow.updatedAt.toISOString()
        };
      });

      res.json(transformedEscrows);
    } catch (error) {
      console.error("Get all escrows error:", error);
      res.status(500).json({ message: "Failed to get escrows" });
    }
  }

  // Get user escrows (as buyer or seller)
  async getUserEscrows(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      let query = this.escrowRepository
        .createQueryBuilder("escrow")
        .leftJoinAndSelect("escrow.escrowProducts", "escrowProducts")
        .leftJoinAndSelect("escrowProducts.product", "product")
        .leftJoinAndSelect("escrow.buyer", "buyer")
        .leftJoinAndSelect("escrow.seller", "seller");

      // Filter by user role
      if (req.user.role === "buyer") {
        query = query.where("escrow.buyerId = :userId", { userId });
      } else if (req.user.role === "seller") {
        query = query.where("escrow.sellerId = :userId", { userId });
      } else if (req.user.role === "admin") {
        // Admins can see all escrows, so no filter needed
      } else {
        return res.status(403).json({ message: "Invalid user role" });
      }

      const escrows = await query.getMany();

      // Transform to match frontend model
      const transformedEscrows = escrows.map(escrow => {
        const products = escrow.escrowProducts.map(ep => ({
          id: ep.id,
          productId: ep.productId,
          productName: ep.product.name,
          productImage: ep.product.image,
          price: ep.price,
          quantity: ep.quantity
        }));

        return {
          id: escrow.id,
          products: products,
          amount: escrow.amount,
          buyerId: escrow.buyerId,
          buyerName: escrow.buyer.name,
          sellerId: escrow.sellerId,
          sellerName: escrow.seller.name,
          status: escrow.status,
          expiryDate: escrow.expiryDate?.toISOString(),
          createdAt: escrow.createdAt.toISOString(),
          updatedAt: escrow.updatedAt.toISOString(),
        };
      });

      res.json(transformedEscrows);
    } catch (error) {
      console.error("Get user escrows error:", error);
      res.status(500).json({ message: "Failed to get user escrows" });
    }
  }

  // Get escrow by ID
  async getEscrow(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const escrow = await this.escrowRepository.findOne({
        where: { id },
        relations: ["escrowProducts", "escrowProducts.product", "buyer", "seller", "disputes"],
      });

      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }

      // Check if user is authorized to view this escrow
      if (
        req.user.role !== "admin" &&
        req.user.id !== escrow.buyerId &&
        req.user.id !== escrow.sellerId
      ) {
        return res.status(403).json({ message: "Not authorized to view this escrow" });
      }

      // Transform to match frontend model
      const products = escrow.escrowProducts.map(ep => ({
        id: ep.id,
        productId: ep.productId,
        productName: ep.product.name,
        productImage: ep.product.image,
        price: ep.price,
        quantity: ep.quantity
      }));

      const transformedEscrow = {
        id: escrow.id,
        products: products,
        amount: escrow.amount,
        buyerId: escrow.buyerId,
        buyerName: escrow.buyer.name,
        sellerId: escrow.sellerId,
        sellerName: escrow.seller.name,
        status: escrow.status,
        expiryDate: escrow.expiryDate?.toISOString(),
        createdAt: escrow.createdAt.toISOString(),
        updatedAt: escrow.updatedAt.toISOString(),
        disputes: escrow.disputes,
      };

      res.json(transformedEscrow);
    } catch (error) {
      console.error("Get escrow error:", error);
      res.status(500).json({ message: "Failed to get escrow" });
    }
  }

  // Create new escrow
  async createEscrow(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      console.log("Escrow creation request body:", req.body);
      const { products, sellerId, escrowDays } = req.body;
      const buyerId = req.user.id;

      // Validate input
      if (!products || !Array.isArray(products) || products.length === 0) {
        return res.status(400).json({ message: "Products array is required" });
      }

      if (!sellerId) {
        return res.status(400).json({ message: "Seller ID is required" });
      }

      // Default escrow period is 14 days if not specified
      const escrowPeriod = escrowDays || 14;
      
      // Calculate expiry date (current date + escrow period)
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + escrowPeriod);

      // Ensure user is a buyer
      if (req.user.role !== "buyer" && req.user.role !== "admin") {
        return res.status(403).json({ message: "Only buyers can create escrows" });
      }

      // Get seller info
      const seller = await this.userRepository.findOne({ 
        where: { id: sellerId } 
      });
      
      console.log("Found seller:", seller);
      
      if (!seller) {
        return res.status(404).json({ message: "Seller not found" });
      }

      // Calculate total amount and fetch products
      let totalAmount = 0;
      const productDetails = [];
      
      for (const item of products) {
        if (!item.productId) {
          return res.status(400).json({ message: "Product ID is required for each product" });
        }
        
        console.log(`Looking for product with ID: ${item.productId}`);
        
        const product = await this.productRepository.findOne({
          where: { id: item.productId }
        });
        
        if (!product) {
          return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
        }
        
        console.log(`Found product: ${product.name}`);
        
        const quantity = item.quantity || 1;
        totalAmount += product.price * quantity;
        
        productDetails.push({
          ...product,
          quantity
        });
      }

      console.log(`Creating escrow with total amount: ${totalAmount}`);

      // Create escrow with AWAITING_DELIVERY status
      const escrow = this.escrowRepository.create({
        amount: totalAmount,
        buyerId,
        sellerId,
        status: TransactionStatus.AWAITING_DELIVERY,
        expiryDate: expiryDate
      });

      // Save escrow first to get an ID
      await this.escrowRepository.save(escrow);
      console.log(`Escrow created with ID: ${escrow.id}`);

      // Now create escrow product entries for each product
      for (const product of productDetails) {
        const escrowProduct = this.escrowProductRepository.create({
          escrowId: escrow.id,
          productId: product.id,
          price: product.price,
          quantity: product.quantity
        });
        await this.escrowProductRepository.save(escrowProduct);
      }

      // Get buyer info for response
      const buyer = await this.userRepository.findOne({ where: { id: buyerId } });

      if (!buyer) {
        console.log("Buyer not found for ID:", buyerId);
      }

      // Get the escrow products
      const escrowProducts = await this.escrowProductRepository.find({
        where: { escrowId: escrow.id },
        relations: ["product"]
      });

      // Transform to match frontend model
      const transformedProducts = escrowProducts.map(ep => ({
        id: ep.id,
        productId: ep.productId,
        productName: ep.product.name,
        productImage: ep.product.image,
        price: ep.price,
        quantity: ep.quantity
      }));

      const transformedEscrow = {
        id: escrow.id,
        products: transformedProducts,
        amount: escrow.amount,
        buyerId: escrow.buyerId,
        buyerName: buyer?.name || "Unknown Buyer",
        sellerId: escrow.sellerId,
        sellerName: seller?.name || "Unknown Seller",
        status: escrow.status,
        expiryDate: escrow.expiryDate?.toISOString(),
        createdAt: escrow.createdAt.toISOString(),
        updatedAt: escrow.updatedAt.toISOString(),
      };

      res.status(201).json(transformedEscrow);
    } catch (error) {
      console.error("Create escrow error:", error);
      res.status(500).json({ message: "Failed to create escrow", error: String(error) });
    }
  }

  // Update escrow status
  async updateEscrowStatus(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const { status } = req.body;

      // Validate input
      if (!status || !Object.values(TransactionStatus).includes(status as TransactionStatus)) {
        return res.status(400).json({ message: "Valid status is required" });
      }

      // Find escrow
      const escrow = await this.escrowRepository.findOne({
        where: { id },
        relations: ["escrowProducts", "escrowProducts.product", "buyer", "seller"],
      });

      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }

      // Check authorization based on current status and requested status
      const currentStatus = escrow.status;
      const newStatus = status as TransactionStatus;
      const userId = req.user.id;
      const userRole = req.user.role;

      // Authorization rules for status changes
      let authorized = false;

      // Admin can change any status
      if (userRole === "admin") {
        authorized = true;
      } 
      // Seller marking as delivered
      else if (
        userId === escrow.sellerId && 
        currentStatus === TransactionStatus.AWAITING_DELIVERY &&
        newStatus === TransactionStatus.DELIVERED
      ) {
        authorized = true;
      }
      // Buyer confirming receipt and completing transaction
      else if (
        userId === escrow.buyerId &&
        currentStatus === TransactionStatus.DELIVERED &&
        newStatus === TransactionStatus.COMPLETED
      ) {
        authorized = true;
      }
      // Either party can raise dispute
      else if (
        (userId === escrow.buyerId || userId === escrow.sellerId) &&
        newStatus === TransactionStatus.DISPUTED
      ) {
        authorized = true;
      }
      // Buyer can cancel if still pending or awaiting delivery
      else if (
        userId === escrow.buyerId &&
        (currentStatus === TransactionStatus.PENDING || 
         currentStatus === TransactionStatus.AWAITING_DELIVERY) &&
        newStatus === TransactionStatus.CANCELED
      ) {
        authorized = true;
      }

      if (!authorized) {
        return res.status(403).json({ message: "Not authorized to update this escrow status" });
      }

      // Execute status update
      escrow.status = newStatus;
      await this.escrowRepository.save(escrow);

      // When transaction is completed, update the seller's wallet balance
      if (newStatus === TransactionStatus.COMPLETED) {
        await this.walletController.updateWalletOnEscrowComplete(escrow);
      }

      // Transform to match frontend model
      const products = escrow.escrowProducts.map(ep => ({
        id: ep.id,
        productId: ep.productId,
        productName: ep.product.name,
        productImage: ep.product.image,
        price: ep.price,
        quantity: ep.quantity
      }));

      const transformedEscrow = {
        id: escrow.id,
        products: products,
        amount: escrow.amount,
        buyerId: escrow.buyerId,
        buyerName: escrow.buyer.name,
        sellerId: escrow.sellerId,
        sellerName: escrow.seller.name,
        status: escrow.status,
        expiryDate: escrow.expiryDate?.toISOString(),
        createdAt: escrow.createdAt.toISOString(),
        updatedAt: escrow.updatedAt.toISOString(),
      };

      res.json(transformedEscrow);
    } catch (error) {
      console.error("Update escrow status error:", error);
      res.status(500).json({ message: "Failed to update escrow status" });
    }
  }

  // Update escrow expiry date
  async updateExpiryDate(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const { days } = req.body;

      // Validate input
      if (!days || isNaN(days) || days <= 0) {
        return res.status(400).json({ message: "Valid number of days is required" });
      }

      // Find escrow
      const escrow = await this.escrowRepository.findOne({
        where: { id },
        relations: ["escrowProducts", "escrowProducts.product", "buyer", "seller"],
      });

      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }

      // Only admin or seller can extend expiry date
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to update escrow expiry date" });
      }

      // Calculate new expiry date
      const newExpiryDate = new Date();
      newExpiryDate.setDate(newExpiryDate.getDate() + parseInt(days));

      // Update escrow
      escrow.expiryDate = newExpiryDate;
      await this.escrowRepository.save(escrow);

      // Transform to match frontend model
      const products = escrow.escrowProducts.map(ep => ({
        id: ep.id,
        productId: ep.productId,
        productName: ep.product.name,
        productImage: ep.product.image,
        price: ep.price,
        quantity: ep.quantity
      }));

      const transformedEscrow = {
        id: escrow.id,
        products: products,
        amount: escrow.amount,
        buyerId: escrow.buyerId,
        buyerName: escrow.buyer.name,
        sellerId: escrow.sellerId,
        sellerName: escrow.seller.name,
        status: escrow.status,
        expiryDate: escrow.expiryDate?.toISOString(),
        createdAt: escrow.createdAt.toISOString(),
        updatedAt: escrow.updatedAt.toISOString(),
      };

      res.json(transformedEscrow);
    } catch (error) {
      console.error("Update escrow expiry date error:", error);
      res.status(500).json({ message: "Failed to update escrow expiry date" });
    }
  }

  // Process expired escrows (admin only or can be called by cron job)
  async processExpiredEscrows(req: AuthRequest, res: Response) {
    try {
      // Only allow admins to manually trigger this endpoint
      if (req.user && req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const now = new Date();
      const expiredEscrows = await this.escrowRepository.find({
        where: {
          expiryDate: LessThan(now),
          status: TransactionStatus.AWAITING_DELIVERY
        },
        relations: ["buyer", "seller"]
      });

      if (expiredEscrows.length === 0) {
        return res.json({ message: "No expired escrows to process", count: 0 });
      }

      let processedCount = 0;

      for (const escrow of expiredEscrows) {
        escrow.status = TransactionStatus.EXPIRED;
        await this.escrowRepository.save(escrow);

        // Refund to buyer's wallet for expired escrows
        const buyer = escrow.buyer;
        if (buyer) {
          buyer.walletBalance = (buyer.walletBalance || 0) + escrow.amount;
          await this.userRepository.save(buyer);
        }
        
        processedCount++;
      }

      res.json({ 
        message: `Processed ${processedCount} expired escrows`, 
        count: processedCount 
      });
    } catch (error) {
      console.error("Process expired escrows error:", error);
      res.status(500).json({ message: "Failed to process expired escrows" });
    }
  }
}
