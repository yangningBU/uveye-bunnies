import assert from "node:assert";
import { describe, it } from "node:test";
import { DEFAULT_CONFIG, DEFAULT_METRICS } from "../constants.js";
import {
  calculateAggregatesAndEntities,
  calculateDownstreamMetrics,
} from "../utilities.js";
import {
  aggregate1,
  aggregate2,
  aggregate3,
  finalTimestampInSnapshotOneEventBundle,
  finalTimestampInSnapshotTwoEventBundle,
  timeline1,
  timeline2,
  timeline3,
} from "./data.js";

const emptyState = DEFAULT_METRICS;
const noChanges = {
  aggregates: DEFAULT_METRICS,
  entities: [],
};

function assertEntitiesHaveExpectedFields(resultEntities, expectedEntities) {
  // We"re not using assert.deepEqual because there are extra fields
  // like createdAt and updatedAt that we don"t care to compare for now
  // So we"re just comparing the fields from the expected output and
  // ensuring those are present in the result
  expectedEntities.forEach((entity) => {
    const matchingResult = resultEntities.find((b) => b.id === entity.id);
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

function findBunnyWithExistingEntities(list, bunnyId, entities, sinceTimestamp) {
  const listMatch = list.find((b) => b.id === bunnyId);
  if (listMatch) {
    return {
      bunny: listMatch,
      alreadyInList: true,
    };
  }

  const dbMatch = entities.find((b) => b.id === bunnyId);
  if (dbMatch) {
    return {
      bunny: { ...dbMatch, lastEventAppliedTimestamp: sinceTimestamp },
      alreadyInList: false,
    };
  }

  return {
    bunny: null,
    alreadyInList: false,
  };
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
      const stateStageOne = await calculateAggregatesAndEntities(
        emptyState,
        noEvents,
        findBunnySimple,
      );

      assert.deepEqual(stateStageOne, noChanges);

      const downstreamMetrics = calculateDownstreamMetrics(
        stateStageOne.aggregates,
        DEFAULT_CONFIG,
      );

      assert.deepEqual(downstreamMetrics, {
        totalHappiness: 0,
      });
    });

    it("should aggregate simple timeline without snapshot correctly", async () => {
      const stateStageOne = await calculateAggregatesAndEntities(
        emptyState,
        timeline1,
        findBunnySimple,
      );
      const downstreamMetrics = calculateDownstreamMetrics(
        stateStageOne.aggregates,
        DEFAULT_CONFIG,
      );

      const stageTwoAggregrates = {
        ...stateStageOne.aggregates,
        ...downstreamMetrics,
      };

      assert.deepEqual(stageTwoAggregrates, aggregate1.aggregates);
      assertEntitiesHaveExpectedFields(stateStageOne.entities, aggregate1.entities);
    });

    it("should aggregate timeline given the latest snapshot", async () => {
      const findBunny = (list, bunnyId) => (
        findBunnyWithExistingEntities(
          list,
          bunnyId,
          aggregate1.entities,
          finalTimestampInSnapshotOneEventBundle,
        )
      );
      const stateStageOne = await calculateAggregatesAndEntities(
        aggregate1.aggregates,
        timeline2,
        findBunny,
      );

      const downstreamMetrics = calculateDownstreamMetrics(
        stateStageOne.aggregates,
        DEFAULT_CONFIG,
      );

      const stageTwoAggregrates = {
        ...stateStageOne.aggregates,
        ...downstreamMetrics,
      };

      assert.deepEqual(stageTwoAggregrates, aggregate2.aggregates);
      assertEntitiesHaveExpectedFields(stateStageOne.entities, aggregate2.entities);
    });

    it("should double count play dates that occur after the first for a given pair", async () => {
      const findBunny = (list, bunnyId) => (
        findBunnyWithExistingEntities(
          list,
          bunnyId,
          aggregate2.entities,
          finalTimestampInSnapshotTwoEventBundle,
        )
      );

      const stateStageOne = await calculateAggregatesAndEntities(
        aggregate2.aggregates,
        timeline3,
        findBunny,
      );

      const { totalHappiness } = calculateDownstreamMetrics(
        stateStageOne.aggregates,
        DEFAULT_CONFIG,
      );

      const stageTwoAggregrates = {
        ...stateStageOne.aggregates,
        totalHappiness,
      };

      assert.deepEqual(stageTwoAggregrates, aggregate3.aggregates);
      assertEntitiesHaveExpectedFields(stateStageOne.entities, aggregate3.entities);
    });
  });
});
