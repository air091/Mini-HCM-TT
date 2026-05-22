import { ArrowLeft, Pencil, RefreshCw, Save, UserRound, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";

export default function EmployeeDetail() {
  const { userId } = useParams();
  const { api } = useAuth();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState("");
  const [editForm, setEditForm] = useState({ timeIn: "", timeOut: "" });
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const attendances = useMemo(() => {
    return [...(employee?.attendances || [])].sort((a, b) => {
      return getAttendanceTime(b) - getAttendanceTime(a);
    });
  }, [employee]);

  const fetchEmployee = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await api.get(`/api/admin/employees/${userId}`);
      setEmployee(response.data.employee);
    } catch (err) {
      setError(getErrorMessage(err, "Failed to load employee"));
    } finally {
      setLoading(false);
    }
  }, [api, userId]);

  useEffect(() => {
    const timeoutId = window.setTimeout(fetchEmployee, 0);
    return () => window.clearTimeout(timeoutId);
  }, [fetchEmployee]);

  const startEditing = (attendance) => {
    setMessage("");
    setError("");
    setEditingId(attendance.id);
    setEditForm({
      timeIn: toDateTimeLocalValue(attendance.timeIn),
      timeOut: toDateTimeLocalValue(attendance.timeOut),
    });
  };

  const cancelEditing = () => {
    setEditingId("");
    setEditForm({ timeIn: "", timeOut: "" });
  };

  const savePunches = async (attendanceId) => {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      const payload = {};
      if (editForm.timeIn) payload.timeIn = editForm.timeIn;
      if (editForm.timeOut) payload.timeOut = editForm.timeOut;

      await api.patch(
        `/api/admin/employees/${userId}/attendance/${attendanceId}/punches`,
        payload,
      );

      setMessage("Punches updated successfully");
      cancelEditing();
      await fetchEmployee();
    } catch (err) {
      setError(getErrorMessage(err, "Failed to update punches"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <section className="flex flex-col justify-between gap-3 border bg-white p-4 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <UserRound size={20} />
          <div>
            <h1 className="text-xl font-semibold">Employee Detail</h1>
            <p className="text-sm text-slate-500">
              Review profile, attendance records, and punch edits.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Link
            to="/admin/employees"
            className="inline-flex items-center gap-2 border px-3 py-2 text-sm hover:bg-slate-100"
          >
            <ArrowLeft size={16} />
            Employees
          </Link>

          <button
            type="button"
            onClick={fetchEmployee}
            disabled={loading || saving}
            className="inline-flex cursor-pointer items-center gap-2 border px-3 py-2 text-sm hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
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

      {loading ? (
        <section className="border bg-white p-4 text-sm text-slate-500">
          Loading employee...
        </section>
      ) : !employee ? (
        <section className="border bg-white p-4 text-sm text-slate-500">
          Employee not found.
        </section>
      ) : (
        <>
          <section className="grid gap-3 border bg-white p-4 md:grid-cols-4">
            <InfoTile label="Name" value={employee.name} />
            <InfoTile label="Email" value={employee.email} />
            <InfoTile label="Timezone" value={employee.timeZone} />
            <InfoTile label="Schedule" value={formatSchedule(employee.schedule)} />
          </section>

          <section className="border bg-white">
            <div className="border-b p-4">
              <h2 className="font-semibold">Attendance Records</h2>
              <p className="text-sm text-slate-500">
                Edit time in/out to recalculate the daily metrics.
              </p>
            </div>

            {attendances.length === 0 ? (
              <p className="p-4 text-sm text-slate-500">
                This employee has no attendance records yet.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] border-collapse text-left text-sm">
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
                      <Th>Action</Th>
                    </tr>
                  </thead>

                  <tbody>
                    {attendances.map((attendance) => {
                      const metric = attendance.metric;
                      const isEditing = editingId === attendance.id;

                      return (
                        <tr key={attendance.id} className="border-t align-top">
                          <Td>{formatDateOnly(attendance.date)}</Td>
                          <Td>
                            {isEditing ? (
                              <DateTimeInput
                                value={editForm.timeIn}
                                onChange={(value) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    timeIn: value,
                                  }))
                                }
                              />
                            ) : (
                              formatDateTime(attendance.timeIn)
                            )}
                          </Td>
                          <Td>
                            {isEditing ? (
                              <DateTimeInput
                                value={editForm.timeOut}
                                onChange={(value) =>
                                  setEditForm((prev) => ({
                                    ...prev,
                                    timeOut: value,
                                  }))
                                }
                              />
                            ) : (
                              formatDateTime(attendance.timeOut)
                            )}
                          </Td>
                          <Td>
                            <StatusBadge complete={attendance.isComplete} />
                          </Td>
                          <Td>{formatHours(metric?.regularHrs)}</Td>
                          <Td>{formatMinutes(metric?.overtime)}</Td>
                          <Td>{formatMinutes(metric?.nightDifferential)}</Td>
                          <Td>{formatMinutes(metric?.late)}</Td>
                          <Td>{formatMinutes(metric?.early)}</Td>
                          <Td>
                            {isEditing ? (
                              <div className="flex gap-2">
                                <button
                                  type="button"
                                  onClick={() => savePunches(attendance.id)}
                                  disabled={saving || !editForm.timeIn}
                                  className="inline-flex cursor-pointer items-center gap-1 border px-2 py-1 text-xs hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <Save size={14} />
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  disabled={saving}
                                  className="inline-flex cursor-pointer items-center gap-1 border px-2 py-1 text-xs hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                  <X size={14} />
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => startEditing(attendance)}
                                className="inline-flex cursor-pointer items-center gap-1 border px-2 py-1 text-xs hover:bg-slate-100"
                              >
                                <Pencil size={14} />
                                Edit
                              </button>
                            )}
                          </Td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
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

function DateTimeInput({ value, onChange }) {
  return (
    <input
      type="datetime-local"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="w-[190px] border px-2 py-1 text-xs"
    />
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

function getErrorMessage(error, fallback) {
  return error?.response?.data?.message || fallback;
}

function getAttendanceTime(attendance) {
  const rawDate = attendance.date || attendance.timeIn;
  const date = rawDate ? new Date(rawDate) : null;

  return date && !Number.isNaN(date.getTime()) ? date.getTime() : 0;
}

function formatSchedule(schedule) {
  if (!schedule?.start || !schedule?.end) return "-";
  return `${formatTime(schedule.start)} - ${formatTime(schedule.end)}`;
}

function formatDateTime(value) {
  const date = parseDate(value);
  if (!date) return "-";

  return `${formatNumericDate(date)} ${formatClockTime(date)}`;
}

function formatDateOnly(value) {
  const date = parseDate(value);
  if (!date) return "-";

  return formatNumericDate(date);
}

function formatTime(value) {
  const date = parseDate(value);
  if (!date) return "-";

  return formatClockTime(date);
}

function formatNumericDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).slice(-2);

  return `${month}/${day}/${year}`;
}

function formatClockTime(date) {
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const period = hours >= 12 ? "PM" : "AM";

  hours %= 12;
  hours = hours || 12;

  return `${String(hours).padStart(2, "0")}:${minutes} ${period}`;
}

function toDateTimeLocalValue(value) {
  const date = parseDate(value);
  if (!date) return "";

  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
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
