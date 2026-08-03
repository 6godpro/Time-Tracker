import { Router } from "express";
import {
  employeeShiftsHandler,
  exportEmployeeShiftsHandler,
  listEmployeesHandler,
  listShiftEditRequestsHandler,
  reviewShiftEditRequestHandler,
} from "../controllers/admin.controller";
import { requireAuth } from "@/middleware/auth.middleware";
import { requireAdmin } from "@/middleware/role.middleware";
import { asyncHandler } from "@/utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/employees", asyncHandler(listEmployeesHandler));
router.get("/employees/:employeeId/shifts", asyncHandler(employeeShiftsHandler));
router.get("/employees/:employeeId/shifts/export", asyncHandler(exportEmployeeShiftsHandler));
router.get("/shift-edit-requests", asyncHandler(listShiftEditRequestsHandler));
router.patch("/shift-edit-requests/:requestId", asyncHandler(reviewShiftEditRequestHandler));

export default router;