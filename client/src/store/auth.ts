
import { create } from "zustand";

type User = { id: string; email: string; name: string };
type State = {
  token: string | null;
  user: User | null;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
};

export const useAuthStore = create<State>((set) => ({
  token: localStorage.getItem("token"),
  user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")!) : null,
  setAuth: (token, user) => {
    localStorage.setItem("token", token);
    localStorage.setItem("user", JSON.stringify(user));
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    set({ token: null, user: null });
    window.location.href = "/login";
  }
}));
