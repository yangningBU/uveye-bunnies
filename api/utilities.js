import { FieldValue } from "firebase-admin/firestore";
import _ from "lodash";
import {
  eventTypeToBunnyField,
  COLLECTIONS,
  DEFAULT_BUNNY,
  DEFAULT_CONFIG,
  DEFAULT_METRICS,
  DOC_SINGLETONS,
  EVENT_FIELDS,
  EVENTS,
  HAPPINESS_FIELD_MAP,
} from "./constants.js";

const getLastSnapshotTimestamp = async (db) => {
  console.debug("Getting last snapshot timestamp.");
  let timestamp;

  const snapshots = await db
    .collection(COLLECTIONS.eventLog)
    .where("eventType", "==", EVENTS.snapshot)
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (snapshots.empty) {
    console.debug(
      "No snapshots. " +
      "Grabbing timestamp from first event if it exists.",
    );
    const firstEvent = await db
      .collection(COLLECTIONS.eventLog)
      .orderBy("timestamp")
      .limit(1)
      .get();

    if (!firstEvent.empty) {
      timestamp = firstEvent.docs.map((x) => x.data())[0].timestamp.toDate();
    }
  } else {
    console.debug("Snapshot found.");
    timestamp = snapshots.docs.map((x) => x.timestamp.toDate())[0];
  }

  const resolvedTimestamp = timestamp ?? new Date();
  console.log("Returning resolved snapshot timestamp:", resolvedTimestamp);
  return resolvedTimestamp;
};

const getAllEventsSinceLastSnapshot = async (db) => {
  const snapshotTimestamp = await getLastSnapshotTimestamp(db);
  console.log("Finding all events since timestamp:", snapshotTimestamp);
  const querySnapshot = await db
    .collection(COLLECTIONS.eventLog)
    .where("timestamp", ">=", snapshotTimestamp)
    .where("eventType", "in", Object.values(EVENTS.bunny))
    .get();

  if (querySnapshot.empty) {
    console.log("No events founds.");
    return [];
  }

  const results = querySnapshot.docs.map((event) => ({
    id: event.id,
    ...event.data(),
  }));

  console.log(`${results.length} events found.`);
  console.debug(results);
  return results;
};

const calculateHappiness = (bunnyDoc, config) => {
  const result = Object
    .entries(HAPPINESS_FIELD_MAP)
    .map(([bunnyField, configField]) => {
      let propertyCount = bunnyDoc[bunnyField];
      let weight = config[configField];

      if (propertyCount == null) {
        console.warn(`Property ${bunnyField} is unset. Using default value.`);
        propertyCount = DEFAULT_BUNNY[bunnyField];
      }

      if (propertyCount == null) {
        console.warn(`Config ${configField} is unset. Using default weight.`);
        weight = DEFAULT_CONFIG[configField];
      }

      return propertyCount * weight;
    })
    .reduce((sum, points) => sum + points, 0);
  return result;
};

const calculateDownstreamMetrics = (metrics, config = DEFAULT_CONFIG) => {
  const dependentMetrics = {
    totalHappiness: [
      metrics.totalCarrotsEaten * config.pointsCarrotsEaten,
      metrics.totalLettuceEaten * config.pointsLettuceEaten,
      metrics.totalPlayDatesHad * config.pointsPlayDatesHad,
    ].reduce((sum, points) => sum + points, 0),
  };
  console.debug("Dependent metrics:", dependentMetrics);
  return dependentMetrics;
};

const calculateAggregates = async (db) => {
  // const snapshot = getLastSnapshot();
  const events = await getAllEventsSinceLastSnapshot(db);
  const config = await getConfig(db);
  // FIXME: start with last snapshot metrics
  let updatedAggregates = { ...DEFAULT_METRICS };

  events.forEach((e) => {
    switch (e.eventType) {
    case EVENTS.bunny.created:
      updatedAggregates.bunnyCount += 1;
      break;
    case EVENTS.bunny.carrotsEaten:
      updatedAggregates.totalCarrotsEaten += 1;
      break;
    case EVENTS.bunny.lettuceEaten:
      updatedAggregates.totalLettuceEaten += 1;
      break;
    case EVENTS.bunny.playDateHad:
      updatedAggregates.totalPlayDatesHad += 1;
      break;
    }
  });

  updatedAggregates = {
    ...updatedAggregates,
    ...calculateDownstreamMetrics(updatedAggregates, config),
  };
  console.log("Calculated total metrics:", updatedAggregates);

  return updatedAggregates;
};

export const safeHappinessAverage = (totalHappiness, bunnyCount) => {
  if (bunnyCount === 0) return 0;
  return totalHappiness / bunnyCount;
};

