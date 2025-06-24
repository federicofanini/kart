import { Redis } from "@upstash/redis";
import {
  writeFileSync,
  readFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  unlinkSync,
  renameSync,
} from "fs";
import { join } from "path";

// Production Redis configuration
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

// Redis connection with error handling
let redisInstance: Redis | null = null;

const initializeRedis = (): Redis => {
  if (!redisInstance && UPSTASH_URL && UPSTASH_TOKEN) {
    try {
      redisInstance = new Redis({
        url: UPSTASH_URL,
        token: UPSTASH_TOKEN,
        retry: {
          retries: 3,
          backoff: (retryCount) => Math.pow(2, retryCount) * 1000, // Exponential backoff
        },
      });
      console.log("[Redis] Production Redis connection initialized");
    } catch (error) {
      console.error("[Redis] Failed to initialize Redis connection:", error);
      throw error;
    }
  }
  return redisInstance!;
};

// Enhanced Redis interface with production features
interface EnhancedRedis {
  get<T = unknown>(key: string): Promise<T | null>;
  set(key: string, value: unknown, options?: { ex?: number }): Promise<string>;
  del(key: string): Promise<number>;
  exists(key: string): Promise<number>;
  multi(): RedisTransaction;
  ping(): Promise<string>;
}

// Transaction interface for atomic operations
interface RedisTransaction {
  set(key: string, value: unknown): RedisTransaction;
  del(key: string): RedisTransaction;
  exec(): Promise<unknown[]>;
}

// File-based storage for development with improved error handling
const STORAGE_DIR = join(process.cwd(), ".redis-mock");
const STORAGE_FILE = join(STORAGE_DIR, "data.json");
const BACKUP_DIR = join(STORAGE_DIR, "backups");

// Ensure storage directories exist
const ensureStorageDir = () => {
  if (typeof window === "undefined") {
    try {
      if (!existsSync(STORAGE_DIR)) {
        mkdirSync(STORAGE_DIR, { recursive: true });
      }
      if (!existsSync(BACKUP_DIR)) {
        mkdirSync(BACKUP_DIR, { recursive: true });
      }
    } catch (error) {
      console.warn("[Redis Mock] Failed to create storage directory:", error);
    }
  }
};

// Load data from file with error recovery
const loadData = (): Record<string, unknown> => {
  if (typeof window !== "undefined") {
    // Client-side: use localStorage
    try {
      const data = localStorage.getItem("redis-mock-data");
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.warn(
        "[Redis Mock] Failed to load from localStorage, starting fresh:",
        error
      );
      return {};
    }
  } else {
    // Server-side: use file system with backup recovery
    try {
      if (existsSync(STORAGE_FILE)) {
        const data = readFileSync(STORAGE_FILE, "utf8");
        const parsed = JSON.parse(data);
        console.log("[Redis Mock] Loaded data from file successfully");
        return parsed;
      }
    } catch (error) {
      console.warn("[Redis Mock] Failed to load from file:", error);
      // Try to load from backup
      try {
        const backupFiles = readdirSync(BACKUP_DIR);
        if (backupFiles.length > 0) {
          const latestBackup = backupFiles.sort().pop();
          if (latestBackup) {
            const backupPath = join(BACKUP_DIR, latestBackup);
            const backupData = readFileSync(backupPath, "utf8");
            const parsed = JSON.parse(backupData);
            console.log(
              "[Redis Mock] Recovered data from backup:",
              latestBackup
            );
            return parsed;
          }
        }
      } catch (backupError) {
        console.warn(
          "[Redis Mock] Failed to recover from backup:",
          backupError
        );
      }
    }
    return {};
  }
};

// Save data to file with backup creation
const saveData = (data: Record<string, unknown>) => {
  if (typeof window !== "undefined") {
    // Client-side: use localStorage with error handling
    try {
      localStorage.setItem("redis-mock-data", JSON.stringify(data));
      console.log("[Redis Mock] Data saved to localStorage successfully");
    } catch (error) {
      console.error("[Redis Mock] Failed to save to localStorage:", error);
      throw error;
    }
  } else {
    // Server-side: use file system with atomic write and backup
    try {
      ensureStorageDir();

      // Create backup before writing new data
      if (existsSync(STORAGE_FILE)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const backupPath = join(BACKUP_DIR, `backup-${timestamp}.json`);
        const currentData = readFileSync(STORAGE_FILE, "utf8");
        writeFileSync(backupPath, currentData);

        // Keep only last 5 backups
        const backupFiles = readdirSync(BACKUP_DIR);
        if (backupFiles.length > 5) {
          const oldestBackup = backupFiles.sort().shift();
          if (oldestBackup) {
            unlinkSync(join(BACKUP_DIR, oldestBackup));
          }
        }
      }

      // Atomic write using temporary file
      const tempFile = `${STORAGE_FILE}.tmp`;
      writeFileSync(tempFile, JSON.stringify(data, null, 2));
      renameSync(tempFile, STORAGE_FILE);

      console.log("[Redis Mock] Data saved to file successfully");
    } catch (error) {
      console.error("[Redis Mock] Failed to save to file:", error);
      throw error;
    }
  }
};

