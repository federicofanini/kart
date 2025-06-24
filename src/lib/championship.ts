import {
  Driver,
  Race,
  Event,
  Championship,
  DriverStandings,
  POSITION_POINTS,
  BONUS_POINTS,
} from "./types";

/**
 * Calculate points for a single race result according to championship rules
 * @param race - The race result
 * @param driver - The driver information
 * @returns Total points earned in the race
 */
export function calculateRacePoints(race: Race, driver: Driver): number {
  if (!race || !driver) {
    console.warn("Invalid race or driver data provided to calculateRacePoints");
    return 0;
  }

  let points = 0;

  // Position points (1st-10th place get points, 11th-15th get 0)
  if (race.participated && race.position >= 1 && race.position <= 15) {
    const positionPoints = POSITION_POINTS[race.position] || 0;
    points += positionPoints;

    console.log(
      `Driver ${driver.name} - Position ${race.position}: ${positionPoints} points`
    );
  }

  // Participation bonus: +5 points for all participants EXCEPT Max Verstappen
  if (race.participated && !driver.isMaxVerstappen) {
    points += BONUS_POINTS.PARTICIPATION;
    console.log(
      `Driver ${driver.name} - Participation bonus: ${BONUS_POINTS.PARTICIPATION} points`
    );
  }

  // Pole position bonus: +2 points
  if (race.polePosition) {
    points += BONUS_POINTS.POLE_POSITION;
    console.log(
      `Driver ${driver.name} - Pole position bonus: ${BONUS_POINTS.POLE_POSITION} points`
    );
  }

  // Fastest lap bonus: +2 points
  if (race.fastestLap) {
    points += BONUS_POINTS.FASTEST_LAP;
    console.log(
      `Driver ${driver.name} - Fastest lap bonus: ${BONUS_POINTS.FASTEST_LAP} points`
    );
  }

  // Most consistent driver bonus: +2 points
  if (race.mostConsistent) {
    points += BONUS_POINTS.MOST_CONSISTENT;
    console.log(
      `Driver ${driver.name} - Most consistent bonus: ${BONUS_POINTS.MOST_CONSISTENT} points`
    );
  }

  console.log(`Driver ${driver.name} - Total race points: ${points}`);
  return points;
}

/**
 * Calculate points for a single event (applies drop rule per event)
 * @param event - The event containing multiple races
 * @param driverId - The driver ID
 * @returns Event points breakdown with drop rule applied
 */
