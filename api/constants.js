export const DEFAULT_BUNNY = {
  carrotsEaten: 0,
  lettuceEaten: 0,
  playDatesHad: 0,
};

export const DEFAULT_CONFIG = {
  pointsCarrotsEaten: 3,
  pointsLettuceEaten: 1,
  pointsPlayDatesHad: 2,
};

export const DEFAULT_METRICS = {
  bunnyCount: 0,
  totalCarrotsEaten: 0,
  totalLettuceEaten: 0,
  totalPlayDatesHad: 0
};

export const EVENTS = {
  bunny: {
    created: "bunny.created",
    carrotsEaten: "bunny.carrots.eaten",
    lettuceEaten: "bunny.lettuce.eaten",
    playDatesHad: "bunny.playDatesHad",
  },
  config: {
    setCarrotPoints: "config.setCarrotPoints",
    setLettucePoints: "config.setLettucePoints",
    setPlayDatePoints: "config.setPlayDatePoints",
  },
};
