import { Router } from "express";
import { verifyWebhook, handleIncomingMessage } from "../controller/webhook-controller.js";

const router = Router();

router.get('/', verifyWebhook);
router.post('/', handleIncomingMessage);

export default router;