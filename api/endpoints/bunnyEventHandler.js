import _ from "lodash";
import { FieldValue } from "firebase-admin/firestore";
import {
  COLLECTIONS,
  EVENT_TO_BUNNY_PROPERTY,
  EVENT_FIELDS,
  EVENTS,
} from "../constants.js";
import {
  formatBunnyForDetailsPage,
  getBunnyFromEventId,
  getConfig,
  processNewEvent,
  validateEventFields,
} from "../utilities.js";

const createBunnyEvent = async (db, eventType, validEventFields) => {
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
      EVENT_FIELDS[eventType],
    );
    console.debug(
      "requestPayload:",
      request.body.data,
      "validEventFields:",
      validEventFields,
      "receivedAllRequiredFields:",
      receivedAllRequiredFields,
    );
    if (!receivedAllRequiredFields) {
      const msg = (
        `eventType "${eventType}" requires "` +
        EVENT_FIELDS[eventType].join(", ")
      );
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const newBunnyEvent = await createBunnyEvent(
      db,
      eventType,
      validEventFields,
    );
    console.log("New bunny event created: ", newBunnyEvent);

    // FIXME: move to onDocumentCreated event listener
    await processNewEvent(db, newBunnyEvent);

    // FIXME: I tried to generalize this function, which perhaps was a
    // mistake but for now I'm expecting there to be a bunnyId on the
    // request payload (and consequently event)
    const newBunnyRecord = await getBunnyFromEventId(db, newBunnyEvent.bunnyId);
    const config = await getConfig(db);
    const formattedResponse = formatBunnyForDetailsPage(newBunnyRecord, config);
    console.debug("logBunnyEvent.formattedResponse:", formattedResponse);
    const fieldToReturn = EVENT_TO_BUNNY_PROPERTY[eventType];
    const out = { count: formattedResponse[fieldToReturn] };
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
