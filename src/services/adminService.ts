import { db } from "../configs/firebase.js";
import { toDateSafe } from "../libs/dateConverter.js";

// admin can view / edit punches
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

  if (timeIn) {
    updates.timeIn = timeIn;
  }
  if (timeOut) {
    updates.timeOut = timeOut;
  }

  if (Object.keys(updates).length === 0) {
    throw new Error("No updates provided");
  }

  await attendanceDoc.ref.update(updates);
  const updatedDoc = await attendanceDoc.ref.get();

  return {
    id: updatedDoc.id,
    ...updatedDoc.data(),
  };
};

// admin can view daily reports of employees with all metrics

// admin can view weekly reports of  employees with all metrics
