"use client";

import { useState, type ChangeEvent } from "react";
import { AppLink, useLedger } from "./provider";
import { PhotoImage } from "./photo-image";
import { categories, type Photo, type Project } from "@/lib/types";
import { filterPhotos, groupPhotos, type Filters } from "@/lib/photos";
import { japanNow } from "@/lib/dates";
import { compressImage, download } from "@/lib/image";
import { putImages } from "@/lib/idb";
import { photosCsv, csvFilename } from "@/lib/csv";

export function PhotosView({ project }: { project: Project }) {
  const { data, commit, updatePhoto, run, notify, today } = useLedger();
  const [filters, setFilters] = useState<Filters>({ trade: "", place: "", date: "", category: "" });
  const [group, setGroup] = useState<"trade" | "date" | "place">("trade");
  const photos = data.photos.filter((photo) => photo.projectId === project.id);
  const filtered = filterPhotos(photos, filters);
  const groups = groupPhotos(filtered, group);

  async function upload(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    await run(async () => {
      const added: Photo[] = [];
      const images = [];
      const failures: string[] = [];
      for (const file of files) {
        try {
          const blob = await compressImage(file);
          const id = crypto.randomUUID();
          const captured = japanNow(new Date(file.lastModified));
          added.push({
            id,
            projectId: project.id,
            trade: "",
            place: "",
            date: captured.date,
            time: captured.time,
            point: "",
            category: "施工中",
            memo: "",
            included: true,
            position: "左下",
            size: "中",
          });
          images.push({ id, blob });
        } catch {
          failures.push(file.name);
        }
      }
      if (images.length) {
        await putImages(images);
        commit({ ...data, photos: [...data.photos, ...added] });
      }
      notify(
        `${added.length}枚の写真を追加しました。工種・場所は写真詳細で設定できます。${failures.length ? ` 読み込めなかったファイル: ${failures.join("、")}` : ""}`,
      );
    });
  }

  function toggle(photo: Photo) {
    void run(async () => updatePhoto({ ...photo, included: !photo.included }));
  }

  return (
    <>
      <AppLink href="/" className="back-link">
        ← 工事一覧
      </AppLink>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT PHOTOS</p>
          <h1 className="project-title">{project.name}</h1>
          <p className="muted">
            {project.address} <span className="inline-dot">・</span>{" "}
            {project.completed ? "完了" : "進行中"}
          </p>
        </div>
        <AppLink href={`/projects/${project.id}/settings`} className="button secondary">
          工事情報を編集
        </AppLink>
      </div>
      <div className="action-bar">
        <div className="file-button">
          <input
            id="add-photos"
            className="visually-hidden"
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={upload}
          />
          <label htmlFor="add-photos" className="button primary">
            ＋ 写真を撮る・選ぶ
          </label>
        </div>
        <AppLink href={`/projects/${project.id}/album`} className="button secondary">
          ▤ 写真帳を作成
        </AppLink>
        <button
          onClick={() =>
            download(
              new Blob([photosCsv(filtered)], { type: "text/csv;charset=utf-8" }),
              csvFilename(project, today),
            )
          }
        >
          一覧CSVを保存
        </button>
      </div>
      <p className="small muted">
        写真は長辺1600px以内のJPEGで保存します。撮影日時の初期値はファイルの更新日時です。
      </p>
      <section className="filter-panel" aria-label="写真の絞り込み">
        <label>
          工種
          <select
            value={filters.trade}
            onChange={(event) => setFilters({ ...filters, trade: event.target.value })}
          >
            <option value="">すべての工種</option>
            <option>未整理</option>
            {project.trades.map((trade) => (
              <option key={trade}>{trade}</option>
            ))}
          </select>
        </label>
        <label>
          場所
          <select
            value={filters.place}
            onChange={(event) => setFilters({ ...filters, place: event.target.value })}
          >
            <option value="">すべての場所</option>
            {project.places.map((place) => (
              <option key={place}>{place}</option>
            ))}
          </select>
        </label>
        <label>
          撮影日
          <input
            type="date"
            value={filters.date}
            onChange={(event) => setFilters({ ...filters, date: event.target.value })}
          />
        </label>
        <label>
          区分
          <select
            value={filters.category}
            onChange={(event) => setFilters({ ...filters, category: event.target.value })}
          >
            <option value="">すべての区分</option>
            {categories.map((category) => (
              <option key={category}>{category}</option>
            ))}
          </select>
        </label>
        <button onClick={() => setFilters({ trade: "", place: "", date: "", category: "" })}>
          条件をクリア
        </button>
      </section>
      <div className="list-toolbar">
        <p>
          <strong>{filtered.length}</strong> / {photos.length} 枚{" "}
          <span className="muted small">
            （写真帳に掲載 {photos.filter((photo) => photo.included).length} 枚）
          </span>
        </p>
        <label className="group-select">
          グループ表示
          <select value={group} onChange={(event) => setGroup(event.target.value as typeof group)}>
            <option value="trade">工種ごと</option>
            <option value="date">日付ごと</option>
            <option value="place">場所ごと</option>
          </select>
        </label>
      </div>
      {groups.map(([label, items]) => (
        <section key={label} className="photo-group">
          <h2>
            {label}
            <span>{items.length}枚</span>
          </h2>
          <div className="photo-grid">
            {items.map((photo) => (
              <article className="photo-card" key={photo.id}>
                <AppLink
                  href={`/projects/${project.id}/photos/${photo.id}`}
                  className="photo-card-image"
                >
                  <PhotoImage photo={photo} project={project} />
                  <span className={`category-tag ${photo.category === "是正" ? "correction" : ""}`}>
                    {photo.category}
                  </span>
                </AppLink>
                <div className="photo-card-body">
                  <strong>{photo.place || "場所未設定"}</strong>
                  <p>{photo.point || "測点・部位を追加できます"}</p>
                  <div className="photo-card-meta">
                    <span>
                      {photo.date} {photo.time}
                    </span>
                    <AppLink
                      href={`/projects/${project.id}/photos/${photo.id}`}
                      className="text-link"
                    >
                      編集 →
                    </AppLink>
                  </div>
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      checked={photo.included}
                      onChange={() => toggle(photo)}
                    />
                    写真帳に載せる
                  </label>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
      {!filtered.length && (
        <div className="empty">
          <h2>写真がありません</h2>
          <p>写真を追加するか、絞り込み条件を変更してください。</p>
        </div>
      )}
    </>
  );
}
