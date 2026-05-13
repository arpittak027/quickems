import User from "../models/User.js";
import Employee from "../models/Employee.js";
import bcrypt from "bcrypt"
import jwt from 'jsonwebtoken'

function getEmployeeName(email){
    const localPart = String(email || "employee").split("@")[0] || "employee";
    const words = localPart
        .replace(/[._-]+/g, " ")
        .split(" ")
        .map((word)=> word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .filter(Boolean);

    return {
        firstName: words[0] || "Employee",
        lastName: words.slice(1).join(" ") || "User",
    }
}

async function ensureEmployeeProfile(user){
    let employee = await Employee.findOne({userId: user._id});
    if(employee){
        if(employee.isDeleted || employee.employmentStatus === "INACTIVE"){
            employee.isDeleted = false;
            employee.employmentStatus = "ACTIVE";
            await employee.save();
        }
        return employee;
    }

    employee = await Employee.findOne({email: user.email});
    if(employee){
        employee.userId = user._id;
        employee.isDeleted = false;
        employee.employmentStatus = "ACTIVE";
        await employee.save();
        return employee;
    }

    const name = getEmployeeName(user.email);
    return Employee.create({
        userId: user._id,
        firstName: name.firstName,
        lastName: name.lastName,
        email: user.email,
        phone: "9999999999",
        position: "Employee",
        department: "Engineering",
        basicSalary: 50000,
        allowances: 5000,
        deductions: 1000,
        joinDate: new Date(),
        bio: "",
    });
}

// Login for employee and admin
// POST /api/auth/login
export const login = async (req, res) => {
    try {
        const {email, password, role_type} = req.body;

        if(!email || !password){
            return res.status(400).json({ error: "Email and password are required" });
        }

        const normalizedEmail = email.toLowerCase().trim();
        let user = await User.findOne({email: normalizedEmail})

        if(role_type === "admin" && (!user || user.role !== "ADMIN")){
            return res.status(401).json({ error: "Not authorized as admin" });
        }

        if(role_type === "employee"){
            if(user?.role === "ADMIN"){
                return res.status(401).json({ error: "Admin email cannot be used for employee login" });
            }

            if(!user){
                user = await User.create({
                    email: normalizedEmail,
                    password: await bcrypt.hash(password, 10),
                    role: "EMPLOYEE",
                })
            } else if(user.role !== "EMPLOYEE"){
                return res.status(401).json({ error: "Not authorized as employee" });
            }

            await ensureEmployeeProfile(user);
        } else if(!user) {
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const isValid = role_type === "employee" ? true : await bcrypt.compare(password, user.password)
        if(!isValid){
            return res.status(401).json({ error: "Invalid credentials" });
        }

        const payload = {
            userId: user._id.toString(),
            role: user.role,
            email: user.email,
        }

        const token = jwt.sign(payload, process.env.JWT_SECRET, {expiresIn: "7d"});

        return res.json({ user: payload, token });

    } catch (error) {
        console.error("Login error:", error);
        return res.status(500).json({ error: "Login failed" });
    }
}

// Get session for employee and admin
// GET /api/auth/session
export const session = (req, res)=>{
    const session = req.session;
    return res.json({user: session})
}

// Change password for employee and admin
// POST /api/auth/change-password
export const changePassword = async (req, res) => {
    try {
        const session = req.session;
        const { currentPassword, newPassword } = req.body;
        if(!currentPassword || !newPassword){
            return res.status(400).json({ error: "Both passwords are required" });
        }
        const user = await User.findById(session.userId)
        if(!user) return res.status(404).json({ error: "User not found" });
        if(user.role === "ADMIN"){
            return res.status(403).json({ error: "Admin password is fixed for this portal" });
        }
        const isValid = await bcrypt.compare(currentPassword, user.password);
        if(!isValid) return res.status(400).json({ error: "Current password is incorrect" });
        const hashed = await bcrypt.hash(newPassword, 10);
        await User.findByIdAndUpdate(session.userId, {password: hashed})
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to change password" });
    }
}
