import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading"
import CheckInButton from "../components/attendance/CheckInButton"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import AdminAttendanceForm from "../components/attendance/AdminAttendanceForm"
import api from "../api/axios"
import {toast} from 'react-hot-toast'
import { useAuth } from "../context/useAuth"


const Attendance = () => {
  const {user} = useAuth()
  const [history, setHistory] = useState([])
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDeleted, setIsDeleted] = useState(false)
  const isAdmin = user?.role === "ADMIN"

  const fetchData = useCallback(async ()=>{
    try {
      const res = await api.get("/attendance");
      const json = res.data;
      setHistory(json.data || [])
      if(json.employee?.isDeleted) setIsDeleted(true)
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    }finally{
      setLoading(false)
    }
  },[])

  const fetchEmployees = useCallback(async ()=>{
    if(!isAdmin) return;
    try {
      const res = await api.get("/employees");
      setEmployees(res.data || [])
    } catch (error) {
      toast.error(error?.response?.data?.error || error?.message)
    }
  },[isAdmin])

  useEffect(()=>{
    fetchData()
  },[fetchData]);

  useEffect(()=>{
    fetchEmployees()
  },[fetchEmployees])

  if (loading) return <Loading />

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayRecord = history.find((r)=> new Date(r.date).toDateString() === today.toDateString())

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">{isAdmin ? "Review daily check-ins across your team" : "Track your work hours and daily check-ins"}</p>
      </div>

      {isAdmin ? (
        <AdminAttendanceForm employees={employees} onSuccess={fetchData}/>
      ) : isDeleted ? (
        <div className="mb-8 p-6 bg-rose-50 border border-rose-200 rounded-2xl text-center">
          <p className="text-rose-600">You can no longer clock in or out because your employee records have been marked as deleted.</p>
        </div>
      ): (
        <div className="mb-8">
          <CheckInButton todayRecord={todayRecord} onAction={fetchData}/>
        </div>
      )}

      <AttendanceStats history={history}/>
      <AttendanceHistory history={history} isAdmin={isAdmin}/>
    </div>
  )
}

export default Attendance
