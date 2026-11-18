"use client";

import { useState, type FormEvent } from "react";
import { useLedger, AppLink } from "./provider";
import { PhotoImage } from "./photo-image";
import { categories, type Photo, type Project, type Position, type BoardSize } from "@/lib/types";
import { photoFilename, sortPhotos } from "@/lib/photos";
import { getImage } from "@/lib/idb";
import { loadImage, canvasBlob, download } from "@/lib/image";
import { drawBoard } from "@/lib/blackboard";

export function PhotoDetail({ project, photo }: { project: Project; photo: Photo }) {
  const { data, updatePhoto, run, notify } = useLedger();
  const [draft, setDraft] = useState(photo);
  const photos = sortPhotos(data.photos.filter((item) => item.projectId === project.id));
  const index = photos.findIndex((item) => item.id === photo.id);
  const dirty = JSON.stringify(draft) !== JSON.stringify(photo);
  function update<K extends keyof Photo>(key: K, value: Photo[K]) {
    setDraft({ ...draft, [key]: value });
  }

  function save(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      updatePhoto(draft);
      notify("写真の情報を保存しました。");
    });
  }

  async function exportPhoto() {
    await run(async () => {
      const blob = await getImage(photo.id);
      if (!blob) throw new Error("元画像が見つかりません。");
      const source = URL.createObjectURL(blob);
      try {
        const image = await loadImage(source);
        const canvas = document.createElement("canvas");
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("黒板を描画できません。");
        context.drawImage(image, 0, 0);
        drawBoard(context, canvas.width, canvas.height, project, draft);
        download(await canvasBlob(canvas), photoFilename(draft, index + 1));
        notify("表示中の内容で黒板入りJPEGを保存しました。元画像はそのまま残ります。");
      } finally {
        URL.revokeObjectURL(source);
      }
    });
  }

  return (
    <>
      <AppLink href={`/projects/${project.id}`} className="back-link">
        ← 写真一覧へ{dirty ? "（未保存の変更は破棄されます）" : ""}
      </AppLink>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PHOTO DETAIL / {String(index + 1).padStart(3, "0")}</p>
          <h1>写真と黒板の編集</h1>
          <p className="muted">{project.name}</p>
        </div>
        <span className="count-badge">
          {index + 1} / {photos.length} 枚
        </span>
      </div>
      <div className="detail-grid">
        <section className="preview-panel">
          <div className="detail-image">
            <PhotoImage photo={draft} project={project} blackboard />
          </div>
          <div className="board-controls">
            <label>
              黒板の位置
              <select
                value={draft.position}
                onChange={(event) => update("position", event.target.value as Position)}
              >
                {["左下", "右下", "左上", "右上"].map((position) => (
                  <option key={position}>{position}</option>
                ))}
              </select>
            </label>
            <label>
              黒板のサイズ
              <select
                value={draft.size}
                onChange={(event) => update("size", event.target.value as BoardSize)}
              >
                {["小", "中", "大"].map((size) => (
                  <option key={size}>{size}</option>
                ))}
              </select>
            </label>
          </div>
          <button className="primary full-width" onClick={exportPhoto}>
            ↓ 黒板入り画像を保存
          </button>
          <p className="small muted">
            表示中の黒板を合成したJPEGを保存します。情報編集後は右の保存ボタンも押してください。
          </p>
          <div className="photo-pager">
            {photos[index - 1] ? (
              <AppLink
                className="button"
                href={`/projects/${project.id}/photos/${photos[index - 1].id}`}
              >
                ← 前の写真
              </AppLink>
            ) : (
              <span />
            )}
            {photos[index + 1] && (
              <AppLink
                className="button"
                href={`/projects/${project.id}/photos/${photos[index + 1].id}`}
              >
                次の写真 →
              </AppLink>
            )}
          </div>
          {dirty && (
            <p className="amber small" role="status">
              未保存の変更があります。移動前に情報を保存してください。
            </p>
          )}
        </section>
        <section className="panel">
          <h2>写真の情報</h2>
          <form onSubmit={save} className="form-grid">
            <label>
              工種
              <select value={draft.trade} onChange={(event) => update("trade", event.target.value)}>
                <option value="">未設定（未整理）</option>
                {project.trades.map((trade) => (
                  <option key={trade}>{trade}</option>
                ))}
              </select>
            </label>
            <label>
              場所
              <select value={draft.place} onChange={(event) => update("place", event.target.value)}>
                <option value="">未設定</option>
                {project.places.map((place) => (
                  <option key={place}>{place}</option>
                ))}
              </select>
            </label>
            <label>
              撮影日
              <input
                type="date"
                required
                value={draft.date}
                onChange={(event) => update("date", event.target.value)}
              />
            </label>
            <label>
              撮影時刻（日本時間）
              <input
                type="time"
                required
                value={draft.time}
                onChange={(event) => update("time", event.target.value)}
              />
            </label>
            <label className="span-two">
              測点・部位
              <input
                value={draft.point}
                maxLength={120}
                placeholder="例：床下 給水管"
                onChange={(event) => update("point", event.target.value)}
              />
            </label>
            <label className="span-two">
              区分
              <select
                value={draft.category}
                onChange={(event) => update("category", event.target.value as Photo["category"])}
              >
                {categories.map((category) => (
                  <option key={category}>{category}</option>
                ))}
              </select>
            </label>
            <label className="span-two">
              メモ（200文字以内）
              <textarea
                aria-label="メモ"
                rows={5}
                maxLength={200}
                value={draft.memo}
                onChange={(event) => update("memo", event.target.value)}
              />
            </label>
            <label className="checkbox-label span-two">
              <input
                type="checkbox"
                checked={draft.included}
                onChange={(event) => update("included", event.target.checked)}
              />
              写真帳に載せる
            </label>
            <button className="primary span-two" type="submit">
              情報・黒板設定を保存
            </button>
          </form>
        </section>
      </div>
    </>
  );
}
