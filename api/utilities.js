import { FieldValue } from "firebase-admin/firestore";
import _ from "lodash";
import {
  eventTypeToBunnyField,
  COLLECTIONS,
  DEFAULT_BUNNY,
  DEFAULT_CONFIG,
  DEFAULT_METRICS,
  DOC_SINGLETONS,
  EVENTS,
  HAPPINESS_FIELD_MAP,
  REQUIRED_EVENT_FIELDS,
} from "./constants.js";

const getLastSnapshot = async (db) => {
  console.debug("Getting last snapshot...");
  const snapshots = await db
    .collection(COLLECTIONS.eventLog)
    .where("eventType", "==", EVENTS.snapshot)
    .orderBy("timestamp", "desc")
    .limit(1)
    .get();

  if (snapshots.empty) {
    console.debug("No snapshots.");
  } else {
    console.log("Snapshot found.");
    return snapshots.docs[0].data();
  }
};

const getCutOffTimestamp = async (db, lastSnapshot) => {
  console.debug("Getting last snapshot timestamp.");
  let timestamp;

  if (lastSnapshot) {
    console.debug("Snapshot found.");
    timestamp = lastSnapshot.timestamp.toDate();
  } else {
    console.debug(
      "No snapshot. " +
      "Grabbing timestamp from first event if it exists.",
    );
    const firstEvent = await db
      .collection(COLLECTIONS.eventLog)
      .orderBy("timestamp")
      .limit(1)
      .get();

    if (!firstEvent.empty) {
      console.debug("First event found. Getting timestamp.");
      timestamp = firstEvent.docs.map((x) => x.data())[0].timestamp.toDate();
    } else {
      console.debug("No events at all. Deferring to now().");
    }
  }

  const resolvedTimestamp = timestamp ?? new Date();
  console.log("Returning resolved snapshot timestamp:", resolvedTimestamp);
  return resolvedTimestamp;
};

