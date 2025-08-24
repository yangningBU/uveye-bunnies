import _ from "lodash";
import {
  COLLECTIONS,
  DEFAULT_CONFIG,
  DOC_SINGLETONS,
  EVENTS,
} from "../constants.js";
import {
  getConfig,
  recordEvent,
  triggerUpdateToState,
} from "../utilities.js";

const setConfig = async (db, updatedConfig) => {
  const collection = await db.collection(COLLECTIONS.config);
  const doc = await collection.doc(DOC_SINGLETONS.config);
  await doc.set(updatedConfig);
  const newConfig = await doc.get();
  return newConfig.data();
};

const saveConfigHandler = async (db, request, response) => {
  try {
    const payload = request?.body?.data;
    console.log("Received new config:", payload);

    const validatedFields = Object.fromEntries(
      Object
        .keys(DEFAULT_CONFIG)
        .map((key) => [key, payload[key]]),
    );
    const missingFields = Object
      .keys(validatedFields)
      .filter((key) => _.isNil(validatedFields[key]));

    if (missingFields.length) {
      const msg = (
        "Missing required fields in request body. " +
        `Specifically ${missingFields.join(", ")}`
      );
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const currentConfig = await getConfig(db);
    const newConfigContent = Object.assign({}, DEFAULT_CONFIG, currentConfig, validatedFields);
    const loggedEvent = await recordEvent(db, EVENTS.config, newConfigContent);
    if (!loggedEvent) {
      throw new Error("Update config event failed to record.");
    }

    const updatedConfig = await setConfig(db, newConfigContent);
    console.log("New config created: ", updatedConfig);

    await triggerUpdateToState(db);

    response
      .status(201)
      .json({ data: updatedConfig });
  } catch (e) {
    console.error(e);

    response
      .status(500)
      .json({ error: `Create config failed. ${e.message}` });
  }
};

export default saveConfigHandler;