// Enhanced mock Redis client with transaction support
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

  multi(): RedisTransaction {
    const operations: Array<{
      type: "set" | "del";
      key: string;
      value?: unknown;
    }> = [];

    return {
      set(key: string, value: unknown) {
        operations.push({ type: "set", key, value });
        return this;
      },
      del(key: string) {
        operations.push({ type: "del", key });
        return this;
      },
      async exec() {
        try {
          const data = loadData();
          const results: unknown[] = [];

          // Execute all operations atomically
          for (const op of operations) {
            if (op.type === "set") {
              data[`redis:${op.key}`] = op.value;
              results.push("OK");
            } else if (op.type === "del") {
              const existed = `redis:${op.key}` in data;
              delete data[`redis:${op.key}`];
              results.push(existed ? 1 : 0);
            }
          }

          saveData(data);
          console.log(
            `[Redis Mock] MULTI/EXEC: Executed ${operations.length} operations atomically`
          );
          return results;
        } catch (error) {
          console.error("[Redis Mock] MULTI/EXEC failed:", error);
          throw error;
        }
      },
    };
  },

  async ping(): Promise<string> {
    console.log("[Redis Mock] PING: PONG");
    return "PONG";
  },
};

// Production Redis client with enhanced error handling
const productionRedis: EnhancedRedis = {
  async get<T = unknown>(key: string): Promise<T | null> {
    try {
      const redis = initializeRedis();
      const result = await redis.get<T>(key);
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
      const redis = initializeRedis();
      const result = options?.ex
        ? await redis.set(key, value, { ex: options.ex })
        : await redis.set(key, value);
      console.log(`[Redis] SET ${key}: Success`);
      return result as string;
    } catch (error) {
      console.error(`[Redis] SET ${key} failed:`, error);
      throw error;
    }
  },

  async del(key: string): Promise<number> {
    try {
      const redis = initializeRedis();
      const result = await redis.del(key);
      console.log(`[Redis] DEL ${key}: ${result} keys deleted`);
      return result;
    } catch (error) {
      console.error(`[Redis] DEL ${key} failed:`, error);
      throw error;
    }
  },

  async exists(key: string): Promise<number> {
    try {
      const redis = initializeRedis();
      const result = await redis.exists(key);
      console.log(`[Redis] EXISTS ${key}: ${result ? "Exists" : "Not found"}`);
      return result;
    } catch (error) {
      console.error(`[Redis] EXISTS ${key} failed:`, error);
      throw error;
    }
  },

  multi(): RedisTransaction {
    const redis = initializeRedis();
    const multi = redis.multi();

    return {
      set(key: string, value: unknown) {
        multi.set(key, value);
        return this;
      },
      del(key: string) {
        multi.del(key);
        return this;
      },
      async exec() {
        try {
          const results = await multi.exec();
          console.log(`[Redis] MULTI/EXEC: Executed transaction successfully`);
          return results;
        } catch (error) {
          console.error("[Redis] MULTI/EXEC failed:", error);
          throw error;
        }
      },
    };
  },

  async ping(): Promise<string> {
    try {
      const redis = initializeRedis();
      const result = await redis.ping();
      console.log("[Redis] PING: Success");
      return result;
    } catch (error) {
      console.error("[Redis] PING failed:", error);
      throw error;
    }
  },
};

// Export the appropriate Redis client based on environment
export const redis: EnhancedRedis =
  UPSTASH_URL && UPSTASH_TOKEN ? productionRedis : mockRedis;

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
      const multi = redis.multi();

      // Create backup if specified
      if (backupKey) {
        multi.set(backupKey, championship);
      }

      // Update main championship data
      multi.set(REDIS_KEYS.CHAMPIONSHIP, championship);

      await multi.exec();
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
