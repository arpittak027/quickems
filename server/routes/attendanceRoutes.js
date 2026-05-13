import { Router } from "express";
import { protect, protectAdmin } from "../middleware/auth.js";
import { clockInOut, deleteAttendance, getAttendance } from "../controllers/attendanceController.js";

const attendanceRouter = Router();

attendanceRouter.post('/', protect, clockInOut)
attendanceRouter.get('/', protect, getAttendance)
attendanceRouter.delete('/:id', protect, protectAdmin, deleteAttendance)

export default attendanceRouter;
