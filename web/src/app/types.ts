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

export type { BunnyDetailModel, BunnyListItem, DashboardResponse };