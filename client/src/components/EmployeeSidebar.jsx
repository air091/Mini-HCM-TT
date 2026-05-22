import { History, LayoutDashboard } from "lucide-react";
import { NavLink } from "react-router-dom";

export default function EmployeeSidebar() {
  const linkClass = ({ isActive }) =>
    [
      "flex items-center gap-2 px-3 py-2 text-sm",
      isActive
        ? "bg-primary text-white"
        : "text-slate-700 hover:bg-slate-100",
    ].join(" ");

  return (
    <nav className="space-y-1">
      <NavLink to="/dashboard" className={linkClass}>
        <LayoutDashboard size={18} />
        <span>Dashboard</span>
      </NavLink>

      <NavLink to="/history" className={linkClass}>
        <History size={18} />
        <span>History</span>
      </NavLink>
    </nav>
  );
}
