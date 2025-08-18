import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";

const dashboardFunction = async (db, request, response) => {
  logger.info("Request received", { query: request.query });

  if (request.method !== "GET") {
    response.status(404).json({error: 'Route not supported.'})
    return;
  }

  try {
    const docRef = db.collection("example").doc("yonatan");
    await docRef.set({
      first: "Yonatan",
      last: "Laurence",
      born: 1991,
      timestamp: FieldValue.serverTimestamp(),
    });

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
};

export default dashboardFunction;
