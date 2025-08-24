import assert from "node:assert";
import { describe, it } from "node:test";
import { DEFAULT_CONFIG, DEFAULT_METRICS, EVENTS } from "../constants.js";
import {
  calculateAggregatesAndEntities,
  calculateDownstreamMetrics,
} from "../utilities.js";

const emptyState = DEFAULT_METRICS;
const noChanges = {
  aggregates: DEFAULT_METRICS,
  entities: [],
};

function assertEntitiesHaveExpectedFields(result, expectedEntities) {
  // We"re not using assert.deepEqual because there are extra fields
  // like createdAt and updatedAt that we don"t care to compare for now
  // So we"re just comparing the fields from the expected output and
  // ensuring those are present in the result
  expectedEntities.forEach((entity) => {
    const matchingResult = result.entities.find((b) => b.id === entity.id);
    Object.keys(entity).forEach((key) => {
      assert.equal(
        entity[key],
        matchingResult[key],
        `Supposed to be ${entity[key]} but got ${matchingResult[key]} ` +
        `for ${key}. Expected: ${JSON.stringify(entity)}, ` +
        `Result: ${JSON.stringify(matchingResult)}`,
      );
    });
  });
}

const finalTimestampInSnapshotOneEventBundle = new Date("2023-01-01T00:08:00Z");
const simpleTimeline = [
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

const snapshot1 = {
  aggregates: {
    bunnyCount: 3,
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

const expectedTotalHappiness1 = 3 * 3 + 2 * 1 + 2 * 1 * 2;

const timeline2 = [
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

const snapshot2 = {
  aggregates: {
    bunnyCount: 4,
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

const expectedTotalHappiness2 = 6 * 3 + 2 * 1 + 2 * 2 * 2;

describe("state calculations", () => {
  describe("aggregated state", () => {
    const findBunnySimple = (list, id) => {
      const match = list.find((b) => b.id === id);
      return {
        bunny: match ?? null,
        alreadyInList: !!match,
      };
    };

    it("should take an empty state and return the same", async () => {
      const noEvents = [];
      const result = await calculateAggregatesAndEntities(
        emptyState,
        noEvents,
        findBunnySimple,
      );

      assert.deepEqual(result, noChanges);

      const { totalHappiness } = calculateDownstreamMetrics(
        result.aggregates,
        DEFAULT_CONFIG,
      );

      assert.equal(totalHappiness, 0);
    });

    it(
      "should aggregate simple timeline without snapshot correctly",
      async () => {
        const result = await calculateAggregatesAndEntities(
          emptyState,
          simpleTimeline,
          findBunnySimple,
        );

        assert.deepEqual(result.aggregates, snapshot1.aggregates);
        assertEntitiesHaveExpectedFields(result, snapshot1.entities);

        const { totalHappiness } = calculateDownstreamMetrics(
          result.aggregates,
          DEFAULT_CONFIG,
        );

        assert.equal(totalHappiness, expectedTotalHappiness1);
      });

    const findBunnyWithExistingEntities = (list, bunnyId) => {
      const listMatch = list.find((b) => b.id === bunnyId);
      if (listMatch) {
        return {
          bunny: listMatch,
          alreadyInList: true,
        };
      }

      const dbMatch = snapshot1.entities.find((b) => b.id === bunnyId);
      if (dbMatch) {
        return {
          bunny: {
            ...dbMatch,
            lastEventAppliedTimestamp: finalTimestampInSnapshotOneEventBundle,
          },
          alreadyInList: false,
        };
      }

      return {
        bunny: null,
        alreadyInList: false,
      };
    };

    it("should aggregate timeline given the latest snapshot", async () => {
      const result = await calculateAggregatesAndEntities(
        snapshot1.aggregates,
        timeline2,
        findBunnyWithExistingEntities,
      );

      assert.deepEqual(result.aggregates, snapshot2.aggregates);
      assertEntitiesHaveExpectedFields(result, snapshot2.entities);

      const { totalHappiness } = calculateDownstreamMetrics(
        result.aggregates,
        DEFAULT_CONFIG,
      );

      assert.equal(totalHappiness, expectedTotalHappiness2);
    });

    // include play date with bunny that already happened
  });
});
