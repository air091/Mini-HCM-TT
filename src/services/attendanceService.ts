import { db } from "../configs/firebase.js";

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
