import { CalendarRange, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Reports() {
  const { api } = useAuth();
  const [mode, setMode] = useState("daily");
  const [date, setDate] = useState(getTodayInputValue());
  const [reports, setReports] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const employeeById = useMemo(() => {
    return employees.reduce((map, employee) => {
      map[employee.id] = employee;
      return map;
    }, {});
  }, [employees]);

  const summary = useMemo(() => {
    return reports.reduce(
      (totals, report) => {
        const metric = report.metric || {};

        totals.records += 1;
        totals.regularHrs += Number(metric.regularHrs || 0);
        totals.workedHrs += Number(metric.workedHrs ?? metric.totalHrs ?? 0);
        totals.overtime += Number(metric.overtime || 0);
        totals.nightDifferential += Number(metric.nightDifferential || 0);
        totals.late += Number(metric.late || 0);
        totals.early += Number(metric.early || 0);

        return totals;
      },
      {
        records: 0,
        regularHrs: 0,
        workedHrs: 0,
        overtime: 0,
        nightDifferential: 0,
        late: 0,
        early: 0,
      },
    );
  }, [reports]);

  const sortedReports = useMemo(() => {
    return [...reports].sort((a, b) => {
      const employeeA = employeeById[a.userId];
      const employeeB = employeeById[b.userId];

      return (employeeA?.name || a.userId || "").localeCompare(
        employeeB?.name || b.userId || "",
      );
    });
  }, [employeeById, reports]);

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const reportEndpoint =
        mode === "daily" ? "daily-report" : "weekly-report";

      const [reportResponse, employeeResponse] = await Promise.all([
        api.get(`/api/admin/employees/${reportEndpoint}`, {
          params: { date },
        }),
        api.get("/api/admin/employees"),
      ]);

      const reportKey =
        mode === "daily" ? "daily_attendance" : "weekly_attendance";

      setReports(reportResponse.data[reportKey] || []);
      setEmployees(employeeResponse.data.employees || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load reports"));
    } finally {
      setLoading(false);
    }
  }, [api, date, mode]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchReports, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchReports]);

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-3 border bg-white p-4 xl:flex-row xl:items-center">
        <div className="flex items-center gap-2">
          <CalendarRange size={20} />
          <div>
            <h1 className="text-xl font-semibold">Admin Reports</h1>
            <p className="text-sm text-slate-500">
              View daily and weekly employee attendance metrics.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <div className="inline-flex border bg-white">
            <button
              type="button"
              onClick={() => setMode("daily")}
              className={getModeButtonClass(mode === "daily")}
            >
              Daily
            </button>
            <button
              type="button"
              onClick={() => setMode("weekly")}
              className={getModeButtonClass(mode === "weekly")}
            >
              Weekly
            </button>
          </div>

          <input
            type="date"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            className="border px-3 py-2 text-sm"
          />

          <button
            type="button"
            onClick={fetchReports}
            disabled={loading || !date}
            className="inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      </section>

      {error && (
        <p className="border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      <section className="grid gap-3 md:grid-cols-4 xl:grid-cols-7">
        <InfoTile label="Records" value={summary.records} />
        <InfoTile label="Regular" value={formatHours(summary.regularHrs)} />
        <InfoTile label="Worked" value={formatHours(summary.workedHrs)} />
        <InfoTile label="OT" value={formatMinutes(summary.overtime)} />
        <InfoTile
          label="Night Diff"
          value={formatMinutes(summary.nightDifferential)}
        />
        <InfoTile label="Late" value={formatMinutes(summary.late)} />
        <InfoTile label="Undertime" value={formatMinutes(summary.early)} />
      </section>

      <section className="border bg-white">
        {loading ? (
          <p className="p-4 text-sm text-slate-500">Loading reports...</p>
        ) : sortedReports.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No report records found for this date.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1120px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <Th>Employee</Th>
                  <Th>Date</Th>
                  <Th>Time In</Th>
                  <Th>Time Out</Th>
                  <Th>Status</Th>
                  <Th>Regular</Th>
                  <Th>Worked</Th>
                  <Th>OT</Th>
                  <Th>ND</Th>
                  <Th>Late</Th>
                  <Th>Undertime</Th>
                </tr>
              </thead>

              <tbody>
                {sortedReports.map((report) => {
                  const employee = employeeById[report.userId];
                  const metric = report.metric || {};

                  return (
                    <tr key={report.id} className="border-t">
                      <Td>
                        <div>
                          <Link
                            to={`/admin/employees/${report.userId}`}
                            className="font-medium underline"
                          >
                            {employee?.name || report.userId}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {employee?.email || report.userId}
                          </p>
                        </div>
                      </Td>
                      <Td>{formatDateOnly(report.date)}</Td>
                      <Td>{formatDateTime(report.timeIn)}</Td>
                      <Td>{formatDateTime(report.timeOut)}</Td>
                      <Td>
                        <StatusBadge complete={report.isComplete} />
                      </Td>
                      <Td>{formatHours(metric.regularHrs)}</Td>
                      <Td>{formatHours(metric.workedHrs ?? metric.totalHrs)}</Td>
                      <Td>{formatMinutes(metric.overtime)}</Td>
                      <Td>{formatMinutes(metric.nightDifferential)}</Td>
                      <Td>{formatMinutes(metric.late)}</Td>
                      <Td>{formatMinutes(metric.early)}</Td>
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

function InfoTile({ label, value }) {
  return (
    <div className="border bg-white p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 text-sm font-semibold">{value}</p>
    </div>
  );
}

function StatusBadge({ complete }) {
  return (
    <span
      className={[
        "inline-flex px-2 py-1 text-xs font-medium",
        complete ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700",
      ].join(" ")}
    >
      {complete ? "Complete" : "Active"}
    </span>
  );
}

function Th({ children }) {
  return <th className="whitespace-nowrap px-3 py-3 font-semibold">{children}</th>;
}

function Td({ children }) {
  return <td className="whitespace-nowrap px-3 py-3">{children || "-"}</td>;
}

function getModeButtonClass(active) {
  return [
    "cursor-pointer px-3 py-2 text-sm",
    active ? "bg-slate-900 text-white" : "hover:bg-slate-100",
  ].join(" ");
}

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function getTodayInputValue() {
  const now = new Date();
  const localDate = new Date(now.getTime() - now.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return "-";

  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateOnly(value) {
  const date = parseDate(value);
  if (!date) return "-";

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${month}/${day}/${year}`;
}

function parseDate(value) {
  if (!value || value === false) return null;

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatHours(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} hrs`;
}

function formatMinutes(value) {
  if (value === null || value === undefined) return "-";
  return `${Number(value).toFixed(2)} mins`;
}
