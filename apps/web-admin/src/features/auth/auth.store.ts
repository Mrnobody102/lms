import { createAuthStore } from "@repo/shared";
import api from "../../lib/api";

export const useAuthStore = createAuthStore({
  api,
  persistUser: true,
  messages: {
    loginError: "Login failed. Please check your credentials.",
  },
});
