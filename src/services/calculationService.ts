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

  const late = getLateMinutes(
    schedule.start.toDate(),
    attendance.timeIn.toDate(),
  );

  const early = getUnderTimeMinutes(
    schedule.end.toDate(),
    attendance.timeOut.toDate(),
  );

  return {
    regularHrs: regularHours,
    totalHrs: totalHours,
    late,
    early,
  };
};

function getTotalHours(timeIn: Date, timeOut: Date): number {
  const diffMs = timeOut.getTime() - timeIn.getTime();
  const BREAKTIME = 1;
  const total = Math.floor(diffMs / (1000 * 60 * 60) - BREAKTIME);
  return total;
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
    (timeOut.getTime() - endShift.getTime()) / (1000 * 60),
  );
  return Math.round(early * 100) / 100;
}

// const hours = await db.collection("attendanceMetrics").add({
//   overtime
//   nightDifferential
// })
