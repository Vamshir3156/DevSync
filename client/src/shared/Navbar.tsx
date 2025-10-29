
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/auth";
import { LogOut } from "lucide-react";

export default function Navbar() {
  const { user, token, logout } = useAuthStore();
  const nav = useNavigate();

  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-900/70 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <div onClick={() => nav("/")} className="cursor-pointer">
          <div className="text-xl font-black tracking-tight">Dev<span className="text-brand-400">Sync</span></div>
          <div className="text-xs text-slate-400 -mt-1">Collab. Plan. Ship.</div>
        </div>
        <div className="flex items-center gap-3">
          {token && <span className="badge">{user?.name}</span>}
          {token && (
            <button className="btn-outline" onClick={logout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
