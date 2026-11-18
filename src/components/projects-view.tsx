"use client";

import { useState } from "react";
import { AppLink, useLedger } from "./provider";
import { PhotoImage } from "./photo-image";
import { sortPhotos } from "@/lib/photos";
import { ProjectForm } from "./project-form";

export function ProjectsView() {
  const { data } = useLedger();
  const [filter, setFilter] = useState("すべて");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const projects = data.projects.filter(
    (project) =>
      project.name.includes(search) &&
      (filter === "すべて" || (filter === "完了" ? project.completed : !project.completed)),
  );
  const unfiled = data.photos.filter((photo) => !photo.trade).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECTS</p>
          <h1>工事一覧</h1>
          <p className="muted">現場の記録を、提出できる一冊に。</p>
        </div>
        <button className="primary" onClick={() => setCreating(!creating)}>
          {creating ? "閉じる" : "＋ 工事を登録"}
        </button>
      </div>
      {creating && (
        <section className="panel">
          <h2>新しい工事</h2>
          <ProjectForm onDone={() => setCreating(false)} />
        </section>
      )}
      <div className="stats-grid">
        <div className="stat">
          <span>進行中の工事</span>
          <strong>
            {data.projects.filter((project) => !project.completed).length}
            <small>件</small>
          </strong>
          <span className="stat-note">現在記録している現場</span>
        </div>
        <div className="stat">
          <span>登録された写真</span>
          <strong>
            {data.photos.length}
            <small>枚</small>
          </strong>
          <span className="stat-note">この端末に保存済み</span>
        </div>
        <div className="stat">
          <span>未整理の写真</span>
          <strong>
            {unfiled}
            <small>枚</small>
          </strong>
          <span className="stat-note amber">工種を設定すると整理できます</span>
        </div>
      </div>
      <div className="list-toolbar">
        <div className="segmented" aria-label="工事の状態">
          {["すべて", "進行中", "完了"].map((label) => (
            <button
              key={label}
              className={filter === label ? "selected" : ""}
              onClick={() => setFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="search">
          <span>⌕</span>
          <input
            aria-label="工事名で検索"
            placeholder="工事名で検索"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </label>
      </div>
      <p className="section-caption">
        登録工事 <strong>{projects.length}</strong> 件<span>撮影・整理・写真帳の作成</span>
      </p>
      <div className="project-grid">
        {projects.map((project, index) => {
          const photos = sortPhotos(data.photos.filter((photo) => photo.projectId === project.id));
          const cover = photos[Math.min(photos.length - 1, 7)];
          return (
            <article className="project-card" key={project.id}>
              <AppLink href={`/projects/${project.id}`} className="project-cover">
                {cover ? (
                  <PhotoImage photo={cover} project={project} />
                ) : (
                  <span className="empty-cover">最初の写真を登録しましょう</span>
                )}
                <span className={`status-pill ${project.completed ? "complete" : ""}`}>
                  {project.completed ? "完了" : "● 進行中"}
                </span>
                <span className="project-number">
                  PROJECT / {String(index + 1).padStart(2, "0")}
                </span>
              </AppLink>
              <div className="project-body">
                <div className="project-code">
                  工事写真 / {project.id.slice(0, 12).toUpperCase()}
                </div>
                <h2>
                  <AppLink href={`/projects/${project.id}`}>{project.name}</AppLink>
                </h2>
                <p className="address">⌖ {project.address}</p>
                <div className="project-dates">
                  工期{" "}
                  <span>
                    {project.start} 〜 {project.end}
                  </span>
                </div>
                <div className="project-counts">
                  <span>
                    <strong>{photos.length}</strong> 枚の写真
                  </span>
                  <span className={photos.some((photo) => !photo.trade) ? "amber" : "muted"}>
                    未整理 {photos.filter((photo) => !photo.trade).length} 枚
                  </span>
                </div>
                <div className="project-footer">
                  <small>最終撮影 {photos.at(-1)?.date || "未登録"}</small>
                  <AppLink href={`/projects/${project.id}`} className="text-link">
                    写真を開く →
                  </AppLink>
                </div>
              </div>
            </article>
          );
        })}
      </div>
      {!projects.length && (
        <div className="empty">
          該当する工事はありません。検索条件を変更するか、工事を登録してください。
        </div>
      )}
      <div className="hint-panel">
        <span className="hint-symbol">▤</span>
        <div>
          <strong>記録から提出まで、この台帳で。</strong>
          <p>写真を追加し、工種・場所を整理。黒板を添えて、A4の写真帳を印刷できます。</p>
        </div>
        <AppLink href="/about" className="text-link">
          使い方を見る →
        </AppLink>
      </div>
    </>
  );
}
