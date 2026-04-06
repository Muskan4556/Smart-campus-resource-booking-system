import axios from "axios";

const BASE_URL = "http://localhost:5003";

// POST /booking/book
// Body: { userId, resourceId, date, startTime, endTime }
export const bookResource = (booking, token) =>
  axios.post(`${BASE_URL}/booking/book`, booking, {
    headers: {
      Authorization: `Bearer ${token}`,
      role: "user",
    },
  });

// GET /booking/user/:userId  ← FIXED (was /booking/my which does not exist)
export const getMyBookings = (userId, token) =>
  axios.get(`${BASE_URL}/booking/user/${userId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      role: "user",
    },
  });

// DELETE /booking/:id
export const cancelBooking = (id, token) =>
  axios.delete(`${BASE_URL}/booking/${id}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      role: "user",
    },
  });

// GET /booking/resource/:resourceId?date=YYYY-MM-DD
export const getResourceBookings = (resourceId, date, token) =>
  axios.get(`${BASE_URL}/booking/resource/${resourceId}`, {
    params: { date },
    headers: {
      Authorization: `Bearer ${token}`,
      role: "user",
    },
  });