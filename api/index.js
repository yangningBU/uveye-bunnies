import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./uveye-bunnies-firebase-adminsdk-fbsvc-c93d9cec13.json" with { type: "json" };

setGlobalOptions({ maxInstances: 10 });

export const helloWorld = onRequest((request, response) => {
  logger.info("Request: ", request);
  logger.info("Hello logs!", { structuredData: true });
  response.send("Hello from Firebase!");
});

initializeApp({
  credential: cert(serviceAccount)
});

const db = getFirestore();

const docRef = db.collection("example").doc("yonatan");
await docRef.set({
  first: "Yonatan",
  last: "Laurence",
  born: 1991
});

const snapshot = await db.collection("example").get();
snapshot.forEach((doc) => {
  console.log(doc.id, "=>", doc.data());
});
