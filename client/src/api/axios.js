import axios from "axios";

const apiBaseUrl = import.meta.env.VITE_BASE_URL
    ? `${import.meta.env.VITE_BASE_URL}/api`
    : import.meta.env.DEV
        ? "http://localhost:4000/api"
        : "/api";

const api = axios.create({
    baseURL: apiBaseUrl
})

// Attach Auth token to all network requests
api.interceptors.request.use((config)=>{
    const token = localStorage.getItem("token")
    if(token){
        config.headers.Authorization = `Bearer ${token}`
    }
    return config;
})

export default api
