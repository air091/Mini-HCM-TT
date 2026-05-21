import { db } from "../configs/firebase.js";

type AttendanceType = {
  date: FirebaseFirestore.Timestamp;
  isComplete: boolean;
  timeIn?: FirebaseFirestore.Timestamp;
  timeOut?: FirebaseFirestore.Timestamp;
  userId: string;
};

export const getAttendanceById = async (attendanceId: string) => {
  const attendanceSnapshot = await db
    .collection("attendance")
    .doc(attendanceId)
    .get();

  return {
    id: attendanceSnapshot.id,
    ...(attendanceSnapshot.data() as Omit<AttendanceType, "id">),
  };
};

export const getAttendancesByUser = async (userId: string) => {
  const attendanceSnapshots = await db
    .collection("attendance")
    .where("userId", "==", userId)
    .get();

  if (attendanceSnapshots.empty) throw new Error("No attendance found");
  const data = attendanceSnapshots.docs.map((doc) => {
    const d = doc.data();
    return {
      id: doc.id,
      userId: d.userId,
      timeIn: d.timeIn?.toDate() ?? null,
      timeOut: d.timeOut?.toDate() ?? null,
      isComplete: d.isComplete,
      date: d.date?.toDate() ?? null,
    };
  });

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
