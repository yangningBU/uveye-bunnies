export const COLLECTIONS = {
  config: "config",
  eventLog: "events",
  bunnies: "bunnies",
  aggregates: "aggregates",
};

export const DEFAULT_BUNNY = {
  carrotsEaten: 1,
  lettuceEaten: 1,
  playDatesHad: 1,
};

export const DEFAULT_CONFIG = {
  pointsCarrotsEaten: 3,
  pointsLettuceEaten: 1,
  pointsPlayDatesHad: 2,
  eventCountTriggerForSnapshot: 100,
};

export const DEFAULT_METRICS = {
  bunnyCount: 0,
  totalCarrotsEaten: 0,
  totalLettuceEaten: 0,
  totalPlayDatesHad: 0,
};

export const DOC_SINGLETONS = {
  config: "config",
  aggregates: "summary",
};

export const EVENTS = {
  bunny: {
    created: "bunny.created",
    carrotsEaten: "bunny.carrotsEaten",
    lettuceEaten: "bunny.lettuceEaten",
    playDateHad: "bunny.playDateHad",
  },
  config: {
    setCarrotPoints: "config.setCarrotPoints",
    setLettucePoints: "config.setLettucePoints",
    setPlayDatePoints: "config.setPlayDatePoints",
  },
  snapshot: "meta.snapshot",
};

export const HAPPINESS_FIELD_MAP = {
  carrotsEaten: "pointsCarrotsEaten",
  lettuceEaten: "pointsLettuceEaten",
  playDatesHad: "pointsPlayDatesHad",
};

export const REQUIRED_EVENT_FIELDS = {
  "bunny.created": ["name"],
  "bunny.carrotsEaten": ["bunnyId"],
  "bunny.lettuceEaten": ["bunnyId"],
  "bunny.playDateHad": ["bunnyId", "otherBunnyId"],
};

export const eventTypeToBunnyField = (eventType) => {
  return Object
    .keys(EVENTS.bunny)
    .find((field) => EVENTS.bunny[field] === eventType);
};
