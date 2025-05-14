
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { Dispute, DisputeRaiser, DisputeStatus } from "../entity/Dispute";
import { Escrow, TransactionStatus } from "../entity/Escrow";
import { DisputeComment } from "../entity/DisputeComment";
import { getFileUrl } from "../middleware/upload";
import { AuthRequest } from "../middleware/auth";
import { User } from "../entity/User";

export class DisputeController {
  private disputeRepository = AppDataSource.getRepository(Dispute);
  private escrowRepository = AppDataSource.getRepository(Escrow);
  private commentRepository = AppDataSource.getRepository(DisputeComment);
  private userRepository = AppDataSource.getRepository(User);

  // Get all disputes (admin only)
  async getAllDisputes(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied" });
      }

      const disputes = await this.disputeRepository.find({
        relations: ["escrow", "user"],
        order: {
          status: "ASC",
          createdAt: "DESC"
        }
      });

      res.json(disputes);
    } catch (error) {
      console.error("Get all disputes error:", error);
      res.status(500).json({ message: "Failed to get disputes" });
    }
  }

  // Get user disputes
  async getUserDisputes(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const userId = req.user.id;
      let query = this.disputeRepository
        .createQueryBuilder("dispute")
        .leftJoinAndSelect("dispute.escrow", "escrow")
        .leftJoinAndSelect("dispute.user", "user");

      // Filter by user role
      if (req.user.role === "buyer" || req.user.role === "seller") {
        query = query.where(
          "dispute.userId = :userId OR escrow.buyerId = :userId OR escrow.sellerId = :userId",
          { userId }
        );
      } else if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Invalid user role" });
      }

      const disputes = await query.getMany();

      res.json(disputes);
    } catch (error) {
      console.error("Get user disputes error:", error);
      res.status(500).json({ message: "Failed to get user disputes" });
    }
  }

  // Get dispute by ID
  async getDispute(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const dispute = await this.disputeRepository.findOne({
        where: { id },
        relations: ["escrow", "user", "escrow.buyer", "escrow.seller", "comments", "comments.user"],
      });

      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      // Check authorization
      const userId = req.user.id;
      const escrow = dispute.escrow;
      
      if (
        req.user.role !== "admin" &&
        userId !== dispute.userId &&
        userId !== escrow.buyerId &&
        userId !== escrow.sellerId
      ) {
        return res.status(403).json({ message: "Not authorized to view this dispute" });
      }

      res.json(dispute);
    } catch (error) {
      console.error("Get dispute error:", error);
      res.status(500).json({ message: "Failed to get dispute" });
    }
  }

  // Create new dispute
  async createDispute(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { escrowId, reason } = req.body;
      const userId = req.user.id;
      const userName = req.user.name;

      // Validate input
      if (!escrowId || !reason) {
        return res.status(400).json({ message: "Escrow ID and reason are required" });
      }

      // Find escrow
      const escrow = await this.escrowRepository.findOneBy({ id: escrowId });
      if (!escrow) {
        return res.status(404).json({ message: "Escrow not found" });
      }

      // Check if user is buyer or seller of the escrow
      if (userId !== escrow.buyerId && userId !== escrow.sellerId) {
        return res.status(403).json({ message: "Not authorized to create dispute for this escrow" });
      }

      // Determine if user is buyer or seller
      const raisedBy: DisputeRaiser = userId === escrow.buyerId ? "buyer" : "seller";

      // Process evidence files
      const evidenceFiles = req.files as Express.Multer.File[];
      const evidence = evidenceFiles ? 
        evidenceFiles.map(file => getFileUrl(file.filename)) : 
        [];

      // Create dispute
      const dispute = this.disputeRepository.create({
        escrowId,
        raisedBy,
        userId,
        reason,
        evidence,
        status: "pending" as DisputeStatus
      });

      await this.disputeRepository.save(dispute);

      // Update escrow status
      escrow.status = TransactionStatus.DISPUTED;
      await this.escrowRepository.save(escrow);

      res.status(201).json(dispute);
    } catch (error) {
      console.error("Create dispute error:", error);
      res.status(500).json({ message: "Failed to create dispute" });
    }
  }

  // Resolve dispute (admin only)
  async resolveDispute(req: AuthRequest, res: Response) {
    try {
      if (!req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied: Admin rights required" });
      }

      const { id } = req.params;
      const { status, adminNotes } = req.body;

      // Validate input
      if (!status || !["resolved", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Valid status (resolved/rejected) is required" });
      }

      // Find dispute
      const dispute = await this.disputeRepository.findOne({
        where: { id },
        relations: ["escrow", "escrow.buyer", "escrow.seller"]
      });

      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      if (dispute.status !== "pending") {
        return res.status(400).json({ message: "This dispute has already been resolved" });
      }

      // Update dispute
      dispute.status = status as DisputeStatus;
      dispute.adminNotes = adminNotes || dispute.adminNotes;
      dispute.resolvedAt = new Date();
      
      await this.disputeRepository.save(dispute);

      // Update escrow status based on dispute resolution
      if (dispute.escrow) {
        const escrow = dispute.escrow;
        const buyer = escrow.buyer;
        const seller = escrow.seller;

        // Determine the new escrow status based on the dispute resolution and who raised it
        if (status === "resolved") {
          if (dispute.raisedBy === "buyer") {
            // Buyer won the dispute, refund the buyer
            escrow.status = TransactionStatus.REFUNDED;
            
            // Update buyer's wallet
            if (buyer) {
              buyer.walletBalance = (buyer.walletBalance || 0) + escrow.amount;
              await this.userRepository.save(buyer);
            }
          } else {
            // Seller won the dispute, release payment to seller
            escrow.status = TransactionStatus.COMPLETED;
            
            // Update seller's wallet
            if (seller) {
              seller.walletBalance = (seller.walletBalance || 0) + escrow.amount;
              await this.userRepository.save(seller);
            }
          }
        } else if (status === "rejected") {
          if (dispute.raisedBy === "buyer") {
            // Buyer lost the dispute, release payment to seller
            escrow.status = TransactionStatus.COMPLETED;
            
            // Update seller's wallet
            if (seller) {
              seller.walletBalance = (seller.walletBalance || 0) + escrow.amount;
              await this.userRepository.save(seller);
            }
          } else {
            // Seller lost the dispute, refund the buyer
            escrow.status = TransactionStatus.REFUNDED;
            
            // Update buyer's wallet
            if (buyer) {
              buyer.walletBalance = (buyer.walletBalance || 0) + escrow.amount;
              await this.userRepository.save(buyer);
            }
          }
        }

        await this.escrowRepository.save(escrow);
      }

      res.json(dispute);
    } catch (error) {
      console.error("Resolve dispute error:", error);
      res.status(500).json({ message: "Failed to resolve dispute" });
    }
  }

  // Add comment to dispute
  async addComment(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      const { content } = req.body;
      const userId = req.user.id;
      const userName = req.user.name;
      const userRole = req.user.role;

      // Validate input
      if (!content) {
        return res.status(400).json({ message: "Comment content is required" });
      }

      // Find dispute
      const dispute = await this.disputeRepository.findOne({
        where: { id },
        relations: ["escrow"]
      });

      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      // Check authorization
      const escrow = dispute.escrow;
      if (
        userRole !== "admin" &&
        userId !== dispute.userId &&
        userId !== escrow.buyerId &&
        userId !== escrow.sellerId
      ) {
        return res.status(403).json({ message: "Not authorized to comment on this dispute" });
      }

      // Process attachments
      const attachmentFiles = req.files as Express.Multer.File[];
      const attachments = attachmentFiles ? 
        attachmentFiles.map(file => getFileUrl(file.filename)) : 
        [];

      // Create comment
      const comment = this.commentRepository.create({
        disputeId: id,
        userId,
        userRole: userRole as "buyer" | "seller" | "admin",
        content,
        attachments
      });

      await this.commentRepository.save(comment);

      res.status(201).json(comment);
    } catch (error) {
      console.error("Add comment error:", error);
      res.status(500).json({ message: "Failed to add comment" });
    }
  }

  // Get comments for a dispute
  async getComments(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Not authenticated" });
      }

      const { id } = req.params;
      
      // Find dispute to check authorization
      const dispute = await this.disputeRepository.findOne({
        where: { id },
        relations: ["escrow"]
      });

      if (!dispute) {
        return res.status(404).json({ message: "Dispute not found" });
      }

      // Check authorization
      const userId = req.user.id;
      const escrow = dispute.escrow;
      if (
        req.user.role !== "admin" &&
        userId !== dispute.userId &&
        userId !== escrow.buyerId &&
        userId !== escrow.sellerId
      ) {
        return res.status(403).json({ message: "Not authorized to view comments for this dispute" });
      }

      // Get comments
      const comments = await this.commentRepository.find({
        where: { disputeId: id },
        order: { createdAt: "ASC" },
        relations: ["user"]
      });

      res.json(comments);
    } catch (error) {
      console.error("Get comments error:", error);
      res.status(500).json({ message: "Failed to get comments" });
    }
  }
}
