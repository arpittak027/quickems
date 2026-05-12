import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading"
import CheckInButton from "../components/attendance/CheckInButton"
import AttendanceStats from "../components/attendance/AttendanceStats"
import AttendanceHistory from "../components/attendance/AttendanceHistory"
import api from "../api/axios"
import {toast} from 'react-hot-toast'
import { useAuth } from "../context/useAuth"


const Attendance = () => {
  const {user} = useAuth()
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)
  const [isDeleted, setIsDeleted] = useState(false)

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

  useEffect(()=>{
    fetchData()
  },[fetchData]);

  if (loading) return <Loading />

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const isAdmin = user?.role === "ADMIN"
  const todayRecord = history.find((r)=> new Date(r.date).toDateString() === today.toDateString())

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Attendance</h1>
        <p className="page-subtitle">{isAdmin ? "Review daily check-ins across your team" : "Track your work hours and daily check-ins"}</p>
      </div>

      {isAdmin ? (
        <div className="mb-8 flex flex-col items-center justify-center min-h-24 p-8 bg-slate-50 rounded-2xl border border-slate-200 text-center">
          <h3 className="text-lg font-bold text-slate-900">Team Attendance Overview</h3>
          <p className="text-slate-500 text-sm mt-1">Review employee check-ins, working hours, day type, and late arrivals.</p>
        </div>
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
