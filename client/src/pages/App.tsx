
import { Outlet, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import Navbar from "../shared/Navbar";
import { useAuthStore } from "../store/auth";

export default function App() {
  const navigate = useNavigate();
  const token = useAuthStore(s => s.token);

  useEffect(() => {
    if (!token) navigate("/login");
  }, [token]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="max-w-7xl mx-auto p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
