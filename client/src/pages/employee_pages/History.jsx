import { RefreshCw, TableProperties } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useAuth } from "../../hooks/useAuth";

export default function History() {
  const { api } = useAuth();
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortedAttendances = useMemo(() => {
    return [...attendances].sort((a, b) => {
      return getAttendanceTime(b) - getAttendanceTime(a);
    });
  }, [attendances]);

  const fetchAttendances = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/attendance");
      setAttendances(response.data.attendances || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load attendance history"));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchAttendances, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchAttendances]);

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-3 border bg-white p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <TableProperties size={20} />
          <div>
            <h1 className="text-xl font-semibold">Attendance History</h1>
            <p className="text-sm text-slate-500">
              Review punch records and computed daily metrics.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchAttendances}
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

      <section className="border bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading history...</p>
        ) : sortedAttendances.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No attendance records yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <Th>Date</Th>
                  <Th>Time In</Th>
                  <Th>Time Out</Th>
                  <Th>Status</Th>
                  <Th>Regular</Th>
                  <Th>OT</Th>
                  <Th>ND</Th>
                  <Th>Late</Th>
                  <Th>Undertime</Th>
                </tr>
              </thead>

              <tbody>
                {sortedAttendances.map((attendance) => {
                  const metric = attendance.metric;

                  return (
                    <tr key={attendance.id} className="border-t">
                      <Td>{formatDateOnly(attendance.date)}</Td>
                      <Td>{attendance.timeIn || "-"}</Td>
                      <Td>{attendance.timeOut || "-"}</Td>
                      <Td>
                        <span
                          className={[
                            "inline-flex px-2 py-1 text-xs font-medium",
                            attendance.isComplete
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-amber-100 text-amber-700",
                          ].join(" ")}
                        >
                          {attendance.isComplete ? "Complete" : "Active"}
                        </span>
                      </Td>
                      <Td>{formatHours(metric?.regularHrs)}</Td>
                      <Td>{formatMinutes(metric?.overtime)}</Td>
                      <Td>{formatMinutes(metric?.nightDifferential)}</Td>
                      <Td>{formatMinutes(metric?.late)}</Td>
                      <Td>{formatMinutes(metric?.early)}</Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

function Th({ children }) {
  return <th className="whitespace-nowrap px-3 py-3 font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="whitespace-nowrap px-3 py-3">{children}</td>;
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

function formatHours(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} hrs`;
}

function formatMinutes(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} mins`;
}
