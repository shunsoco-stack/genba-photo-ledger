import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { addDays, beforeNow, japanNow, weekday } from "../src/lib/dates.ts";
import { isWorkday, workdayOnOrBefore } from "../src/lib/workdays.ts";
import { validateLedger } from "../src/lib/backup.ts";

// 生成側の判定とは独立した既知の祝日・振替休日・国民の休日。
const closedDates = [
  "2026-01-01",
  "2026-01-12",
  "2026-02-11",
  "2026-02-23",
  "2026-03-20",
  "2026-04-29",
  "2026-05-03",
  "2026-05-04",
  "2026-05-05",
  "2026-05-06",
  "2026-07-20",
  "2026-08-11",
  "2026-09-21",
  "2026-09-22",
  "2026-09-23",
  "2026-10-12",
  "2026-11-03",
  "2026-11-23",
  "2026-12-29",
  "2026-12-30",
  "2026-12-31",
  "2027-01-01",
  "2027-01-02",
  "2027-01-03",
  "2027-01-11",
  "2027-03-22",
  "2028-03-20",
  "2028-09-22",
];
for (const date of closedDates) {
  test(`休業日 ${date} を除外`, () => assert.equal(isWorkday(date), false));
}
for (const date of [
  "2026-05-07",
  "2026-09-24",
  "2026-11-04",
  "2026-12-28",
  "2027-01-04",
  "2027-03-23",
]) {
  test(`平日 ${date} は撮影可能`, () => assert.equal(isWorkday(date), true));
}
const moments = [
  "2026-11-18T14:30:00+09:00",
  "2026-11-18T00:10:00+09:00",
  "2027-01-02T00:10:00+09:00",
  "2026-05-04T23:50:00+09:00",
  "2026-11-21T23:59:00+09:00",
  "2026-11-22T00:01:00+09:00",
  "2026-11-03T14:30:00+09:00",
  "2026-09-24T00:10:00+09:00",
  "2027-01-04T08:00:00+09:00",
  "2028-03-21T23:50:00+09:00",
];
for (const moment of moments) {
  const now = new Date(moment);
  const data = createSeed(now);
  test(`${moment}: 3工事52枚と全日時の過去・工期内`, () => {
    assert.ok(validateLedger(data));
    assert.equal(data.projects.length, 3);
    assert.equal(data.photos.length, 52);
    assert.equal(data.projects.filter((p) => p.completed).length, 1);
    for (const photo of data.photos) {
      const project = data.projects.find((p) => p.id === photo.projectId);
      assert.ok(beforeNow(photo.date, photo.time, now));
      assert.ok(photo.date >= project.start && photo.date <= project.end);
      assert.ok(photo.date < japanNow(now).date);
    }
  });
  test(`${moment}: 休日なし・昼休みなし・30種類以上の時刻`, () => {
    assert.ok(new Set(data.photos.map((p) => p.time)).size >= 30);
    for (const photo of data.photos) {
      assert.ok(isWorkday(photo.date));
      assert.ok(![0, 6].includes(weekday(photo.date)));
      assert.ok(!closedDates.includes(photo.date));
      assert.ok(photo.date.slice(5) > "01-03" && photo.date.slice(5) < "12-29");
      assert.ok(photo.time >= "08:00" && photo.time <= "17:30");
      assert.notEqual(photo.time.slice(0, 2), "12");
    }
  });
  test(`${moment}: 日時順・各工事1日1〜6枚・3種類以上の枚数`, () => {
    const timestamps = data.photos.map((p) => `${p.date}T${p.time}`);
    assert.deepEqual(timestamps, [...timestamps].sort());
    for (const project of data.projects) {
      const counts = new Map();
      for (const p of data.photos.filter((p) => p.projectId === project.id))
        counts.set(p.date, (counts.get(p.date) ?? 0) + 1);
      assert.ok([...counts.values()].every((count) => count >= 1 && count <= 6));
      assert.ok(new Set(counts.values()).size >= 3);
    }
  });
  test(`${moment}: 着工前は最初の撮影日・完了は工期末7日前以降`, () => {
    for (const project of data.projects) {
      const photos = data.photos.filter((p) => p.projectId === project.id);
      const before = photos.filter((p) => p.category === "着工前");
      assert.ok(before.length > 0);
      assert.ok(before.every((p) => p.date === photos[0].date && p.date >= project.start));
      const complete = photos.filter((p) => p.category === "完了");
      assert.equal(complete.length > 0, project.completed);
      assert.ok(complete.every((p) => p.date >= addDays(project.end, -7) && p.date <= project.end));
      assert.equal(project.end < japanNow(now).date, project.completed);
    }
  });
}
const data = createSeed(new Date(moments[0]));
test("測点の短周期反復がなく、日ごとの並びも一律でない", () => {
  for (const project of data.projects) {
    const photos = data.photos.filter((p) => p.projectId === project.id);
    const points = photos.map((p) => p.point);
    for (let period = 1; period <= 5; period++)
      assert.ok(points.slice(period).some((point, i) => point !== points[i]));
    const dates = [...new Set(photos.map((p) => p.date))];
    const sequences = dates.map((date) =>
      photos
        .filter((p) => p.date === date)
        .map((p) => p.point)
        .join("|"),
    );
    // 同じ補修箇所の再訪は自然。全撮影日が同じ巡回順になることを防ぐ。
    assert.ok(new Set(sequences).size >= 3);
  }
});
test("メモは全件固有・除外3枚には理由・未整理2枚には入力待ちの説明", () => {
  assert.equal(new Set(data.photos.map((p) => p.memo)).size, 52);
  const excluded = data.photos.filter((p) => !p.included);
  assert.equal(excluded.length, 3);
  assert.ok(excluded.every((p) => /ピンぼけ|重複撮影|手ぶれ/.test(p.memo)));
  const unassigned = data.photos.filter((p) => !p.trade);
  assert.equal(unassigned.length, 2);
  assert.ok(unassigned.every((p) => /入力待ち|照合中/.test(p.memo)));
});
test("黒板は左下が過半数、右下・右上・小サイズを含む", () => {
  assert.ok(data.photos.filter((p) => p.position === "左下").length > 26);
  assert.ok(data.photos.some((p) => p.position === "右下"));
  assert.ok(data.photos.some((p) => p.position === "右上"));
  assert.ok(data.photos.some((p) => p.size === "小"));
});
test("外構の測点はNo.1〜5でメモにも同一測点を明記", () => {
  for (const p of data.photos.filter((p) => p.projectId === "midori")) {
    assert.match(p.point, /^No\.[1-5] \+\d\.\d$/);
    assert.ok(p.memo.includes(p.point) || /重複撮影/.test(p.memo));
  }
});
test("戸建ての床下・階数とメモが一致", () => {
  for (const p of data.photos.filter((p) => p.projectId === "sakura")) {
    if (p.point.startsWith("床下")) {
      assert.equal(p.place, "1階 床下");
      assert.ok(p.memo.includes("床下"));
    }
    if (p.point.startsWith("2階")) {
      assert.equal(p.place, "2階 洗面所");
      assert.ok(p.memo.includes("2階"));
    }
    if (p.point.startsWith("北側壁")) assert.equal(p.place, "1階 洗面所");
    assert.ok(!p.point.includes("No."));
  }
});
test("外壁改修の面・工種・測点が一致", () => {
  for (const p of data.photos.filter((p) => p.projectId === "komorebi")) {
    assert.ok(["仮設工", "下地補修", "塗装工"].includes(p.trade));
    assert.ok(!p.point.includes("No."));
    const face = p.point.slice(0, 2);
    assert.ok(p.memo.includes(face));
    assert.equal(p.place, { 南面: "外壁 南面", 西面: "玄関 西側", 北面: "外壁 北面" }[face]);
  }
});
test("年末年始をまたぐ前営業日", () => assert.equal(workdayOnOrBefore("2027-01-03"), "2026-12-28"));
test("同一時刻からの生成は決定的で、返却データは独立", () => {
  const original = createSeed(new Date(moments[0]));
  assert.deepEqual(data, original);
  original.photos[0].memo = "変更";
  assert.deepEqual(data, createSeed(new Date(moments[0])));
});
