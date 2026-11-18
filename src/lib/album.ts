import { sortPhotos } from "./photos.ts";
import type { Photo } from "./types.ts";

export function albumPages(photos: Photo[]) {
  const selected = sortPhotos(photos.filter((photo) => photo.included));
  const pages: { number: number; cover: boolean; photos: Photo[] }[] = [
    { number: 1, cover: true, photos: [] },
  ];
  for (let index = 0; index < selected.length; index += 3) {
    pages.push({
      number: pages.length + 1,
      cover: false,
      photos: selected.slice(index, index + 3),
    });
  }
  return pages;
}
