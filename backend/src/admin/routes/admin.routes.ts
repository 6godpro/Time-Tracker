import { Router } from "express";
import {
  employeePayrollHandler,
  employeeShiftsHandler,
  exportEmployeeShiftsHandler,
  exportPayrollHandler,
  listEmployeesHandler,
  listPayrollPaymentsHandler,
  listShiftEditRequestsHandler,
  payrollHandler,
  recordPayrollPaymentHandler,
  reviewShiftEditRequestHandler,
  updateHourlyRateHandler,
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
router.patch("/employees/:employeeId/rate", asyncHandler(updateHourlyRateHandler));
router.get("/employees/:employeeId/payroll", asyncHandler(employeePayrollHandler));
router.get("/payroll", asyncHandler(payrollHandler));
router.get("/payroll/export", asyncHandler(exportPayrollHandler));
router.post("/employees/:employeeId/payroll/payments", asyncHandler(recordPayrollPaymentHandler));
router.get("/employees/:employeeId/payroll/payments", asyncHandler(listPayrollPaymentsHandler));

export default router;