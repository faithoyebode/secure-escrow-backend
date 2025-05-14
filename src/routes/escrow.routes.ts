
import { Router } from "express";
import { EscrowController } from "../controllers/EscrowController";
import { authenticateToken, isAdmin } from "../middleware/auth";

const router = Router();
const escrowController = new EscrowController();

/**
 * @swagger
 * /escrows/all:
 *   get:
 *     summary: Get all escrows (admin only)
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all escrows
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Escrow'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/all", authenticateToken, isAdmin, (req, res) => escrowController.getAllEscrows(req, res));

/**
 * @swagger
 * /escrows:
 *   get:
 *     summary: Get escrows for the authenticated user
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's escrows
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Escrow'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", authenticateToken, (req, res) => escrowController.getUserEscrows(req, res));

/**
 * @swagger
 * /escrows/{id}:
 *   get:
 *     summary: Get an escrow by ID
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Escrow ID
 *     responses:
 *       200:
 *         description: Escrow details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Escrow'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id", authenticateToken, (req, res) => escrowController.getEscrow(req, res));

/**
 * @swagger
 * /escrows:
 *   post:
 *     summary: Create a new escrow
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - productId
 *             properties:
 *               productId:
 *                 type: string
 *                 format: uuid
 *               escrowDays:
 *                 type: integer
 *                 description: Number of days until escrow expires (default is 14)
 *     responses:
 *       201:
 *         description: Escrow created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Escrow'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Product not found
 */
router.post("/", authenticateToken, (req, res) => escrowController.createEscrow(req, res));

/**
 * @swagger
 * /escrows/{id}/status:
 *   patch:
 *     summary: Update escrow status
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Escrow ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, awaiting_delivery, delivered, completed, disputed, refunded, canceled, expired]
 *     responses:
 *       200:
 *         description: Escrow status updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Escrow'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch("/:id/status", authenticateToken, (req, res) => escrowController.updateEscrowStatus(req, res));

/**
 * @swagger
 * /escrows/{id}/expiry:
 *   patch:
 *     summary: Update escrow expiry date
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Escrow ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - days
 *             properties:
 *               days:
 *                 type: integer
 *                 description: Number of days to extend the escrow from current date
 *     responses:
 *       200:
 *         description: Escrow expiry date updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Escrow'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch("/:id/expiry", authenticateToken, (req, res) => escrowController.updateExpiryDate(req, res));

/**
 * @swagger
 * /escrows/process-expired:
 *   post:
 *     summary: Process all expired escrows (admin only)
 *     tags: [Escrows]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Expired escrows processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 count:
 *                   type: integer
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.post("/process-expired", authenticateToken, isAdmin, (req, res) => escrowController.processExpiredEscrows(req, res));

export default router;
