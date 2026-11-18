import { test } from "node:test";
import assert from "node:assert/strict";
import { createSeed } from "../src/lib/seed.ts";
import { japanNow, addDays, weekday, validDate, validTime, beforeNow } from "../src/lib/dates.ts";
import {
  filterPhotos,
  sortPhotos,
  groupPhotos,
  safeName,
  photoFilename,
} from "../src/lib/photos.ts";
import { albumPages } from "../src/lib/album.ts";
import { boardLayout, boardFields } from "../src/lib/blackboard.ts";
import { resizeDimensions } from "../src/lib/image.ts";
import { photosCsv, csvCell, csvFilename } from "../src/lib/csv.ts";
import { validateLedger, validateBackup } from "../src/lib/backup.ts";

const now = new Date("2026-11-18T12:00:00+09:00");

const seed = createSeed(now);

const photo = seed.photos[0];

const project = seed.projects[0];

const clone = (value) => structuredClone(value);

const moments = [
  "2026-11-18T00:01:00+09:00",
  "2026-11-18T08:00:00+09:00",
  "2026-11-18T12:15:00+09:00",
  "2026-11-18T23:59:00+09:00",
  "2026-12-01T00:10:00+09:00",
  "2026-12-31T23:50:00+09:00",
  "2026-11-22T13:00:00+09:00",
  "2028-03-01T00:00:00+09:00",
];
for (const moment of moments) {
  const current = new Date(moment);
  test(`シード: ${moment} の全写真が過去かつ工期内`, () => {
    const data = createSeed(current);
    assert.ok(validateLedger(data));
    for (const item of data.photos) {
      const site = data.projects.find((entry) => entry.id === item.projectId);
      assert.ok(beforeNow(item.date, item.time, current));
      assert.ok(item.date >= site.start && item.date <= site.end);
      assert.ok(item.time >= "08:00" && item.time <= "17:30");
    }
  });
  test(`シード: ${moment} の日曜・工種整合`, () => {
    const data = createSeed(current);
    for (const item of data.photos) {
      assert.notEqual(weekday(item.date), 0);
      const site = data.projects.find((entry) => entry.id === item.projectId);
      assert.ok(!item.trade || site.trades.includes(item.trade));
      assert.ok(site.places.includes(item.place));
    }
  });
  test(`シード: ${moment} の着工前→施工中→完了`, () => {
    const data = createSeed(current);
    for (const site of data.projects) {
      const items = sortPhotos(data.photos.filter((item) => item.projectId === site.id));
      let phase = 0;
      for (const item of items) {
        const next = item.category === "着工前" ? 0 : item.category === "完了" ? 2 : 1;
        assert.ok(next >= phase);
        phase = next;
        if (next === 2) {
          assert.ok(
            new Date(item.date) - new Date(site.start) >
              (new Date(site.end) - new Date(site.start)) / 2,
          );
        }
      }
    }
  });
}

test("シードは3工事・52写真・進行中2件", () => {
  assert.equal(seed.projects.length, 3);
  assert.equal(seed.photos.length, 52);
  assert.equal(seed.projects.filter((item) => !item.completed).length, 2);
});
test("シードのメモは重複しない", () =>
  assert.equal(new Set(seed.photos.map((item) => item.memo)).size, 52));
test("未整理2枚・是正2枚", () => {
  assert.equal(seed.photos.filter((item) => !item.trade).length, 2);
  assert.equal(seed.photos.filter((item) => item.category === "是正").length, 2);
});
test("撮影間隔にばらつきがあり同日に複数枚", () => {
  const dates = [
    ...new Set(
      seed.photos.filter((item) => item.projectId === project.id).map((item) => item.date),
    ),
  ].sort();
  const gaps = dates
    .slice(1)
    .map((date, index) => (new Date(date) - new Date(dates[index])) / 86400000);
  assert.ok(new Set(gaps).size >= 3);
  assert.ok(dates.length < 12);
});
test("水回り改修は配管工・内装工が過半数", () => {
  const items = seed.photos.filter((item) => item.projectId === "sakura");
  assert.ok(
    items.filter((item) => ["配管工", "内装工"].includes(item.trade)).length > items.length / 2,
  );
});
test("日本時間で日付が変わる", () =>
  assert.deepEqual(japanNow(new Date("2026-11-17T15:03:00Z")), {
    date: "2026-11-18",
    time: "00:03",
  }));
test("月跨ぎの加算", () => assert.equal(addDays("2026-11-30", 1), "2026-12-01"));
test("閏年の減算", () => assert.equal(addDays("2028-03-01", -1), "2028-02-29"));
test("存在しない日付を拒否", () => assert.equal(validDate("2026-02-30"), false));
test("不正時刻を拒否", () => assert.equal(validTime("24:00"), false));

