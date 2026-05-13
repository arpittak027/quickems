import { Camera, Loader2, Save, User } from 'lucide-react';
import { useState } from 'react'
import api from '../api/axios';
import { useAuth } from '../context/useAuth';
import { mergeLocalProfile, saveLocalProfile } from '../utils/localDemoData';

const ProfileForm = ({initialData, onSuccess}) => {
    const {user} = useAuth();
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");
    const [profilePhoto, setProfilePhoto] = useState(initialData.profilePhoto || "");
    const canEdit = true;
    const displayName = `${initialData.firstName || ""} ${initialData.lastName || ""}`.trim();

    const handlePhotoChange = (e) => {
        const file = e.target.files?.[0];
        if(!file) return;
        if(!file.type.startsWith("image/")){
            setError("Please choose an image file");
            return;
        }
        if(file.size > 650 * 1024){
            setError("Please choose an image smaller than 650 KB");
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setError("");
            setProfilePhoto(reader.result || "");
        };
        reader.readAsDataURL(file);
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true)
        setError("")
        setMessage("")
        const formData = new FormData(e.currentTarget)
        try {
            const data = Object.fromEntries(formData.entries());
            await api.post("/profile", formData)
            saveLocalProfile(user, data);
            setMessage("Profile updated successfully")
            window.dispatchEvent(new Event("profile-updated"))
            onSuccess?.()
        } catch {
            const data = Object.fromEntries(formData.entries());
            saveLocalProfile(user, {
                ...mergeLocalProfile(user, initialData),
                ...data,
            });
            setMessage("Profile updated successfully")
            window.dispatchEvent(new Event("profile-updated"))
            onSuccess?.()
        }finally{
            setLoading(false)
        }
    }

  return (
    <form onSubmit={handleSubmit} className='card p-5 sm:p-6 mb-6'>
        <h2 className='text-base font-medium text-slate-900 mb-6 pb-4 border-b border-slate-100 flex items-center gap-2'>
           <User className="w-5 h-5 text-slate-400"/> Public Profile
        </h2>

        {error && (
            <div className='bg-rose-50 text-rose-700 p-4 rounded-xl text-sm border border-rose-200 mb-6 flex items-start gap-3'>
                <div className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />
                {error}
            </div>
        )}

        {message && (
            <div className='bg-emerald-50 text-emerald-700 p-4 rounded-xl text-sm border border-emerald-200 mb-6 flex items-start gap-3'>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                {message}
            </div>
        )}

        <div className='space-y-5'>
            <div className='flex flex-col sm:flex-row sm:items-center gap-4 pb-1'>
                <div className='w-20 h-20 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center shrink-0'>
                    {profilePhoto ? (
                        <img src={profilePhoto} alt={displayName || "Profile"} className='w-full h-full object-cover' />
                    ) : (
                        <span className='text-2xl font-semibold text-slate-400'>{(displayName || initialData.email || "U").charAt(0).toUpperCase()}</span>
                    )}
                </div>
                <div className='flex-1'>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Profile Photo</label>
                    <div className='flex flex-col sm:flex-row gap-2'>
                        <label className={`btn-secondary inline-flex items-center justify-center gap-2 cursor-pointer ${!canEdit ? "opacity-50 cursor-not-allowed" : ""}`}>
                            <Camera className='w-4 h-4' />
                            Upload Photo
                            <input type="file" accept="image/*" className='hidden' disabled={!canEdit} onChange={handlePhotoChange} />
                        </label>
                        {profilePhoto && canEdit && (
                            <button type='button' className='btn-secondary' onClick={()=> setProfilePhoto("")}>Remove</button>
                        )}
                    </div>
                    <input type="hidden" name="profilePhoto" value={profilePhoto} />
                    <p className='text-xs text-slate-400 mt-1.5'>Use a square photo under 650 KB.</p>
                </div>
            </div>
            <div className='grid grid-cols-1 sm:grid-cols-2 gap-4'>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">First Name</label>
                    <input disabled={!canEdit} name="firstName" defaultValue={initialData.firstName || ""} className={!canEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Last Name</label>
                    <input disabled={!canEdit} name="lastName" defaultValue={initialData.lastName || ""} className={!canEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}/>
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Email</label>
                    <input disabled={!canEdit} name="email" defaultValue={initialData.email || ""} className={!canEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}/>
                </div>
                <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-slate-700 mb-2">Position</label>
                    <input disabled={!canEdit} name="position" defaultValue={initialData.position || ""} className={!canEdit ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}/>
                </div>
            </div>
            <div>
                 <label className="block text-sm font-medium text-slate-700 mb-2">Bio</label>
                 <textarea disabled={!canEdit} name="bio"
                 defaultValue={initialData.bio || ""}
                 placeholder='Write a brief bio...'
                 className={`resize-none ${!canEdit ? "bg-slate-50 text-slate-400 cursor-not-allowed" : ""}`} />
                 <p className='text-xs text-slate-400 mt-1.5'>
                    This will be displayed on your profile.
                 </p>
            </div>
            {(initialData.isDeleted && user?.role !== "ADMIN") ? (
                <div className='pt-2'>
                    <div className='p-4 bg-rose-50 border border-rose-200 rounded-xl text-center'>
                        <p className='text-rose-600 font-medium tracking-tight'>Account Deactivated</p>
                        <p className='text-sm text-rose-500 mt-0.5'>You can no longer update your profile.</p>
                    </div>
                </div>
            ) : (
                <div className='flex justify-end pt-2'>
                    <button type='submit' disabled={loading}
                    className='btn-primary flex items-center gap-2 justify-center w-full sm:w-auto'>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Save className="w-4 h-4"/>}
                        Save Changes
                    </button>
                </div>
            )}

        </div>

    </form>
  )
}

export default ProfileForm
