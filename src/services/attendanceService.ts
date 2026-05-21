import { db } from "../configs/firebase.js";
import { toDateSafe } from "../libs/dateConverter.js";
import { metrics } from "./calculationService.js";

export const getAttendanceById = async (attendanceId: string) => {
  const attendanceSnapshot = await db
    .collection("attendance")
    .doc(attendanceId)
    .get();

  if (!attendanceSnapshot.exists) throw new Error("No attendance found");

  const d = attendanceSnapshot.data();

  const dailySummarySnapshots = await db
    .collection("dailySummary")
    .where("attendanceId", "==", attendanceId)
    .limit(1)
    .get();

  const summary = dailySummarySnapshots.docs[0]?.data();
  const summaryId = dailySummarySnapshots.docs[0]?.id;

  return {
    id: attendanceSnapshot.id,
    userId: d?.userId,
    timeIn: toDateSafe(d?.timeIn),
    timeOut: toDateSafe(d?.timeOut),
    isComplete: d?.isComplete,
    date: toDateSafe(d?.date),

    metric: summary
      ? {
          id: summaryId,
          regularHrs: summary.regularHrs ?? 0,
          totalHrs: summary.totalHrs ?? 0,
          overtime: summary.overtimeMins ?? 0,
          nightDifferential: summary.nightDifferentialMins ?? 0,
          late: summary.lateMins ?? 0,
          early: summary.earlyMins ?? 0,
        }
      : null,
  };
};

export const getAttendancesByUser = async (userId: string) => {
  const attendanceSnapshots = await db
    .collection("attendance")
    .where("userId", "==", userId)
    .get();

  if (attendanceSnapshots.empty) throw new Error("No attendance found");

  const data = await Promise.all(
    attendanceSnapshots.docs.map(async (doc) => {
      const d = doc.data();

      const dailySummarySnapshots = await db
        .collection("dailySummary")
        .where("attendanceId", "==", doc.id)
        .limit(1)
        .get();

      const summary = dailySummarySnapshots.docs[0]?.data();

      return {
        id: doc.id,
        userId: d.userId,
        timeIn: d.timeIn?.toDate() ?? null,
        timeOut: d.timeOut?.toDate() ?? null,
        isComplete: d.isComplete,
        date: d.date?.toDate() ?? null,

        metric: summary
          ? {
              id: dailySummarySnapshots.docs[0]?.id,
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

  return data;
};

export const punchIn = async (userId: string) => {
  // check active document by user
  const activePunchRef = await db
    .collection("attendance")
    .where("userId", "==", userId)
    .where("isComplete", "==", false)
    .limit(1)
    .get();

  if (!activePunchRef.empty) throw new Error("Attendance already punched in");

  const now = new Date();
  const startRef = await db.collection("attendance").add({
    date: now,
    timeIn: now,
    userId: userId,
    timeOut: false,
    isComplete: false,
  });

  const startSnapshot = await startRef.get();

  return {
    id: startSnapshot.id,
    ...startSnapshot.data(),
  };
};

export const punchOut = async (userId: string) => {
  const activeAttendance = await db
    .collection("attendance")
    .where("userId", "==", userId)
    .where("isComplete", "==", false)
    .limit(1)
    .get();

  if (activeAttendance.empty) {
    throw new Error("No active attendance");
  }

  const doc = activeAttendance.docs[0];
  const now = new Date();

  await doc?.ref.update({
    timeOut: now,
    isComplete: true,
  });

  return await metrics(userId, doc?.id as string);
};
