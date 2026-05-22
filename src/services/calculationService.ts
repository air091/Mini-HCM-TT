import { db } from "../configs/firebase.js";
import {
  fromBusinessDateParts,
  getBusinessClockParts,
  getBusinessDateParts,
} from "../libs/businessTime.js";

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
  const shiftStart = getBusinessClockParts(shiftStartRaw);
  const shiftEnd = getBusinessClockParts(shiftEndRaw);
  const timeInDate = getBusinessDateParts(timeIn);

  const start = fromBusinessDateParts(
    timeInDate.year,
    timeInDate.monthIndex,
    timeInDate.day,
    shiftStart.hours,
    shiftStart.minutes,
  );
  let end = fromBusinessDateParts(
    timeInDate.year,
    timeInDate.monthIndex,
    timeInDate.day,
    shiftEnd.hours,
    shiftEnd.minutes,
  );

  if (end <= start) {
    end = fromBusinessDateParts(
      timeInDate.year,
      timeInDate.monthIndex,
      timeInDate.day + 1,
      shiftEnd.hours,
      shiftEnd.minutes,
    );
  }

  const summaryExists = await db
    .collection("dailySummary")
    .where("attendanceId", "==", attendanceId)
    .limit(1)
    .get();

  if (!summaryExists.empty) {
    throw new Error("Already calculated");
  }

  const regularHoursLimit = getRegularHoursLimit(start, end);
  const totalHours = getWorkedHours(timeIn, timeOut, start, regularHoursLimit);
  const workedHours = Math.min(totalHours, regularHoursLimit);
  const regularHours = workedHours;
  const nightDifferentialMins = getNightDifferentialMinutes(timeIn, timeOut);
  const overtimeMins = getOvertimeMinutes(end, timeOut);
  const lateMins = getLateMinutes(start, timeIn);
  const earlyMins = getUnderTimeMinutes(end, timeOut);

  const summaryRef = await db.collection("dailySummary").add({
    attendanceId,
    regularHrs: regularHours,
    totalHrs: totalHours,
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

const BREAK_HOURS = 1;
const MAX_REGULAR_HOURS = 8;

function getWorkedHours(
  timeIn: Date,
  timeOut: Date,
  startShift: Date,
  regularHoursLimit: number,
): number {
  // clamp ONLY start
  const effectiveStart = new Date(
    Math.max(timeIn.getTime(), startShift.getTime()),
  );

  const effectiveEnd = timeOut; // no clamp

  if (effectiveEnd <= effectiveStart) return 0;

  const diffMs = effectiveEnd.getTime() - effectiveStart.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const breakHours = diffHours > regularHoursLimit ? BREAK_HOURS : 0;

  const workedHours = Math.max(diffHours - breakHours, 0);

  return Math.round(workedHours * 100) / 100;
}

function getRegularHoursLimit(startShift: Date, endShift: Date): number {
  const diffMs = endShift.getTime() - startShift.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  const breakHours = diffHours > MAX_REGULAR_HOURS ? BREAK_HOURS : 0;
  const regularLimit = Math.max(diffHours - breakHours, 0);

  return Math.min(regularLimit, MAX_REGULAR_HOURS);
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
  const timeInDate = getBusinessDateParts(timeIn);
  const ndStart = fromBusinessDateParts(
    timeInDate.year,
    timeInDate.monthIndex,
    timeInDate.day,
    22,
  );
  const ndEnd = fromBusinessDateParts(
    timeInDate.year,
    timeInDate.monthIndex,
    timeInDate.day + 1,
    6,
  );

  const overlapStart = Math.max(timeIn.getTime(), ndStart.getTime());

  const overlapEnd = Math.min(timeOut.getTime(), ndEnd.getTime());

  const overlapMs = overlapEnd - overlapStart;

  if (overlapMs <= 0) return 0;

  return Math.round((overlapMs / (1000 * 60)) * 100) / 100;
}
