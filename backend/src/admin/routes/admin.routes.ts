import { Router } from "express";
import {
  adminCreateJobHandler,
  adminListJobsHandler,
  adminSetJobActiveHandler,
  adminUpdateJobHandler,
  createClientHandler,
  createReconciliationHandler,
  employeePayrollHandler,
  employeeShiftsHandler,
  exportEmployeeShiftsHandler,
  exportPayrollHandler,
  getReconciliationHandler,
  listClientsHandler,
  listEmployeesHandler,
  listPayrollPaymentsHandler,
  listShiftEditRequestsHandler,
  payrollHandler,
  recordPayrollPaymentHandler,
  resolveReconciliationHandler,
  reviewShiftEditRequestHandler,
  setClientActiveHandler,
  submitClientFiguresHandler,
  updateEmployeeBreakOverrideHandler,
  updateEmployeeClientHandler,
  updateEmployeeJobHandler,
  updateHourlyRateHandler,
} from "../controllers/admin.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { requireAdmin } from "../../middleware/role.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth, requireAdmin);

router.get("/employees", asyncHandler(listEmployeesHandler));
router.get("/employees/:employeeId/shifts", asyncHandler(employeeShiftsHandler));
router.get("/employees/:employeeId/shifts/export", asyncHandler(exportEmployeeShiftsHandler));
router.patch("/employees/:employeeId/rate", asyncHandler(updateHourlyRateHandler));
router.patch("/employees/:employeeId/job", asyncHandler(updateEmployeeJobHandler));
router.patch("/employees/:employeeId/break-override", asyncHandler(updateEmployeeBreakOverrideHandler));
router.patch("/employees/:employeeId/client", asyncHandler(updateEmployeeClientHandler));
router.get("/employees/:employeeId/payroll", asyncHandler(employeePayrollHandler));
router.post("/employees/:employeeId/payroll/payments", asyncHandler(recordPayrollPaymentHandler));
router.get("/employees/:employeeId/payroll/payments", asyncHandler(listPayrollPaymentsHandler));
router.get("/employees/:employeeId/payroll/reconciliation", asyncHandler(getReconciliationHandler));
router.post("/employees/:employeeId/payroll/reconciliation", asyncHandler(createReconciliationHandler));
router.post(
  "/payroll/reconciliation/:reconciliationId/client-figures",
  asyncHandler(submitClientFiguresHandler),
);
router.post("/payroll/reconciliation/:reconciliationId/resolve", asyncHandler(resolveReconciliationHandler));
router.get("/payroll", asyncHandler(payrollHandler));
router.get("/payroll/export", asyncHandler(exportPayrollHandler));
router.get("/shift-edit-requests", asyncHandler(listShiftEditRequestsHandler));
router.patch("/shift-edit-requests/:requestId", asyncHandler(reviewShiftEditRequestHandler));
router.get("/jobs", asyncHandler(adminListJobsHandler));
router.post("/jobs", asyncHandler(adminCreateJobHandler));
router.patch("/jobs/:jobId", asyncHandler(adminUpdateJobHandler));
router.patch("/jobs/:jobId/active", asyncHandler(adminSetJobActiveHandler));
router.get("/clients", asyncHandler(listClientsHandler));
router.post("/clients", asyncHandler(createClientHandler));
router.patch("/clients/:clientId/active", asyncHandler(setClientActiveHandler));

export default router;
