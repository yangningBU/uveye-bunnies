import _ from "lodash";
import { FieldValue } from "firebase-admin/firestore";
import {
  COLLECTIONS,
  EVENTS,
  REQUIRED_EVENT_FIELDS,
} from "../constants.js";
import {
  calculateHappiness,
  getBunnyById,
  getBunnyFieldValue,
  getConfig,
  triggerUpdateToState,
  validateEventFields,
} from "../utilities.js";

const getReturnObjectForLoggedEvent = async (db, newEvent) => {
  let out;

  switch (newEvent.eventType) {
  case EVENTS.bunny.carrotsEaten:
  case EVENTS.bunny.lettuceEaten: {
    const updatedRecord = await getBunnyById(db, newEvent.bunnyId);
    const value = getBunnyFieldValue(newEvent.eventType, updatedRecord);
    const config = await getConfig(db);
    out = {
      count: value,
      happiness: calculateHappiness(updatedRecord, config),
    };
    break;
  }
  default:
    console.error("Unsupported event type: ", newEvent.eventType);
  }

  return out;
};

const recordEvent = async (db, eventType, validEventFields) => {
  const collection = await db.collection(COLLECTIONS.eventLog);
  const querySnapshot = await collection.add({
    eventType,
    timestamp: FieldValue.serverTimestamp(),
    ...validEventFields,
  });
  const newEventRef = await querySnapshot.get();
  return { id: newEventRef.id, ...newEventRef.data() };
};

const logBunnyEvent = async (db, request, response) => {
  try {
    const eventType = request?.body?.data?.eventType;
    if (!eventType) {
      const msg = "Missing valid data.eventType field in request body.";
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const eventTypeIsValid = Object.values(EVENTS.bunny).includes(eventType);
    if (!eventTypeIsValid) {
      const msg = `eventType "${eventType}" is not a valid bunny event"`;
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const validEventFields = validateEventFields(
      eventType,
      request.body.data,
    );
    const receivedAllRequiredFields = _.isEqual(
      Object.keys(validEventFields),
      REQUIRED_EVENT_FIELDS[eventType],
    );
    if (!receivedAllRequiredFields) {
      const msg = (
        `eventType "${eventType}" requires "` +
        REQUIRED_EVENT_FIELDS[eventType].join(", ")
      );
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const newEvent = await recordEvent(db, eventType, validEventFields);
    console.log("New event created: ", newEvent);

    // FIXME: move to onDocumentCreated event listener
    await triggerUpdateToState(db, newEvent);

    const out = await getReturnObjectForLoggedEvent(db, newEvent);
    console.log("Returning:", out);

    response
      .status(201)
      .json({ data: out });
  } catch (e) {
    console.error(e);

    response
      .status(500)
      .json({ error: "Create bunny failed." });
  }
};

export default logBunnyEvent;