export function getRandomInt(lower, upper) {
  const min = Math.ceil(lower);
  const max = Math.floor(upper);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function setCorsHeaders(res) {
  const frontendUrl = process.env.FUNCTIONS_EMULATOR ?
    "http://localhost:4200" :
    "https://uveye-bunnies.web.app";

  res.set("Access-Control-Allow-Origin", frontendUrl);
  res.set("Access-Control-Allow-Headers", "Content-Type");
  res.set("Access-Control-Allow-Methods", "GET, POST, OPTIONS"),
  res.set("Access-Control-Max-Age", "5");
}

const getConfigRef = async (db) => {
  return await db
    .collection(COLLECTIONS.config)
    .doc(DOC_SINGLETONS.config)
    .get();
};

export const getConfig = async (db) => {
  let configRef = getConfigRef(db);

  if (!configRef.exists) {
    await db
      .collection(COLLECTIONS.config)
      .doc(DOC_SINGLETONS.config)
      .set(DEFAULT_CONFIG);
    configRef = await getConfigRef(db);
  }

  return configRef.data();
};

export const formatBunnyForDashboard = (bunny, config) => ({
  id: bunny.id,
  name: bunny.name,
  happinessCount: calculateHappiness(bunny, config),
});

export const formatBunnyForDetailsPage = (bunny, config) => {
  const { id, name, carrotsEaten, lettuceEaten, playDatesHad } = bunny;
  return {
    id,
    name,
    carrotsEaten,
    lettuceEaten,
    playDatesHad,
    happiness: calculateHappiness(bunny, config),
  };
};

export const getBunnyFromEventId = async (db, eventId) => {
  const querySnapshot = await db
    .collection(COLLECTIONS.bunnies)
    .doc(eventId)
    .get();

  if (!querySnapshot.exists) {
    throw new Error(`Could not find bunny with id ${eventId}.`);
  }

  return {
    id: eventId,
    ...querySnapshot.data(),
  };
};

export const updateAggregates = async (db) => {
  console.log("Updating aggregate metrics...");
  const updatedState = await calculateAggregates(db);
  console.debug("New metrics will be:", updatedState);
  const collection = await db.collection(COLLECTIONS.aggregates);
  // FIXME: what if this fails?
  await collection.doc(DOC_SINGLETONS.aggregates).set({
    ...updatedState,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const aggregateSnapshot = await collection
    .doc(DOC_SINGLETONS.aggregates)
    .get();
  const savedNewAggregate = aggregateSnapshot.data();
  console.log("Aggregates saved as:", savedNewAggregate);
  return savedNewAggregate;
};

export const incrementBunnyField = async (db, bunnyId, eventType) => {
  console.log("Updating bunny entity fields...");

  const collection = await db.collection(COLLECTIONS.bunnies);
  const doc = await collection.doc(bunnyId);
  const querySnapshot = await doc.get();
  if (querySnapshot.empty) {
    throw new Error(`Unable to update non-existent bunny with ID ${bunnyId}.`);
  }

  const fieldToUpdate = eventTypeToBunnyField(eventType);
  if (!fieldToUpdate) {
    throw new Error(
      "Unable to update bunny on non-existent field for event type: " +
      eventType,
    );
  }

  const currentValue = querySnapshot.data()[fieldToUpdate];
  if (_.isEmpty(currentValue)) {
    console.error(
      `Current value for field ${fieldToUpdate}(ID: ${bunnyId}) is missing. ` +
      "While I will be supplying a default value to ensure the " +
      "system continues to function, you should know that there " +
      "is a fault in your initializing logic.",
    );
  }

  await doc.update({
    [fieldToUpdate]: (currentValue ?? 0) + 1,
    updatedAt: FieldValue.serverTimestamp(),
  });

  console.log(`Bunny ${bunnyId} updated ${fieldToUpdate}.`);
};

export const recordBunny = async (db, bunny) => {
  console.log("Recording new bunny entity...");
  const collection = await db.collection(COLLECTIONS.bunnies);
  const bunnyDocument = {
    ...bunny,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  console.log("Attempting to save this doc:", bunnyDocument);
  // FIXME: what if this fails?
  await collection.doc(bunny.id).set(bunnyDocument);

  const newBunnySnapshot = await collection.doc(bunny.id).get();
  const newBunny = newBunnySnapshot.data();
  if (!newBunny) {
    throw new Error("Failed to record bunny entity.");
  }

  console.log("Bunny entity saved successfully.");
  return newBunny;
};

export const processNewEvent = async (db, event) => {
  console.log("Triggering downstream processing following event...");
  if (!event) {
    throw new Error("Unable to process missing event.");
  }

  // FIXME: Refactor so that resulting entity states is also a product
  // of iterating over events like in updateAggregates / calculateAggregates
  switch (event.eventType) {
  case EVENTS.bunny.created: {
    const newBunny = {
      ...DEFAULT_BUNNY,
      ...{ id: event.id, name: event.name },
    };
    // FIXME: wrap this in a transaction
    await recordBunny(db, newBunny);
    await updateAggregates(db);
    break;
  }
  case EVENTS.bunny.carrotsEaten:
  case EVENTS.bunny.lettuceEaten:
    await incrementBunnyField(db, event.bunnyId, event.eventType);
    await updateAggregates(db);
    break;
  case EVENTS.bunny.playDateHad:
    await incrementBunnyField(db, event.bunnyId, event.eventType);
    await incrementBunnyField(db, event.otherBunnyId, event.eventType);
    await updateAggregates(db);
    break;
  default:
    console.log(`Event listener ignoring event type '${event.eventType}'.`);
  }

  // TODO: implement this:
  // const config = getConfig(db);
  // if (countEventsSinceLastSnapshot(db) >= config.eventCountCutoff) {
  //   generateNewSnapshotAsync();
  // }

  console.log("Processing complete.");
};

export const validateEventFields = (eventType, requestPayload) => {
  const requiredFields = EVENT_FIELDS[eventType];
  return Object
    .keys(requestPayload)
    .filter(field => requiredFields.includes(field))
    .reduce((filtered, field) => {
      filtered[field] = requestPayload[field];
      return filtered;
    }, {});
};
