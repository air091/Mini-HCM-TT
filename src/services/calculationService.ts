import { db } from "../configs/firebase.js";

export const metrics = async (userId: string, attendanceId: string) => {
  const userSnapshot = await db.collection("users").doc(userId).get();
  if (!userSnapshot.exists) throw new Error("User not found");

  const data = userSnapshot.data();
  const schedule = data?.schedule;

  if (!schedule?.start || !schedule?.end) {
    throw new Error("User schedule missing");
  }

  const attendanceSnapshot = await db
    .collection("attendance")
    .doc(attendanceId)
    .get();

  if (!attendanceSnapshot.exists) throw new Error("No attendance found");

  const attendance = attendanceSnapshot.data();

  if (!attendance?.timeIn || !attendance?.timeOut) {
    throw new Error("Incomplete attendance record");
  }

  const timeIn = attendance.timeIn.toDate();
  const timeOut = attendance.timeOut.toDate();

  if (!(timeIn instanceof Date) || !(timeOut instanceof Date)) {
    throw new Error("Invalid timeIn or timeOut");
  }

  const shiftStartRaw = schedule.start.toDate();
  const shiftEndRaw = schedule.end.toDate();

  const start = new Date(timeIn);
  start.setHours(shiftStartRaw.getHours(), shiftStartRaw.getMinutes(), 0, 0);

  const end = new Date(timeIn);
  end.setHours(shiftEndRaw.getHours(), shiftEndRaw.getMinutes(), 0, 0);

  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }

  const summaryExists = await db
    .collection("dailySummary")
    .where("attendanceId", "==", attendanceId)
    .limit(1)
    .get();

  if (!summaryExists.empty) {
    throw new Error("Already calculated");
  }

  const regularHours = getRegularHours(start, end);
  const workedHours = getWorkedHours(timeIn, timeOut, start);
  const nightDifferentialMins = getNightDifferentialMinutes(timeIn, timeOut);
  const overtimeMins = getOvertimeMinutes(end, timeOut);
  const lateMins = getLateMinutes(start, timeIn);
  const earlyMins = getUnderTimeMinutes(end, timeOut);

  const summaryRef = await db.collection("dailySummary").add({
    attendanceId,
    regularHrs: regularHours,
    workedHrs: workedHours,
    overtimeMins,
    nightDifferentialMins,
    lateMins,
    earlyMins,
  });

  const summarySnapshot = await summaryRef.get();

  return {
    id: summarySnapshot.id,
    ...summarySnapshot.data(),
  };
};

export const recalculateMetrics = async (
  userId: string,
  attendanceId: string,
) => {
  // Delete existing summary so metrics() doesn't throw "Already calculated"
  const existingSummary = await db
    .collection("dailySummary")
    .where("attendanceId", "==", attendanceId)
    .limit(1)
    .get();

  if (!existingSummary.empty) {
    await existingSummary.docs[0]?.ref.delete();
  }

  return metrics(userId, attendanceId);
};

function getWorkedHours(timeIn: Date, timeOut: Date, startShift: Date): number {
  const BREAKTIME = 1;

  // clamp ONLY start
  const effectiveStart = new Date(
    Math.max(timeIn.getTime(), startShift.getTime()),
  );

  const effectiveEnd = timeOut; // no clamp

  if (effectiveEnd <= effectiveStart) return 0;

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const workedHours = Math.max(diffHours - BREAKTIME, 0);

  return Math.round(workedHours * 100) / 100;
}

function getRegularHours(startShift: Date, endShift: Date): number {
  const BREAK_HOURS = 1;
  const diffMs = endShift.getTime() - startShift.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return Math.max(diffHours - BREAK_HOURS, 0);
}

function getLateMinutes(startShift: Date, timeIn: Date): number {
  // check schedule start and punched in
  const late = Math.max(
    0,
    (timeIn.getTime() - startShift.getTime()) / (1000 * 60),
  );
  return Math.round(late * 100) / 100;
}

function getUnderTimeMinutes(endShift: Date, timeOut: Date): number {
  const early = Math.max(
    0,
    (endShift.getTime() - timeOut.getTime()) / (1000 * 60),
  );
  return Math.round(early * 100) / 100;
}

function getOvertimeMinutes(endShift: Date, timeOut: Date): number {
  const diffMins = Math.max(
    0,
    (timeOut.getTime() - endShift.getTime()) / (1000 * 60),
  );
  return Math.round(diffMins * 100) / 100;
}

function getNightDifferentialMinutes(timeIn: Date, timeOut: Date): number {
  const ndStart = new Date(timeIn);
  ndStart.setHours(22, 0, 0, 0);

  const ndEnd = new Date(ndStart);
  ndEnd.setDate(ndEnd.getDate() + 1);
  ndEnd.setHours(6, 0, 0, 0);

  const overlapStart = Math.max(timeIn.getTime(), ndStart.getTime());

  const overlapEnd = Math.min(timeOut.getTime(), ndEnd.getTime());

  const overlapMs = overlapEnd - overlapStart;

  if (overlapMs <= 0) return 0;

  return Math.round((overlapMs / (1000 * 60)) * 100) / 100;
}
