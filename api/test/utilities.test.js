import assert from "node:assert";
import { describe, it } from "node:test";
import { DEFAULT_CONFIG, DEFAULT_METRICS } from "../constants.js";
import {
  calculateAggregatesAndEntities,
  calculateDownstreamMetrics,
} from "../utilities.js";
import {
  expectedTotalHappiness1,
  expectedTotalHappiness2,
  finalTimestampInSnapshotOneEventBundle,
  snapshot1,
  snapshot2,
  timeline1,
  timeline2,
} from "./data.js";

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
          timeline1,
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
  });
});
