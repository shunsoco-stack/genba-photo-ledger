import type { Ledger, Backup } from "./types.ts";
import { categories } from "./types.ts";
import { validDate, validTime } from "./dates.ts";

function record(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function text(value: unknown, required = false): value is string {
  return (
    typeof value === "string" && value.length <= 5000 && (!required || value.trim().length > 0)
  );
}

function identifier(value: unknown): value is string {
  return typeof value === "string" && /^[a-zA-Z0-9_-]{1,100}$/.test(value);
}

function strings(value: unknown): value is string[] {
  return (
    Array.isArray(value) &&
    value.length > 0 &&
    value.length <= 100 &&
    value.every((item) => text(item, true)) &&
    new Set(value).size === value.length
  );
}

export function validateLedger(value: unknown): value is Ledger {
  if (
    !record(value) ||
    value.version !== 1 ||
    !Array.isArray(value.projects) ||
    !Array.isArray(value.photos)
  )
    return false;
  if (value.projects.length > 500 || value.photos.length > 10000) return false;
  const projectIds = new Set<string>();
  for (const project of value.projects) {
    if (!record(project) || !identifier(project.id) || projectIds.has(project.id)) return false;
    if (![project.name, project.address, project.contractor].every((item) => text(item, true)))
      return false;
    if (
      String(project.name).length > 120 ||
      String(project.address).length > 200 ||
      String(project.contractor).length > 120
    )
      return false;
    if (!validDate(project.start) || !validDate(project.end) || project.start > project.end)
      return false;
    if (
      !strings(project.trades) ||
      !strings(project.places) ||
      typeof project.completed !== "boolean"
    )
      return false;
    if (
      project.trades.some((item) => item.length > 30) ||
      project.places.some((item) => item.length > 60)
    )
      return false;
    projectIds.add(project.id);
  }
  const photoIds = new Set<string>();
  for (const photo of value.photos) {
    if (
      !record(photo) ||
      !identifier(photo.id) ||
      photoIds.has(photo.id) ||
      !identifier(photo.projectId) ||
      !projectIds.has(photo.projectId)
    )
      return false;
    if (![photo.trade, photo.place, photo.point, photo.memo].every((item) => text(item)))
      return false;
    if (String(photo.point).length > 120 || String(photo.memo).length > 200) return false;
    if (
      !validDate(photo.date) ||
      !validTime(photo.time) ||
      !categories.includes(photo.category as never)
    )
      return false;
    if (
      typeof photo.position !== "string" ||
      typeof photo.size !== "string" ||
      !["左下", "右下", "左上", "右上"].includes(photo.position) ||
      !["小", "中", "大"].includes(photo.size)
    )
      return false;
    if (typeof photo.included !== "boolean") return false;
    const project = value.projects.find((item) => item.id === photo.projectId);
    if (photo.trade && !project.trades.includes(photo.trade)) return false;
    if (photo.place && !project.places.includes(photo.place)) return false;
    photoIds.add(photo.id);
  }
  return true;
}

export function validateBackup(value: unknown): value is Backup {
  if (
    !record(value) ||
    value.format !== "cpl-backup" ||
    value.version !== 1 ||
    !validateLedger(value.data) ||
    !record(value.images)
  )
    return false;
  const images = value.images;
  if (Object.keys(images).length !== value.data.photos.length) return false;
  return value.data.photos.every((photo) => {
    const source = images[photo.id];
    return (
      typeof source === "string" &&
      source.length < 15000000 &&
      /^data:image\/jpeg;base64,\/9j\/[A-Za-z0-9+/]*={0,2}$/.test(source)
    );
  });
}

export function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("バックアップの画像変換に失敗しました。"));
    reader.readAsDataURL(blob);
  });
}

export function base64ToBlob(source: string) {
  const binary = atob(source.split(",")[1]);
  return new Blob([Uint8Array.from(binary, (character) => character.charCodeAt(0))], {
    type: "image/jpeg",
  });
}
