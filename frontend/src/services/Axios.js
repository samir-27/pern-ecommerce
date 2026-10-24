import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  config.headers = config.headers || {};

  if (config.data instanceof FormData) {
    delete config.headers['Content-Type'];
    delete config.headers['content-type'];
  }

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only clear token and redirect when a verified token expiry occurs
    if (error.response?.status === 401) {
      const errMsg = String(error.response?.data?.error || error.response?.data?.message || '').toLowerCase();
      const pathname = window.location.pathname;
      const isAuthPage = pathname === "/login" || pathname === "/register" || pathname === "/admin/login";

      // Purge only when the authentication token has genuinely expired or user was deleted
      if (errMsg.includes('session expired') || errMsg.includes('jwt expired') || errMsg.includes('no longer exists')) {
        localStorage.removeItem("token");
        localStorage.removeItem("userRole");

        if (!isAuthPage) {
          window.location.href = pathname.startsWith("/admin") ? "/admin/login" : "/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

export default api;