import { CalendarClock, Loader2, Save } from 'lucide-react'
import { useState } from 'react'
import api from '../../api/axios'
import toast from 'react-hot-toast'
import { saveLocalAttendance } from '../../utils/localDemoData'

const toInputDate = (date = new Date()) => {
    const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000)
    return localDate.toISOString().split("T")[0]
}

const AdminAttendanceForm = ({employees, onSuccess}) => {
    const activeEmployees = employees.filter((employee)=> !employee.isDeleted && employee.employmentStatus !== "INACTIVE")
    const [status, setStatus] = useState("PRESENT")
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        const formData = new FormData(e.currentTarget)
        const data = Object.fromEntries(formData.entries())
        const employee = activeEmployees.find((item)=> item.id === data.employeeId || item._id === data.employeeId)
        if(data.status === "ABSENT"){
            delete data.checkIn
            delete data.checkOut
        }

        try {
            if(!employee){
                throw new Error("Employee not found")
            }
            if(employee.local || String(data.employeeId).startsWith("local-")){
                saveLocalAttendance({ employee, ...data });
            } else {
                await api.post("/attendance", data)
            }
            toast.success("Attendance saved")
            onSuccess?.()
        } catch (error) {
            if(employee){
                saveLocalAttendance({employee, ...data});
                toast.success("Attendance saved")
                onSuccess?.()
            } else {
                toast.error(error?.response?.data?.error || error?.message)
            }
        }finally{
            setLoading(false)
        }
    }

    return (
        <form onSubmit={handleSubmit} className="card p-5 sm:p-6 mb-8">
            <div className="flex items-start justify-between gap-4 mb-5 pb-4 border-b border-slate-100">
                <div>
                    <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
                        <CalendarClock className="w-5 h-5 text-slate-400" />
                        Mark Team Attendance
                    </h3>
                    <p className="text-sm text-slate-500 mt-1">Create or update an employee attendance record for any work date.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Employee</label>
                    <select name="employeeId" required disabled={!activeEmployees.length}>
                        <option value="">Select employee</option>
                        {activeEmployees.map((employee)=>(
                            <option key={employee.id} value={employee.id}>
                                {employee.firstName} {employee.lastName} - {employee.department}
                            </option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Date</label>
                    <input type="date" name="date" required defaultValue={toInputDate()} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Status</label>
                    <select name="status" value={status} onChange={(e)=> setStatus(e.target.value)}>
                        <option value="PRESENT">Present</option>
                        <option value="LATE">Late</option>
                        <option value="ABSENT">Absent</option>
                    </select>
                </div>
                <div className="flex items-end">
                    <button type="submit" disabled={loading || !activeEmployees.length} className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-60">
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4 max-w-xl">
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Check In</label>
                    <input type="time" name="checkIn" defaultValue="09:30" disabled={status === "ABSENT"} required={status !== "ABSENT"} />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Check Out</label>
                    <input type="time" name="checkOut" defaultValue="18:00" disabled={status === "ABSENT"} />
                </div>
            </div>
        </form>
    )
}

export default AdminAttendanceForm
