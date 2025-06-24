import { NextResponse } from "next/server";
import { redis, REDIS_KEYS, redisUtils } from "@/lib/redis-simplified";
import { Championship, Race } from "@/lib/types";
import { calculateChampionshipStandings } from "@/lib/championship";

interface RaceStatistics {
  totalEvents: number;
  totalRaces: number;
  totalDrivers: number;
  uniqueDrivers: number;
  averageDriversPerRace: number;
  mostActiveDriver: {
    name: string;
    racesParticipated: number;
  };
  topPerformers: {
    mostWins: { name: string; wins: number };
    mostPoles: { name: string; poles: number };
    mostFastestLaps: { name: string; fastestLaps: number };
    mostConsistent: { name: string; consistentRaces: number };
  };
  championshipProgress: {
    leader: string;
    points: number;
    margin: number;
  };
}

/**
 * GET /api/statistics
 * Retrieves comprehensive race statistics
 */
export async function GET() {
  try {
    console.log("[Statistics API] GET: Fetching race statistics...");

    // Health check Redis connection
    const isHealthy = await redisUtils.healthCheck();
    if (!isHealthy) {
      console.error("[Statistics API] GET: Redis health check failed");
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    // Get championship data
    const championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);

    if (!championship) {
      console.log("[Statistics API] GET: No championship data found");
      return NextResponse.json({
        totalEvents: 0,
        totalRaces: 0,
        totalDrivers: 0,
        uniqueDrivers: 0,
        averageDriversPerRace: 0,
        mostActiveDriver: { name: "N/A", racesParticipated: 0 },
        topPerformers: {
          mostWins: { name: "N/A", wins: 0 },
          mostPoles: { name: "N/A", poles: 0 },
          mostFastestLaps: { name: "N/A", fastestLaps: 0 },
          mostConsistent: { name: "N/A", consistentRaces: 0 },
        },
        championshipProgress: {
          leader: "N/A",
          points: 0,
          margin: 0,
        },
      });
    }

    // Calculate statistics
    const stats = calculateRaceStatistics(championship);

    // Cache statistics for 5 minutes
    try {
      await redis.set(REDIS_KEYS.STATISTICS, stats, { ex: 300 });
      console.log("[Statistics API] GET: Statistics cached successfully");
    } catch (cacheError) {
      console.warn(
        "[Statistics API] GET: Failed to cache statistics:",
        cacheError
      );
    }

    console.log("[Statistics API] GET: Statistics calculated successfully");
    return NextResponse.json(stats);
  } catch (error) {
    console.error("[Statistics API] GET: Failed to fetch statistics:", error);
    return NextResponse.json(
      {
        error: "Failed to fetch statistics",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * Calculate comprehensive race statistics from championship data
 */
function calculateRaceStatistics(championship: Championship): RaceStatistics {
  const driverStats = new Map<
    string,
    {
      name: string;
      racesParticipated: number;
      wins: number;
      poles: number;
      fastestLaps: number;
      consistentRaces: number;
    }
  >();

  let totalRaces = 0;
  let totalDriverResults = 0;

  // Process all events
  championship.events.forEach((event) => {
    // Process new format races
    if (event.races && typeof event.races === "object") {
      Object.entries(event.races).forEach(([, raceData]) => {
        if (raceData && typeof raceData === "object") {
          totalRaces++;
          Object.values(raceData).forEach((race) => {
            if (race && typeof race === "object") {
              totalDriverResults++;

              if (!driverStats.has(race.id)) {
                driverStats.set(race.id, {
                  name: race.name,
                  racesParticipated: 0,
                  wins: 0,
                  poles: 0,
                  fastestLaps: 0,
                  consistentRaces: 0,
                });
              }

              const driver = driverStats.get(race.id)!;

              if (race.participated) {
                driver.racesParticipated++;

                if (race.position === 1) {
                  driver.wins++;
                }

                if (race.polePosition) {
                  driver.poles++;
                }

                if (race.fastestLap) {
                  driver.fastestLaps++;
                }

                if (race.mostConsistent) {
                  driver.consistentRaces++;
                }
              }
            }
          });
        }
      });
    }

    // Process legacy format races
    ["race1Results", "race2Results"].forEach((key) => {
      const raceResults = event[key as keyof typeof event] as
        | { [driverId: string]: Race }
        | undefined;
      if (raceResults && typeof raceResults === "object") {
        totalRaces++;
        Object.values(raceResults).forEach((race) => {
          if (race && typeof race === "object" && race.id && race.name) {
            totalDriverResults++;

            if (!driverStats.has(race.id)) {
              driverStats.set(race.id, {
                name: race.name,
                racesParticipated: 0,
                wins: 0,
                poles: 0,
                fastestLaps: 0,
                consistentRaces: 0,
              });
            }

            const driver = driverStats.get(race.id)!;

            if (race.participated) {
              driver.racesParticipated++;

              if (race.position === 1) {
                driver.wins++;
              }

              if (race.polePosition) {
                driver.poles++;
              }

              if (race.fastestLap) {
                driver.fastestLaps++;
              }

              if (race.mostConsistent) {
                driver.consistentRaces++;
              }
            }
          }
        });
      }
    });
  });

  // Find top performers
  const drivers = Array.from(driverStats.values());

  const mostActiveDriver = drivers.reduce(
    (max, driver) =>
      driver.racesParticipated > max.racesParticipated ? driver : max,
    { name: "N/A", racesParticipated: 0 }
  );

  const mostWins = drivers.reduce(
    (max, driver) => (driver.wins > max.wins ? driver : max),
    { name: "N/A", wins: 0 }
  );

  const mostPoles = drivers.reduce(
    (max, driver) => (driver.poles > max.poles ? driver : max),
    { name: "N/A", poles: 0 }
  );

  const mostFastestLaps = drivers.reduce(
    (max, driver) => (driver.fastestLaps > max.fastestLaps ? driver : max),
    { name: "N/A", fastestLaps: 0 }
  );

  const mostConsistent = drivers.reduce(
    (max, driver) =>
      driver.consistentRaces > max.consistentRaces ? driver : max,
    { name: "N/A", consistentRaces: 0 }
  );

  // Calculate championship standings
  const standings = calculateChampionshipStandings(championship);
  const leader = standings[0];
  const secondPlace = standings[1];

  const championshipProgress = {
    leader: leader?.driver.name || "N/A",
    points: leader?.totalPoints || 0,
    margin:
      leader && secondPlace ? leader.totalPoints - secondPlace.totalPoints : 0,
  };

  return {
    totalEvents: championship.events.length,
    totalRaces,
    totalDrivers: totalDriverResults,
    uniqueDrivers: driverStats.size,
    averageDriversPerRace:
      totalRaces > 0
        ? Math.round((totalDriverResults / totalRaces) * 100) / 100
        : 0,
    mostActiveDriver: {
      name: mostActiveDriver.name,
      racesParticipated: mostActiveDriver.racesParticipated,
    },
    topPerformers: {
      mostWins: {
        name: mostWins.name,
        wins: mostWins.wins,
      },
      mostPoles: {
        name: mostPoles.name,
        poles: mostPoles.poles,
      },
      mostFastestLaps: {
        name: mostFastestLaps.name,
        fastestLaps: mostFastestLaps.fastestLaps,
      },
      mostConsistent: {
        name: mostConsistent.name,
        consistentRaces: mostConsistent.consistentRaces,
      },
    },
    championshipProgress,
  };
}
