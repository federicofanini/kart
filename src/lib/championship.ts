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
  racePoints: { [raceId: string]: number };
  discardedPoints: number;
  finalPoints: number;
} {
  // Handle backward compatibility
  const raceResults: { [raceId: string]: { [driverId: string]: Race } } = {};

  if (event.races) {
    // New format: multiple races
    Object.assign(raceResults, event.races);
  } else {
    // Backward compatibility: race1Results and race2Results
    if (event.race1Results) {
      raceResults["race1"] = event.race1Results;
    }
    if (event.race2Results) {
      raceResults["race2"] = event.race2Results;
    }
  }

  const driverRacePoints: { [raceId: string]: number } = {};
  let driverInfo: Driver | null = null;

  // Calculate points for each race
  Object.entries(raceResults).forEach(([raceId, raceData]) => {
    const race = raceData[driverId];
    if (race) {
      if (!driverInfo) {
        driverInfo = {
          id: driverId,
          name: race.name,
          isMaxVerstappen: race.name.toLowerCase().includes("max verstappen"),
        };
      }
      driverRacePoints[raceId] = calculateRacePoints(race, driverInfo);
    } else {
      driverRacePoints[raceId] = 0;
    }
  });

  if (!driverInfo) {
    return {
      racePoints: {},
      discardedPoints: 0,
      finalPoints: 0,
    };
  }

  // Apply discard rule: discard the worst result
  const allPoints = Object.values(driverRacePoints);
  const discardedPoints = allPoints.length > 1 ? Math.min(...allPoints) : 0;
  const finalPoints =
    allPoints.reduce((sum, points) => sum + points, 0) - discardedPoints;

  return {
    racePoints: driverRacePoints,
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
    // Handle new format
    if (event.races) {
      Object.values(event.races).forEach((raceData) => {
        Object.values(raceData).forEach((race) => {
          if (!allDrivers.has(race.id)) {
            allDrivers.set(race.id, {
              id: race.id,
              name: race.name,
              isMaxVerstappen: race.name
                .toLowerCase()
                .includes("max verstappen"),
            });
          }
        });
      });
    }

    // Handle backward compatibility
    if (event.race1Results) {
      Object.values(event.race1Results).forEach((race) => {
        if (!allDrivers.has(race.id)) {
          allDrivers.set(race.id, {
            id: race.id,
            name: race.name,
            isMaxVerstappen: race.name.toLowerCase().includes("max verstappen"),
          });
        }
      });
    }

    if (event.race2Results) {
      Object.values(event.race2Results).forEach((race) => {
        if (!allDrivers.has(race.id)) {
          allDrivers.set(race.id, {
            id: race.id,
            name: race.name,
            isMaxVerstappen: race.name.toLowerCase().includes("max verstappen"),
          });
        }
      });
    }
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
    leaders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
