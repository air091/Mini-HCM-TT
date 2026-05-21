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

// admin can view daily reports of employees with all metrics

// admin can view weekly reports of  employees with all metrics
