import { FieldValue } from "firebase-admin/firestore";
import { DEFAULT_CONFIG, EVENTS } from "./constants.js";

export const safeHappinessAverage = (totalHappiness, bunnyCount) => {
  if (bunnyCount === 0) return 0;
  return totalHappiness / bunnyCount;
};

export function getRandomInt(lower, upper) {
  const min = Math.ceil(lower);
  const max = Math.floor(upper);
  return Math.floor(Math.random() * (max - min + 1)) + min;
};

export function setCorsHeaders(res) {
  const frontendUrl = process.env.FUNCTIONS_EMULATOR ?
    "http://localhost:4200" :
    "https://uveye-bunnies.web.app";
  res.set("Access-Control-Allow-Origin", frontendUrl);
  res.set("Access-Control-Allow-Headers", "Content-Type");
};

const getAllEventsSinceLastSnapshot = async (db) => {
  const collection = await db.collection("events");
  // FIXME: Add timestamp where clause here
  const querySnapshot = await collection.get();
  const results = querySnapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
  return results;
};

const calculateDownstreamMetrics = (metrics, config = DEFAULT_CONFIG) => {
  return {
    totalHappiness: [
      metrics.totalCarrotsEaten * config.pointsCarrotsEaten,
      metrics.totalLettuceEaten * config.pointsLettuceEaten,
      metrics.totalPlayDatesHad * config.pointsPlayDatesHad,
    ].reduce((sum, points) => sum += points, 0),
  }
};

const calculateAggregates = async (db) => {
  const snapshot = getLastSnapshot(db);
  const events = getAllEventsSinceLastSnapshot(db);
  const config = getConfig(db);
  let updatedAgregates = {...snapshot.data};

  events.forEach(e => {
    switch (e.eventType) {
      case EVENTS.bunny.created: {
        updatedAgregates.bunnyCount += 1;
      }
      case EVENTS.bunny.carrotsEaten: {
        updatedAgregates.totalCarrotsEaten += 1;
      }
      case EVENTS.bunny.lettuceEaten: {
        updatedAgregates.totalLettuceEaten += 1;
      }
      case EVENTS.bunny.playDatesHad: {
        updatedAgregates.totalPlayDatesHad += 1;
      }
    }
  })

  updatedAggregates = {
    ...updatedAggregates,
    ...calculateDownstreamMetrics(updatedAggregates, config),
  };

  return updatedAgregates;
};

export const updateAggregates = async (db) => {
  const updatedState = calculateAggregates(db);
  const collection = await db.collection("aggregates");
  const querySnapshot = await collection.doc("summary").set({
    ...updatedState,
    updatedAt: FieldValue.serverTimestamp(),
  });
  console.log("Updated aggregate:", querySnapshot);
  return querySnapshot;
};

export const recordBunny = async (db, bunny) => {
  const collection = await db.collection("bunnies");
  const querySnapshot = await collection.doc.add({
    ...bunny,
    createdAt: FieldValue.serverTimestamp(),
  });
  console.log("New bunny:", querySnapshot);
};
