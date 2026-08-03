import { Router } from "express";
import { endBreakHandler, startBreakHandler } from "../controllers/break.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.post("/start", asyncHandler(startBreakHandler));
router.post("/end", asyncHandler(endBreakHandler));

export default router;
