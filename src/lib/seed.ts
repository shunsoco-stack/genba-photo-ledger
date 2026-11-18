import type { Ledger, Photo, Project } from "./types.ts";
import { addDays, japanNow } from "./dates.ts";
import { workdayOnOrBefore, workdaysBefore } from "./workdays.ts";
import { seedSessions } from "./seed-records.ts";

export function createSeed(now: Date): Ledger {
  const today = japanNow(now).date;
  // 当日は使わず、前営業日までの撮影記録にする。深夜・連休でも52枚を保持。
  const latest = workdayOnOrBefore(addDays(today, -1));
  const completedEnd = workdayOnOrBefore(addDays(today, -8));
  const projects: Project[] = [
    {
      id: "sakura",
      name: "（架空）さくら町 戸建て水回り改修工事",
      address: "架空県こだま市さくら町2-8",
      start: workdaysBefore(latest, 19),
      end: addDays(today, 18),
      contractor: "やまびこ工務店（架空）",
      trades: ["仮設工", "配管工", "内装工"],
      places: ["1階 洗面所", "1階 床下", "2階 洗面所"],
      completed: false,
    },
    {
      id: "midori",
      name: "（架空）みどり台 店舗外構工事",
      address: "架空県こだま市みどり台4-12",
      start: workdaysBefore(latest, 18),
      end: addDays(today, 12),
      contractor: "やまびこ工務店（架空）",
      trades: ["土工", "基礎工", "外構工"],
      places: ["外構 北面", "店舗 入口", "外構 東面"],
      completed: false,
    },
    {
      id: "komorebi",
      name: "（架空）こもれび荘 外壁改修工事",
      address: "架空県こだま市若葉町1-6",
      start: workdaysBefore(completedEnd, 26),
      end: completedEnd,
      contractor: "やまびこ工務店（架空）",
      trades: ["仮設工", "下地補修", "塗装工"],
      places: ["外壁 南面", "玄関 西側", "外壁 北面"],
      completed: true,
    },
  ];
  const photos: Photo[] = [];
  for (const session of seedSessions) {
    const anchor = session.projectId === "komorebi" ? completedEnd : latest;
    const date = workdaysBefore(anchor, session.daysBefore);
    for (const record of session.records) {
      photos.push({
        ...record,
        id: `sample-${photos.length + 1}`,
        projectId: session.projectId,
        date,
        included: record.included ?? true,
        position: record.position ?? "左下",
        size: record.size ?? "中",
      });
    }
  }
  photos.sort((a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`));
  return { version: 1, projects, photos };
}
