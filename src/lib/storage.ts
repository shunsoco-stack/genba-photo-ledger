import { validateLedger, validateBackup, blobToBase64, base64ToBlob } from "./backup.ts";
import { getImage, putImages } from "./idb.ts";
import { loadImage } from "./image.ts";
import { sampleImage } from "./samples.ts";
import { createSeed } from "./seed.ts";
import type { Backup, Ledger } from "./types.ts";

export const storageKey = "cpl:v1";

export function saveLedger(data: Ledger) {
  if (!validateLedger(data))
    throw new Error("保存するデータが不正です。入力内容を確認してください。");
  localStorage.setItem(storageKey, JSON.stringify(data));
}

async function replaceData(data: Ledger, images: { id: string; blob: Blob }[]) {
  const previous = localStorage.getItem(storageKey);
  // First check localStorage capacity, then replace images in one atomic transaction.
  saveLedger(data);
  try {
    await putImages(images, true);
  } catch (error) {
    if (previous === null) localStorage.removeItem(storageKey);
    else localStorage.setItem(storageKey, previous);
    throw error;
  }
}

export async function resetLedger() {
  const data = createSeed(new Date());
  const images = [];
  for (const [index, photo] of data.photos.entries()) {
    images.push({ id: photo.id, blob: await sampleImage(photo, index) });
  }
  await replaceData(data, images);
  return data;
}

let initialization: Promise<{ data: Ledger; notice: string }> | undefined;

export function initializeLedger() {
  initialization ??= (async () => {
    const source = localStorage.getItem(storageKey);
    if (source === null)
      return { data: await resetLedger(), notice: "サンプルの工事3件・写真52枚を準備しました。" };
    try {
      const data: unknown = JSON.parse(source);
      if (!validateLedger(data)) throw new Error("invalid");
      for (const photo of data.photos) {
        const blob = await getImage(photo.id);
        if (!(blob instanceof Blob) || blob.size === 0) throw new Error("missing image");
        const source = URL.createObjectURL(blob);
        try {
          await loadImage(source);
        } finally {
          URL.revokeObjectURL(source);
        }
      }
      return { data, notice: "" };
    } catch {
      return {
        data: await resetLedger(),
        notice: "保存データの破損または画像の欠落が見つかったため、既定データに戻しました。",
      };
    }
  })();
  return initialization;
}

export async function exportBackup(data: Ledger): Promise<Backup> {
  const images: Record<string, string> = Object.create(null);
  for (const photo of data.photos) {
    const blob = await getImage(photo.id);
    if (!blob) throw new Error("画像が見つかりません。バックアップを中止しました。");
    images[photo.id] = await blobToBase64(blob);
  }
  return { format: "cpl-backup", version: 1, data, images };
}

export async function importBackup(value: unknown) {
  if (!validateBackup(value))
    throw new Error("バックアップの形式またはデータが不正です。現在のデータは変更していません。");
  const images = [];
  for (const photo of value.data.photos) {
    const source = value.images[photo.id];
    await loadImage(source);
    images.push({ id: photo.id, blob: base64ToBlob(source) });
  }
  await replaceData(value.data, images);
  return value.data;
}
