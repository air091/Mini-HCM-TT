import { db } from "../configs/firebase.js";

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
    timeIn: d?.timeIn?.toDate() ?? null,
    timeOut: d?.timeOut?.toDate() ?? null,
    isComplete: d?.isComplete,
    date: d?.date?.toDate() ?? null,

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
    timeOut: null,
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
    .where("timeOut", "==", null)
    .limit(1)
    .get();

  if (activeAttendance.empty) throw new Error("Active attendance not found");

  const now = new Date();
  const endSnapshot = activeAttendance.docs[0];
  return endSnapshot?.ref.update({ timeOut: now, isComplete: true });
};
