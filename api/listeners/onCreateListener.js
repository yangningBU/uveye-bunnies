import { processNewEvent } from "../utilities.js";

const onCreateListener = async (db, fireBaseEvent) => {
  console.log("!!onCreate triggered. Event: ", fireBaseEvent);

  const eventId = fireBaseEvent.params.eventId;
  console.log(`fireBaseEvent.params.eventId: "${eventId}"`);

  let event;
  const snapshot = fireBaseEvent.data;

  if (snapshot) {
    console.log("Snapshot present.");
    event = snapshot.after.data();
  } else {
    console.warning(
      "The onCreateListener has no associated data. " +
      `Falling back to direct querying by provided ID ${eventId}.`,
    );
    event = await db.collection("events").get(eventId);
  }
  console.log("Resulting event is ", event);

  if (!event) {
    throw new Error(`Event ${eventId} is missing. Aborting onCreateListener.`);
  }

  processNewEvent(db, event);
};

export default onCreateListener;
