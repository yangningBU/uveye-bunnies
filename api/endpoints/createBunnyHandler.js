import { FieldValue } from "firebase-admin/firestore";
import { COLLECTIONS, EVENTS } from "../constants.js";
import {
  formatBunnyForDashboard,
  getBunnyById,
  getConfig,
  triggerUpdateToState,
} from "../utilities.js";

const createBunnyCreatedEvent = async (db, name) => {
  const collection = await db.collection(COLLECTIONS.eventLog);
  const querySnapshot = await collection.add({
    name,
    eventType: EVENTS.bunny.created,
    timestamp: FieldValue.serverTimestamp(),
  });
  const newBunnyRef = await querySnapshot.get();
  return { id: newBunnyRef.id, ...newBunnyRef.data() };
};

const logCreateBunny = async (db, request, response) => {
  try {
    const name = request?.body?.data?.name;
    if (!name) {
      const msg = "Missing valid data.name field in request body.";
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const newBunnyEvent = await createBunnyCreatedEvent(db, name);
    console.log("New bunny event created: ", newBunnyEvent);

    await triggerUpdateToState(db, newBunnyEvent);

    const newBunnyRecord = await getBunnyById(db, newBunnyEvent.id);
    const config = await getConfig(db);
    const formattedResponse = formatBunnyForDashboard(newBunnyRecord, config);

    response
      .status(201)
      .json({ data: formattedResponse });
  } catch (e) {
    console.error(e);

    response
      .status(500)
      .json({ error: "Create bunny failed." });
  }
};

export default logCreateBunny;
