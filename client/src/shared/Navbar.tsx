import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { LogOut } from "lucide-react";
import { FaRocket, FaTrello } from "react-icons/fa";

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const nav = useNavigate();

  const handleLogout = () => {
    logout();
    nav("/login");
  };

  const initials =
    user?.name
      ?.split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "U";

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => nav("/")}
          className="group flex items-center gap-2 cursor-pointer"
        >
          <div className="grid place-items-center h-9 w-9 rounded-xl bg-gradient-to-br from-brand-400/80 to-cyan-400/80 text-slate-900 shadow-[0_0_18px_rgba(34,211,238,0.35)] group-hover:scale-[1.03] transition">
            <FaRocket />
          </div>
          <div className="text-left leading-tight">
            <div className="text-xl font-black tracking-tight">
              Dev<span className="text-brand-400">Sync</span>
            </div>
            <div className="text-[10.5px] text-slate-400 -mt-0.5">
              Collab. Plan. Ship.
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {token && (
            <button
              onClick={() => nav("/")}
              className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm bg-slate-800/70 hover:bg-slate-800 border border-white/10 transition"
              title="Go to Dashboard"
            >
              <FaTrello className="opacity-90" />
              Dashboard
            </button>
          )}

          {token && (
            <span className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-slate-800/70 border border-white/10 text-slate-100 text-sm">
              <span className="grid place-items-center h-6 w-6 rounded-full bg-gradient-to-br from-sky-400/70 to-cyan-400/70 text-slate-900 font-bold">
                {initials}
              </span>
              <span className="font-medium">{user?.name}</span>
            </span>
          )}

          {token && (
            <button
              className="btn-outline inline-flex items-center"
              onClick={handleLogout}
              title="Log out"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          )}

          {!token && (
            <button
              onClick={() => nav("/login")}
              className="btn-primary"
              title="Sign in"
            >
              Sign in
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