for (const count of [0, 1, 3, 4, 10]) {
  test(`写真帳 ${count}枚のページ数・表紙・番号・3枚制限`, () => {
    const photos = seed.photos.slice(0, count).map((item) => ({ ...item, included: true }));
    const pages = albumPages(photos);
    assert.equal(pages.length, 1 + Math.ceil(count / 3));
    assert.equal(pages[0].cover, true);
    assert.equal(pages[0].photos.length, 0);
    assert.deepEqual(
      pages.map((page) => page.number),
      Array.from({ length: pages.length }, (_, index) => index + 1),
    );
    assert.equal(pages.flatMap((page) => page.photos).length, count);
    assert.ok(pages.every((page) => page.photos.length <= 3));
  });
}
test("写真帳の除外と撮影順", () => {
  const pages = albumPages([...seed.photos].reverse());
  assert.deepEqual(
    pages.flatMap((page) => page.photos),
    sortPhotos(seed.photos.filter((item) => item.included)),
  );
});
for (const [width, height] of [
  [1600, 1200],
  [1200, 1600],
]) {
  for (const position of ["左下", "右下", "左上", "右上"]) {
    for (const size of ["小", "中", "大"]) {
      test(`黒板 ${width}x${height} ${position} ${size}`, () => {
        const box = boardLayout(width, height, position, size);
        assert.ok(box.x > 0 && box.y > 0);
        assert.ok(box.x + box.width < width && box.y + box.height < height);
        assert.ok(Math.abs(box.height / box.width - 0.56) < 0.0001);
        assert.ok(box.width <= width * 0.68);
        assert.ok(
          position.startsWith("左") ? box.x < width * 0.1 : box.x + box.width > width * 0.9,
        );
        assert.ok(
          position.endsWith("上") ? box.y < height * 0.1 : box.y + box.height > height * 0.9,
        );
      });
    }
  }
}
test("黒板の大きさは小・中・大の順", () => {
  const widths = ["小", "中", "大"].map((size) => boardLayout(1600, 1200, "左下", size).width);
  assert.ok(widths[0] < widths[1] && widths[1] < widths[2]);
});
test("黒板の項目と未設定の表示", () => {
  const fields = boardFields(project, { ...photo, trade: "", point: "" });
  assert.deepEqual(
    fields.map(([label]) => label),
    ["工事名", "工種", "場所", "測点", "撮影日", "施工者"],
  );
  assert.equal(fields[1][1], "未設定");
  assert.equal(fields[3][1], "―");
});
test("ファイル名の記号と空白を除去", () => assert.equal(safeName('1階 東側 /:*?"<>|'), "1階東側"));
test("黒板画像のファイル名", () =>
  assert.equal(
    photoFilename({ ...photo, date: "2026-11-18", trade: "基礎工", place: "1階 東側" }, 3),
    "写真_2026-11-18_基礎工_1階東側_003.jpg",
  ));
test("空のファイル名には代替文字列", () => assert.equal(safeName(" /:*"), "未設定"));
for (const [width, height, expected] of [
  [4000, 3000, { width: 1600, height: 1200 }],
  [3000, 4000, { width: 1200, height: 1600 }],
  [800, 600, { width: 800, height: 600 }],
  [1600, 1600, { width: 1600, height: 1600 }],
  [10000, 1, { width: 1600, height: 1 }],
]) {
  test(`縮小 ${width}x${height}`, () =>
    assert.deepEqual(resizeDimensions(width, height), expected));
}
test("縮小に不正なサイズを指定すると拒否", () => assert.throws(() => resizeDimensions(0, 10)));
test("撮影日時順・元配列を変更しない", () => {
  const reversed = [...seed.photos].reverse();
  const copy = [...reversed];
  const sorted = sortPhotos(reversed);
  assert.deepEqual(reversed, copy);
  assert.ok(
    sorted.every(
      (item, index) =>
        index === 0 ||
        `${item.date}${item.time}` >= `${sorted[index - 1].date}${sorted[index - 1].time}`,
    ),
  );
});
for (const key of ["trade", "place", "date", "category"]) {
  test(`${key} で絞り込める`, () => {
    const result = filterPhotos(seed.photos, { [key]: photo[key] });
    assert.ok(result.length > 0);
    assert.ok(result.every((item) => item[key] === photo[key]));
  });
}
test("複数条件はANDで絞り込む", () =>
  assert.ok(
    filterPhotos(seed.photos, { trade: "配管工", place: "1階 洗面所" }).every(
      (item) => item.trade === "配管工" && item.place === "1階 洗面所",
    ),
  ));
