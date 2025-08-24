interface BunnyDetailModel {
  id: string;
  name: string;
  carrotsEaten: number;
  lettuceEaten: number;
  playDatesHad: number;
  happiness: number;
}

interface BunnyListItem {
  id: string;
  name: string;
  happinessCount: number;
}

interface ConfigDetail {
  pointsCarrotsEaten: number;
  pointsLettuceEaten: number;
  pointsPlayDatesHad: number;
  eventCountTriggerForSnapshot: number;
}

interface DashboardResponse {
  bunnies: BunnyListItem[];
  bunniesCount: number;
  happinessAverage: number;
  happinessTotal: number;
}

interface EatSomethingRequest {
  eventType: string;
  bunnyId: string;
}

interface LogEventResult {
  count: number;
  happiness: number;
}

interface PlayDateEventRequest {
  eventType: string;
  bunnyId: string;
  otherBunnyId: string;
}

export type {
  BunnyDetailModel,
  BunnyListItem,
  ConfigDetail,
  DashboardResponse,
  EatSomethingRequest,
  LogEventResult,
  PlayDateEventRequest,
};