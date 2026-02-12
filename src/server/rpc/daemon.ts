import '@/agents/shared/loadEnv';
import { resolve } from 'path';
import { ensureRpcIndexes, claimNextPendingJob, completeRpcJob, failRpcJob } from './collection';
import { closeDbConnection } from '@/server/database/connection';

const POLL_INTERVAL_MS = 2_000;

let running = true;

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function processJob(): Promise<boolean> {
  const job = await claimNextPendingJob();
  if (!job) return false;

  const { handlerPath } = job;
  console.log(`[rpc-daemon] Processing job ${job._id.toHexString()} → ${handlerPath}`);

  const fullPath = resolve(process.cwd(), handlerPath);
  const allowedBase = resolve(process.cwd(), 'src/server/');
  if (!fullPath.startsWith(allowedBase)) {
    await failRpcJob(job._id, `Invalid handler path: "${handlerPath}"`);
    console.error(`[rpc-daemon] Rejected invalid path: ${handlerPath}`);
    return true;
  }

  const start = Date.now();
  try {
    const mod = await import(fullPath);
    const handler = mod.default;

    if (typeof handler !== 'function') {
      throw new Error(`Handler at "${handlerPath}" has no default export function`);
    }

    const result = await handler(job.args);
    const durationMs = Date.now() - start;

    await completeRpcJob(job._id, result);
    console.log(`[rpc-daemon] Completed ${job._id.toHexString()} in ${durationMs}ms`);
  } catch (err) {
    const durationMs = Date.now() - start;
    const errorMsg = err instanceof Error ? err.message : String(err);

    await failRpcJob(job._id, errorMsg);
    console.error(`[rpc-daemon] Failed ${job._id.toHexString()} after ${durationMs}ms: ${errorMsg}`);
  }

  return true;
}

async function pollLoop(): Promise<void> {
  console.log(`[rpc-daemon] Starting — polling every ${POLL_INTERVAL_MS / 1000}s`);
  await ensureRpcIndexes();
  console.log('[rpc-daemon] Indexes ensured');

  while (running) {
    try {
      const hadJob = await processJob();
      if (!hadJob) {
        await sleep(POLL_INTERVAL_MS);
      }
    } catch (err) {
      console.error('[rpc-daemon] Poll error:', err instanceof Error ? err.message : err);
      await sleep(POLL_INTERVAL_MS);
    }
  }

  console.log('[rpc-daemon] Stopped');
}

function handleShutdown(signal: string): void {
  console.log(`[rpc-daemon] Received ${signal}, shutting down...`);
  running = false;
}

process.on('SIGINT', () => handleShutdown('SIGINT'));
process.on('SIGTERM', () => handleShutdown('SIGTERM'));

pollLoop()
  .then(() => closeDbConnection())
  .catch((err) => {
    console.error('[rpc-daemon] Fatal error:', err);
    closeDbConnection().finally(() => process.exit(1));
  });
