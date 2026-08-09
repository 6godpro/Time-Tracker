import { Router } from "express";
import {
  listNotificationsHandler,
  markAllNotificationsReadHandler,
  markNotificationReadHandler,
  unreadNotificationCountHandler,
} from "../controllers/notification.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/", asyncHandler(listNotificationsHandler));
router.get("/unread-count", asyncHandler(unreadNotificationCountHandler));
router.patch("/read-all", asyncHandler(markAllNotificationsReadHandler));
router.patch("/:notificationId/read", asyncHandler(markNotificationReadHandler));

export default router;
