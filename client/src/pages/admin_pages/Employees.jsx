import { RefreshCw, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function Employees() {
  const { api } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const sortedEmployees = useMemo(() => {
    return [...employees].sort((a, b) => {
      return (a.name || "").localeCompare(b.name || "");
    });
  }, [employees]);

  const fetchEmployees = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get("/api/admin/employees");
      setEmployees(response.data.employees || []);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load employees"));
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchEmployees, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchEmployees]);

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-3 border bg-white p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <Users size={20} />
          <div>
            <h1 className="text-xl font-semibold">Employees</h1>
            <p className="text-sm text-slate-500">
              View registered employee profiles and schedules.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchEmployees}
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
          <p className="p-4 text-sm text-slate-500">Loading employees...</p>
        ) : sortedEmployees.length === 0 ? (
          <p className="p-4 text-sm text-slate-500">
            No employees have registered yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left text-sm">
              <thead className="bg-slate-100 text-xs uppercase text-slate-600">
                <tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Timezone</Th>
                  <Th>Schedule</Th>
                  <Th>Action</Th>
                </tr>
              </thead>

              <tbody>
                {sortedEmployees.map((employee) => (
                  <tr key={employee.id} className="border-t">
                    <Td>
                      <span className="font-medium">
                        {employee.name || "Unnamed employee"}
                      </span>
                    </Td>
                    <Td>{employee.email || "-"}</Td>
                    <Td>{employee.timeZone || "-"}</Td>
                    <Td>{formatSchedule(employee.schedule)}</Td>
                    <Td>
                      <Link
                        to={`/admin/employees/${employee.id}`}
                        className="inline-flex border px-3 py-2 text-xs font-medium hover:bg-slate-100"
                      >
                        View detail
                      </Link>
                    </Td>
                  </tr>
                ))}
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function formatSchedule(schedule) {
  if (!schedule?.start || !schedule?.end) return "-";
  return `${formatTime(schedule.start)} - ${formatTime(schedule.end)}`;
}

function formatTime(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "-";

  const businessDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  let hours = businessDate.getUTCHours();
  const minutes = String(businessDate.getUTCMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours %= 12;
  hours = hours || 12;

  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}