const getAllEventsSinceLastSnapshot = async (db) => {
  const lastSnapshot = await getLastSnapshot(db);
  const cutOffTimestamp = await getCutOffTimestamp(db, lastSnapshot);
  console.log("Finding all events since timestamp:", cutOffTimestamp);
  const querySnapshot = await db
    .collection(COLLECTIONS.eventLog)
    .where("timestamp", ">=", cutOffTimestamp)
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
  return {
    events: results,
    lastSnapshot: lastSnapshot ?? DEFAULT_METRICS,
  };
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

      if (weight == null) {
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

const findBunnyInListOrDB = (list, db, bunnyId) => {
  const listMatch = list.find((b) => b.id === bunnyId);
  if (listMatch) return listMatch;

  const dbMatch = getBunnyById(db, bunnyId);
  if (dbMatch) return dbMatch;

  console.debug(`Unable to find bunny by ID ${bunnyId} in list or DB.`);
};

const calculateAggregatesAndEntities = async (db) => {
  const eventsAndSnapshot = await getAllEventsSinceLastSnapshot(db);
  const config = await getConfig(db);

  const entities = [];
  const aggregateCollector = eventsAndSnapshot.lastSnapshot;

  eventsAndSnapshot.events.forEach((e) => {
    switch (e.eventType) {
    case EVENTS.bunny.created: {
      const newBunny = {
        ...DEFAULT_BUNNY,
        id: e.id,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };
      entities.push(newBunny);
      aggregateCollector.bunnyCount += 1;
      break;
    }
    case EVENTS.bunny.carrotsEaten: {
      const matchingBunny = findBunnyInListOrDB(entities, db, e.bunnyId);
      if (matchingBunny) {
        matchingBunny.carrotsEaten += 1;
        aggregateCollector.totalCarrotsEaten += 1;
        entities.push(matchingBunny);
      } else {
        console.warn(
          "Attempting to increment carrot count on bunny that hasn't been " +
          "created yet. Skipping.",
        );
      }
      break;
    }
    case EVENTS.bunny.lettuceEaten: {
      const matchingBunny = findBunnyInListOrDB(entities, db, e.bunnyId);
      if (matchingBunny) {
        matchingBunny.lettuceEaten += 1;
        aggregateCollector.totalLettuceEaten += 1;
        entities.push(matchingBunny);
      } else {
        console.warn(
          "Attempting to increment lettuce count on bunny that hasn't been " +
          "created yet. Skipping.",
        );
      }
      break;
    }
    case EVENTS.bunny.playDateHad: {
      const matchingBunny = findBunnyInListOrDB(entities, db, e.bunnyId);
      const otherBunny = findBunnyInListOrDB(entities, db, e.otherBunnyId);
      if (matchingBunny && otherBunny) {
        matchingBunny.playDatesHad += 1;
        otherBunny.playDatesHad += 1;
        aggregateCollector.totalPlayDatesHad += 1;
        entities.push(matchingBunny);
      } else {
        console.warn(
          "Attempting to record playdate with bunny that hasn't been " +
          "created yet. Skipping.",
        );
      }
      break;
    }
    }
  });

  const aggregates = {
    ...aggregateCollector,
    ...calculateDownstreamMetrics(aggregateCollector, config),
  };
  console.log("Calculated total metrics:", aggregates);
  console.log(`There are ${entities.length} entities to upsert.`);

  return { aggregates, entities };
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

export const getBunnyFieldValue = (eventType, newBunnyRecord) => {
  const fieldToReturn = eventTypeToBunnyField(eventType);
  return newBunnyRecord[fieldToReturn];
};

export const getBunnyById = async (db, bunnyId) => {
  const querySnapshot = await db
    .collection(COLLECTIONS.bunnies)
    .doc(bunnyId)
    .get();

  if (!querySnapshot.exists) {
    console.info(`Could not find bunny with id ${bunnyId}.`);
    return;
  }

  return {
    id: bunnyId,
    ...querySnapshot.data(),
  };
};

export const applyNewState = async (db, newState) => {
  console.log("Updating aggregate metrics...");
  console.debug("New metrics will be:", newState.aggregates);
  const collection = await db.collection(COLLECTIONS.aggregates);
  // FIXME: what if this fails?
  await collection.doc(DOC_SINGLETONS.aggregates).set({
    ...newState.aggregates,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const aggregateSnapshot = await collection
    .doc(DOC_SINGLETONS.aggregates)
    .get();
  const savedNewAggregate = aggregateSnapshot.data();
  console.log("Aggregates saved as:", savedNewAggregate);

  const batch = db.batch();
  newState.entities.forEach((entity) => {
    const doc = db.collection(COLLECTIONS.bunnies).doc(entity.id);
    batch.set(doc, entity);
  });
  
  await batch.commit()
};

export const incrementBunnyField = async (db, bunnyId, eventType) => {
  console.log("Updating bunny entity fields...");

  const collection = await db.collection(COLLECTIONS.bunnies);
  const doc = await collection.doc(bunnyId);
  const querySnapshot = await doc.get();
  if (querySnapshot.empty) {
    console.error(`Unable to update non-existent bunny with ID ${bunnyId}.`);
    return;
  }

  const fieldToUpdate = eventTypeToBunnyField(eventType);
  if (_.isEmpty(fieldToUpdate)) {
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
    [fieldToUpdate]: (currentValue ?? DEFAULT_BUNNY[fieldToUpdate]) + 1,
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

export const triggerUpdateToState = async (db, event) => {
  console.log("Triggering downstream processing following event...");
  if (!event) {
    throw new Error("Unable to process missing event.");
  }

  const newState = await calculateAggregatesAndEntities(db);

  await applyNewState(db, newState);

  // TODO: implement this:
  // const config = getConfig(db);
  // if (countEventsSinceLastSnapshot(db) >= config.eventCountCutoff) {
  //   generateNewSnapshotAsync();
  // }

  console.log("Processing complete.");
};

export const validateEventFields = (eventType, requestPayload) => {
  const requiredFields = REQUIRED_EVENT_FIELDS[eventType];
  return Object
    .keys(requestPayload)
    .filter((field) => requiredFields.includes(field))
    .reduce((filtered, field) => {
      filtered[field] = requestPayload[field];
      return filtered;
    }, {});
};
