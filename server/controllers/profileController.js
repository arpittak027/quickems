import Employee from "../models/Employee.js";
import User from "../models/User.js";

function getProfilePhoto(value){
    const photo = String(value || "");
    if(!photo) return "";
    if(photo.length > 900000) return null;
    return photo.startsWith("data:image/") ? photo : null;
}

// Get profile
// GET /api/profile
export const getProfile = async (req, res) => {
    try {
        const session = req.session;
        if(session.role === "ADMIN"){
            const user = await User.findById(session.userId).lean();
            return res.json({
                firstName: user?.displayName || "Admin",
                lastName: "",
                email: session.email,
                position: "Administrator",
                bio: user?.bio || "",
                profilePhoto: user?.profilePhoto || "",
                isDeleted: false,
                readOnly: false,
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
                profilePhoto: "",
                isDeleted: false,
                readOnly: false,
            })
        }
        const profile = employee.toObject();
        return res.json({
            ...profile,
            readOnly: false,
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
        const profilePhoto = getProfilePhoto(req.body.profilePhoto);
        if(req.body.profilePhoto && profilePhoto === null){
            return res.status(400).json({ error: "Please upload a smaller image file" });
        }

        if(session.role === "ADMIN"){
            const update = {
                displayName: "Admin",
                bio: req.body.bio || "",
            };
            if(req.body.profilePhoto !== undefined) update.profilePhoto = profilePhoto;
            await User.findByIdAndUpdate(session.userId, update);
            return res.json({ success: true });
        }

        const employee = await Employee.findOne({userId: session.userId})
        if(!employee) return res.status(404).json({ error: "Employee not found" });
        if (employee.isDeleted){
            return res.status(403).json({error: "Your account is deactivated. You cannot update your profile.",})
        }
        const update = {bio: req.body.bio || ""};
        if(req.body.profilePhoto !== undefined) update.profilePhoto = profilePhoto;
        await Employee.findByIdAndUpdate(employee._id, update)
        return res.json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: "Failed to update profile" });
    }
}
