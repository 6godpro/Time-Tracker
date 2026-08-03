import { Router } from "express";
import {
  clockInHandler,
  clockOutHandler,
  createShiftEditRequestHandler,
  currentShiftHandler,
  extendShiftHandler,
  historyHandler,
  pendingCorrectionsHandler,
} from "../controllers/shift.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/clock-in", asyncHandler(clockInHandler));
router.post("/clock-out", asyncHandler(clockOutHandler));
router.get("/current", asyncHandler(currentShiftHandler));
router.get("/history", asyncHandler(historyHandler));
router.get("/pending-corrections", asyncHandler(pendingCorrectionsHandler));
router.post("/extend", asyncHandler(extendShiftHandler));
router.post(
  "/:shiftId/edit-requests",
  asyncHandler(createShiftEditRequestHandler),
);

export default router;
