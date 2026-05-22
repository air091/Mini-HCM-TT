import { LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function AdminSidebar() {
  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-2 px-3 py-2 text-sm",
      isActive
        ? "bg-slate-900 text-white"
        : "text-slate-700 hover:bg-slate-100",
    ].join(" ");

  return (
    <nav className="space-y-1">
      <NavLink to="/admin/dashboard" className={linkClass}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </NavLink>
    </nav>
  );
}
