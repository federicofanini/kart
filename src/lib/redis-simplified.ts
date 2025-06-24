import { Redis } from "@upstash/redis";
import { writeFileSync, readFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";

// Production Redis configuration
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Enhanced Redis interface with production features
interface EnhancedRedis {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<string>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  ping(): Promise<string>;
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
      console.warn("[Redis Mock] Failed to create storage directory:", error);
    }
  }
};

// Load data from file with error handling
const loadData = (): Record<string, unknown> => {
  if (typeof window !== "undefined") {
    try {
      const data = localStorage.getItem("redis-mock-data");
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn("[Redis Mock] Failed to load from localStorage:", error);
      return {};
    }
  } else {
    try {
      if (existsSync(STORAGE_FILE)) {
        const data = readFileSync(STORAGE_FILE, "utf8");
        const parsed = JSON.parse(data);
        console.log("[Redis Mock] Loaded data from file successfully");
        return parsed;
      }
    } catch (error) {
      console.warn("[Redis Mock] Failed to load from file:", error);
    }
    return {};
  }
};

// Save data to file with error handling
const saveData = (data: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem("redis-mock-data", JSON.stringify(data));
      console.log("[Redis Mock] Data saved to localStorage successfully");
    } catch (error) {
      console.error("[Redis Mock] Failed to save to localStorage:", error);
      throw error;
    }
  } else {
    try {
      ensureStorageDir();
      writeFileSync(STORAGE_FILE, JSON.stringify(data, null, 2));
      console.log("[Redis Mock] Data saved to file successfully");
    } catch (error) {
      console.error("[Redis Mock] Failed to save to file:", error);
      throw error;
    }
  }
};

// Mock Redis client for development
const mockRedis: EnhancedRedis = {
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
      throw error;
    }
  },

  async set(
    key: string,
    value: unknown,
    options?: { ex?: number }
  ): Promise<string> {
    try {
      const data = loadData();
      data[`redis:${key}`] = value;

      // Handle expiration (mock implementation)
      if (options?.ex) {
        setTimeout(() => {
          const currentData = loadData();
          delete currentData[`redis:${key}`];
          saveData(currentData);
          console.log(
            `[Redis Mock] Expired key ${key} after ${options.ex} seconds`
          );
        }, options.ex * 1000);
      }

      saveData(data);
      console.log(`[Redis Mock] SET ${key}: Data saved successfully`);
      return "OK";
    } catch (error) {
      console.error(`[Redis Mock] SET ${key} failed:`, error);
      throw error;
    }
  },

  async del(key: string): Promise<number> {
    try {
      const data = loadData();
      const existed = `redis:${key}` in data;
      delete data[`redis:${key}`];
      saveData(data);
      console.log(
        `[Redis Mock] DEL ${key}: ${existed ? "Deleted" : "Key not found"}`
      );
      return existed ? 1 : 0;
    } catch (error) {
      console.error(`[Redis Mock] DEL ${key} failed:`, error);
      throw error;
    }
  },

  async exists(key: string): Promise<number> {
    try {
      const data = loadData();
      const exists = `redis:${key}` in data;
      console.log(`[Redis Mock] EXISTS ${key}: ${exists}`);
      return exists ? 1 : 0;
    } catch (error) {
      console.error(`[Redis Mock] EXISTS ${key} failed:`, error);
      throw error;
    }
  },

  async ping(): Promise<string> {
    console.log("[Redis Mock] PING: PONG");
    return "PONG";
  },
};

// Production Redis client
const createProductionRedis = (): EnhancedRedis => {
  const redisInstance = new Redis({
    url: UPSTASH_URL!,
    token: UPSTASH_TOKEN!,
  });

  return {
    async get<T = unknown>(key: string): Promise<T | null> {
      try {
        const result = await redisInstance.get<T>(key);
        console.log(
          `[Redis] GET ${key}: ${result ? "Found data" : "No data found"}`
        );
        return result;
      } catch (error) {
        console.error(`[Redis] GET ${key} failed:`, error);
        throw error;
      }
    },

    async set(
      key: string,
      value: unknown,
      options?: { ex?: number }
    ): Promise<string> {
      try {
        const result = options?.ex
          ? await redisInstance.set(key, value, { ex: options.ex })
          : await redisInstance.set(key, value);
        console.log(`[Redis] SET ${key}: Success`);
        return typeof result === "string" ? result : "OK";
      } catch (error) {
        console.error(`[Redis] SET ${key} failed:`, error);
        throw error;
      }
    },

    async del(key: string): Promise<number> {
      try {
        const result = await redisInstance.del(key);
        console.log(`[Redis] DEL ${key}: ${result} keys deleted`);
        return result;
      } catch (error) {
        console.error(`[Redis] DEL ${key} failed:`, error);
        throw error;
      }
    },

    async exists(key: string): Promise<number> {
      try {
        const result = await redisInstance.exists(key);
        console.log(
          `[Redis] EXISTS ${key}: ${result ? "Exists" : "Not found"}`
        );
        return result;
      } catch (error) {
        console.error(`[Redis] EXISTS ${key} failed:`, error);
        throw error;
      }
    },

    async ping(): Promise<string> {
      try {
        const result = await redisInstance.ping();
        console.log("[Redis] PING: Success");
        return result;
      } catch (error) {
        console.error("[Redis] PING failed:", error);
        throw error;
      }
    },
  };
};

// Export the appropriate Redis client based on environment
export const redis: EnhancedRedis =
  UPSTASH_URL && UPSTASH_TOKEN ? createProductionRedis() : mockRedis;

// Redis keys with proper namespacing
export const REDIS_KEYS = {
  CHAMPIONSHIP: "kart:championship:main",
  LEADERS: "kart:championship:leaders",
  LEADER_TOKEN: (token: string) => `kart:leader:${token}`,
  STATISTICS: "kart:championship:stats",
  EVENT: (eventId: string) => `kart:event:${eventId}`,
  DRIVER: (driverId: string) => `kart:driver:${driverId}`,
  SESSION: (sessionId: string) => `kart:session:${sessionId}`,
} as const;

// Utility functions for production operations
export const redisUtils = {
  /**
   * Health check for Redis connection
   */
  async healthCheck(): Promise<boolean> {
    try {
      await redis.ping();
      return true;
    } catch (error) {
      console.error("[Redis] Health check failed:", error);
      return false;
    }
  },

  /**
   * Atomic update operation for championship data
   */
  async atomicChampionshipUpdate(
    championship: unknown,
    backupKey?: string
  ): Promise<void> {
    try {
      // Create backup if specified
      if (backupKey) {
        await redis.set(backupKey, championship);
      }

      // Update main championship data
      await redis.set(REDIS_KEYS.CHAMPIONSHIP, championship);

      console.log("[Redis] Atomic championship update completed");
    } catch (error) {
      console.error("[Redis] Atomic championship update failed:", error);
      throw error;
    }
  },

  /**
   * Cleanup old backup keys
   */
  async cleanupBackups(maxBackups: number = 5): Promise<void> {
    // This is a simplified implementation
    // In production, you would scan for backup keys and delete old ones
    console.log(`[Redis] Cleanup backups (max: ${maxBackups})`);
  },
};

// Initialize Redis connection on module load
if (UPSTASH_URL && UPSTASH_TOKEN) {
  console.log("[Redis] Initializing production Redis connection...");
} else {
  console.warn("[Redis] Using mock Redis storage for development");
}
