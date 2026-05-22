import { Clock, LogIn, LogOut, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function Dashboard() {
  const { api, user } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const sortedAttendances = useMemo(() => {
    return [...attendances].sort((a, b) => {
      return getAttendanceTime(b) - getAttendanceTime(a);
    });
  }, [attendances]);

  const activeAttendance = useMemo(() => {
    return sortedAttendances.find((attendance) => !attendance.isComplete);
  }, [sortedAttendances]);

  const latestAttendance = sortedAttendances[0] || null;
  const latestMetric = latestAttendance?.metric;

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/attendance");
      setAttendances(response.data.attendances || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load attendance"));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchAttendances, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchAttendances]);

  const handlePunch = async (type) => {
    try {
      setActionLoading(type);
      setError("");
      setMessage("");

      const endpoint =
        type === "in" ? "/api/attendance/punch-in" : "/api/attendance/punch-out";

      const response = await api.post(endpoint);
      setMessage(response.data.message || "Attendance updated");
      await fetchAttendances();
    } catch (err) {
      setError(getErrorMessage(err, "Punch action failed"));
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-3 border bg-white p-4 md:flex-row md:items-center">
        <div>
          <h1 className="text-xl font-semibold">Employee Dashboard</h1>
          <p className="text-sm text-slate-500">
            {user?.name ? `Welcome, ${user.name}` : "Track your workday"}
          </p>
        </div>

        <button
          type="button"
          onClick={fetchAttendances}
          disabled={loading || Boolean(actionLoading)}
          className="inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </section>

      {(error || message) && (
        <p
          className={[
            "border px-3 py-2 text-sm",
            error
              ? "border-red-300 bg-red-50 text-red-700"
              : "border-emerald-300 bg-emerald-50 text-emerald-700",
          ].join(" ")}
        >
          {error || message}
        </p>
      )}

      <section className="grid gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="border bg-white p-4">
          <div className="mb-4 flex items-center gap-2">
            <Clock size={18} />
            <h2 className="font-semibold">Punch Status</h2>
          </div>

          {loading ? (
            <p className="text-sm text-slate-500">Loading attendance...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-slate-500">Current status</p>
                <p className="text-2xl font-semibold">
                  {activeAttendance ? "Punched in" : "Punched out"}
                </p>
              </div>

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  type="button"
                  onClick={() => handlePunch("in")}
                  disabled={Boolean(activeAttendance) || Boolean(actionLoading)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 bg-primary px-4 py-3 text-sm font-medium text-white hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogIn size={18} />
                  {actionLoading === "in" ? "Punching in..." : "Punch In"}
                </button>

                <button
                  type="button"
                  onClick={() => handlePunch("out")}
                  disabled={!activeAttendance || Boolean(actionLoading)}
                  className="inline-flex cursor-pointer items-center justify-center gap-2 border px-4 py-3 text-sm font-medium hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <LogOut size={18} />
                  {actionLoading === "out" ? "Punching out..." : "Punch Out"}
                </button>
              </div>

              {activeAttendance && (
                <div className="border bg-slate-50 p-3 text-sm">
                  <p className="text-slate-500">Active punch started</p>
                  <p className="font-medium">
                    {activeAttendance.timeIn || "Not available"}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border bg-white p-4">
          <h2 className="mb-4 font-semibold">Latest Attendance</h2>

          {loading ? (
            <p className="text-sm text-slate-500">Loading latest record...</p>
          ) : !latestAttendance ? (
            <p className="text-sm text-slate-500">
              No attendance records yet. Punch in to start tracking.
            </p>
          ) : (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile
                  label="Date"
                  value={formatDateOnly(latestAttendance.date)}
                />
                <InfoTile label="Time In" value={latestAttendance.timeIn} />
                <InfoTile label="Time Out" value={latestAttendance.timeOut} />
              </div>

              <div className="grid gap-3 sm:grid-cols-3">
                <InfoTile
                  label="Regular Hours"
                  value={formatMetric(latestMetric?.regularHrs)}
                />
                <InfoTile
                  label="Worked Hours"
                  value={formatMetric(
                    latestMetric?.workedHrs ?? latestMetric?.totalHrs,
                  )}
                />
                <InfoTile
                  label="Overtime"
                  value={formatMinutes(latestMetric?.overtime)}
                />
                <InfoTile
                  label="Night Diff"
                  value={formatMinutes(latestMetric?.nightDifferential)}
                />
                <InfoTile label="Late" value={formatMinutes(latestMetric?.late)} />
                <InfoTile
                  label="Undertime"
                  value={formatMinutes(latestMetric?.early)}
                />
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="border bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value || "-"}</p>
    </div>
  );
}

function getAttendanceTime(attendance) {
  const rawDate = attendance.date || attendance.timeIn;
  const date = rawDate ? new Date(rawDate) : null;

  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatDateOnly(value) {
  if (!value) return "-";

  return String(value).split(" ").at(0) || "-";
}

function formatMetric(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} hrs`;
}

function formatMinutes(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} mins`;
}
