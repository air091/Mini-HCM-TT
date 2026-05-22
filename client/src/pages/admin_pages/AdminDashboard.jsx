import { CalendarRange, RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function AdminDashboard() {
  const { api, user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [dailyReports, setDailyReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const today = useMemo(() => getTodayInputValue(), []);

  const totals = useMemo(() => {
    return dailyReports.reduce(
      (summary, report) => {
        const metric = report.metric || {};

        summary.workedHrs += Number(metric.workedHrs ?? metric.totalHrs ?? 0);
        summary.overtime += Number(metric.overtime || 0);
        summary.late += Number(metric.late || 0);
        if (Number(metric.late || 0) > 0) summary.lateEmployees += 1;

        return summary;
      },
      { workedHrs: 0, overtime: 0, late: 0, lateEmployees: 0 },
    );
  }, [dailyReports]);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const [employeeResponse, reportResponse] = await Promise.all([
        api.get("/api/admin/employees"),
        api.get("/api/admin/employees/daily-report", {
          params: { date: today },
        }),
      ]);

      setEmployees(employeeResponse.data.employees || []);
      setDailyReports(reportResponse.data.daily_attendance || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load dashboard"));
    } finally {
      setLoading(false);
    }
  }, [api, today]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchDashboard, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchDashboard]);

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-3 border bg-white p-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold">Admin Dashboard</h1>
          <p className="text-sm text-slate-500">
            {user?.name ? `Welcome, ${user.name}` : "Attendance overview"}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-3 md:grid-cols-5">
        <InfoTile
          label="Employees"
          value={loading ? "..." : employees.length}
          icon={<Users size={18} />}
        />
        <InfoTile
          label="Records Today"
          value={loading ? "..." : dailyReports.length}
          icon={<CalendarRange size={18} />}
        />
        <InfoTile label="Worked Today" value={formatHours(totals.workedHrs)} />
        <InfoTile
          label="Late Employees"
          value={loading ? "..." : totals.lateEmployees}
        />
        <InfoTile label="Late Minutes" value={formatMinutes(totals.late)} />
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="border bg-white p-4">
          <h2 className="font-semibold">Employee Management</h2>
          <p className="mt-1 text-sm text-slate-500">
            Review employees, attendance history, and punch corrections.
          </p>
          <Link
            to="/admin/employees"
            className="mt-4 inline-flex border px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Open employees
          </Link>
        </div>

        <div className="border bg-white p-4">
          <h2 className="font-semibold">Reports</h2>
          <p className="mt-1 text-sm text-slate-500">
            Check daily and weekly attendance totals for all employees.
          </p>
          <Link
            to="/admin/reports"
            className="mt-4 inline-flex border px-3 py-2 text-sm font-medium hover:bg-slate-100"
          >
            Open reports
          </Link>
        </div>
      </section>
    </div>
  );
}

function InfoTile({ label, value, icon }) {
  return (
    <div className="border bg-white p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500">{label}</p>
        {icon}
      </div>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatHours(value) {
  return `${Number(value || 0).toFixed(2)} hrs`;
}

function formatMinutes(value) {
  return `${Number(value || 0).toFixed(2)} mins`;
}
