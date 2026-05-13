import { sendInngestEvent } from "../inngest/index.js";
import Attendance from "../models/Attendance.js";
import Employee from "../models/Employee.js";
import mongoose from "mongoose";

const ATTENDANCE_STATUSES = ["PRESENT", "ABSENT", "LATE"];

function normalizeDate(value){
    const [year, month, day] = String(value || "").split("-").map(Number);
    if(!year || !month || !day) return null;
    const date = new Date(year, month - 1, day);
    date.setHours(0, 0, 0, 0);
    return Number.isNaN(date.getTime()) ? null : date;
}

function combineDateAndTime(date, time){
    if(!time) return null;
    const [hours, minutes] = String(time).split(":").map(Number);
    if(!Number.isInteger(hours) || !Number.isInteger(minutes)) return null;
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return Number.isNaN(result.getTime()) ? null : result;
}

function getDayType(workingHours){
    if(workingHours >= 8) return "Full Day";
    if(workingHours >= 6) return "Three Quarter Day";
    if(workingHours >= 4) return "Half Day";
    return "Short Day";
}

async function markEmployeeAttendance(req, res){
    const {employeeId, date, status = "PRESENT", checkIn, checkOut} = req.body;

    if(!employeeId || !date){
        return res.status(400).json({ error: "Employee and date are required" });
    }
    if(!mongoose.Types.ObjectId.isValid(employeeId)){
        return res.status(400).json({ error: "Invalid employee" });
    }
    if(!ATTENDANCE_STATUSES.includes(status)){
        return res.status(400).json({ error: "Invalid attendance status" });
    }

    const employee = await Employee.findById(employeeId);
    if(!employee || employee.isDeleted || employee.employmentStatus === "INACTIVE"){
        return res.status(404).json({ error: "Active employee not found" });
    }

    const attendanceDate = normalizeDate(date);
    if(!attendanceDate){
        return res.status(400).json({ error: "Invalid attendance date" });
    }

    let checkInDate = null;
    let checkOutDate = null;
    let workingHours = null;
    let dayType = null;

    if(status !== "ABSENT"){
        checkInDate = combineDateAndTime(attendanceDate, checkIn);
        if(!checkInDate){
            return res.status(400).json({ error: "Check-in time is required" });
        }

        checkOutDate = combineDateAndTime(attendanceDate, checkOut);
        if(checkOutDate){
            if(checkOutDate <= checkInDate){
                return res.status(400).json({ error: "Check-out must be after check-in" });
            }
            workingHours = Number(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2));
            dayType = getDayType(workingHours);
        }
    }

    const attendance = await Attendance.findOneAndUpdate(
        {employeeId, date: attendanceDate},
        {
            employeeId,
            date: attendanceDate,
            checkIn: checkInDate,
            checkOut: checkOutDate,
            status,
            workingHours,
            dayType,
        },
        {returnDocument: "after", upsert: true, setDefaultsOnInsert: true}
    );

    return res.json({ success: true, type: "ADMIN_MARK", data: attendance });
}

// Clock in/out for employee
// POST /api/attendance
export const clockInOut = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN"){
            return markEmployeeAttendance(req, res);
        }
        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted) return res.status(403).json({
                error: "Your account is deactivated. You cannot clock in/out.",
            });

         const today = new Date();
         today.setHours(0, 0, 0, 0);

         const existing = await Attendance.findOne({
            employeeId: employee._id,
            date: today,
         })

        const now = new Date();

        if(!existing){
            const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
            const attendance = await Attendance.create({
                employeeId: employee._id,
                date: today,
                checkIn: now,
                status: isLate ? "LATE" : "PRESENT"
            })

            await sendInngestEvent({
                name: "employee/check-out",
                data: {
                    employeeId: employee._id,
                    attendanceId: attendance._id,
                }
            })

            return res.json({ success: true, type: "CHECK_IN", data: attendance });
        } else if(!existing.checkOut){
            const checkInTime = new Date(existing.checkIn).getTime()
            const diffMs = now.getTime() - checkInTime;
            const diffHours = diffMs / (1000 * 60 * 60)

            existing.checkOut = now;

            // Compute working hours and day type
            const workingHours = parseFloat(diffHours.toFixed(2))
            existing.workingHours = workingHours;
            existing.dayType = getDayType(workingHours);

            await existing.save();
            return res.json({ success: true, type: "CHECK_OUT", data: existing });
        }else {
            return res.json({ success: true, type: "CHECK_OUT", data: existing });
        }


    } catch (error) {
        console.error("Attendance Error:", error);
        return res.status(500).json({ error: "Operation failed" });
    }
}

// Get attendance for employee
// GET /api/attendance
export const getAttendance = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN"){
            const limit = parseInt(req.query.limit || 100);
            const history = await Attendance.find()
                .populate("employeeId", "firstName lastName email position department isDeleted")
                .sort({date: -1, createdAt: -1})
                .limit(limit)
                .lean();

            const data = history.map((record)=>({
                ...record,
                id: record._id.toString(),
                employee: record.employeeId ? {
                    id: record.employeeId._id.toString(),
                    firstName: record.employeeId.firstName,
                    lastName: record.employeeId.lastName,
                    email: record.employeeId.email,
                    position: record.employeeId.position,
                    department: record.employeeId.department,
                    isDeleted: record.employeeId.isDeleted,
                } : null,
            }))

            return res.json({ role: "ADMIN", data });
        }

        const employee = await Employee.findOne({ userId: session.userId })
        if (!employee) return res.status(404).json({ error: "Employee not found" });

        const limit = parseInt(req.query.limit || 30);
        const history = await Attendance.find({employeeId: employee._id}).sort({date: -1}).limit(limit)

        return res.json({
            role: "EMPLOYEE",
            data: history,
            employee: {isDeleted: employee.isDeleted}
        })
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch attendance" });
    }
}

export const deleteAttendance = async (req, res) => {
    try {
        if(!mongoose.Types.ObjectId.isValid(req.params.id)){
            return res.status(400).json({ error: "Invalid attendance record" });
        }

        const attendance = await Attendance.findByIdAndDelete(req.params.id);
        if(!attendance){
            return res.status(404).json({ error: "Attendance record not found" });
        }

        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to delete attendance" });
    }
}
