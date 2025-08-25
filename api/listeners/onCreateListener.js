import { COLLECTIONS } from "../constants.js";
import {
  createNewSnapshot,
  getConfig,
  getLastSnapshot,
  getCutOffTimestamp,
} from "../utilities.js";

const onCreateListener = async (db, fireBaseEvent) => {
  console.debug("!!onCreate triggered. Event: ", fireBaseEvent);
  console.debug("Counting events since last snapshot.");
  const config = await getConfig();
  const lastSnapshot = await getLastSnapshot(db);
  const cutOffTimestamp = await getCutOffTimestamp(db, lastSnapshot);
  const eventCountQuery = await db
    .collection(COLLECTIONS.eventLog)
    .where("timestamp", ">=", cutOffTimestamp)
    .count()
    .get();
  const eventCount = eventCountQuery.data().count;
  console.debug(`There have been ${eventCount} events since last snapshot.`);

  if (eventCount >= config.eventCountTriggerForSnapshot) {
    console.debug("Event count surpasses cutoff.");
    createNewSnapshot(db);
  } else {
    console.debug("Event count under cutoff. Doing nothing.");
  }
};

export default onCreateListener;
