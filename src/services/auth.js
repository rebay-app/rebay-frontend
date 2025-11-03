import api from "./api";

export const authService = {
  async register(userData) {
    const response = await api.post(`/api/auth/register`, userData);
    const { access_token, refresh_token, user } = response.data;

    console.log("authService:", response.data);

    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  },

  async login(userData) {
    const response = await api.post(`/api/auth/login`, userData);
    const { access_token, refresh_token, user } = response.data;

    console.log("authService:", response.data);

    localStorage.setItem("accessToken", access_token);
    localStorage.setItem("refreshToken", refresh_token);
    localStorage.setItem("user", JSON.stringify(user));

    return response.data;
  },

  logout: () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
  },

  getCurrentUser() {
    const userStr = localStorage.getItem("user");
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated() {
    return !!localStorage.getItem("accessToken");
  },
};
