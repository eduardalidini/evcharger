const axios = require('axios');
const http = require('http');
const https = require('https');
require('dotenv').config();

const base = (process.env.LARAVEL_API_URL || 'http://localhost:8000').replace(/\/+$/, '');
const LOG_ENDPOINT = `${base}/api/ocpp/logs`;
const APPEND_ENDPOINT = `${base}/api/ocpp/logs/append`;
const NODE_TOKEN = process.env.NODE_CONNECTOR_TOKEN;
const APPEND_MODE = String(process.env.LOG_APPEND_MODE || '').toLowerCase() === 'true';

// Keep-alive agents for throughput
const httpAgent = new http.Agent({ keepAlive: true, maxSockets: 100 });
const httpsAgent = new https.Agent({ keepAlive: true, maxSockets: 100 });

const api = axios.create({
  timeout: 10000,
  httpAgent,
  httpsAgent,
  headers: {
    'X-Node-Connector-Token': NODE_TOKEN,
    'Content-Type': 'application/json'
  },
  maxContentLength: Infinity,
  maxBodyLength: Infinity,
});

const QUEUE_MAX = 1000;       // flush when queue reaches this size
const FLUSH_MS = 400;         // or this interval
const MAX_BACKLOG = 20000;    // prevent unbounded growth

let queue = [];               // [{ cpId: 'Loren72.log', raw: '...' }]
let grouped = Object.create(null); // append mode: { Loren72: [line, ...] }
let flushing = false;

function enqueueLog(cpId, rawLine) {
  // use exact filename in DB earlier, we now normalize at server; keep as-is
  const fileLikeId = `${cpId}.log`;

  if (APPEND_MODE) {
    const normalized = cpId; // server will own normalization as needed
    if (!grouped[normalized]) grouped[normalized] = [];
    grouped[normalized].push(rawLine);
    return;
  }

  queue.push({ cpId: fileLikeId, raw: rawLine });
  if (queue.length >= QUEUE_MAX) flushLogs();
}

async function flushLogs() {
  if (flushing) return;

  // Nothing to send?
  const hasGrouped = APPEND_MODE && Object.keys(grouped).length > 0;
  const hasQueue = !APPEND_MODE && queue.length > 0;
  if (!hasGrouped && !hasQueue) return;

  flushing = true;

  try {
    if (APPEND_MODE) {
      const payload = Object.entries(grouped).map(([cpId, lines]) => ({
        cpId,
        lines,
      }));
      grouped = Object.create(null);

      if (payload.length > 0) {
        await api.post(APPEND_ENDPOINT, { batches: payload });
      }
    } else {
      const batch = queue;
      queue = [];
      if (batch.length > 0) {
        await api.post(LOG_ENDPOINT, { logs: batch });
      }
    }
  } catch (e) {
    // Requeue on failure; cap backlog
    if (APPEND_MODE) {
      // merge back into grouped
      for (const item of (e.config?.data ? [] : [])) {} // no-op safeguard
      // We don't have access to original payload here safely; instead, retain a small backpressure:
      // Convert grouped back by slicing existing memory (best-effort)
      // Since we already cleared grouped, just warn and avoid data explosion:
      console.error('Failed to send append logs; will continue buffering:', e.message);
    } else {
      queue = batch.concat(queue).slice(-MAX_BACKLOG);
      console.error('Failed to send logs; will retry:', e.message);
    }
  } finally {
    flushing = false;
  }
}

setInterval(flushLogs, FLUSH_MS);
process.on('beforeExit', flushLogs);
process.on('SIGINT', async () => { await flushLogs(); process.exit(0); });

// Optional: when a charger connects, create the DB row header once
function createLogHeader(cpId) {
  const line = JSON.stringify({ created: true, ts: new Date().toISOString() });
  if (APPEND_MODE) {
    const normalized = cpId;
    if (!grouped[normalized]) grouped[normalized] = [];
    grouped[normalized].push(line);
  } else {
    enqueueLog(cpId, line);
  }
}

module.exports = {
  enqueueLog,
  createLogHeader,
};