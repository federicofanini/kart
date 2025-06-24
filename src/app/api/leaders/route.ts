import { NextRequest, NextResponse } from "next/server";
import { redis, REDIS_KEYS } from "@/lib/redis";
import { Championship, ChampionshipLeader } from "@/lib/types";
import { nanoid } from "nanoid";
import bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, password } = body;

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Name, email, and password are required" },
        { status: 400 }
      );
    }

    // Get current championship or create one if it doesn't exist
    let championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);

    if (!championship) {
      // Create initial championship
      championship = {
        id: "championship-2024",
        name: "Campionato Kart 2024",
        season: "2024",
        drivers: [],
        events: [],
        leaders: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      await redis.set(REDIS_KEYS.CHAMPIONSHIP, championship);
    }

    // Check if email already exists
    const existingLeader = championship.leaders.find(
      (leader) => leader.email === email
    );
    if (existingLeader) {
      return NextResponse.json(
        { error: "Email already registered as leader" },
        { status: 400 }
      );
    }

    // Hash password and create token
    const hashedPassword = await bcrypt.hash(password, 10);
    const token = nanoid(32);

    const newLeader: ChampionshipLeader = {
      id: nanoid(),
      name,
      email,
      token,
      isCreator: championship.leaders.length === 0, // First leader is creator
      createdAt: new Date().toISOString(),
    };

    // Store leader token separately for quick auth lookup
    await redis.set(REDIS_KEYS.LEADER_TOKEN(token), {
      leaderId: newLeader.id,
      email: newLeader.email,
      hashedPassword,
    });

    // Update championship with new leader
    const updatedChampionship: Championship = {
      ...championship,
      leaders: [...championship.leaders, newLeader],
      updatedAt: new Date().toISOString(),
    };

    await redis.set(REDIS_KEYS.CHAMPIONSHIP, updatedChampionship);

    return NextResponse.json({
      leader: newLeader,
      token,
    });
  } catch (error) {
    console.error("Error creating leader:", error);
    return NextResponse.json(
      { error: "Failed to create leader" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Get current championship
    const championship = await redis.get<Championship>(REDIS_KEYS.CHAMPIONSHIP);

    if (!championship) {
      return NextResponse.json(
        { error: "Championship not found" },
        { status: 404 }
      );
    }

    // Find leader by email
    const leader = championship.leaders.find((l) => l.email === email);
    if (!leader) {
      return NextResponse.json({ error: "Leader not found" }, { status: 404 });
    }

    // Verify password
    const leaderAuth = await redis.get<{
      leaderId: string;
      email: string;
      hashedPassword: string;
    }>(REDIS_KEYS.LEADER_TOKEN(leader.token));

    if (!leaderAuth || !leaderAuth.hashedPassword) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(
      password,
      leaderAuth.hashedPassword
    );
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    return NextResponse.json({
      leader,
      token: leader.token,
    });
  } catch (error) {
    console.error("Error authenticating leader:", error);
    return NextResponse.json(
      { error: "Failed to authenticate leader" },
      { status: 500 }
    );
  }
}
