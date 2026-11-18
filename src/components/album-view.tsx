"use client";

import { useLedger, AppLink } from "./provider";
import { PhotoImage } from "./photo-image";
import { albumPages } from "@/lib/album";
import type { Project } from "@/lib/types";

export function AlbumView({ project }: { project: Project }) {
  const { data, today } = useLedger();
  const photos = data.photos.filter((photo) => photo.projectId === project.id);
  const pages = albumPages(photos);
  const count = photos.filter((photo) => photo.included).length;
  return (
    <>
      <div className="no-print">
        <AppLink href={`/projects/${project.id}`} className="back-link">
          ← 写真一覧へ
        </AppLink>
        <div className="page-heading">
          <div>
            <p className="eyebrow">PHOTO ALBUM</p>
            <h1>提出用 写真帳</h1>
            <p className="muted">A4縦 / 1ページ3枚 / 表紙付き・全{pages.length}ページ</p>
          </div>
          <button className="primary" onClick={() => window.print()}>
            ▤ 印刷・PDFで保存
          </button>
        </div>
        <p className="print-help">
          画像が表示されたら印刷してください。用紙はA4・倍率100%・ブラウザのヘッダーとフッターはオフに設定します。
        </p>
        {!count && (
          <div className="notice">
            掲載する写真がありません。写真一覧で「写真帳に載せる」を選択してください。
          </div>
        )}
      </div>
      <div className="album-preview">
        {pages.map((page) => (
          <section className={`album-page ${page.cover ? "album-cover" : ""}`} key={page.number}>
            {page.cover ? (
              <>
                <div className="cover-top">工事記録 / CONSTRUCTION PHOTO RECORD</div>
                <div className="cover-title">
                  <p>工事写真帳</p>
                  <h2>{project.name}</h2>
                  <div className="cover-rule" />
                </div>
                <dl className="cover-info">
                  <div>
                    <dt>工事場所</dt>
                    <dd>{project.address}</dd>
                  </div>
                  <div>
                    <dt>工期</dt>
                    <dd>
                      {project.start} 〜 {project.end}
                    </dd>
                  </div>
                  <div>
                    <dt>施工者</dt>
                    <dd>{project.contractor}</dd>
                  </div>
                  <div>
                    <dt>作成日</dt>
                    <dd>{today}</dd>
                  </div>
                  <div>
                    <dt>掲載枚数</dt>
                    <dd>{count} 枚</dd>
                  </div>
                </dl>
                <p className="cover-demo">デモ用の架空データです</p>
              </>
            ) : (
              <>
                <header className="album-header">
                  <strong>工事写真帳</strong>
                  <span>{project.name}</span>
                </header>
                <div className="album-rows">
                  {page.photos.map((photo) => (
                    <article
                      className={`album-row ${photo.memo.length + photo.point.length + photo.place.length > 120 ? "long-note" : ""}`}
                      key={photo.id}
                    >
                      <div className="album-photo">
                        <PhotoImage photo={photo} project={project} blackboard />
                      </div>
                      <table>
                        <tbody>
                          {[
                            ["工種", photo.trade || "未設定"],
                            ["場所", photo.place || "未設定"],
                            ["測点・部位", photo.point || "―"],
                            ["撮影日", `${photo.date} ${photo.time}`],
                            ["区分", photo.category],
                            ["メモ", photo.memo || "―"],
                          ].map(([label, value]) => (
                            <tr key={label}>
                              <th>{label}</th>
                              <td>{value}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </article>
                  ))}
                </div>
              </>
            )}
            <footer className="album-footer">
              <span>{project.contractor}</span>
              <span>
                {page.number} / {pages.length}
              </span>
            </footer>
          </section>
        ))}
      </div>
    </>
  );
}
