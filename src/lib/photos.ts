import type { Photo } from "./types.ts";

export type Filters = { trade: string; place: string; date: string; category: string };

export function sortPhotos(photos: Photo[]) {
  return [...photos].sort((a, b) =>
    `${a.date}T${a.time}-${a.id}`.localeCompare(`${b.date}T${b.time}-${b.id}`),
  );
}

export function filterPhotos(photos: Photo[], filters: Partial<Filters>) {
  return sortPhotos(
    photos.filter((photo) =>
      Object.entries(filters).every(
        ([key, value]) =>
          !value ||
          (value === "未整理" && key === "trade"
            ? !photo.trade
            : photo[key as keyof Filters] === value),
      ),
    ),
  );
}

export function groupPhotos(photos: Photo[], group: "trade" | "date" | "place") {
  const groups = new Map<string, Photo[]>();
  for (const photo of sortPhotos(photos)) {
    const label = photo[group] || "未整理";
    const items = groups.get(label) ?? [];
    items.push(photo);
    groups.set(label, items);
  }
  return Array.from(groups.entries());
}

export function safeName(value: string) {
  return value.replace(/[^\p{L}\p{N}_-]/gu, "").slice(0, 70) || "未設定";
}

export function photoFilename(photo: Photo, index: number) {
  return `写真_${photo.date}_${safeName(photo.trade)}_${safeName(photo.place)}_${String(index).padStart(3, "0")}.jpg`;
}
