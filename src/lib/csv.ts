import type { Photo, Project } from "./types.ts";
import { safeName, sortPhotos } from "./photos.ts";

export function csvCell(value: string) {
  const safe = /^[=+\-@\t\r]/.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function photosCsv(photos: Photo[]) {
  const rows = [["撮影日", "時刻", "工種", "場所", "測点・部位", "区分", "メモ", "写真帳に掲載"]];
  for (const photo of sortPhotos(photos)) {
    rows.push([
      photo.date,
      photo.time,
      photo.trade,
      photo.place,
      photo.point,
      photo.category,
      photo.memo,
      photo.included ? "掲載" : "除外",
    ]);
  }
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function csvFilename(project: Project, date: string) {
  return `写真一覧_${safeName(project.name)}_${date}.csv`;
}
