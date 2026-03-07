import IORedis from 'ioredis';
import { env } from './env.js';

let connection: IORedis | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis(env.REDIS_URL, {
      maxRetriesPerRequest: null, // required by BullMQ
    });
    connection.on('error', (err) => {
      console.error('[Redis] Verbindingsfout:', err.message);
    });
    connection.on('connect', () => {
      console.log('[Redis] Verbonden');
    });
  }
  return connection;
}

export async function closeRedis(): Promise<void> {
  if (connection) {
    await connection.quit();
    connection = null;
  }
}
