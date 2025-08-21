import _ from "lodash";
import { COLLECTIONS } from "../constants.js";
import { formatBunnyForDetailsPage, getConfig } from "../utilities.js";

const getBunny = async (db, bunnyId) => {
  const querySnapshot = await db
    .collection(COLLECTIONS.bunnies)
    .doc(bunnyId)
    .get()
  
  if (!querySnapshot.exists) {
    return;
  }

  const bunny = {
    id: bunnyId,
    ...querySnapshot.data(),
  };

  return bunny;
};

const getBunnyHandler = async (db, request, response) => {
  try {
    const bunnyId = request?.body?.data?.id;
    if (_.isEmpty(bunnyId)) {
      const msg = "Missing required bunny :id parameter.";
      console.log(msg);
      response
        .status(400)
        .json({ error: msg });
      return;
    }

    const bunny = await getBunny(db, bunnyId);
    if (_.isEmpty(bunny)) {
      const msg = `Bunny with ID "${bunnyId}" not found.`;
      console.log(msg);
      response
        .status(404)
        .json({ error: msg });
      return;
    }

    const config = await getConfig(db);
    response.json({ data: formatBunnyForDetailsPage(bunny, config) });
  } catch (error) {
    console.error("Error getting bunny", error);
    response
      .status(500)
      .json({ error: "Internal server error collecting bunny data." });
  }
};

export default getBunnyHandler;
