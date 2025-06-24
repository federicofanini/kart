import { NextRequest, NextResponse } from "next/server";
import { redis, REDIS_KEYS } from "@/lib/redis";
import { Championship } from "@/lib/types";

export async function GET() {
  try {
    const championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);

    if (!championship) {
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

    return NextResponse.json(updatedChampionship);
  } catch (error) {
    console.error("Error updating championship:", error);
    return NextResponse.json(
      { error: "Failed to update championship" },
      { status: 500 }
    );
  }
}
