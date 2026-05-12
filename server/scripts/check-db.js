import "dotenv/config";
import mongoose from "mongoose";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Payslip from "../models/Payslip.js";
import LeaveApplication from "../models/LeaveApplication.js";
import Attendance from "../models/Attendance.js";

const uri = process.env.MONGODB_URI;

if(!uri){
    console.error("MONGODB_URI is not set");
    process.exit(1);
}

try {
    await mongoose.connect(uri);

    const [users, employees, payslips, leaves, attendance] = await Promise.all([
        User.countDocuments(),
        Employee.countDocuments(),
        Payslip.countDocuments(),
        LeaveApplication.countDocuments(),
        Attendance.countDocuments(),
    ]);

    console.log("Database connection OK");
    console.log(`Database: ${mongoose.connection.name}`);
    console.log(`Users: ${users}`);
    console.log(`Employees: ${employees}`);
    console.log(`Payslips: ${payslips}`);
    console.log(`Leaves: ${leaves}`);
    console.log(`Attendance records: ${attendance}`);
} catch (error) {
    console.error("Database connection failed:", error.message);
    process.exitCode = 1;
} finally {
    await mongoose.disconnect();
}
