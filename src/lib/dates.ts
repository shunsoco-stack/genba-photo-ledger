export function japanNow(now: Date = new Date()) {
  const value = new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString();
  return { date: value.slice(0, 10), time: value.slice(11, 16) };
}

export function addDays(date: string, amount: number) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
}

export function weekday(date: string) {
  return new Date(`${date}T00:00:00Z`).getUTCDay();
}

export function validDate(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function validTime(value: unknown): value is string {
  return typeof value === "string" && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

export function beforeNow(date: string, time: string, now: Date) {
  return new Date(`${date}T${time}:00+09:00`).getTime() < now.getTime();
}
