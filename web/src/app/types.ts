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

export type { BunnyListItem, DashboardResponse };