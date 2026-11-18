import type { Photo } from "./types.ts";

function hash(text: string) {
  let value = 2166136261;
  for (const character of text) value = Math.imul(value ^ character.charCodeAt(0), 16777619);
  return value >>> 0;
}

function sceneKind(photo: Photo) {
  const text = `${photo.point} ${photo.memo}`;
  switch (photo.trade) {
    case "配管工":
      if (/給水分岐/.test(text)) return "pipe-tee";
      if (/排水管/.test(text)) return "pipe-drain";
      if (/保温端部/.test(text)) return "pipe-insulation";
      if (/壁内/.test(text)) return "pipe-studs";
      if (/固定/.test(text)) return "pipe-bracket";
      if (/洗面台裏/.test(text)) return "pipe-valve";
      if (/通水|給水継手/.test(text)) return "pipe-test";
      return "pipe-basin";
    case "内装工":
      if (/撤去範囲/.test(text)) return "interior-removal";
      if (/床下地|合板/.test(text)) return "interior-plywood";
      if (/入隅|パテ/.test(text)) return "interior-corner";
      if (/巾木/.test(text)) return "interior-skirting";
      if (/床仕上げ|出入口|見切り/.test(text)) return "interior-floor";
      if (/ボード|復旧/.test(text)) return "interior-board";
      return "interior-backing";
    case "土工":
      if (/境界杭/.test(text)) return "ground-boundary";
      return photo.category === "着工前" ? "ground-pavement" : "ground-excavation";
    case "基礎工":
      if (/転圧/.test(text)) return "ground-compaction";
      if (/砕石/.test(text)) return "ground-gravel";
      if (/型枠/.test(text)) return "ground-formwork";
      if (/配筋/.test(text)) return "ground-rebar";
      return "ground-concrete";
    case "外構工":
      if (/目地/.test(text)) return "masonry-joint";
      if (/門柱/.test(text)) return "masonry-pillar";
      if (/通路/.test(text)) return "ground-path";
      if (/排水桝/.test(text)) return "ground-drain";
      return "masonry-blocks";
    case "下地補修":
      if (/浮き/.test(text)) return "facade-anchors";
      return photo.category === "着工前" ? "facade-crack" : "facade-patch";
    case "塗装工":
      if (/全景/.test(text)) return "facade-overview";
      if (/庇/.test(text)) return "facade-canopy";
      return "facade-paint";
    case "仮設工":
      if (/床下/.test(photo.place)) return "interior-hatch";
      if (/洗面所/.test(photo.place)) return "interior-protection";
      if (photo.category === "着工前" || photo.category === "完了") return "facade-overview";
      if (/壁つなぎ/.test(text)) return "scaffold-tie";
      return "scaffold-platform";
    default:
      return /排水桝|外構/.test(`${photo.place} ${text}`) ? "ground-drain" : "interior-hatch";
  }
}

/** DOM・日付・配列順に依存しない構図指定。是正比較は測点ごとの共通カメラを使う。 */
export function sampleScene(photo: Photo) {
  const kind = sceneKind(photo);
  const comparison =
    kind === "masonry-joint" || kind === "pipe-bracket" || /是正前|是正後/.test(photo.memo);
  const seed = hash(
    comparison ? `${photo.projectId}|${photo.trade}|${photo.place}|${photo.point}` : photo.id,
  );
  let value = seed;
  const random = () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
  const repaired =
    /是正後|増し締め後|再充填後|補修済み/.test(photo.memo) ||
    (photo.category === "是正" && !/是正前/.test(photo.memo));
  const state =
    photo.category === "着工前"
      ? "existing"
      : photo.category === "完了"
        ? "finished"
        : repaired
          ? "repaired"
          : comparison
            ? "defect"
            : "working";
  return {
    kind,
    state,
    seed,
    camera: {
      zoom: 0.94 + random() * 0.2,
      x: (random() - 0.5) * 64,
      y: (random() - 0.5) * 36,
      angle: (random() - 0.5) * 0.08,
    },
    light: 0.03 + random() * 0.1,
    skyHue: 190 + random() * 30,
    shadow: 8 + random() * 16,
    prop: Math.floor(random() * 4),
    portrait: seed % 13 === 0,
  };
}

export type SampleScene = ReturnType<typeof sampleScene>;
