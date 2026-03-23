import axios from "axios";

const api = axios.create({
  baseURL: "https://attendance-system-prexo-fk.onrender.com/api"
});

export default api;
