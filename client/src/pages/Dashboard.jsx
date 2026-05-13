import { useEffect, useState } from "react"
import Loading from "../components/Loading"
import EmployeeDashboard from "../components/EmployeeDashboard"
import AdminDashboard from "../components/AdminDashboard"
import api from "../api/axios"
import toast from "react-hot-toast"
import { useAuth } from "../context/useAuth"
import { getLocalDashboardData, isLocalToken } from "../utils/localDemoData"

const Dashboard = () => {
  const { user } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const localOnlySession = isLocalToken(localStorage.getItem("token"))

    api.get('/dashboard')
      .then((res) => {
        setData(res.data)
      })
      .catch((err) => {
        const localData = getLocalDashboardData(user)
        if (localData) {
          setData(localData)
        }
        if (!localOnlySession) {
          toast.error(err.response?.data?.error || err?.message)
        }
      })
      .finally(() => setLoading(false))
  }, [user])

  if(loading) return <Loading />
  if(!data) return <p className="text-center text-slate-500 py-12">Failed to load dashboard</p>

  if(data.role === "ADMIN"){
    return <AdminDashboard data={data}/>
  }else{
    return <EmployeeDashboard data={data}/>
  }
}

export default Dashboard
