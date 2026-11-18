let connection: Promise<IDBDatabase> | undefined;

function database() {
  connection ??= new Promise((resolve, reject) => {
    const request = indexedDB.open("cpl-photos", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("images");
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      connection = undefined;
      reject(new Error("画像保存領域を開けません。ブラウザの保存設定をご確認ください。"));
    };
  });
  return connection;
}

export async function getImage(id: string): Promise<Blob | undefined> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const request = db.transaction("images").objectStore("images").get(id);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new Error("画像を取得できませんでした。"));
  });
}

export async function putImages(images: { id: string; blob: Blob }[], replace = false) {
  const db = await database();
  return new Promise<void>((resolve, reject) => {
    const transaction = db.transaction("images", "readwrite");
    const store = transaction.objectStore("images");
    if (replace) store.clear();
    for (const image of images) store.put(image.blob, image.id);
    transaction.oncomplete = () => resolve();
    transaction.onerror = () =>
      reject(new Error("画像の保存に失敗しました。空き容量を確認してください。"));
    transaction.onabort = () => reject(new Error("画像の保存を完了できませんでした。"));
  });
}
