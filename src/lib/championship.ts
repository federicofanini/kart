import {
  Driver,
  Race,
  Event,
  Championship,
  DriverStandings,
  POSITION_POINTS,
  BONUS_POINTS,
} from "./types";

export function calculateRacePoints(race: Race, driver: Driver): number {
  let points = 0;

  // Position points
  if (race.participated && race.position >= 1 && race.position <= 15) {
    points += POSITION_POINTS[race.position];
  }

  // Bonus points
  if (race.participated && !driver.isMaxVerstappen) {
    points += BONUS_POINTS.PARTICIPATION;
  }

  if (race.polePosition) {
    points += BONUS_POINTS.POLE_POSITION;
  }

  if (race.fastestLap) {
    points += BONUS_POINTS.FASTEST_LAP;
  }

  if (race.mostConsistent) {
    points += BONUS_POINTS.MOST_CONSISTENT;
  }

  return points;
}

export function calculateEventPoints(
  event: Event,
  driverId: string
): {
  race1Points: number;
  race2Points: number;
  discardedPoints: number;
  finalPoints: number;
} {
  const driver = event.race1Results[driverId] || event.race2Results[driverId];
  if (!driver) {
    return {
      race1Points: 0,
      race2Points: 0,
      discardedPoints: 0,
      finalPoints: 0,
    };
  }

  // Find driver info from the race data
  const driverInfo: Driver = {
    id: driverId,
    name: driver.name,
    isMaxVerstappen: driver.name.toLowerCase().includes("max verstappen"),
  };

  const race1 = event.race1Results[driverId];
  const race2 = event.race2Results[driverId];

  const race1Points = race1 ? calculateRacePoints(race1, driverInfo) : 0;
  const race2Points = race2 ? calculateRacePoints(race2, driverInfo) : 0;

  // Apply discard rule: discard the worse result
  const discardedPoints = Math.min(race1Points, race2Points);
  const finalPoints = race1Points + race2Points - discardedPoints;

  return {
    race1Points,
    race2Points,
    discardedPoints,
    finalPoints,
  };
}

export function calculateChampionshipStandings(
  championship: Championship
): DriverStandings[] {
  const standings: DriverStandings[] = [];

  // Get all unique drivers from all events
  const allDrivers = new Map<string, Driver>();

  championship.events.forEach((event) => {
    Object.values(event.race1Results).forEach((race) => {
      if (!allDrivers.has(race.id)) {
        allDrivers.set(race.id, {
          id: race.id,
          name: race.name,
          isMaxVerstappen: race.name.toLowerCase().includes("max verstappen"),
        });
      }
    });
    Object.values(event.race2Results).forEach((race) => {
      if (!allDrivers.has(race.id)) {
        allDrivers.set(race.id, {
          id: race.id,
          name: race.name,
          isMaxVerstappen: race.name.toLowerCase().includes("max verstappen"),
        });
      }
    });
  });

  allDrivers.forEach((driver, driverId) => {
    const raceResults = championship.events.map((event) => {
      const eventPoints = calculateEventPoints(event, driverId);
      return {
        eventId: event.id,
        ...eventPoints,
      };
    });

    const totalPoints = raceResults.reduce(
      (sum, result) => sum + result.finalPoints,
      0
    );

    standings.push({
      driver,
      totalPoints,
      raceResults,
    });
  });

  // Sort by total points (descending)
  return standings.sort((a, b) => b.totalPoints - a.totalPoints);
}

// Sample data for testing
export function createSampleChampionship(): Championship {
  return {
    id: "championship-2024",
    name: "Campionato Kart 2024",
    season: "2024",
    drivers: [],
    events: [],
  };
}
