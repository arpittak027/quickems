import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { createLeave, deleteLeave, getLeaves, updateLeaveStatus } from "../controllers/leaveController.js";

const leaveRouter = Router();

leaveRouter.post("/", protect, createLeave)
leaveRouter.get("/", protect, getLeaves)
leaveRouter.patch("/:id", protect, protectAdmin,  updateLeaveStatus)
leaveRouter.delete("/:id", protect, protectAdmin, deleteLeave)

export default leaveRouter;
