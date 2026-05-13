import "dotenv/config";
import connectDB from "./config/db.js";
import User from "./models/User.js";
import Employee from "./models/Employee.js";
import bcrypt from 'bcrypt'

const ADMIN_PASSWORD = "admin123";
const README_ADMIN_EMAIL = "prakashratnesh2005@gmail.com";
const EMPLOYEE_EMAIL = "employee@arpittak.com";
const EMPLOYEE_PASSWORD = "employee123";

async function registerAdmin(){
    try {
        const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@example.com";
        const adminEmails = Array.from(new Set([ADMIN_EMAIL, README_ADMIN_EMAIL]));

        if(!ADMIN_EMAIL){
            console.error('Missing ADMIN_EMAIL env variable')
            process.exit(1);
        }

        await connectDB()

        const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10)
        const adminUsers = await Promise.all(adminEmails.map((email) => User.findOneAndUpdate({
                email,
            }, {
                password: adminPassword,
                role: "ADMIN",
            }, {
                returnDocument: "after",
                upsert: true,
                setDefaultsOnInsert: true,
            })
        ))

        const employeePassword = await bcrypt.hash(EMPLOYEE_PASSWORD, 10)
        const employeeUser = await User.findOneAndUpdate({
            email: EMPLOYEE_EMAIL,
        }, {
            password: employeePassword,
            role: "EMPLOYEE",
        }, {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
        })

        await Employee.findOneAndUpdate({
            userId: employeeUser._id,
        }, {
            userId: employeeUser._id,
            firstName: "Standard",
            lastName: "Employee",
            email: EMPLOYEE_EMAIL,
            phone: "9999999999",
            position: "Software Engineer",
            department: "Engineering",
            basicSalary: 50000,
            allowances: 5000,
            deductions: 1000,
            employmentStatus: "ACTIVE",
            joinDate: new Date("2026-01-01"),
            isDeleted: false,
            bio: "Standard employee account",
        }, {
            returnDocument: "after",
            upsert: true,
            setDefaultsOnInsert: true,
        })

        console.log("Standard users are ready");
        console.log("\nAdmin emails:", adminUsers.map((user) => user.email).join(", "));
        console.log("Admin password:", ADMIN_PASSWORD);
        console.log("\nEmployee email:", EMPLOYEE_EMAIL);
        console.log("Employee password:", EMPLOYEE_PASSWORD);

        process.exit(0);
    } catch (error) {
        console.error("Seed failed:", error);
    }
}

registerAdmin();
