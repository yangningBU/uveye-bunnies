import * as logger from "firebase-functions/logger";
import { FieldValue } from "firebase-admin/firestore";
import { calculateHappinessAverage } from "../utilities.js";

const EVENT_TYPES = {
  bunny: {
    created: "bunny.created"
  }
}

function getRandomInt(lower, upper) {
  const min = Math.ceil(lower);
  const max = Math.floor(upper);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const createNewBunny = async (db, collectionName) => {
  const collection = db.collection(collectionName);
  await collection.add({
    name: `Fluffy ${getRandomInt(0, 5000)}`,
    eventType: EVENT_TYPES.bunny.created,
    happinessCount: getRandomInt(0, 100),
    timestamp: FieldValue.serverTimestamp(),
  });
};

const getAllBunnies = async (db, collectionName) => {
  const collection = await db.collection(collectionName)
  const querySnapshot = await collection.where("eventType", "==", EVENT_TYPES.bunny.created).get()
  const results = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return results;
};

const dashboardFunction = async (db, request, response) => {
  logger.info("Request received.");

  try {
    const collection = process.env.FUNCTIONS_EMULATOR ?
      "example" :
      "prod-example";
    logger.info(`Collection is "${collection}".`);

    await createNewBunny(db, collection);
    const results = await getAllBunnies(db, collection);

    // FIXME: average is from all results, not just paginated
    logger.info("Firestore results", results);
    response.json({
      bunnies: results,
      bunniesCount: results.length,
      happinessAverage: calculateHappinessAverage(results),
    });
  } catch (error) {
    logger.error("Error handling request", error);
    response
      .status(500)
      .send("Internal Server Error");
  }
};

export default dashboardFunction;
