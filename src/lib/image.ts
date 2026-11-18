export function resizeDimensions(width: number, height: number, maximum = 1600) {
  if (![width, height, maximum].every((value) => Number.isFinite(value) && value > 0)) {
    throw new Error("画像サイズが不正です。");
  }
  const ratio = Math.min(1, maximum / Math.max(width, height));
  return {
    width: Math.max(1, Math.round(width * ratio)),
    height: Math.max(1, Math.round(height * ratio)),
  };
}

export function loadImage(source: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new Error("画像を読み込めませんでした。JPEG・PNG・WebPなどに変換してください。"));
    image.src = source;
  });
}

export function canvasBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("画像の変換に失敗しました。"))),
      "image/jpeg",
      0.86,
    ),
  );
}

export async function compressImage(file: Blob) {
  const source = URL.createObjectURL(file);
  try {
    const image = await loadImage(source);
    const dimensions = resizeDimensions(image.naturalWidth, image.naturalHeight);
    const canvas = document.createElement("canvas");
    Object.assign(canvas, dimensions);
    const context = canvas.getContext("2d");
    if (!context) throw new Error("画像を処理できません。");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
    return await canvasBlob(canvas);
  } finally {
    URL.revokeObjectURL(source);
  }
}

export function download(blob: Blob, filename: string) {
  const source = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = source;
  anchor.download = filename;
  anchor.click();
  setTimeout(() => URL.revokeObjectURL(source), 10000);
}
