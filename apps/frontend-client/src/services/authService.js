import axios from "axios";

const BASE_URL = "http://localhost:4000"; // backend URL

export const signup = (user) =>
  axios.post(`${BASE_URL}/auth/register`, user);

export const login = (user) =>
  axios.post(`${BASE_URL}/auth/login`, user);

export const getProfile = (token) =>
  axios.get(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });