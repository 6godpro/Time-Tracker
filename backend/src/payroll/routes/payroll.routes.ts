import { Router } from "express";
import { myPayrollPaymentHandler, myPayrollPaymentsHandler } from "../controllers/payroll.controller";
import { requireAuth } from "../../middleware/auth.middleware";
import { asyncHandler } from "../../utils/asyncHandler";

const router = Router();

router.use(requireAuth);

router.get("/payments", asyncHandler(myPayrollPaymentsHandler));
router.get("/payments/:paymentId", asyncHandler(myPayrollPaymentHandler));

export default router;
