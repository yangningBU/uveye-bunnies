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

interface DashboardResponse {
  bunnies: BunnyListItem[];
  bunniesCount: number;
  happinessAverage: number;
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
  EatSomethingRequest,
  DashboardResponse,
  LogEventResult,
  PlayDateEventRequest,
};