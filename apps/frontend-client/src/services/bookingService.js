import axios from "axios";

const BASE_URL = "http://localhost:4000";

export const bookResource = (booking, token) =>
  axios.post(`${BASE_URL}/bookings`, booking, {
    headers: { Authorization: `Bearer ${token}` },
  });

export const getMyBookings = (token) =>
  axios.get(`${BASE_URL}/bookings/my`, {
    headers: { Authorization: `Bearer ${token}` },
  });