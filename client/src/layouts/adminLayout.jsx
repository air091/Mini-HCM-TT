import { LogOut } from "lucide-react";
import { Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar";
import { useAuth } from "../hooks/useAuth";

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r bg-white p-4 md:block">
        <div className="mb-6">
          <p className="text-sm font-semibold">Mini HCM</p>
          <p className="text-xs text-slate-500">Admin</p>
        </div>

        <AdminSidebar />
      </aside>

      <div className="min-h-screen md:pl-64">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white px-4 py-3">
          <div>
            <p className="text-sm font-semibold">{user?.name || "Admin"}</p>
            <p className="text-xs text-slate-500">{user?.email}</p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-slate-100"
          >
            <LogOut size={16} />
            Logout
          </button>
        </header>

        <div className="border-b bg-white p-2 md:hidden">
          <AdminSidebar />
        </div>

        <main className="p-4">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
