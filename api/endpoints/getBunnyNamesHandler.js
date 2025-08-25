import { COLLECTIONS } from "../constants.js";

const getBunnyNames = async (db, bunnyId) => {
  const querySnapshot = await db
    .collection(COLLECTIONS.bunnies)
    .orderBy("name")
    .get();

  if (querySnapshot.empty) {
    return [];
  }

  return querySnapshot.docs.map((doc) => (
    {
      id: doc.id,
      name: doc.data().name,
    }
  ));
};

const getBunnyNamesHandler = async (db, request, response) => {
  try {
    const bunnies = await getBunnyNames(db);
    response.json({ data: bunnies });
  } catch (error) {
    console.error("Error getting bunny", error);
    response
      .status(500)
      .json({ error: "Internal server error collecting bunny data." });
  }
};

export default getBunnyNamesHandler;
