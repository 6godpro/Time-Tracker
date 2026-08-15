import { Router } from "express";
import { listActiveJobsHandler } from "../controllers/job.controller";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.get("/", asyncHandler(listActiveJobsHandler));

export default router;
