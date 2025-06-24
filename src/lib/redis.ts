import { Redis } from "@upstash/redis";

// For development - using localStorage as fallback if no Redis env vars
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.warn(
    "Redis environment variables not set. Using localStorage fallback for development."
  );
}

// Type for our mock Redis client
interface MockRedis {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<string>;
}

// In-memory storage for server-side mock
const serverStorage = new Map<string, string>();

// Mock Redis client for development
const mockRedis: MockRedis = {
  async get<T = unknown>(key: string): Promise<T | null> {
    if (typeof window === "undefined") {
      // Server-side: use in-memory Map
      const data = serverStorage.get(`redis:${key}`);
      return data ? JSON.parse(data) : null;
    } else {
      // Client-side: use localStorage
      const data = localStorage.getItem(`redis:${key}`);
      return data ? JSON.parse(data) : null;
    }
  },
  async set(key: string, value: unknown): Promise<string> {
    const serialized = JSON.stringify(value);
    if (typeof window === "undefined") {
      // Server-side: use in-memory Map
      serverStorage.set(`redis:${key}`, serialized);
    } else {
      // Client-side: use localStorage
      localStorage.setItem(`redis:${key}`, serialized);
    }
    return "OK";
  },
};

export const redis =
  UPSTASH_URL && UPSTASH_TOKEN
    ? new Redis({
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
      })
    : mockRedis;

// Redis keys
export const REDIS_KEYS = {
  CHAMPIONSHIP: "championship:main",
  LEADERS: "championship:leaders",
  LEADER_TOKEN: (token: string) => `leader:${token}`,
} as const;
