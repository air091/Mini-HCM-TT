import { db } from "../configs/firebase.js";
import { formatTimestamp, toDateSafe } from "../libs/dateConverter.js";
import { metrics, recalculateMetrics } from "./calculationService.js";
import { Timestamp } from "firebase-admin/firestore";
// admin can view / edit punches
// get employees
export const getAllEmployees = async () => {
  const usersSnapshots = await db
    .collection("users")
    .where("role", "==", "employee")
    .get();

  if (usersSnapshots.empty) throw new Error("No employees yet");

  const users = usersSnapshots.docs.map((doc) => {
    const userData = doc.data();
    const { password, ...userDataSafe } = userData;
    return {
      id: doc.id,
      ...userDataSafe,
      schedule: {
        start: toDateSafe(userDataSafe.schedule.start),
        end: toDateSafe(userDataSafe.schedule.end),
      },
    };
  });

  return users;
};

// get employee
export const getEmployee = async (userId: string) => {
  const userDoc = await db.collection("users").doc(userId).get();
  if (!userDoc.exists) throw new Error("Employee not found");

  const attendanceSnapshots = await db
    .collection("attendance")
    .where("userId", "==", userDoc.id)
    .get();

  if (attendanceSnapshots.empty) throw new Error("No attendance yet");

  const attendances = await Promise.all(
    attendanceSnapshots.docs.map(async (doc) => {
      const attendanceData = doc.data();

      const summarySnapshots = await db
        .collection("dailySummary")
        .where("attendanceId", "==", doc.id)
        .get();
      const summary = summarySnapshots.docs[0]?.data();

      return {
        id: doc.id,
        userId: attendanceData.userId,
        timeIn: toDateSafe(attendanceData.timeIn),
        timeOut: toDateSafe(attendanceData.timeOut),
        isComplete: attendanceData.isComplete,
        date: toDateSafe(attendanceData.date),

        metric: summary
          ? {
              id: summarySnapshots.docs[0]?.id,
              regularHrs: summary.regularHrs ?? 0,
              totalHrs: summary.totalHrs ?? 0,
              overtime: summary.overtimeMins ?? 0,
              nightDifferential: summary.nightDifferentialMins ?? 0,
              late: summary.lateMins ?? 0,
              early: summary.earlyMins ?? 0,
            }
          : null,
      };
    }),
  );

  return attendances;
};

// update employee punches
export const updateEmployeePunches = async (
  userId: string,
  attendanceId: string,
  timeIn?: Date,
  timeOut?: Date,
) => {
  const attendanceDoc = await db
    .collection("attendance")
    .doc(attendanceId)
    .get();

  if (!attendanceDoc.exists) {
    throw new Error("Attendance not found");
  }

  const updates: Record<string, any> = {};

  if (timeIn) updates.timeIn = Timestamp.fromDate(timeIn);
  if (timeOut) updates.timeOut = Timestamp.fromDate(timeOut);

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  await attendanceDoc.ref.update(updates);
  const updatedDoc = await attendanceDoc.ref.get();

  // Recalculate metrics after punch update
  await recalculateMetrics(userId, attendanceId);
  const data = updatedDoc.data();
  return {
    id: updatedDoc.id,
    ...data,
    timeIn: formatTimestamp(data?.timeIn),
    timeOut: formatTimestamp(data?.timeOut),
  };
};

