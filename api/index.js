import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";
import { setGlobalOptions } from "firebase-functions/v2";
import { initializeApp, cert } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import serviceAccount from "./credentials.json" with { type: "json" };

setGlobalOptions({ maxInstances: 10 });
initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

// Cloud Function
export const helloWorld = onRequest(async (request, response) => {
  logger.info("Request received", { query: request.query });

  try {
    // Write a document
    const docRef = db.collection("example").doc("yonatan");
    await docRef.set({
      first: "Yonatan",
      last: "Laurence",
      born: 1991,
    });

    // Read documents
    const snapshot = await db.collection("example").get();
    const results = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    logger.info("Firestore results", results);

    response.json({
      message: "Hello from Firebase!",
      data: results,
    });
  } catch (error) {
    logger.error("Error handling request", error);
    response.status(500).send("Internal Server Error");
  }
});
