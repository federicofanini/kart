import { Redis } from "@upstash/redis";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// For development - using localStorage as fallback if no Redis env vars
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

if (!UPSTASH_URL || !UPSTASH_TOKEN) {
  console.warn(
    "Redis environment variables not set. Using file-based storage fallback for development."
  );
}

// Type for our mock Redis client
interface MockRedis {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown): Promise<string>;
}

// File-based storage for development
const STORAGE_DIR = join(process.cwd(), ".redis-mock");
const STORAGE_FILE = join(STORAGE_DIR, "data.json");

// Ensure storage directory exists
const ensureStorageDir = () => {
  if (typeof window === "undefined") {
    try {
      if (!existsSync(STORAGE_DIR)) {
        mkdirSync(STORAGE_DIR, { recursive: true });
      }
    } catch (error) {
      console.warn("Failed to create storage directory:", error);
    }
  }
};

// Load data from file
const loadData = (): Record<string, unknown> => {
  if (typeof window !== "undefined") {
    // Client-side: use localStorage
    try {
      const data = localStorage.getItem("redis-mock-data");
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn("Failed to load from localStorage:", error);
      return {};
    }
  } else {
    // Server-side: use file system
    try {
      if (existsSync(STORAGE_FILE)) {
        const data = readFileSync(STORAGE_FILE, "utf8");
        return JSON.parse(data);
      }
    } catch (error) {
      console.warn("Failed to load from file:", error);
    }
    return {};
  }
};

// Save data to file
const saveData = (data: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    // Client-side: use localStorage
    try {
      localStorage.setItem("redis-mock-data", JSON.stringify(data));
    } catch (error) {
      console.warn("Failed to save to localStorage:", error);
    }
  } else {
    // Server-side: use file system
    try {
      ensureStorageDir();
      writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
    } catch (error) {
      console.warn("Failed to save to file:", error);
    }
  }
};

// Mock Redis client for development
const mockRedis: MockRedis = {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const data = loadData();
      const value = data[`redis:${key}`];
      if (value !== undefined) {
        console.log(`[Redis Mock] GET ${key}: Found data`);
        return value as T;
      }
      console.log(`[Redis Mock] GET ${key}: No data found`);
      return null;
    } catch (error) {
      console.error(`[Redis Mock] GET ${key} failed:`, error);
      return null;
    }
  },
  async set(key: string, value: unknown): Promise<string> {
    try {
      const data = loadData();
      data[`redis:${key}`] = value;
      saveData(data);
      console.log(`[Redis Mock] SET ${key}: Data saved successfully`);
      return "OK";
    } catch (error) {
      console.error(`[Redis Mock] SET ${key} failed:`, error);
      return "ERROR";
    }
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
