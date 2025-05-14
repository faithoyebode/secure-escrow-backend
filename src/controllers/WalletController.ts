
import { Request, Response } from "express";
import { AppDataSource } from "../data-source";
import { User } from "../entity/User";
import { Escrow, TransactionStatus } from "../entity/Escrow";
import { AuthRequest } from "../middleware/auth";

export class WalletController {
  private userRepository = AppDataSource.getRepository(User);
  private escrowRepository = AppDataSource.getRepository(Escrow);

  // Get wallet balance for the authenticated user
  async getWalletBalance(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const userId = req.user.id;
      
      // Fetch most up-to-date user data for accurate balance
      const user = await this.userRepository.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ balance: user.walletBalance || 0 });
    } catch (error) {
      console.error("Get wallet balance error:", error);
      res.status(500).json({ message: "Failed to get wallet balance" });
    }
  }

  // Process withdrawal request
  async withdrawFunds(req: AuthRequest, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const { amount, accountDetails } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid withdrawal amount is required" });
      }

      if (!accountDetails) {
        return res.status(400).json({ message: "Account details are required" });
      }

      const userId = req.user.id;
      const user = await this.userRepository.findOneBy({ id: userId });
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has enough funds
      if (!user.walletBalance || user.walletBalance < amount) {
        return res.status(400).json({ message: "Insufficient funds" });
      }

      // Process withdrawal (in a real system, this would interact with a payment processor)
      user.walletBalance -= amount;
      await this.userRepository.save(user);

      // Return transaction details
      res.json({
        success: true,
        message: "Withdrawal successful",
        transaction: {
          id: `w-${Date.now()}`,
          amount: amount,
          status: "completed",
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error("Withdraw funds error:", error);
      res.status(500).json({ message: "Failed to process withdrawal" });
    }
  }

  // Internal method to update wallet balances when an escrow is completed
  // This is called by the EscrowController when an escrow is completed
  async updateWalletOnEscrowComplete(escrow: Escrow): Promise<boolean> {
    try {
      if (escrow.status !== TransactionStatus.COMPLETED) {
        return false;
      }

      const seller = await this.userRepository.findOneBy({ id: escrow.sellerId });
      
      if (seller) {
        // Add escrow amount to seller's wallet
        if (!seller.walletBalance) {
          seller.walletBalance = 0;
        }
        seller.walletBalance += escrow.amount;
        await this.userRepository.save(seller);
        console.log(`Updated seller ${seller.name}'s wallet balance to ${seller.walletBalance}`);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error("Update wallet on escrow complete error:", error);
      return false;
    }
  }
}
