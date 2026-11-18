"use client";

import { AppLink, useLedger } from "./provider";
import { ProjectsView } from "./projects-view";
import { PhotosView } from "./photos-view";
import { PhotoDetail } from "./photo-detail";
import { AlbumView } from "./album-view";
import { SettingsView } from "./project-form";
import { AboutView, BackupView } from "./utility-views";

export function AppView() {
  const { data, path } = useLedger();
  if (path === "/") return <ProjectsView />;
  if (path === "/backup") return <BackupView />;
  if (path === "/about") return <AboutView />;
  const parts = path.split("/").filter(Boolean);
  const project =
    parts[0] === "projects" ? data.projects.find((item) => item.id === parts[1]) : undefined;
  if (project) {
    if (parts.length === 2) return <PhotosView key={path} project={project} />;
    if (parts.length === 3 && parts[2] === "settings")
      return <SettingsView key={path} project={project} />;
    if (parts.length === 3 && parts[2] === "album") return <AlbumView project={project} />;
    const photo =
      parts.length === 4 && parts[2] === "photos"
        ? data.photos.find((item) => item.id === parts[3] && item.projectId === project.id)
        : undefined;
    if (photo) return <PhotoDetail key={photo.id} photo={photo} project={project} />;
  }
  return (
    <section className="empty">
      <h1>記録が見つかりません</h1>
      <p>別の端末で作った記録は、バックアップを読み込んでから開いてください。</p>
      <AppLink href="/" className="button primary">
        工事一覧へ戻る
      </AppLink>
    </section>
  );
}
