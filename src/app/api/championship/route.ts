import { NextRequest, NextResponse } from "next/server";
import { redis, REDIS_KEYS } from "@/lib/redis";
import { Championship } from "@/lib/types";

export async function GET() {
  try {
    console.log("[Championship API] GET: Fetching championship data...");
    const championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);

    if (!championship) {
      console.log(
        "[Championship API] GET: No championship found, returning empty championship"
      );
      // Return empty championship if none exists
      const emptyChampionship: Championship = {
        id: "championship-2024",
        name: "Campionato Kart 2024",
        season: "2024",
        drivers: [],
        events: [],
        leaders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      return NextResponse.json(emptyChampionship);
    }

    console.log(
      `[Championship API] GET: Found championship with ${championship.events.length} events`
    );

    // Debug driver results
    championship.events.forEach((event, eventIndex) => {
      let totalDrivers = 0;

      // Count drivers in new format
      if (event.races) {
        Object.entries(event.races).forEach(([raceId, raceData]) => {
          const driversInRace = Object.keys(raceData).length;
          totalDrivers += driversInRace;
          console.log(
            `[Championship API] GET: Event ${
              eventIndex + 1
            }, Race ${raceId} has ${driversInRace} drivers`
          );
        });
      }

      // Count drivers in legacy format
      if (event.race1Results) {
        const driversInRace1 = Object.keys(event.race1Results).length;
        totalDrivers += driversInRace1;
        console.log(
          `[Championship API] GET: Event ${
            eventIndex + 1
          }, Race1 has ${driversInRace1} drivers`
        );
      }
      if (event.race2Results) {
        const driversInRace2 = Object.keys(event.race2Results).length;
        totalDrivers += driversInRace2;
        console.log(
          `[Championship API] GET: Event ${
            eventIndex + 1
          }, Race2 has ${driversInRace2} drivers`
        );
      }

      console.log(
        `[Championship API] GET: Event ${
          eventIndex + 1
        } total driver results: ${totalDrivers}`
      );
    });

    return NextResponse.json(championship);
  } catch (error) {
    console.error("Error fetching championship:", error);
    return NextResponse.json(
      { error: "Failed to fetch championship" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { championship, leaderToken } = body;

    if (!championship) {
      return NextResponse.json(
        { error: "Championship data is required" },
        { status: 400 }
      );
    }

    console.log(
      `[Championship API] PUT: Updating championship with ${championship.events.length} events`
    );

    // Debug what's being saved
    championship.events.forEach((event: any, eventIndex: number) => {
      let totalDrivers = 0;

      // Count drivers in new format
      if (event.races) {
        Object.entries(event.races).forEach(([raceId, raceData]) => {
          const driversInRace = Object.keys(raceData).length;
          totalDrivers += driversInRace;
          console.log(
            `[Championship API] PUT: Event ${
              eventIndex + 1
            }, Race ${raceId} has ${driversInRace} drivers`
          );

          // Log sample driver data
          if (driversInRace > 0) {
            const firstDriverId = Object.keys(raceData)[0];
            const firstDriver = raceData[firstDriverId];
            console.log(`[Championship API] PUT: Sample driver result:`, {
              name: firstDriver.name,
              position: firstDriver.position,
              points: firstDriver.participated
                ? "participated"
                : "not participated",
            });
          }
        });
      }

      // Count drivers in legacy format
      if (event.race1Results) {
        const driversInRace1 = Object.keys(event.race1Results).length;
        totalDrivers += driversInRace1;
        console.log(
          `[Championship API] PUT: Event ${
            eventIndex + 1
          }, Race1 has ${driversInRace1} drivers`
        );
      }
      if (event.race2Results) {
        const driversInRace2 = Object.keys(event.race2Results).length;
        totalDrivers += driversInRace2;
        console.log(
          `[Championship API] PUT: Event ${
            eventIndex + 1
          }, Race2 has ${driversInRace2} drivers`
        );
      }

      console.log(
        `[Championship API] PUT: Event ${
          eventIndex + 1
        } total driver results: ${totalDrivers}`
      );
    });

    // Verify leader token if provided
    if (leaderToken) {
      const leaderData = await redis.get(REDIS_KEYS.LEADER_TOKEN(leaderToken));
      if (!leaderData) {
        return NextResponse.json(
          { error: "Invalid leader token" },
          { status: 401 }
        );
      }
    }

    // Update championship with current timestamp
    const updatedChampionship: Championship = {
      ...championship,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(REDIS_KEYS.CHAMPIONSHIP, updatedChampionship);
    console.log("[Championship API] PUT: Championship data saved successfully");

    return NextResponse.json(updatedChampionship);
  } catch (error) {
    console.error("Error updating championship:", error);
    return NextResponse.json(
      { error: "Failed to update championship" },
      { status: 500 }
    );
  }
}
