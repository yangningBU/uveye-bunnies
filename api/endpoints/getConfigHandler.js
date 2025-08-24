import { getConfig } from "../utilities.js";

const getConfigHandler = async (db, request, response) => {
  try {
    const currentConfig = await getConfig(db);
    response
      .status(201)
      .json({ data: currentConfig });
  } catch (e) {
    console.error(e);
    response
      .status(500)
      .json({ error: `Fetching config failed. ${e.message}` });
  }
};

export default getConfigHandler;
