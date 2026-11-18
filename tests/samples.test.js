import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { sampleScene } from "../src/lib/sample-scene.ts";

const photos = createSeed(new Date("2026-11-18T12:00:00+09:00")).photos;
for (const trade of new Set(photos.map((p) => p.trade).filter(Boolean))) {
  test(`${trade}: 実データの構図が3種類以上`, () => {
    const kinds = new Set(photos.filter((p) => p.trade === trade).map((p) => sampleScene(p).kind));
    assert.ok(kinds.size >= 3, `${trade}: ${[...kinds]}`);
  });
}
test("全52枚で構図15種類以上、未整理も内容に対応", () => {
  assert.equal(photos.length, 52);
  assert.ok(new Set(photos.map((p) => sampleScene(p).kind)).size >= 15);
  assert.deepEqual(
    photos
      .filter((p) => !p.trade)
      .map((p) => sampleScene(p).kind)
      .sort(),
    ["ground-drain", "interior-hatch"],
  );
});
test("同じ写真ID・内容は常に同じ結果、日付と配列順に依存しない", () => {
  const scenes = new Map(photos.map((p) => [p.id, sampleScene(p)]));
  for (const p of [...photos].reverse()) {
    assert.deepEqual(sampleScene({ ...p }), scenes.get(p.id));
    assert.deepEqual(sampleScene({ ...p, date: "2027-01-04", time: "09:00" }), scenes.get(p.id));
  }
});
test("同じ給水分岐でもIDごとにカメラ・明るさ・影が変わる", () => {
  const scenes = photos.filter((p) => p.point.includes("給水分岐")).map(sampleScene);
  for (const key of ["camera", "light", "shadow", "skyHue"]) {
    assert.equal(new Set(scenes.map((s) => JSON.stringify(s[key]))).size, scenes.length);
  }
});
test("測点・場所・メモ・区分に応じた具体的な構図", () => {
  const cases = [
    ["給水分岐", "pipe-tee"],
    ["排水管 支持部", "pipe-drain"],
    ["壁内給湯管", "pipe-studs"],
    ["保温端部", "pipe-insulation"],
    ["洗面台裏", "pipe-valve"],
    ["給水継手", "pipe-test"],
    ["床下地", "interior-plywood"],
    ["入隅", "interior-corner"],
    ["巾木", "interior-skirting"],
  ];
  for (const [point, kind] of cases)
    assert.equal(sampleScene(photos.find((p) => p.point.includes(point))).kind, kind);
  const base = photos[0];
  assert.equal(
    sampleScene({ ...base, trade: "基礎工", point: "No.1", memo: "砕石転圧" }).kind,
    "ground-compaction",
  );
  assert.equal(sampleScene({ ...base, trade: "仮設工", place: "1階 床下" }).kind, "interior-hatch");
});
test("実際の目地是正前後は構図・カメラ・照明・小物が一致し状態だけ変わる", () => {
  const pair = photos.filter((p) => p.trade === "外構工" && p.memo.includes("目地"));
  const scenes = pair.map(sampleScene);
  assert.ok(scenes.some((s) => s.state === "defect"));
  assert.ok(scenes.some((s) => s.state === "repaired"));
  const withoutState = (scene) => ({ ...scene, state: undefined });
  for (const scene of scenes) assert.deepEqual(withoutState(scene), withoutState(scenes[0]));
});
test("給水固定部の是正前後はIDが違っても同じ構図", () => {
  const photo = photos.find((p) => p.point.includes("給水固定部"));
  const before = sampleScene({
    ...photo,
    id: "before",
    memo: "固定金具の是正前",
    category: "施工中",
  });
  const after = sampleScene({ ...photo, id: "after", memo: "固定金具の是正後" });
  assert.equal(before.state, "defect");
  assert.equal(after.state, "repaired");
  assert.deepEqual({ ...before, state: after.state }, after);
});
test("着工前・完了の状態を保持し、縦長と横長・小物の変化を含む", () => {
  for (const p of photos) {
    if (p.category === "着工前") assert.equal(sampleScene(p).state, "existing");
    if (p.category === "完了") assert.equal(sampleScene(p).state, "finished");
  }
  assert.ok(photos.filter((p) => sampleScene(p).portrait).length >= 2);
  assert.ok(photos.some((p) => !sampleScene(p).portrait));
  assert.equal(new Set(photos.map((p) => sampleScene(p).prop)).size, 4);
});
