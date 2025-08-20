import { FieldValue } from "firebase-admin/firestore";
import { EVENTS } from "../constants.js";

const createBunny = async (db, request, response) => {
  console.log("REACHED CREATEBUNNY", request.body);
  try{
    const { name } = request?.body?.data;
    if (!name) {
      throw new Error("Missing valid name field.")
    };

    // Consider: what happens if the same bunny
    // is created more than once?
    const collection = await db.collection('events');
    const newBunnyRef = await collection.add({
      eventType: EVENTS.bunny.created,
      name,
      timestamp: FieldValue.serverTimestamp(),
    });
    const newBunnyDoc = await newBunnyRef.get();
    console.log("New bunny event:", newBunnyDoc);
    response
      .status(201)
      .json({ id: newBunnyDoc.id, ...newBunnyDoc.data() });
  } catch (e) {
    console.error(e);

    response
      .status(500)
      .json({ error: "Create bunny failed." })
  }
};

export default createBunny;
