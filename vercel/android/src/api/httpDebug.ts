export type HttpDebugEntry = {
  url: string;
  status: number;
  body: string;
  at: string;
};

const log: HttpDebugEntry[] = [];
const MAX = 24;

export function pushHttpDebug(entry: Omit<HttpDebugEntry, 'at'>): void {
  log.unshift({
    ...entry,
    at: new Date().toISOString(),
  });
  if (log.length > MAX) {
    log.length = MAX;
  }
}

export function getHttpDebugLog(): HttpDebugEntry[] {
  return [...log];
}

export function clearHttpDebugLog(): void {
  log.length = 0;
}
