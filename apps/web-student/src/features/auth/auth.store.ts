import { createAuthStore } from "@repo/shared";
import api from "../../lib/api";

export const useAuthStore = createAuthStore({
  api,
  persistUser: true,
  messages: {
    loginError: "Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.",
    registerError: "Đăng ký thất bại. Email có thể đã được sử dụng.",
  },
});