export function calculateEventPoints(
  event: Event,
  driverId: string
): {
  racePoints: { [raceId: string]: number };
  discardedPoints: number;
  finalPoints: number;
} {
  if (!event || !driverId) {
    console.warn("Invalid event or driverId provided to calculateEventPoints");
    return {
      racePoints: {},
      discardedPoints: 0,
      finalPoints: 0,
    };
  }

  // Handle backward compatibility - collect all race results
  const raceResults: { [raceId: string]: { [driverId: string]: Race } } = {};

  // New format: multiple races
  if (event.races && typeof event.races === "object") {
    Object.assign(raceResults, event.races);
  }

  // Backward compatibility: race1Results and race2Results
  if (event.race1Results && typeof event.race1Results === "object") {
    raceResults["race1"] = event.race1Results;
  }
  if (event.race2Results && typeof event.race2Results === "object") {
    raceResults["race2"] = event.race2Results;
  }

  const driverRacePoints: { [raceId: string]: number } = {};
  const races: { [raceId: string]: Race } = {};
  let driverInfo: Driver | null = null;

  // Calculate points for each race and store race data
  Object.entries(raceResults).forEach(([raceId, raceData]) => {
    if (!raceData || typeof raceData !== "object") {
      console.warn(`Invalid race data for race ${raceId}`);
      driverRacePoints[raceId] = 0;
      return;
    }

    const race = raceData[driverId];
    if (race && typeof race === "object") {
      // Create driver info from race data if not already set
      if (!driverInfo) {
        driverInfo = {
          id: driverId,
          name: race.name || "Unknown Driver",
          isMaxVerstappen: race.name
            ? race.name.toLowerCase().includes("max verstappen")
            : false,
        };
      }

      races[raceId] = race;
      driverRacePoints[raceId] = calculateRacePoints(race, driverInfo);
    } else {
      // Driver didn't participate in this race
      driverRacePoints[raceId] = 0;
    }
  });

  // No driver info means no participation
  if (!driverInfo) {
    return {
      racePoints: {},
      discardedPoints: 0,
      finalPoints: 0,
    };
  }

  // At this point driverInfo is guaranteed to be non-null
  const driver = driverInfo as Driver;

  // Apply discard rule: discard the worst result per event
  // Check if any race has manual override (isDropped = true)
  let discardedPoints = 0;
  const manuallyDroppedRace = Object.entries(races).find(
    ([, race]) => race.isDropped === true
  );

  if (manuallyDroppedRace) {
    // Use manually dropped race
    const [droppedRaceId] = manuallyDroppedRace;
    discardedPoints = driverRacePoints[droppedRaceId] || 0;
    console.log(
      `Driver ${driver.name} - Manual drop: ${discardedPoints} points from race ${droppedRaceId}`
    );
  } else {
    // Auto-drop worst result if there are multiple races
    const allPoints = Object.values(driverRacePoints).filter(
      (points) => points !== undefined
    );
    if (allPoints.length > 1) {
      discardedPoints = Math.min(...allPoints);
      console.log(
        `Driver ${driver.name} - Auto drop worst result: ${discardedPoints} points`
      );
    } else {
      discardedPoints = 0;
    }
  }

  const totalPoints = Object.values(driverRacePoints).reduce(
    (sum, points) => sum + (points || 0),
    0
  );
  const finalPoints = Math.max(0, totalPoints - discardedPoints);

  console.log(
    `Driver ${driver.name} - Event total: ${totalPoints}, Discarded: ${discardedPoints}, Final: ${finalPoints}`
  );

  return {
    racePoints: driverRacePoints,
    discardedPoints,
    finalPoints,
  };
}

/**
 * Calculate championship standings from all events
 * @param championship - The championship data
 * @returns Sorted standings array
 */
export function calculateChampionshipStandings(
  championship: Championship
): DriverStandings[] {
  if (!championship || !Array.isArray(championship.events)) {
    console.warn(
      "Invalid championship data provided to calculateChampionshipStandings"
    );
    return [];
  }

  const standings: DriverStandings[] = [];

  // Get all unique drivers from all events
  const allDrivers = new Map<string, Driver>();

  championship.events.forEach((event, eventIndex) => {
    if (!event || typeof event !== "object") {
      console.warn(`Invalid event data at index ${eventIndex}`);
      return;
    }

    // Handle new format
    if (event.races && typeof event.races === "object") {
      Object.values(event.races).forEach((raceData) => {
        if (raceData && typeof raceData === "object") {
          Object.values(raceData).forEach((race) => {
            if (race && typeof race === "object" && race.id && race.name) {
              if (!allDrivers.has(race.id)) {
                allDrivers.set(race.id, {
                  id: race.id,
                  name: race.name,
                  isMaxVerstappen: race.name
                    .toLowerCase()
                    .includes("max verstappen"),
                });
              }
            }
          });
        }
      });
    }

    // Handle backward compatibility
    const legacyRaces = [
      { key: "race1Results", raceId: "race1" },
      { key: "race2Results", raceId: "race2" },
    ];

    legacyRaces.forEach(({ key }) => {
      if (key === "race1Results" && event.race1Results) {
        Object.values(event.race1Results).forEach((race) => {
          if (race && typeof race === "object" && race.id && race.name) {
            if (!allDrivers.has(race.id)) {
              allDrivers.set(race.id, {
                id: race.id,
                name: race.name,
                isMaxVerstappen: race.name
                  .toLowerCase()
                  .includes("max verstappen"),
              });
            }
          }
        });
      } else if (key === "race2Results" && event.race2Results) {
        Object.values(event.race2Results).forEach((race) => {
          if (race && typeof race === "object" && race.id && race.name) {
            if (!allDrivers.has(race.id)) {
              allDrivers.set(race.id, {
                id: race.id,
                name: race.name,
                isMaxVerstappen: race.name
                  .toLowerCase()
                  .includes("max verstappen"),
              });
            }
          }
        });
      }
    });
  });

  // Calculate standings for each driver
  allDrivers.forEach((driver, driverId) => {
    const raceResults = championship.events.map((event) => {
      const eventPoints = calculateEventPoints(event, driverId);
      return {
        eventId: event.id,
        ...eventPoints,
      };
    });

    const totalPoints = raceResults.reduce(
      (sum, result) => sum + (result.finalPoints || 0),
      0
    );

    standings.push({
      driver,
      totalPoints,
      raceResults,
    });
  });

  // Sort by total points (descending), then by name for ties
  return standings.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) {
      return b.totalPoints - a.totalPoints;
    }
    return a.driver.name.localeCompare(b.driver.name);
  });
}

