
import { Router } from "express";
import authRoutes from "./auth.routes";
import productRoutes from "./product.routes";
import escrowRoutes from "./escrow.routes";
import disputeRoutes from "./dispute.routes";
import walletRoutes from "./wallet.routes";

const router = Router();

/**
 * @swagger
 * tags:
 *   - name: Authentication
 *     description: User authentication and profile management
 *   - name: Products
 *     description: Product management
 *   - name: Escrows
 *     description: Escrow transaction management
 *   - name: Disputes
 *     description: Dispute management
 *   - name: Dispute Comments
 *     description: Comments on disputes
 *   - name: Wallet
 *     description: Wallet operations for sellers
 */

// Mount all routes
router.use("/auth", authRoutes);
router.use("/products", productRoutes);
router.use("/escrows", escrowRoutes);
router.use("/disputes", disputeRoutes);
router.use("/wallet", walletRoutes);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: API is up and running
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: ok
 *                 message:
 *                   type: string
 *                   example: API is up and running
 */
router.get("/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "API is up and running" });
});

export default router;
