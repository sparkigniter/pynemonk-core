import { Router } from "express";
import { container } from "tsyringe";
import { CommunicationController } from "./controllers/CommunicationController.js";
import { requireAuth } from "../../core/middleware/requireAuth.js";
import { apiRateLimiter, sensitiveRateLimiter } from "../../core/middleware/RateLimiter.js";

const router = Router();

router.use(requireAuth);

router.get("/recipient-options", apiRateLimiter, (req, res) => container.resolve(CommunicationController).getRecipientOptions(req, res));
router.get("/tickets", apiRateLimiter, (req, res) => container.resolve(CommunicationController).listTickets(req, res));
router.post("/tickets", apiRateLimiter, sensitiveRateLimiter, (req, res) => container.resolve(CommunicationController).createTicket(req, res));
router.get("/tickets/:id/messages", apiRateLimiter, (req, res) => container.resolve(CommunicationController).listMessages(req, res));
router.post("/tickets/:id/messages", apiRateLimiter, sensitiveRateLimiter, (req, res) => container.resolve(CommunicationController).reply(req, res));
router.patch("/tickets/:id/status", apiRateLimiter, sensitiveRateLimiter, (req, res) => container.resolve(CommunicationController).updateStatus(req, res));

export default router;
