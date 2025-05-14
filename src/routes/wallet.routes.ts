
import { Router } from "express";
import { WalletController } from "../controllers/WalletController";
import { authenticateToken, isSeller } from "../middleware/auth";

const router = Router();
const walletController = new WalletController();

/**
 * @swagger
 * /wallet/balance:
 *   get:
 *     summary: Get wallet balance for authenticated seller
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Wallet balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 balance:
 *                   type: number
 *                   format: float
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/balance", authenticateToken, isSeller, (req, res) => walletController.getWalletBalance(req, res));

/**
 * @swagger
 * /wallet/withdraw:
 *   post:
 *     summary: Withdraw funds from wallet
 *     tags: [Wallet]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *               - accountDetails
 *             properties:
 *               amount:
 *                 type: number
 *                 format: float
 *               accountDetails:
 *                 type: object
 *                 properties:
 *                   bankName:
 *                     type: string
 *                   accountNumber:
 *                     type: string
 *                   accountName:
 *                     type: string
 *     responses:
 *       200:
 *         description: Withdrawal successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 transaction:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     amount:
 *                       type: number
 *                       format: float
 *                     status:
 *                       type: string
 *                     timestamp:
 *                       type: string
 *                       format: date-time
 *       400:
 *         description: Invalid input or insufficient funds
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/withdraw", authenticateToken, isSeller, (req, res) => walletController.withdrawFunds(req, res));

export default router;
