import axios from "axios";

const BASE_URL = "http://localhost:4000";

export const getResources = () =>
  axios.get(`${BASE_URL}/resources`);

export const addResource = (resource) =>
  axios.post(`${BASE_URL}/resources`, resource);