import axios from "axios";
import { auth } from "../../firebaseConfig";

const backendHost = import.meta.env.VITE_BACKEND_HOST || "http://localhost";
const backendPort = import.meta.env.VITE_BACKEND_PORT || "5000";

if (!import.meta.env.VITE_BACKEND_HOST || !import.meta.env.VITE_BACKEND_PORT) {
    console.warn(
        "Environment variables VITE_BACKEND_HOST and/or VITE_BACKEND_PORT are not set. Using default values."
    );
}

export const apiUrl = `${backendHost}:${backendPort}/api`;

// Helper to get token
export const getToken = async () => {
  return await auth.currentUser?.getIdToken();
};

// Axios instance with interceptor for auth
export const authAxios = axios.create();

authAxios.interceptors.request.use(async (config) => {
  const token = await getToken();
  if (token) {
    config.headers = config.headers || {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});