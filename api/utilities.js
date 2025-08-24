import { FieldValue } from "firebase-admin/firestore";
import _ from "lodash";
import {
  eventTypeToBunnyField,
  AGGREGATE_HAPPINESSS_FIELD_MAP,
  COLLECTIONS,
  DEFAULT_BUNNY,
  DEFAULT_CONFIG,
  DEFAULT_METRICS,
  DOC_SINGLETONS,
  EVENTS,
  HAPPINESS_BUNNY_FIELD_CONFIG_MAP,
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

export const calculateHappiness = (bunnyDoc, config) => {
  const result = Object
    .entries(HAPPINESS_BUNNY_FIELD_CONFIG_MAP)
    .map(([bunnyField, configField]) => {
      const propertyCount = bunnyDoc[bunnyField];
      const weight = config[configField];
      return propertyCount * weight;
    })
    .reduce((sum, points) => sum + points, 0);
  return result;
};

export const calculateDownstreamMetrics = (metrics, config = DEFAULT_CONFIG) => {
  const totalHappiness = Object
    .entries(AGGREGATE_HAPPINESSS_FIELD_MAP.totalHappiness)
    .map(([metric, { configField, multiplier }]) => (
      metrics[metric] * config[configField] * multiplier
    ))
    .reduce((sum, points) => sum + points, 0);

  const dependentMetrics = {
    totalHappiness,
  };
  console.debug("Dependent metrics:", dependentMetrics);
  return dependentMetrics;
};

const findBunnyInListOrDB = async (db, list, bunnyId) => {
  const listMatch = list.find((b) => b.id === bunnyId);
  if (listMatch) {
    return {
      bunny: listMatch,
      alreadyInList: true,
    };
  }

  const dbMatch = await getBunnyById(db, bunnyId);
  if (dbMatch) {
    return {
      bunny: { ...dbMatch },
      alreadyInList: false,
    };
  }

  console.debug(`Unable to find bunny by ID ${bunnyId} in list or DB.`);
  return {
    bunny: null,
    alreadyInList: false,
  };
};

const handleBunnyCreatedEvent = async (
  event,
  entities,
  aggregates,
  findBunny,
) => {
  const { bunny, alreadyInList } = await findBunny(entities, event.id);
  if (bunny) {
    console.log("Event bunny.created fired for exising bunny. Tracking.");
    if (!alreadyInList) {
      entities.push(bunny);
    }
  } else {
    const newBunny = {
      ...DEFAULT_BUNNY,
      id: event.id,
      name: event.name,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
      lastEventAppliedTimestamp: event.timestamp,
    };
    entities.push(newBunny);
  }
  aggregates.bunnyCount += 1;
};

const handleCarrotsEatenEvent = async (
  event,
  entities,
  aggregates,
  findBunny,
) => {
  const { bunny, alreadyInList } = await findBunny(
    entities,
    event.bunnyId,
  );
  if (bunny && bunny.lastEventAppliedTimestamp < event.timestamp) {
    bunny.carrotsEaten += 1;
    bunny.lastEventAppliedTimestamp = event.timestamp;
    if (!alreadyInList) {
      entities.push(bunny);
    }
  } else {
    console.warn(
      "Attempting to increment carrot count on bunny that hasn't been " +
      `created yet (bunny ID ${event.bunnyId}). Skipping.`,
    );
  }
  aggregates.totalCarrotsEaten += 1;
};

const handleLettuceEatenEvent = async (
  event,
  entities,
  aggregates,
  findBunny,
) => {
  const { bunny, alreadyInList } = await findBunny(
    entities,
    event.bunnyId,
  );
  if (bunny && bunny.lastEventAppliedTimestamp < event.timestamp) {
    bunny.lettuceEaten += 1;
    bunny.lastEventAppliedTimestamp = event.timestamp;
    if (!alreadyInList) {
      entities.push(bunny);
    }
  } else {
    console.warn(
      "Attempting to increment lettuce count on bunny that hasn't been " +
      `created yet (bunny ID ${event.bunnyId}). Skipping.`,
    );
  }
  aggregates.totalLettuceEaten += 1;
};

const handlePlayDateEvent = async (
  event,
  entities,
  aggregates,
  findBunny,
) => {
  const { bunny: firstBunny, alreadyInList: alreadyInList1 } = await findBunny(
    entities,
    event.bunnyId,
  );
  const { bunny: secondBunny, alreadyInList: alreadyInList2 } = await findBunny(
    entities,
    event.otherBunnyId,
  );

  if (
    firstBunny &&
    secondBunny &&
    firstBunny.lastEventAppliedTimestamp < event.timestamp &&
    secondBunny.lastEventAppliedTimestamp < event.timestamp
  ) {
    firstBunny.playDatesHad += 1;
    secondBunny.playDatesHad += 1;
    firstBunny.lastEventAppliedTimestamp = event.timestamp;
    secondBunny.lastEventAppliedTimestamp = event.timestamp;
    if (!alreadyInList1) {
      entities.push(firstBunny);
    }
    if (!alreadyInList2) {
      entities.push(secondBunny);
    }
  } else {
    console.warn(
      "Attempting to record playdate with bunny that hasn't been " +
      `created yet (IDS ${event.bunnyId}, ${event.otherBunnyId}). Or already `,
      "applied this event.",
    );
  }
  aggregates.totalPlayDatesHad += 1;
};

export const calculateAggregatesAndEntities = async (
  lastSnapshot,
  events,
  findBunny,
) => {
  const entities = [];
  const aggregates = Object.assign({}, DEFAULT_METRICS, lastSnapshot);
  console.log("Starting with an agggregate snapshot like so:", aggregates);
  console.log(`Processing ${events.length} events.`);

  for (const event of events) {
    switch (event.eventType) {
    case EVENTS.bunny.created:
      await handleBunnyCreatedEvent(event, entities, aggregates, findBunny);
      break;
    case EVENTS.bunny.carrotsEaten:
      await handleCarrotsEatenEvent(event, entities, aggregates, findBunny);
      break;
    case EVENTS.bunny.lettuceEaten:
      await handleLettuceEatenEvent(event, entities, aggregates, findBunny);
      break;
    case EVENTS.bunny.playDateHad:
      await handlePlayDateEvent(event, entities, aggregates, findBunny);
      break;
    default:
      console.log(`Not processing event ${event.eventType}.`);
    }
  }

  console.log("Calculated aggregate:", aggregates);
  console.log(`There are ${entities.length} entities to upsert.`);
  return { aggregates: aggregates, entities };
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
  let configRef = await getConfigRef(db);

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

const batchCommitEntities = async (db, entities) => {
  const batch = db.batch();
  entities.forEach((entity) => {
    const doc = db.collection(COLLECTIONS.bunnies).doc(entity.id);
    batch.set(doc, entity);
  });

  await batch.commit();
};

const setAggregateSummary = async (db, aggregates) => {
  const collection = await db.collection(COLLECTIONS.aggregates);
  // FIXME: what if this fails? - it'll mean the dashboard
  // will show stale data until this method succeeds
  await collection.doc(DOC_SINGLETONS.aggregates).set({
    ...aggregates,
    updatedAt: FieldValue.serverTimestamp(),
  });
  const aggregateSnapshot = await collection
    .doc(DOC_SINGLETONS.aggregates)
    .get();
  return aggregateSnapshot.data();
};

export const applyNewState = async (db, newState) => {
  console.log("Updating aggregate metrics...");
  console.debug("New metrics will be:", newState.aggregates);
  const savedAggregates = await setAggregateSummary(db, newState.aggregates);
  console.log("Aggregates saved as:", savedAggregates);

  console.log(`Upserting ${newState.entities.length} entities...`);
  await batchCommitEntities(db, newState.entities);
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

export const triggerUpdateToState = async (db) => {
  console.log("Triggering downstream processing following event...");
  const config = await getConfig(db);

  const { lastSnapshot, events } = await getAllEventsSinceLastSnapshot(db);
  const findBunny = (list, bunnyId) => findBunnyInListOrDB(db, list, bunnyId);
  const partialNewState = await calculateAggregatesAndEntities(
    lastSnapshot,
    events,
    findBunny,
  );

  const newState = {
    aggregates: {
      ...partialNewState.aggregates,
      ...calculateDownstreamMetrics(partialNewState.aggregates, config),
    },
    entities: partialNewState.entities,
  };

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

export const recordEvent = async (db, eventType, validEventFields) => {
  const collection = await db.collection(COLLECTIONS.eventLog);
  const querySnapshot = await collection.add({
    eventType,
    timestamp: FieldValue.serverTimestamp(),
    ...validEventFields,
  });
  const newEventRef = await querySnapshot.get();
  return { id: newEventRef.id, ...newEventRef.data() };
};
