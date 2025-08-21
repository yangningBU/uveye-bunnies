import { COLLECTIONS, DEFAULT_METRICS, DOC_SINGLETONS } from "../constants.js";
import {
  formatBunnyForDashboard,
  getConfig,
  safeHappinessAverage,
} from "../utilities.js";

const formatBunnies = (bunnies, config) => {
  return bunnies.map((bunny) => formatBunnyForDashboard(bunny, config));
};

const getAggregateSummary = async (db) => {
  const collection = await db.collection(COLLECTIONS.aggregates);
  const querySnapshot = await collection.doc(DOC_SINGLETONS.aggregates).get();
  if (!querySnapshot.exists) {
    return DEFAULT_METRICS;
  }

  return querySnapshot.data();
};

const getAllBunnies = async (db) => {
  const collection = await db
    .collection(COLLECTIONS.bunnies)
    .orderBy("createdAt", "desc");
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
    const config = await getConfig(db);
    const { bunnyCount, totalHappiness } = metrics;

    /* FIXME: bunnies should be paginated but bunniesCount
    and happinessAverages should be calculated from the
    entire dataset, not just the paginated subset
    */
    response.json({
      data: {
        bunnies: formatBunnies(bunnies, config),
        bunniesCount: metrics.bunnyCount,
        happinessAverage: safeHappinessAverage(totalHappiness, bunnyCount),
      },
    });
  } catch (error) {
    console.error("Error handling request", error);
    response
      .status(500)
      .json({ error: "Internal server error collecting bunny data." });
  }
};

export default dashboardFunction;
