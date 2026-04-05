import axios from "axios";

const BASE_URL = "http://localhost:5001";

export const bookResource = (booking, token) =>
  axios.post(`${BASE_URL}/booking/book`, booking, {
    headers: {
      Authorization: `Bearer ${token}`,
      role: "user",
    },
  });

export const getMyBookings = (token) =>
  axios.get(`${BASE_URL}/booking/my`, {
    headers: {
      Authorization: `Bearer ${token}`,
      role: "user",
    },
  });