test("未整理フィルター", () =>
  assert.equal(filterPhotos(seed.photos, { trade: "未整理" }).length, 2));
for (const key of ["trade", "date", "place"]) {
  test(`${key} でグループ化し全件保持`, () => {
    const groups = groupPhotos(seed.photos, key);
    assert.equal(groups.flatMap(([, items]) => items).length, 52);
    for (const [label, items] of groups)
      assert.ok(items.every((item) => (item[key] || "未整理") === label));
  });
}
test("CSVはBOM付き", () => assert.equal(photosCsv(seed.photos).charCodeAt(0), 0xfeff));
test("CSVは引用符・改行・カンマを保持", () => assert.equal(csvCell('a,"b"\nc'), '"a,""b""\nc"'));
test("CSV数式の実行を抑止", () => assert.equal(csvCell("=1+1"), '"\'=1+1"'));
test("CSVファイル名", () =>
  assert.equal(
    csvFilename({ ...project, name: "工事 / A" }, "2026-11-18"),
    "写真一覧_工事A_2026-11-18.csv",
  ));

const backup = {
  format: "cpl-backup",
  version: 1,
  data: seed,
  images: Object.fromEntries(
    seed.photos.map((item) => [item.id, "data:image/jpeg;base64,/9j/2Q=="]),
  ),
};
test("有効なバックアップの構造", () => assert.ok(validateBackup(backup)));
const corruptions = [
  [
    "バージョン",
    (value) => {
      value.version = 2;
    },
  ],
  [
    "形式",
    (value) => {
      value.format = "unknown";
    },
  ],
  [
    "画像不足",
    (value) => {
      delete value.images[photo.id];
    },
  ],
  [
    "余分な画像",
    (value) => {
      value.images.extra = "data:image/jpeg;base64,/9j/2Q==";
    },
  ],
  [
    "外部画像",
    (value) => {
      value.images[photo.id] = "https://example.com/image.jpg";
    },
  ],
  [
    "SVG画像",
    (value) => {
      value.images[photo.id] = "data:image/svg+xml;base64,PHN2Zz4=";
    },
  ],
  [
    "壊れたbase64",
    (value) => {
      value.images[photo.id] = "data:image/jpeg;base64,!!!!";
    },
  ],
  [
    "重複ID",
    (value) => {
      value.data.photos[1].id = photo.id;
    },
  ],
  [
    "不明な工事",
    (value) => {
      value.data.photos[0].projectId = "absent";
    },
  ],
  [
    "日付の破損",
    (value) => {
      value.data.photos[0].date = "2026-02-31";
    },
  ],
  [
    "時刻の破損",
    (value) => {
      value.data.photos[0].time = "99:00";
    },
  ],
  [
    "区分の破損",
    (value) => {
      value.data.photos[0].category = "不明";
    },
  ],
  [
    "工種の破損",
    (value) => {
      value.data.photos[0].trade = "不存在";
    },
  ],
  [
    "位置の破損",
    (value) => {
      value.data.photos[0].position = "中央";
    },
  ],
  [
    "サイズの破損",
    (value) => {
      value.data.photos[0].size = "特大";
    },
  ],
  [
    "掲載値の破損",
    (value) => {
      value.data.photos[0].included = "true";
    },
  ],
  [
    "工期の逆転",
    (value) => {
      value.data.projects[0].start = "2099-01-01";
    },
  ],
  [
    "重複工事",
    (value) => {
      value.data.projects[1].id = project.id;
    },
  ],
  [
    "パスを含むID",
    (value) => {
      value.data.projects[0].id = "../escape";
    },
  ],
  [
    "空の工種",
    (value) => {
      value.data.projects[0].trades = [];
    },
  ],
];
for (const [name, corrupt] of corruptions) {
  test(`バックアップの${name}を拒否`, () => {
    const value = clone(backup);
    corrupt(value);
    assert.equal(validateBackup(value), false);
  });
}
for (const value of [null, [], "broken", {}, { version: 1, projects: [], photos: null }]) {
  test(`不正データ ${JSON.stringify(value)} を拒否`, () =>
    assert.equal(validateLedger(value), false));
}

test("特殊な名前でもグループ化できる", () => {
  const result = groupPhotos([{ ...photo, trade: "__proto__" }], "trade");
  assert.equal(result[0][0], "__proto__");
  assert.equal(result[0][1].length, 1);
});

test("写真帳に収まらない長さのメモを拒否", () => {
  const value = clone(seed);
  value.photos[0].memo = "記".repeat(201);
  assert.equal(validateLedger(value), false);
});

test("黒板位置の配列への型破損を拒否", () => {
  const value = clone(seed);
  value.photos[0].position = ["左下"];
  assert.equal(validateLedger(value), false);
});
