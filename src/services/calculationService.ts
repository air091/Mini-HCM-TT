import { db } from "../configs/firebase.js";
import { getAttendanceById } from "./attendanceService.js";

export const metrics = async (userId: string, attendanceId: string) => {
  const userSnapshot = await db.collection("users").doc(userId).get();
  if (!userSnapshot.exists) throw new Error("User not found");
  const data = userSnapshot.data();

  const schedule = data?.schedule;
  if (!schedule.start || !schedule.end)
    throw new Error("User schedules are missing");

  const attendance = await getAttendanceById(attendanceId);
  if (!attendance?.timeIn || !attendance?.timeOut) {
    throw new Error("Incomplete attendance record");
  }

  const regularHours = getTotalHours(
    schedule.start.toDate(),
    schedule.end.toDate(),
  );

  const totalHours = getTotalHours(
    attendance.timeIn.toDate(),
    attendance.timeOut.toDate(),
  );

  const nightDifferential = getNightDifferential(
    attendance.timeIn.toDate(),
    attendance.timeOut.toDate(),
  );

  const overtime = getOvertimeMinutes(
    schedule.end.toDate(),
    attendance.timeOut.toDate(),
  );

  const late = getLateMinutes(
    schedule.start.toDate(),
    attendance.timeIn.toDate(),
  );

  const early = getUnderTimeMinutes(
    schedule.end.toDate(),
    attendance.timeOut.toDate(),
  );

  const summaryRef = await db.collection("dailySummary").add({
    attendanceId: attendance.id,
    regularHrs: regularHours,
    totalHrs: totalHours,
    overtime,
    nightDifferential,
    late,
    early,
  });

  const summarySnapshot = await summaryRef.get();

  return {
    id: summarySnapshot.id,
    ...summarySnapshot.data(),
  };
};

function getTotalHours(timeIn: Date, timeOut: Date): number {
  const diffHours = (timeOut.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
  const BREAKTIME = 1;
  return Math.round(Math.max(0, diffHours - BREAKTIME) * 100) / 100;
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

function getNightDifferential(timeIn: Date, timeOut: Date): number {
  const ndStart = new Date(timeIn);
  ndStart.setHours(22, 0, 0, 0);

  const ndEnd = new Date(ndStart);
  ndEnd.setDate(ndEnd.getDate() + 1);
  ndEnd.setHours(6, 0, 0, 0);

  const overlapStart = Math.max(timeIn.getTime(), ndStart.getTime());

  const overlapEnd = Math.min(timeOut.getTime(), ndEnd.getTime());

  const overlapMs = overlapEnd - overlapStart;

  if (overlapMs <= 0) return 0;

  return Math.round((overlapMs / (1000 * 60 * 60)) * 100) / 100;
}
