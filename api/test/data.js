
import { EVENTS } from "../constants.js";

export const finalTimestampInSnapshotOneEventBundle = new Date("2023-01-01T00:08:00Z");
export const timeline1 = [
  {
    eventType: EVENTS.bunny.created,
    id: 100,
    name: "Arnold",
    timestamp: new Date("2023-01-01T00:00:00Z"),
  },
  {
    eventType: EVENTS.bunny.carrotsEaten,
    bunnyId: 100,
    timestamp: new Date("2023-01-01T00:01:00Z"),
  },
  {
    eventType: EVENTS.bunny.created,
    id: 101,
    name: "Fluffy",
    timestamp: new Date("2023-01-01T00:02:00Z"),
  },
  {
    eventType: EVENTS.bunny.carrotsEaten,
    bunnyId: 101,
    timestamp: new Date("2023-01-01T00:03:00Z"),
  },
  {
    eventType: EVENTS.bunny.lettuceEaten,
    bunnyId: 100,
    timestamp: new Date("2023-01-01T00:04:00Z"),
  },
  {
    eventType: EVENTS.bunny.created,
    id: 102,
    name: "Ralphy",
    timestamp: new Date("2023-01-01T00:05:00Z"),
  },
  {
    eventType: EVENTS.bunny.carrotsEaten,
    bunnyId: 102,
    timestamp: new Date("2023-01-01T00:06:00Z"),
  },
  {
    eventType: EVENTS.bunny.lettuceEaten,
    bunnyId: 101,
    timestamp: new Date("2023-01-01T00:07:00Z"),
  },
  {
    eventType: EVENTS.bunny.playDateHad,
    bunnyId: 101,
    otherBunnyId: 102,
    timestamp: finalTimestampInSnapshotOneEventBundle,
  },
];

export const snapshot1 = {
  aggregates: {
    bunnyCount: 3,
    eventCount: 9,
    totalCarrotsEaten: 3,
    totalLettuceEaten: 2,
    totalPlayDatesHad: 1,
  },
  entities: [
    {
      id: 100,
      name: "Arnold",
      carrotsEaten: 1,
      lettuceEaten: 1,
      playDatesHad: 0,
    },
    {
      id: 101,
      name: "Fluffy",
      carrotsEaten: 1,
      lettuceEaten: 1,
      playDatesHad: 1,
    },
    {
      id: 102,
      name: "Ralphy",
      carrotsEaten: 1,
      lettuceEaten: 0,
      playDatesHad: 1,
    },
  ],
};

export const expectedTotalHappiness1 = 3 * 3 + 2 * 1 + 2 * 1 * 2;

export const timeline2 = [
  {
    eventType: EVENTS.bunny.created,
    id: 200,
    name: "Howard",
    timestamp: new Date("2023-01-02T00:00:00Z"),
  },
  {
    eventType: EVENTS.bunny.carrotsEaten,
    bunnyId: 100,
    timestamp: new Date("2023-01-02T00:01:00Z"),
  },
  {
    eventType: EVENTS.bunny.carrotsEaten,
    bunnyId: 101,
    timestamp: new Date("2023-01-02T00:02:00Z"),
  },
  {
    eventType: EVENTS.bunny.carrotsEaten,
    bunnyId: 200,
    timestamp: new Date("2023-01-02T00:03:00Z"),
  },
  {
    eventType: EVENTS.bunny.playDateHad,
    bunnyId: 100,
    otherBunnyId: 200,
    timestamp: new Date("2023-01-02T00:04:00Z"),
  },
];

export const snapshot2 = {
  aggregates: {
    bunnyCount: 4,
    eventCount: 14,
    totalCarrotsEaten: 6,
    totalLettuceEaten: 2,
    totalPlayDatesHad: 2,
  },
  entities: [
    {
      id: 100,
      name: "Arnold",
      carrotsEaten: 2,
      lettuceEaten: 1,
      playDatesHad: 1,
    },
    {
      id: 101,
      name: "Fluffy",
      carrotsEaten: 2,
      lettuceEaten: 1,
      playDatesHad: 1,
    },
    {
      id: 200,
      name: "Howard",
      carrotsEaten: 1,
      lettuceEaten: 0,
      playDatesHad: 1,
    },
  ],
};

export const expectedTotalHappiness2 = 6 * 3 + 2 * 1 + 2 * 2 * 2;
