import { COLLECTIONS, DOC_SINGLETONS } from "../constants.js";
import {
  createNewSnapshot,
  getConfig,
} from "../utilities.js";

const onCreateListener = async (db, _fireBaseEvent) => {
  const config = await getConfig(db);
  const currentAggregate = await db
    .collection(COLLECTIONS.aggregates)
    .doc(DOC_SINGLETONS.aggregates)
    .get();
  const eventCount = currentAggregate?.data()?.incrementalEventCount ?? 0;
  console.debug(`There have been ${eventCount} events since last snapshot.`);
  console.debug(
    "We're triggering a new snapshot at " +
    `${config.eventCountTriggerForSnapshot} incremental events.`,
  );
  if (eventCount >= config.eventCountTriggerForSnapshot) {
    console.debug("Event count surpasses cutoff Creating new snapshot.");
    await createNewSnapshot(db);
  } else {
    console.debug("Event count under cutoff. Doing nothing.");
  }
};

export default onCreateListener;
