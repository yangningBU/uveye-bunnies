export const AGGREGATE_HAPPINESSS_FIELD_MAP = {
  totalHappiness: {
    totalCarrotsEaten: "pointsCarrotsEaten",
    totalLettuceEaten: "pointsLettuceEaten",
    totalPlayDatesHad: "pointsPlayDatesHad",
  },
};

export const COLLECTIONS = {
  config: "config",
  eventLog: "events",
  bunnies: "bunnies",
  aggregates: "aggregates",
};

export const DEFAULT_BUNNY = {
  carrotsEaten: 0,
  lettuceEaten: 0,
  playDatesHad: 0,
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

export const EVENT_TO_BUNNY_FIELD_MAP = {
  "bunny.carrotsEaten": "carrotsEaten",
  "bunny.lettuceEaten": "lettuceEaten",
  "bunny.playDateHad": "playDatesHad",
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

export const HAPPINESS_BUNNY_FIELD_CONFIG_MAP = {
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
  return EVENT_TO_BUNNY_FIELD_MAP[eventType];
};
