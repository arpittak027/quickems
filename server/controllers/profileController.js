import Employee from "../models/Employee.js";

const DEMO_ACCOUNT_EMAILS = new Set([
    "admin@example.com",
    "employee@example.com",
    "employee@arpittak.com",
]);

// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN"){
            return res.json({
                firstName: "Demo",
                lastName: "Admin",
                email: session.email,
                position: "Administrator",
                bio: "Demo admin profile is read-only",
                isDeleted: false,
                readOnly: true,
            })
        }

        const employee = await Employee.findOne({userId: session.userId})

        if(!employee) {
            // Authenticated user is not an employee - return admin profile
            return res.json({
                firstName: "Admin",
                lastName: "",
                email: session.email,
                position: "Administrator",
                bio: "",
                isDeleted: false,
                readOnly: true,
            })
        }
        const profile = employee.toObject();
        return res.json({
            ...profile,
            readOnly: DEMO_ACCOUNT_EMAILS.has(session.email),
        })
    } catch (error) {
        return res.status(500).json({ error: "Failed to fetch profile" });
    }
}

// Update profile
// PUT /api/profile
export const updateProfile = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN" || DEMO_ACCOUNT_EMAILS.has(session.email)){
            return res.status(403).json({ error: "Demo profile is read-only" });
        }
        const employee = await Employee.findOne({userId: session.userId})
        if(!employee && session.role === "ADMIN") return res.json({ success: true });
        if(!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted){
            return res.status(403).json({error: "Your account is deactivated. You cannot update your profile.",})
        }
        await Employee.findByIdAndUpdate(employee._id, {
            bio: req.body.bio
        })
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update profile" });
    }
}
