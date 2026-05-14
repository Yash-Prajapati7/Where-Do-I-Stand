import { slugify } from "../utils/slugify.js";

const HEARTBEAT_INTERVAL_MS = 25000;
const subscribersByProcess = new Map();

function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

function normalizeProcessKey(rawProcessIdentifier) {
  const decoded = safeDecodeURIComponent(String(rawProcessIdentifier || ""));
  return slugify(decoded);
}

function writeEvent(res, eventName, payload) {
  res.write(`event: ${eventName}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
}

export function subscribeToProcessUpdates(rawProcessIdentifier, res) {
  const processIdentifier = normalizeProcessKey(rawProcessIdentifier);

  if (!processIdentifier) {
    return null;
  }

  const subscribers = subscribersByProcess.get(processIdentifier) || new Set();

  if (!subscribersByProcess.has(processIdentifier)) {
    subscribersByProcess.set(processIdentifier, subscribers);
  }

  res.status(200);
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  if (typeof res.flushHeaders === "function") {
    res.flushHeaders();
  }

  res.write("retry: 3000\n\n");

  const subscriber = {
    res,
    heartbeat: setInterval(() => {
      res.write(": keep-alive\n\n");
    }, HEARTBEAT_INTERVAL_MS),
  };

  subscribers.add(subscriber);

  writeEvent(res, "connected", {
    processIdentifier,
    timestamp: new Date().toISOString(),
  });

  const unsubscribe = () => {
    clearInterval(subscriber.heartbeat);
    subscribers.delete(subscriber);

    if (subscribers.size === 0) {
      subscribersByProcess.delete(processIdentifier);
    }
  };

  res.on("close", unsubscribe);
  res.on("error", unsubscribe);

  return processIdentifier;
}

export function publishProcessUpdate(rawProcessIdentifier, payload = {}) {
  const processIdentifier = normalizeProcessKey(rawProcessIdentifier);

  if (!processIdentifier) {
    return 0;
  }

  const subscribers = subscribersByProcess.get(processIdentifier);

  if (!subscribers || subscribers.size === 0) {
    return 0;
  }

  const eventPayload = {
    processIdentifier,
    timestamp: new Date().toISOString(),
    ...payload,
  };

  const deadSubscribers = [];

  for (const subscriber of subscribers) {
    try {
      writeEvent(subscriber.res, "processUpdated", eventPayload);
    } catch (error) {
      deadSubscribers.push(subscriber);
    }
  }

  deadSubscribers.forEach((subscriber) => {
    clearInterval(subscriber.heartbeat);
    subscribers.delete(subscriber);
  });

  if (subscribers.size === 0) {
    subscribersByProcess.delete(processIdentifier);
  }

  return subscribers.size;
}