// admin can view daily reports of employees with all metrics
export const getDailyEmployeeReports = async (dateQuery: string) => {
  if (!dateQuery) throw new Error("Date query is required");

  const [year, month, day] = dateQuery.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const timezoneOffsetHours = 8;
  const start = new Date(
    Date.UTC(year, month - 1, day) - timezoneOffsetHours * 60 * 60 * 1000,
  );
  const end = new Date(
    Date.UTC(year, month - 1, day + 1) - timezoneOffsetHours * 60 * 60 * 1000,
  );

  const attendanceSnapshot = await db
    .collection("attendance")
    .where("date", ">=", start)
    .where("date", "<", end)
    .get();

  if (attendanceSnapshot.empty) throw new Error("No reports");

  return await Promise.all(
    attendanceSnapshot.docs.map(async (doc) => {
      const attendanceData = doc.data();

      const summarySnapshot = await db
        .collection("dailySummary")
        .where("attendanceId", "==", doc.id)
        .limit(1)
        .get();

      const summary = summarySnapshot.docs[0]?.data();

      return {
        id: doc.id,
        userId: attendanceData.userId,
        timeIn: toDateSafe(attendanceData.timeIn),
        timeOut: toDateSafe(attendanceData.timeOut),
        isComplete: attendanceData.isComplete,
        date: toDateSafe(attendanceData.date),
        metric: summary
          ? {
              id: summarySnapshot.docs[0]?.id,
              regularHrs: summary.regularHrs ?? 0,
              totalHrs: summary.totalHrs ?? 0,
              overtime: summary.overtimeMins ?? 0,
              nightDifferential: summary.nightDifferentialMins ?? 0,
              late: summary.lateMins ?? 0,
              early: summary.earlyMins ?? 0,
            }
          : null,
      };
    }),
  );
};

// admin can view weekly reports of  employees with all metrics
export const getWeeklyEmployeeReports = async (dateQuery: string) => {
  if (!dateQuery) throw new Error("Date query is required");

  const [year, month, day] = dateQuery.split("-").map(Number);

  if (!year || !month || !day) {
    throw new Error("Invalid date format. Use YYYY-MM-DD");
  }

  const timezoneOffsetHours = 8;
  const selectedDate = new Date(
    Date.UTC(year, month - 1, day) - timezoneOffsetHours * 60 * 60 * 1000,
  );
  const selectedDateInTimezone = new Date(
    selectedDate.getTime() + timezoneOffsetHours * 60 * 60 * 1000,
  );
  const daysFromMonday = (selectedDateInTimezone.getUTCDay() + 6) % 7;

  const weekStartYear = selectedDateInTimezone.getUTCFullYear();
  const weekStartMonth = selectedDateInTimezone.getUTCMonth();
  const weekStartDay = selectedDateInTimezone.getUTCDate() - daysFromMonday;

  const start = new Date(
    Date.UTC(weekStartYear, weekStartMonth, weekStartDay) -
      timezoneOffsetHours * 60 * 60 * 1000,
  );
  const end = new Date(
    Date.UTC(weekStartYear, weekStartMonth, weekStartDay + 7) -
      timezoneOffsetHours * 60 * 60 * 1000,
  );

  const attendanceSnapshot = await db
    .collection("attendance")
    .where("date", ">=", start)
    .where("date", "<", end)
    .get();

  if (attendanceSnapshot.empty) throw new Error("No reports");

  return await Promise.all(
    attendanceSnapshot.docs.map(async (doc) => {
      const attendanceData = doc.data();

      const summarySnapshot = await db
        .collection("dailySummary")
        .where("attendanceId", "==", doc.id)
        .limit(1)
        .get();

      const summary = summarySnapshot.docs[0]?.data();

      return {
        id: doc.id,
        userId: attendanceData.userId,
        timeIn: toDateSafe(attendanceData.timeIn),
        timeOut: toDateSafe(attendanceData.timeOut),
        isComplete: attendanceData.isComplete,
        date: toDateSafe(attendanceData.date),
        metric: summary
          ? {
              id: summarySnapshot.docs[0]?.id,
              regularHrs: summary.regularHrs ?? 0,
              totalHrs: summary.totalHrs ?? 0,
              overtime: summary.overtimeMins ?? 0,
              nightDifferential: summary.nightDifferentialMins ?? 0,
              late: summary.lateMins ?? 0,
              early: summary.earlyMins ?? 0,
            }
          : null,
      };
    }),
  );
};
