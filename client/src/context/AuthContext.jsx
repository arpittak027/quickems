import { useEffect, useState } from "react";
import api from "../api/axios";
import { AuthContext } from "./AuthContextBase";
import { createLocalToken, createLocalUser, getUserFromLocalToken, mergeLocalProfile, saveLocalProfile } from "../utils/localDemoData";

export function AuthProvider({children}){
    const [user, setUser] = useState(null)
    const [token, setToken] = useState(localStorage.getItem("token"))
    const [loading, setLoading] = useState(true)

    const refreshSession = async () => {
        const storedToken = localStorage.getItem("token")
        if(!storedToken){
            setUser(null);
            setToken(null);
            setLoading(false);
            return;
        }
        const localUser = getUserFromLocalToken(storedToken);
        if(localUser){
            saveLocalProfile(localUser, mergeLocalProfile(localUser, {}));
            setUser(localUser);
            setToken(storedToken);
            setLoading(false);
            return;
        }
        try {
            const { data } = await api.get("/auth/session")
            setUser(data.user)
        } catch {
            // Token is invalid, clear it
            localStorage.removeItem("token")
            setUser(null)
            setToken(null)
        }finally{
            setLoading(false)
        }
    }

    useEffect(()=>{
        refreshSession()
    },[])

    const login = async (email, password, role_type) => {
        try {
            const { data } = await api.post("/auth/login", {email, password, role_type})
            localStorage.setItem("token", data.token)
            setToken(data.token);
            setUser(data.user);
            return data.user;
        } catch (error) {
            if(role_type !== "employee") throw error;
            const localUser = createLocalUser(email);
            const localToken = createLocalToken(localUser);
            saveLocalProfile(localUser, mergeLocalProfile(localUser, {}));
            localStorage.setItem("token", localToken);
            setToken(localToken);
            setUser(localUser);
            return localUser;
        }
    }

    const logout = async ()=>{
        localStorage.removeItem("token")
        setToken(null);
        setUser(null);
    }

    const value = {user, token, loading, login, logout, refreshSession}

    return <AuthContext.Provider value={value}>
        {children}
    </AuthContext.Provider>
}
