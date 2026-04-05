import axios from "axios";

const BASE_URL = "http://127.0.0.1:4000";

export const signup = (user) =>
  axios.post(`${BASE_URL}/auth/register`, user);

export const login = (user) =>
  axios.post(`${BASE_URL}/auth/login`, user);

export const getProfile = (token) =>
  axios.get(`${BASE_URL}/auth/profile`, {
    headers: { Authorization: `Bearer ${token}` },
  });