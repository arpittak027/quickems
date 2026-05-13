import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading";
import PayslipList from "../components/payslip/PayslipList";
import GeneratePayslipForm from "../components/payslip/GeneratePayslipForm";
import { useAuth } from "../context/useAuth";
import api from "../api/axios";
import toast from "react-hot-toast";
import { Banknote, FileCheck2, Users } from "lucide-react";
import { formatINR } from "../utils/currency";


const Payslips = () => {
  const [payslips, setPayslips] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true);

  const {user} = useAuth()
  const isAdmin = user?.role === "ADMIN";

  const fetchPayslips = useCallback(async ()=>{
    try {
      const res = await api.get('/payslips')
      setPayslips(res.data.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message);
    }finally{
      setLoading(false)
    }
  },[])

  useEffect(()=>{
    fetchPayslips()
  },[fetchPayslips])

  useEffect(()=>{
    if(isAdmin) api.get("/employees").then((res)=> setEmployees(res.data.filter((e)=> !e.isDeleted && e.employmentStatus !== "INACTIVE"))).catch(()=>{})
  },[isAdmin])

  if(loading) return <Loading />

  const totalNetSalary = payslips.reduce((sum, payslip)=> sum + Number(payslip.netSalary || 0), 0);
  const latestPayslip = payslips[0];
  const stats = isAdmin
    ? [
      {label: "Payslips Issued", value: payslips.length, helper: "records", icon: FileCheck2},
      {label: "Total Net Payroll", value: formatINR(totalNetSalary), helper: "across visible records", icon: Banknote},
      {label: "Active Employees", value: employees.length, helper: "available for payroll", icon: Users},
    ]
    : [
      {label: "Payslips Received", value: payslips.length, helper: "records", icon: FileCheck2},
      {label: "Latest Net Pay", value: latestPayslip ? formatINR(latestPayslip.netSalary) : "N/A", helper: "most recent payslip", icon: Banknote},
      {label: "Total Paid", value: formatINR(totalNetSalary), helper: "all payslips", icon: Users},
    ]

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="page-title">Payslips</h1>
          <p className="page-subtitle">{isAdmin ? "Generate and manage employee payslips" : "Your payslip history"}</p>
        </div>
        {isAdmin && <GeneratePayslipForm employees={employees} onSuccess={fetchPayslips}/>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-5 mb-8">
        {stats.map((stat)=>(
          <div key={stat.label} className="card p-5 sm:p-6 flex items-center gap-4 relative overflow-hidden">
            <div className="absolute left-0 top-0 bottom-0 w-1 rounded-r-full bg-slate-500/70" />
            <div className="p-3 bg-slate-100 rounded-lg">
              <stat.icon className="w-5 h-5 text-slate-600" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-slate-500">{stat.label}</p>
              <p className="text-2xl font-semibold text-slate-900 tracking-tight truncate">{stat.value}</p>
              <p className="text-xs text-slate-400">{stat.helper}</p>
            </div>
          </div>
        ))}
      </div>

      <PayslipList payslips={payslips} isAdmin={isAdmin}/>
    </div>
  )
}

export default Payslips
