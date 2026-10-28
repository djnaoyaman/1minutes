export const TARGET_MS = 60_000;
export const MAX_COUNT_MS = 300_000;
export const MAX_GAP_MS = 1_500;
export const STORAGE_KEY = '1minutes-results-v2';
export const EXPERIMENTS = ['wait', 'flow', 'count'];

// Measure elapsed time, never the number of timer callbacks.
export class SessionClock {
  constructor(kind, now = () => performance.now(), wall = () => Date.now()) {
    if (!EXPERIMENTS.includes(kind)) throw new TypeError('Unknown experiment');
    this.kind = kind;
    this.now = now;
    this.wall = wall;
    this.started = now();
    this.wallStarted = wall();
    this.previous = this.started;
    this.status = 'running';
  }
  sample(hidden = false) {
    if (this.status !== 'running') return { status: this.status };
    const current = this.now();
    const elapsedMs = current - this.started;
    const gap = current - this.previous;
    const drift = Math.abs((this.wall() - this.wallStarted) - elapsedMs);
    this.previous = current;
    let reason;
    if (hidden) reason = 'hidden';
    else if (elapsedMs < 0 || gap < 0 || !Number.isFinite(elapsedMs)) reason = 'clock';
    else if (gap > MAX_GAP_MS || drift > MAX_GAP_MS) reason = 'timing';
    else if (this.kind === 'count' && elapsedMs >= MAX_COUNT_MS) reason = 'limit';
    if (reason) {
      this.status = 'interrupted';
      return { status: this.status, reason, elapsedMs };
    }
    if (this.kind !== 'count' && elapsedMs >= TARGET_MS) this.status = 'complete';
    return { status: this.status, elapsedMs };
  }
  stop(hidden = false) {
    const sample = this.sample(hidden);
    if (sample.status === 'running') {
      this.status = 'complete';
      return { ...sample, status: 'complete' };
    }
    return sample;
  }
  cancel() { this.status = 'cancelled'; }
}

export function validEstimate(value) {
  if (typeof value !== 'string' || value.trim() === '') return null;
  const number = Number(value);
  return Number.isFinite(number) && number >= 0.1 && number <= 3600
    ? Math.round(number * 10) / 10 : null;
}
export function validRecord(record) {
  return record && EXPERIMENTS.includes(record.experiment)
    && Number.isFinite(record.actual) && record.actual > 0 && record.actual <= 300
    && Number.isFinite(record.felt) && record.felt >= 0.1 && record.felt <= 3600
    && Number.isInteger(record.score) && record.score >= 0 && record.score <= 100000
    && typeof record.at === 'string' && Number.isFinite(Date.parse(record.at));
}
export function readRecords(storage) {
  try {
    const value = JSON.parse(storage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(value) ? value.filter(validRecord).slice(-100) : [];
  } catch { return []; }
}
export function saveRecords(storage, records) {
  try { storage.setItem(STORAGE_KEY, JSON.stringify(records.filter(validRecord).slice(-100))); return true; }
  catch { return false; }
}
export function nextTarget(previous, random = Math.random) {
  // Always change the target; the same finger position cannot score repeatedly.
  return (previous + 1 + Math.floor(random() * 7)) % 8;
}
