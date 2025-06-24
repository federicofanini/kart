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
  const races: { [raceId: string]: Race } = {};
  let driverInfo: Driver | null = null;

  // Calculate points for each race and store race data
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
      races[raceId] = race;
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

  // Apply discard rule: discard the worst result per event
  // Check if any race has manual override (isDropped = true)
  let discardedPoints = 0;
  const manuallyDroppedRace = Object.entries(races).find(
    ([, race]) => race.isDropped
  );

  if (manuallyDroppedRace) {
    // Use manually dropped race
    const [droppedRaceId] = manuallyDroppedRace;
    discardedPoints = driverRacePoints[droppedRaceId] || 0;
  } else {
    // Auto-drop worst result if there are multiple races
    const allPoints = Object.values(driverRacePoints);
    discardedPoints = allPoints.length > 1 ? Math.min(...allPoints) : 0;
  }

  const finalPoints =
    Object.values(driverRacePoints).reduce((sum, points) => sum + points, 0) -
    discardedPoints;

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

export function toggleWorstResult(
  championship: Championship,
  driverId: string,
  eventId: string,
  raceId: string
): Championship {
  // Find the event and race
  const event = championship.events.find((e) => e.id === eventId);
  if (!event) return championship;

  let race: Race | undefined;
  let updatedEvent = { ...event };

  // Handle both new format and backward compatibility
  if (raceId === "race1" || raceId === "race2") {
    // Backward compatibility
    const raceResults =
      event[raceId === "race1" ? "race1Results" : "race2Results"];
    if (raceResults && raceResults[driverId]) {
      race = raceResults[driverId];
      const updatedRaceResults = {
        ...raceResults,
        [driverId]: {
          ...race,
          isDropped: !race.isDropped, // Toggle the dropped status
        },
      };
      updatedEvent = {
        ...event,
        [raceId === "race1" ? "race1Results" : "race2Results"]:
          updatedRaceResults,
      };
    }
  } else {
    // New format
    if (event.races && event.races[raceId] && event.races[raceId][driverId]) {
      race = event.races[raceId][driverId];
      const updatedRace = {
        ...race,
        isDropped: !race.isDropped, // Toggle the dropped status
      };
      updatedEvent = {
        ...event,
        races: {
          ...event.races,
          [raceId]: {
            ...event.races[raceId],
            [driverId]: updatedRace,
          },
        },
      };
    }
  }

  // Update the championship with the modified event
  const updatedChampionship = {
    ...championship,
    events: championship.events.map((e) =>
      e.id === eventId ? updatedEvent : e
    ),
  };

  return updatedChampionship;
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
