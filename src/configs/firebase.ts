import dotenv from "dotenv";
import admin from "firebase-admin";

dotenv.config();

const serviceKey = process.env.FIREBASE_SERVICE_ACCOUNT
  ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
  : (
      await import(
        "../../mini-hcm-bd3a4-firebase-adminsdk-fbsvc-f4b4b3d686.json",
        { with: { type: "json" } }
      )
    ).default;

admin.initializeApp({
  credential: admin.credential.cert(serviceKey as admin.ServiceAccount),
});

export const db = admin.firestore();
