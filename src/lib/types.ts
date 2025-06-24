export interface Driver {
  id: string;
  name: string;
  number?: number;
  isMaxVerstappen?: boolean; // Special rule for Max Verstappen
}

export interface Race {
  id: string;
  name: string;
  position: number; // 1-15
  polePosition: boolean;
  fastestLap: boolean;
  mostConsistent: boolean;
  participated: boolean;
}

export interface Event {
  id: string;
  name: string;
  date: string;
  race1Results: { [driverId: string]: Race };
  race2Results: { [driverId: string]: Race };
}

export interface Championship {
  id: string;
  name: string;
  season: string;
  drivers: Driver[];
  events: Event[];
  leaders: ChampionshipLeader[];
  createdAt: string;
  updatedAt: string;
}

export interface ChampionshipLeader {
  id: string;
  name: string;
  email: string;
  token: string;
  isCreator: boolean;
  createdAt: string;
}

export interface DriverStandings {
  driver: Driver;
  totalPoints: number;
  raceResults: Array<{
    eventId: string;
    race1Points: number;
    race2Points: number;
    discardedPoints: number; // The worse result that was discarded
    finalPoints: number; // race1Points + race2Points - discardedPoints
  }>;
}

export const POSITION_POINTS: { [position: number]: number } = {
  1: 20,
  2: 17,
  3: 15,
  4: 13,
  5: 11,
  6: 9,
  7: 7,
  8: 5,
  9: 3,
  10: 1,
  11: 0,
  12: 0,
  13: 0,
  14: 0,
  15: 0,
};

export const BONUS_POINTS = {
  PARTICIPATION: 5,
  POLE_POSITION: 2,
  FASTEST_LAP: 2,
  MOST_CONSISTENT: 2,
} as const;
