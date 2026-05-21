import { db } from "../configs/firebase.js";
import { getAttendanceById } from "./attendanceService.js";

export const metrics = async (userId: string, attendanceId: string) => {
  const userSnapshot = await db.collection("users").doc(userId).get();
  if (!userSnapshot.exists) throw new Error("User not found");

  const data = userSnapshot.data();
  const schedule = data?.schedule;

  if (!schedule?.start || !schedule?.end) {
    throw new Error("User schedule missing");
  }

  const attendance = await getAttendanceById(attendanceId);

  if (!attendance?.timeIn || !attendance?.timeOut) {
    throw new Error("Incomplete attendance record");
  }

  const timeIn = attendance.timeIn;
  const timeOut = attendance.timeOut;
  const start = schedule.start.toDate();
  const end = schedule.end.toDate();

  const summaryExists = await db
    .collection("dailySummary")
    .where("attendanceId", "==", attendanceId)
    .limit(1)
    .get();

  if (!summaryExists.empty) {
    throw new Error("Already calculated");
  }

  const totalHours = getTotalHours(timeIn, timeOut, start, end);

  const nightDifferentialMins = getNightDifferentialMinutes(timeIn, timeOut);
  const overtimeMins = getOvertimeMinutes(end, timeOut);
  const lateMins = getLateMinutes(start, timeIn);
  const earlyMins = getUnderTimeMinutes(end, timeOut);

  const summaryRef = await db.collection("dailySummary").add({
    attendanceId,
    regularHrs: totalHours,
    totalHrs: totalHours,
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

function getTotalHours(
  timeIn: Date,
  timeOut: Date,
  startShift: Date,
  endShift: Date,
): number {
  const BREAKTIME = 1;
  const MAX_HOURS = 8;

  // clamp to schedule window
  const effectiveStart = new Date(
    Math.max(timeIn.getTime(), startShift.getTime()),
  );

  const effectiveEnd = new Date(
    Math.min(timeOut.getTime(), endShift.getTime()),
  );

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const total = Math.min(Math.max(diffHours - BREAKTIME, 0), MAX_HOURS);

  return Math.round(total * 100) / 100;
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
