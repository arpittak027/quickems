const LOCAL_TOKEN_PREFIX = "quickems-local-token:";
const PROFILES_KEY = "quickems.localProfiles";
const ATTENDANCE_KEY = "quickems.localAttendance";
const LEAVES_KEY = "quickems.localLeaves";
const PAYSLIPS_KEY = "quickems.localPayslips";

const safeParse = (value, fallback) => {
    try {
        return value ? JSON.parse(value) : fallback;
    } catch {
        return fallback;
    }
};

const slugify = (value) => String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const toTitleWords = (value) => String(value || "")
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase());

const getEmployeeIdFromEmail = (email) => `local-${slugify(email)}`;
const createLocalId = (prefix) => `local-${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const dedupeBy = (items, getKey) => {
    const seen = new Set();
    return items.filter((item) => {
        const key = getKey(item);
        if (!key || seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

const sortByLatest = (a, b) => {
    const aTime = new Date(a.updatedAt || a.createdAt || a.date || 0).getTime();
    const bTime = new Date(b.updatedAt || b.createdAt || b.date || 0).getTime();
    return bTime - aTime;
};

export const createLocalUser = (email) => {
    const normalizedEmail = String(email || "").toLowerCase().trim();
    return {
        userId: getEmployeeIdFromEmail(normalizedEmail),
        role: "EMPLOYEE",
        email: normalizedEmail,
    };
};

export const createLocalToken = (user) => `${LOCAL_TOKEN_PREFIX}${btoa(encodeURIComponent(JSON.stringify(user)))}`;

export const getUserFromLocalToken = (token) => {
    if (!token?.startsWith(LOCAL_TOKEN_PREFIX)) return null;
    try {
        return JSON.parse(decodeURIComponent(atob(token.slice(LOCAL_TOKEN_PREFIX.length))));
    } catch {
        return null;
    }
};

export const isLocalToken = (token) => !!getUserFromLocalToken(token);

const readProfiles = () => safeParse(localStorage.getItem(PROFILES_KEY), {});
const writeProfiles = (profiles) => localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles));
const readAttendance = () => safeParse(localStorage.getItem(ATTENDANCE_KEY), []);
const writeAttendance = (records) => localStorage.setItem(ATTENDANCE_KEY, JSON.stringify(records));
const readLeaves = () => safeParse(localStorage.getItem(LEAVES_KEY), []);
const writeLeaves = (records) => localStorage.setItem(LEAVES_KEY, JSON.stringify(records));
const readPayslips = () => safeParse(localStorage.getItem(PAYSLIPS_KEY), []);
const writePayslips = (records) => localStorage.setItem(PAYSLIPS_KEY, JSON.stringify(records));

const getDefaultProfile = (user) => {
    if (user?.role === "ADMIN") {
        return {
            firstName: "Admin",
            lastName: "",
            email: user.email,
            position: "Administrator",
            department: "Management",
            bio: "",
            profilePhoto: "",
            isDeleted: false,
            readOnly: false,
        };
    }

    const localPart = String(user?.email || "employee").split("@")[0];
    const words = toTitleWords(localPart);
    const id = user?.userId || getEmployeeIdFromEmail(user?.email);
    return {
        id,
        _id: id,
        firstName: words[0] || "Employee",
        lastName: words.slice(1).join(" ") || "User",
        email: user?.email || "",
        phone: "9999999999",
        position: "Employee",
        department: "Engineering",
        employmentStatus: "ACTIVE",
        bio: "",
        profilePhoto: "",
        isDeleted: false,
        readOnly: false,
    };
};

export const mergeLocalProfile = (user, remoteProfile = {}) => {
    const profiles = readProfiles();
    const saved = profiles[user?.email] || {};
    const base = {
        ...getDefaultProfile(user),
        ...remoteProfile,
        ...saved,
        email: user?.email || remoteProfile.email || "",
        readOnly: false,
        isDeleted: false,
    };

    if (user?.role === "ADMIN") {
        base.firstName = "Admin";
        base.lastName = "";
        base.position = "Administrator";
        base.department = "Management";
        base.isDeleted = false;
    } else {
        base.id = base.id || base._id || getEmployeeIdFromEmail(base.email);
        base._id = base._id || base.id;
        base.employmentStatus = "ACTIVE";
    }

    return base;
};

export const saveLocalProfile = (user, data) => {
    const profiles = readProfiles();
    const current = mergeLocalProfile(user, profiles[user.email] || {});
    profiles[user.email] = {
        ...current,
        bio: data.bio ?? current.bio ?? "",
        profilePhoto: data.profilePhoto ?? current.profilePhoto ?? "",
    };
    if (user?.role === "ADMIN") {
        profiles[user.email].isDeleted = false;
    }
    writeProfiles(profiles);
    return profiles[user.email];
};

export const getLocalEmployees = () => {
    const profiles = readProfiles();
    return Object.values(profiles)
        .filter((profile) => profile.email && profile.position !== "Administrator")
        .map((profile) => ({
            ...profile,
            id: profile.id || profile._id || getEmployeeIdFromEmail(profile.email),
            _id: profile._id || profile.id || getEmployeeIdFromEmail(profile.email),
            employmentStatus: "ACTIVE",
            isDeleted: false,
            local: true,
        }));
};

export const mergeEmployeeDirectory = (remoteEmployees = []) => {
    const normalizedRemote = remoteEmployees.map((employee) => ({
        ...employee,
        id: employee.id || employee._id,
        _id: employee._id || employee.id,
    }));

    const localEmployees = getLocalEmployees();
    return dedupeBy(
        [...normalizedRemote, ...localEmployees],
        (employee) => employee.email?.toLowerCase() || employee.id || employee._id
    );
};

const dateAtTime = (date, time) => {
    if (!date || !time) return null;
    const [year, month, day] = date.split("-").map(Number);
    const [hours, minutes] = time.split(":").map(Number);
    const value = new Date(year, month - 1, day, hours, minutes, 0, 0);
    return Number.isNaN(value.getTime()) ? null : value;
};

const dateOnly = (date = new Date()) => {
    const value = new Date(date);
    value.setHours(0, 0, 0, 0);
    return value;
};

const formatDateKey = (date) => dateOnly(date).toISOString().slice(0, 10);

const toInputDate = (date = new Date()) => {
    const value = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
    return value.toISOString().split("T")[0];
};

const getDayType = (workingHours) => {
    if (workingHours >= 8) return "Full Day";
    if (workingHours >= 6) return "Three Quarter Day";
    if (workingHours >= 4) return "Half Day";
    return "Short Day";
};

const normalizeEmployee = (employeeOrUser) => {
    if (employeeOrUser?.firstName) {
        return {
            id: employeeOrUser.id || employeeOrUser._id || employeeOrUser.userId || getEmployeeIdFromEmail(employeeOrUser.email),
            firstName: employeeOrUser.firstName,
            lastName: employeeOrUser.lastName || "",
            email: employeeOrUser.email,
            position: employeeOrUser.position || "Employee",
            department: employeeOrUser.department || "Engineering",
            isDeleted: false,
            employmentStatus: "ACTIVE",
            local: !!employeeOrUser.local,
        };
    }

    const profile = mergeLocalProfile(employeeOrUser, {});
    return {
        id: profile.id || profile._id || getEmployeeIdFromEmail(profile.email),
        firstName: profile.firstName,
        lastName: profile.lastName || "",
        email: profile.email,
        position: profile.position || "Employee",
        department: profile.department || "Engineering",
        isDeleted: false,
        employmentStatus: "ACTIVE",
        local: true,
    };
};

const getAttendanceKey = (record) => `${record.employee?.email?.toLowerCase() || record.employeeId}-${formatDateKey(record.date)}`;

export const saveLocalAttendance = ({ employee, date, status = "PRESENT", checkIn, checkOut }) => {
    const normalizedEmployee = normalizeEmployee(employee);
    const employeeId = normalizedEmployee.id || normalizedEmployee.email;
    const attendanceDate = dateOnly(dateAtTime(date, "00:00") || new Date(date));
    const checkInDate = status === "ABSENT" ? null : dateAtTime(date, checkIn);
    const checkOutDate = status === "ABSENT" ? null : dateAtTime(date, checkOut);
    const workingHours = checkInDate && checkOutDate
        ? Number(((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60)).toFixed(2))
        : null;

    const record = {
        _id: `local-${employeeId}-${attendanceDate.toISOString().slice(0, 10)}`,
        id: `local-${employeeId}-${attendanceDate.toISOString().slice(0, 10)}`,
        employeeId,
        employee: normalizedEmployee,
        date: attendanceDate.toISOString(),
        checkIn: checkInDate?.toISOString() || null,
        checkOut: checkOutDate?.toISOString() || null,
        status,
        workingHours,
        dayType: workingHours != null ? getDayType(workingHours) : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        local: true,
    };

    const records = readAttendance().filter((item) => getAttendanceKey(item) !== getAttendanceKey(record));
    records.unshift(record);
    writeAttendance(records);
    return record;
};

export const deleteLocalAttendance = (id) => {
    const records = readAttendance().filter((item) => (item._id || item.id) !== id);
    writeAttendance(records);
};

export const clockLocalAttendance = (user, todayRecord) => {
    const now = new Date();
    const date = toInputDate(now);
    const time = now.toTimeString().slice(0, 5);

    if (todayRecord?.checkIn && !todayRecord?.checkOut) {
        return saveLocalAttendance({
            employee: user,
            date,
            status: todayRecord.status || "PRESENT",
            checkIn: new Date(todayRecord.checkIn).toTimeString().slice(0, 5),
            checkOut: time,
        });
    }

    const isLate = now.getHours() > 9 || (now.getHours() === 9 && now.getMinutes() > 0);
    return saveLocalAttendance({
        employee: user,
        date,
        status: isLate ? "LATE" : "PRESENT",
        checkIn: time,
    });
};

export const getLocalAttendanceForUser = (user) => {
    const records = readAttendance();
    if (user?.role === "ADMIN") return records;
    return records.filter((record) => record.employee?.email === user?.email || record.employeeId === user?.userId);
};

export const mergeAttendance = (remoteRecords = [], user) => {
    const localRecords = getLocalAttendanceForUser(user);
    return dedupeBy([...remoteRecords, ...localRecords], getAttendanceKey).sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const saveLocalLeave = ({ employee, type, startDate, endDate, reason, status = "PENDING" }) => {
    const normalizedEmployee = normalizeEmployee(employee);
    const recordId = createLocalId("leave");
    const record = {
        _id: recordId,
        id: recordId,
        employeeId: normalizedEmployee.id || normalizedEmployee.email,
        employee: normalizedEmployee,
        type,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        reason,
        status,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        local: true,
    };

    const records = [record, ...readLeaves()].sort(sortByLatest);
    writeLeaves(records);
    return record;
};

export const updateLocalLeaveStatus = (id, status) => {
    const records = readLeaves().map((leave) => (
        (leave._id || leave.id) === id
            ? { ...leave, status, updatedAt: new Date().toISOString() }
            : leave
    ));
    writeLeaves(records);
};

export const deleteLocalLeave = (id) => {
    const records = readLeaves().filter((leave) => (leave._id || leave.id) !== id);
    writeLeaves(records);
};

export const getLocalLeavesForUser = (user) => {
    const records = readLeaves();
    if (user?.role === "ADMIN") return records;
    return records.filter((leave) => leave.employee?.email === user?.email || leave.employeeId === user?.userId);
};

export const mergeLeaves = (remoteLeaves = [], user) => {
    const localLeaves = getLocalLeavesForUser(user);
    return dedupeBy([...remoteLeaves, ...localLeaves], (leave) => leave._id || leave.id).sort(sortByLatest);
};

export const saveLocalPayslip = ({ employee, month, year, basicSalary, allowances = 0, deductions = 0 }) => {
    const normalizedEmployee = normalizeEmployee(employee);
    const basic = Number(basicSalary || 0);
    const allowanceValue = Number(allowances || 0);
    const deductionValue = Number(deductions || 0);
    const recordId = createLocalId("payslip");
    const record = {
        _id: recordId,
        id: recordId,
        employeeId: normalizedEmployee.id || normalizedEmployee.email,
        employee: normalizedEmployee,
        month: Number(month),
        year: Number(year),
        basicSalary: basic,
        allowances: allowanceValue,
        deductions: deductionValue,
        netSalary: basic + allowanceValue - deductionValue,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        local: true,
    };

    const records = [record, ...readPayslips()].sort((a, b) => {
        const monthDiff = (Number(b.year) * 12 + Number(b.month)) - (Number(a.year) * 12 + Number(a.month));
        return monthDiff || sortByLatest(a, b);
    });
    writePayslips(records);
    return record;
};

export const deleteLocalPayslip = (id) => {
    const records = readPayslips().filter((payslip) => (payslip._id || payslip.id) !== id);
    writePayslips(records);
};

export const getLocalPayslipsForUser = (user) => {
    const records = readPayslips();
    if (user?.role === "ADMIN") return records;
    return records.filter((payslip) => 
        payslip.employee?.email?.toLowerCase() === user?.email?.toLowerCase() || 
        payslip.employeeId === user?.userId ||
        payslip.employeeId === getEmployeeIdFromEmail(user?.email)
    );
};

export const mergePayslips = (remotePayslips = [], user) => {
    const localPayslips = getLocalPayslipsForUser(user);
    return dedupeBy([...remotePayslips, ...localPayslips], (payslip) => payslip._id || payslip.id).sort((a, b) => {
        const monthDiff = (Number(b.year) * 12 + Number(b.month)) - (Number(a.year) * 12 + Number(a.month));
        return monthDiff || sortByLatest(a, b);
    });
};

export const getLocalPayslipById = (id, user) => {
    const payslip = getLocalPayslipsForUser(user).find((item) => (item._id || item.id) === id);
    if (!payslip) return null;
    return {
        ...payslip,
        employee: normalizeEmployee(payslip.employee || user),
    };
};

export const isLocalRecordId = (id) => String(id || "").startsWith("local-");
