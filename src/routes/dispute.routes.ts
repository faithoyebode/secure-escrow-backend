
import { Router } from "express";
import { DisputeController } from "../controllers/DisputeController";
import { authenticateToken, isAdmin } from "../middleware/auth";
import { upload } from "../middleware/upload";

const router = Router();
const disputeController = new DisputeController();

/**
 * @swagger
 * /disputes/all:
 *   get:
 *     summary: Get all disputes (admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all disputes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dispute'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 */
router.get("/all", authenticateToken, isAdmin, (req, res) => disputeController.getAllDisputes(req, res));

/**
 * @swagger
 * /disputes/{id}/resolve:
 *   patch:
 *     summary: Resolve a dispute (admin only)
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Dispute ID
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
 *                 enum: [resolved, rejected]
 *               adminNotes:
 *                 type: string
 *               escrowResolution:
 *                 type: string
 *                 enum: [pending, awaiting_delivery, delivered, completed, refunded, canceled]
 *     responses:
 *       200:
 *         description: Dispute resolved
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dispute'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.patch("/:id/resolve", authenticateToken, isAdmin, (req, res) => disputeController.resolveDispute(req, res));

/**
 * @swagger
 * /disputes:
 *   get:
 *     summary: Get disputes for the authenticated user
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's disputes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Dispute'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 */
router.get("/", authenticateToken, (req, res) => disputeController.getUserDisputes(req, res));

/**
 * @swagger
 * /disputes/{id}:
 *   get:
 *     summary: Get a dispute by ID
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Dispute ID
 *     responses:
 *       200:
 *         description: Dispute details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dispute'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id", authenticateToken, (req, res) => disputeController.getDispute(req, res));

/**
 * @swagger
 * /disputes:
 *   post:
 *     summary: Create a new dispute
 *     tags: [Disputes]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - escrowId
 *               - reason
 *             properties:
 *               escrowId:
 *                 type: string
 *                 format: uuid
 *               reason:
 *                 type: string
 *               evidence:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Dispute created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Dispute'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         description: Escrow not found
 */
router.post("/", 
  authenticateToken,
  upload.array('evidence', 5),
  (req, res) => disputeController.createDispute(req, res)
);

/**
 * @swagger
 * /disputes/{id}/comments:
 *   get:
 *     summary: Get comments for a dispute
 *     tags: [Dispute Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Dispute ID
 *     responses:
 *       200:
 *         description: List of comments
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/DisputeComment'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.get("/:id/comments", authenticateToken, (req, res) => disputeController.getComments(req, res));

/**
 * @swagger
 * /disputes/{id}/comments:
 *   post:
 *     summary: Add a comment to a dispute
 *     tags: [Dispute Comments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: Dispute ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               attachments:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/DisputeComment'
 *       400:
 *         description: Invalid input
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 */
router.post("/:id/comments", 
  authenticateToken,
  upload.array('attachments', 5),
  (req, res) => disputeController.addComment(req, res)
);

export default router;
