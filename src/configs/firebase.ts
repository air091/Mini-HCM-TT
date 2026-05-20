import admin from "firebase-admin";
import serviceKey from "../../mini-hcm-bd3a4-firebase-adminsdk-fbsvc-f4b4b3d686.json";

admin.initializeApp({
  credential: admin.credential.cert(serviceKey as admin.ServiceAccount),
});

export const db = admin.firestore();
