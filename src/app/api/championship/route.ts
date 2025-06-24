import { NextRequest, NextResponse } from "next/server";
import { redis, REDIS_KEYS, redisUtils } from "@/lib/redis-simplified";
import { Championship } from "@/lib/types";

/**
 * GET /api/championship
 * Retrieves the current championship data
 */
export async function GET() {
  try {
    console.log("[Championship API] GET: Fetching championship data...");

    // Health check Redis connection
    const isHealthy = await redisUtils.healthCheck();
    if (!isHealthy) {
      console.error("[Championship API] GET: Redis health check failed");
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    const championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);

    if (!championship) {
      console.log(
        "[Championship API] GET: No championship found, returning empty championship"
      );

      // Return empty championship structure if none exists
      const emptyChampionship: Championship = {
        id: "championship-2025",
        name: "Campionato Kart 2025",
        season: "2025",
        drivers: [],
        events: [],
        leaders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(emptyChampionship);
    }

    // Validate championship data structure
    if (
      !championship.id ||
      !championship.name ||
      !Array.isArray(championship.events)
    ) {
      console.error(
        "[Championship API] GET: Invalid championship data structure"
      );
      return NextResponse.json(
        { error: "Invalid championship data" },
        { status: 500 }
      );
    }

    console.log(
      `[Championship API] GET: Found championship with ${championship.events.length} events and ${championship.drivers.length} drivers`
    );

    // Log event statistics for debugging
    championship.events.forEach((event, eventIndex) => {
      let totalDrivers = 0;
      let totalRaces = 0;

      // Count drivers and races in new format
      if (event.races && typeof event.races === "object") {
        totalRaces = Object.keys(event.races).length;
        Object.entries(event.races).forEach(([raceId, raceData]) => {
          if (raceData && typeof raceData === "object") {
            const driversInRace = Object.keys(raceData).length;
            totalDrivers += driversInRace;
            console.log(
              `[Championship API] GET: Event ${
                eventIndex + 1
              }, Race ${raceId} has ${driversInRace} drivers`
            );
          }
        });
      }

      // Count drivers in legacy format
      if (event.race1Results && typeof event.race1Results === "object") {
        const driversInRace1 = Object.keys(event.race1Results).length;
        totalDrivers += driversInRace1;
        totalRaces += 1;
        console.log(
          `[Championship API] GET: Event ${
            eventIndex + 1
          }, Race1 (legacy) has ${driversInRace1} drivers`
        );
      }
      if (event.race2Results && typeof event.race2Results === "object") {
        const driversInRace2 = Object.keys(event.race2Results).length;
        totalDrivers += driversInRace2;
        totalRaces += 1;
        console.log(
          `[Championship API] GET: Event ${
            eventIndex + 1
          }, Race2 (legacy) has ${driversInRace2} drivers`
        );
      }

      console.log(
        `[Championship API] GET: Event ${
          eventIndex + 1
        } summary: ${totalRaces} races, ${totalDrivers} total driver results`
      );
    });

    return NextResponse.json(championship);
  } catch (error) {
    console.error(
      "[Championship API] GET: Failed to fetch championship:",
      error
    );
    return NextResponse.json(
      {
        error: "Failed to fetch championship data",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/championship
 * Updates the championship data with atomic transaction
 */
export async function PUT(request: NextRequest) {
  try {
    console.log("[Championship API] PUT: Starting championship update...");

    // Parse and validate request body
    let body: { championship?: Championship; leaderToken?: string };
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(
        "[Championship API] PUT: Invalid JSON in request body:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { championship, leaderToken } = body;

    // Validate championship data
    if (!championship) {
      return NextResponse.json(
        { error: "Championship data is required" },
        { status: 400 }
      );
    }

    if (
      !championship.id ||
      !championship.name ||
      !Array.isArray(championship.events)
    ) {
      return NextResponse.json(
        { error: "Invalid championship data structure" },
        { status: 400 }
      );
    }

    // Health check Redis connection
    const isHealthy = await redisUtils.healthCheck();
    if (!isHealthy) {
      console.error("[Championship API] PUT: Redis health check failed");
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    console.log(
      `[Championship API] PUT: Updating championship with ${championship.events.length} events and ${championship.drivers.length} drivers`
    );

    // Verify leader token if provided
    if (leaderToken) {
      try {
        const leaderData = await redis.get(
          REDIS_KEYS.LEADER_TOKEN(leaderToken)
        );
        if (!leaderData) {
          console.warn(
            `[Championship API] PUT: Invalid leader token: ${leaderToken}`
          );
          return NextResponse.json(
            { error: "Invalid or expired leader token" },
            { status: 401 }
          );
        }
        console.log(
          "[Championship API] PUT: Leader token validated successfully"
        );
      } catch (tokenError) {
        console.error(
          "[Championship API] PUT: Error validating leader token:",
          tokenError
        );
        return NextResponse.json(
          { error: "Failed to validate leader token" },
          { status: 500 }
        );
      }
    }

    // Log event statistics for debugging
    championship.events.forEach((event, eventIndex) => {
      let totalDrivers = 0;
      let totalRaces = 0;

      // Count drivers and races in new format
      if (event.races && typeof event.races === "object") {
        totalRaces = Object.keys(event.races).length;
        Object.entries(event.races).forEach(([raceId, raceData]) => {
          if (raceData && typeof raceData === "object") {
            const driversInRace = Object.keys(raceData).length;
            totalDrivers += driversInRace;
            console.log(
              `[Championship API] PUT: Event ${
                eventIndex + 1
              }, Race ${raceId} has ${driversInRace} drivers`
            );

            // Log sample driver data for first race
            if (driversInRace > 0 && eventIndex === 0) {
              const firstDriverId = Object.keys(raceData)[0];
              const firstDriver = raceData[firstDriverId];
              console.log(`[Championship API] PUT: Sample driver result:`, {
                id: firstDriver.id,
                name: firstDriver.name,
                position: firstDriver.position,
                participated: firstDriver.participated,
                bonuses: {
                  pole: firstDriver.polePosition,
                  fastest: firstDriver.fastestLap,
                  consistent: firstDriver.mostConsistent,
                },
              });
            }
          }
        });
      }

      // Count drivers in legacy format
      if (event.race1Results && typeof event.race1Results === "object") {
        const driversInRace1 = Object.keys(event.race1Results).length;
        totalDrivers += driversInRace1;
        totalRaces += 1;
      }
      if (event.race2Results && typeof event.race2Results === "object") {
        const driversInRace2 = Object.keys(event.race2Results).length;
        totalDrivers += driversInRace2;
        totalRaces += 1;
      }

      console.log(
        `[Championship API] PUT: Event ${
          eventIndex + 1
        } summary: ${totalRaces} races, ${totalDrivers} total driver results`
      );
    });

    // Update championship with current timestamp and validate data
    const updatedChampionship: Championship = {
      ...championship,
      updatedAt: new Date().toISOString(),
      // Ensure drivers array is properly maintained
      drivers: championship.drivers || [],
      // Ensure leaders array is properly maintained
      leaders: championship.leaders || [],
    };

    // Create backup key with timestamp
    const backupKey = `${
      REDIS_KEYS.CHAMPIONSHIP
    }:backup:${new Date().toISOString()}`;

    try {
      // Use atomic transaction to update championship data
      await redisUtils.atomicChampionshipUpdate(updatedChampionship, backupKey);
      console.log(
        "[Championship API] PUT: Championship data saved successfully using atomic transaction"
      );
    } catch (redisError) {
      console.error(
        "[Championship API] PUT: Failed to save championship data:",
        redisError
      );
      return NextResponse.json(
        {
          error: "Failed to save championship data",
          details:
            redisError instanceof Error ? redisError.message : "Database error",
        },
        { status: 500 }
      );
    }

    // Cleanup old backups (keep only recent ones)
    try {
      await redisUtils.cleanupBackups(5);
    } catch (cleanupError) {
      // Don't fail the request if cleanup fails, just log it
      console.warn(
        "[Championship API] PUT: Failed to cleanup old backups:",
        cleanupError
      );
    }

    console.log(
      `[Championship API] PUT: Successfully updated championship. Events: ${updatedChampionship.events.length}, Drivers: ${updatedChampionship.drivers.length}`
    );

    return NextResponse.json(updatedChampionship);
  } catch (error) {
    console.error(
      "[Championship API] PUT: Unexpected error during championship update:",
      error
    );
    return NextResponse.json(
      {
        error: "Failed to update championship",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/championship
 * Deletes championship data (admin only)
 */
export async function DELETE(request: NextRequest) {
  try {
    console.log("[Championship API] DELETE: Starting championship deletion...");

    // Parse and validate request body
    let body: { leaderToken?: string };
    try {
      body = await request.json();
    } catch (parseError) {
      console.error(
        "[Championship API] DELETE: Invalid JSON in request body:",
        parseError
      );
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const { leaderToken } = body;

    // Require leader token for deletion
    if (!leaderToken) {
      return NextResponse.json(
        { error: "Leader token is required for deletion" },
        { status: 401 }
      );
    }

    // Health check Redis connection
    const isHealthy = await redisUtils.healthCheck();
    if (!isHealthy) {
      console.error("[Championship API] DELETE: Redis health check failed");
      return NextResponse.json(
        { error: "Database connection unavailable" },
        { status: 503 }
      );
    }

    // Verify leader token
    try {
      const leaderData = await redis.get(REDIS_KEYS.LEADER_TOKEN(leaderToken));
      if (!leaderData) {
        console.warn(
          `[Championship API] DELETE: Invalid leader token: ${leaderToken}`
        );
        return NextResponse.json(
          { error: "Invalid or expired leader token" },
          { status: 401 }
        );
      }
    } catch (tokenError) {
      console.error(
        "[Championship API] DELETE: Error validating leader token:",
        tokenError
      );
      return NextResponse.json(
        { error: "Failed to validate leader token" },
        { status: 500 }
      );
    }

    // Create final backup before deletion
    const championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);
    if (championship) {
      const finalBackupKey = `${
        REDIS_KEYS.CHAMPIONSHIP
      }:deleted:${new Date().toISOString()}`;
      try {
        await redis.set(finalBackupKey, championship);
        console.log(
          "[Championship API] DELETE: Created final backup before deletion"
        );
      } catch (backupError) {
        console.warn(
          "[Championship API] DELETE: Failed to create backup before deletion:",
          backupError
        );
      }
    }

    // Delete championship data
    try {
      const deletedCount = await redis.del(REDIS_KEYS.CHAMPIONSHIP);
      console.log(
        `[Championship API] DELETE: Deleted championship data (${deletedCount} keys)`
      );
    } catch (deleteError) {
      console.error(
        "[Championship API] DELETE: Failed to delete championship data:",
        deleteError
      );
      return NextResponse.json(
        {
          error: "Failed to delete championship data",
          details:
            deleteError instanceof Error
              ? deleteError.message
              : "Database error",
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: "Championship deleted successfully" });
  } catch (error) {
    console.error(
      "[Championship API] DELETE: Unexpected error during championship deletion:",
      error
    );
    return NextResponse.json(
      {
        error: "Failed to delete championship",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
