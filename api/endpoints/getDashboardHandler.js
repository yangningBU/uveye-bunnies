import * as logger from "firebase-functions/logger";
import { DEFAULT_METRICS } from "../constants.js";
import { safeHappinessAverage } from "../utilities.js";

const getAggregateSummary = async (db) => {
  const collection = await db.collection("aggregates");
  const querySnapshot = await collection.get("summary");
  return querySnapshot.docs.map(a => a.data())[0] ?? DEFAULT_METRICS;
}

const getAllBunnies = async (db) => {
  const collection = await db.collection("bunnies");
  // FIXME: Add limit and pagination clause here
  const querySnapshot = await collection.get();
  const bunnies = querySnapshot.docs.map((bunny) => ({
    id: bunny.id,
    ...bunny.data(),
  }));
  return bunnies;
};

const dashboardFunction = async (db, request, response) => {
  try {
    const bunnies = await getAllBunnies(db);
    const metrics = await getAggregateSummary(db);
    const { bunnyCount, totalHappiness } = metrics;

    logger.info("Firestore results", bunnies, metrics);
    response.json({
      // FIXME: bunnies should be paginated
      bunnies,
      // FIXME: metrics should be from all results, not just paginated
      bunniesCount: metrics.bunnyCount,
      happinessAverage: safeHappinessAverage(totalHappiness, bunnyCount),
    });
  } catch (error) {
    logger.error("Error handling request", error);
    response
      .status(500)
      .json({ error: "Internal server error collecting bunny data." });
  }
};

export default dashboardFunction;
