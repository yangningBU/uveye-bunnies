import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";

const setExampleRecord = async (db, collection) => {
  const docRef = db.collection(collection).doc("yonatan");
  await docRef.set({
    first: "Yonatan",
    last: "Laurence",
    born: 1991,
    timestamp: FieldValue.serverTimestamp(),
  });
};

const getAllRecords = async (db, collection) => {
  const snapshot = await db.collection(collection).get();
  const results = snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return results;
};

const dashboardFunction = async (db, request, response) => {
  logger.info("Request received.");

  if (request.method !== "GET") {
    response
      .status(404)
      .json({ error: "Route not supported." });
    return;
  }

  try {
    const collection = process.env.FUNCTIONS_EMULATOR ?
      "example" :
      "prod-example";
    logger.info(`Collection is "${collection}".`);

    await setExampleRecord(db, collection);
    const results = await getAllRecords(db, collection);

    logger.info("Firestore results", results);
    response.json({
      message: "Hello from Firebase!",
      data: results,
    });
  } catch (error) {
    logger.error("Error handling request", error);
    response
      .status(500)
      .send("Internal Server Error");
  }
};

export default dashboardFunction;
