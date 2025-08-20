import { getRandomInt, recordBunny, updateAggregates } from "../utilities.js";

const onCreateListener = (db, fireBaseEvent) => {
  console.log("!! onCreate triggered. Event: ", fireBaseEvent);
  switch (e.eventType) {
    case EVENTS.bunny.created: {
      const newBunny = {
        ...DEFAULT_BUNNY,
        ...{ name: `Sample ${getRandomInt(0, 1000)}` }
      };
      recordBunny(db, newBunny);
      updateAggregates(db);
      break;
    }
    case EVENTS.bunny.carrotsEaten:
    case EVENTS.bunny.lettuceEaten:
    case EVENTS.bunny.playDatesHad:
      updateAggregates(db);
      break;
    default:
      console.log("Event listener ignoring event.")
  }
};

export default onCreateListener;
