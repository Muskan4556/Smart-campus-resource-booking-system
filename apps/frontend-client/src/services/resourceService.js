import axios from "axios";

const resourceApi = axios.create({
  baseURL: "http://localhost:5002",
});

// Interceptor to automatically add token to every request
resourceApi.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const getResources = () => resourceApi.get("/resources");
export const addResource = (resource) => resourceApi.post("/resources", resource);