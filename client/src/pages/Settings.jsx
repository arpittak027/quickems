import { useCallback, useEffect, useState } from "react"
import Loading from "../components/Loading"
import { Lock } from "lucide-react"
import ProfileForm from "../components/ProfileForm"
import ChangePasswordModal from "../components/ChangePasswordModal"
import { useAuth } from "../context/useAuth"
import api from "../api/axios"
import toast from "react-hot-toast"
import { mergeLocalProfile } from "../utils/localDemoData"


const Settings = () => {
  const {user} = useAuth()

  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showPasswordModal, setShowPasswordModal] = useState(false)

  const fetchProfile = useCallback(async () => {
   try {
    const res = await api.get("/profile")
    const profile = mergeLocalProfile(user, res.data);
    if(profile) setProfile(profile)
   } catch (err) {
    const profile = mergeLocalProfile(user, {});
    if(profile) setProfile(profile)
    if(user?.role === "ADMIN"){
      toast.error(err?.response?.data?.error || err?.message)
    }
   }finally{
    setLoading(false)
   }
  },[user])

  useEffect(()=>{
    fetchProfile()
  },[fetchProfile])

  if(loading) return <Loading />

  const canChangePassword = user?.role !== "ADMIN";

  return (
    <div className="animate-fade-in">
      <div className="page-header">
        <h1 className="page-title">Settings</h1>
        <p className="page-subtitle">Manage your account and preferences</p>
      </div>

      {profile && <ProfileForm initialData={profile} onSuccess={fetchProfile}/>}

       {/* Change Password trigger */}
       <div className="card max-w-md p-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-100 rounded-lg">
              <Lock className="w-5 h-5 text-slate-600" />
            </div>
            <div>
              <p className="font-medium text-slate-900">Password</p>
              <p className="text-sm text-slate-500">{canChangePassword ? "Update your account password" : "Admin password is fixed for this portal"}</p>
            </div>
          </div>
          <button disabled={!canChangePassword} onClick={()=> setShowPasswordModal(true)} className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed">
            Change
          </button>
       </div>
       <ChangePasswordModal open={showPasswordModal} onClose={()=> setShowPasswordModal(false)}/>
    </div>
  )
}

export default Settings
