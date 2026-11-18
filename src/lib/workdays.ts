import { addDays, weekday } from "./dates.ts";

// デモ撮影用の休業日。将来の祝日改正時は更新する。
function holidays(year: number) {
  const days = new Set<string>();
  const date = (month: number, day: number) =>
    `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const fixed = (month: number, day: number) => days.add(date(month, day));
  const monday = (month: number, nth: number) =>
    fixed(month, 1 + ((8 - weekday(date(month, 1))) % 7) + (nth - 1) * 7);
  fixed(1, 1);
  monday(1, 2);
  fixed(2, 11);
  if (year >= 2020) fixed(2, 23);
  // 1980〜2099年の春分・秋分の近似式。範囲外は候補日を休業とする。
  if (year >= 1980 && year <= 2099) {
    fixed(3, Math.floor(20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
    fixed(9, Math.floor(23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4)));
  } else {
    [19, 20, 21, 22].forEach((day) => fixed(3, day));
    [21, 22, 23, 24].forEach((day) => fixed(9, day));
  }
  fixed(4, 29);
  fixed(5, 3);
  fixed(5, 4);
  fixed(5, 5);
  if (year === 2020 || year === 2021) {
    fixed(7, year === 2020 ? 23 : 22);
    fixed(7, year === 2020 ? 24 : 23);
    fixed(8, year === 2020 ? 10 : 8);
  } else {
    monday(7, 3);
    if (year >= 2016) fixed(8, 11);
    monday(10, 2);
  }
  monday(9, 3);
  fixed(11, 3);
  fixed(11, 23);
  if (year <= 2018) fixed(12, 23);
  if (year === 2019) {
    fixed(5, 1);
    fixed(10, 22);
  }
  const national = [...days].sort();
  for (const day of national) if (days.has(addDays(day, 2))) days.add(addDays(day, 1));
  for (const day of national) {
    if (weekday(day) !== 0) continue;
    let substitute = addDays(day, 1);
    while (days.has(substitute)) substitute = addDays(substitute, 1);
    days.add(substitute);
  }
  return days;
}

export function isWorkday(date: string) {
  const monthDay = date.slice(5);
  return (
    weekday(date) !== 0 &&
    weekday(date) !== 6 &&
    !(monthDay >= "12-29" || monthDay <= "01-03") &&
    !holidays(Number(date.slice(0, 4))).has(date)
  );
}

export function workdayOnOrBefore(date: string): string {
  while (!isWorkday(date)) date = addDays(date, -1);
  return date;
}

export function workdaysBefore(date: string, count: number): string {
  for (let remaining = count; remaining > 0; remaining--)
    date = workdayOnOrBefore(addDays(date, -1));
  return date;
}