/**
 * Toggle the drop status of a specific race result
 * @param championship - The championship data
 * @param driverId - The driver ID
 * @param eventId - The event ID
 * @param raceId - The race ID
 * @returns Updated championship data
 */
export function toggleWorstResult(
  championship: Championship,
  driverId: string,
  eventId: string,
  raceId: string
): Championship {
  if (!championship || !driverId || !eventId || !raceId) {
    console.warn("Invalid parameters provided to toggleWorstResult");
    return championship;
  }

  const updatedChampionship = { ...championship };
  const event = updatedChampionship.events.find((e) => e.id === eventId);

  if (!event) {
    console.warn(`Event ${eventId} not found`);
    return championship;
  }

  let race: Race | undefined;
  let raceLocation: "new" | "legacy" | null = null;

  // Check new format first
  if (event.races && event.races[raceId] && event.races[raceId][driverId]) {
    race = event.races[raceId][driverId];
    raceLocation = "new";
  }
  // Check legacy format
  else if (
    raceId === "race1" &&
    event.race1Results &&
    event.race1Results[driverId]
  ) {
    race = event.race1Results[driverId];
    raceLocation = "legacy";
  } else if (
    raceId === "race2" &&
    event.race2Results &&
    event.race2Results[driverId]
  ) {
    race = event.race2Results[driverId];
    raceLocation = "legacy";
  }

  if (!race || !raceLocation) {
    console.warn(
      `Race result not found for driver ${driverId} in event ${eventId}, race ${raceId}`
    );
    return championship;
  }

  // Toggle the drop status
  const updatedRace = { ...race, isDropped: !race.isDropped };

  // Update the race in the appropriate location
  if (raceLocation === "new") {
    updatedChampionship.events = updatedChampionship.events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            races: {
              ...e.races,
              [raceId]: {
                ...e.races![raceId],
                [driverId]: updatedRace,
              },
            },
          }
        : e
    );
  } else {
    // Legacy format
    const resultsKey = raceId === "race1" ? "race1Results" : "race2Results";
    updatedChampionship.events = updatedChampionship.events.map((e) =>
      e.id === eventId
        ? {
            ...e,
            [resultsKey]: {
              ...e[resultsKey],
              [driverId]: updatedRace,
            },
          }
        : e
    );
  }

  console.log(
    `Toggled drop status for driver ${driverId} in event ${eventId}, race ${raceId}: ${
      updatedRace.isDropped ? "DROPPED" : "ACTIVE"
    }`
  );
  return updatedChampionship;
}

// Sample data for testing
export function createSampleChampionship(): Championship {
  return {
    id: "championship-2025",
    name: "Campionato Kart 2025",
    season: "2025",
    drivers: [],
    events: [],
    leaders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
