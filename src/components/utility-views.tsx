"use client";

import { useState, type ChangeEvent } from "react";
import { useLedger } from "./provider";
import { exportBackup, importBackup, resetLedger } from "@/lib/storage";
import { validateBackup } from "@/lib/backup";
import { download } from "@/lib/image";
import type { Backup } from "@/lib/types";

export function BackupView() {
  const { data, today, run, replace, notify } = useLedger();
  const [pending, setPending] = useState<Backup | null>(null);
  async function read(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPending(null);
    await run(async () => {
      if (file.size > 250 * 1024 * 1024)
        throw new Error("250MBを超えるバックアップは読み込めません。");
      let value: unknown;
      try {
        value = JSON.parse(await file.text());
      } catch {
        throw new Error("JSONファイルを読み込めません。正しいバックアップを選んでください。");
      }
      if (!validateBackup(value))
        throw new Error(
          "バックアップの形式・画像・参照情報が不正です。現在のデータは変更していません。",
        );
      setPending(value);
    });
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">BACKUP</p>
          <h1>記録をバックアップ</h1>
          <p className="muted">工事情報とすべての写真を、ひとつのJSONに。</p>
        </div>
      </div>
      <div className="backup-grid">
        <section className="panel">
          <span className="feature-icon">↓</span>
          <h2>この端末の記録を書き出す</h2>
          <p>
            {data.projects.length}件の工事・{data.photos.length}
            枚の元画像と、黒板の設定を保存します。
          </p>
          <p className="muted">
            ブラウザのデータを消去する前や、別の端末へ移す際に保存してください。
          </p>
          <button
            className="primary"
            onClick={() =>
              void run(async () => {
                const backup = await exportBackup(data);
                download(
                  new Blob([JSON.stringify(backup)], { type: "application/json" }),
                  `写真台帳バックアップ_${today}.json`,
                );
                notify("バックアップを書き出しました。");
              })
            }
          >
            バックアップを保存（JSON）
          </button>
        </section>
        <section className="panel">
          <span className="feature-icon">↑</span>
          <h2>保存した記録を読み込む</h2>
          <p>JSONの中の工事・写真・画像を検証してから復元します。</p>
          <p className="muted">復元すると、現在の端末の記録をすべて置き換えます。</p>
          <div className="file-button">
            <input
              id="restore-backup"
              type="file"
              accept=".json,application/json"
              className="visually-hidden"
              onChange={read}
            />
            <label htmlFor="restore-backup" className="button secondary">
              バックアップを読み込む（JSON）
            </label>
          </div>
        </section>
      </div>
      {pending && (
        <section className="panel confirm-panel" role="region" aria-label="復元内容の確認">
          <h2>このバックアップで置き換えますか？</h2>
          <p>
            工事 {pending.data.projects.length}件 / 写真 {pending.data.photos.length}
            枚。現在の記録は置き換えられます。
          </p>
          <div className="action-bar">
            <button
              className="primary"
              onClick={() =>
                void run(async () => {
                  const restored = await importBackup(pending);
                  replace(restored);
                  setPending(null);
                  notify("バックアップを復元しました。");
                })
              }
            >
              現在の記録を置き換えて復元
            </button>
            <button onClick={() => setPending(null)}>キャンセル</button>
          </div>
        </section>
      )}
      <div className="hint-panel">
        <div>
          <strong>保存先は、いま使っているブラウザです。</strong>
          <p>
            別のブラウザ・端末とは自動同期されません。大切な記録は定期的にバックアップしてください。
          </p>
        </div>
      </div>
    </>
  );
}

export function AboutView() {
  const { run, replace, notify } = useLedger();
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ABOUT THIS DEMO</p>
          <h1>このデモについて</h1>
          <p className="muted">現場の写真を整理して、伝わる記録に。</p>
        </div>
      </div>
      <section className="panel prose">
        <h2>工事・現場写真台帳</h2>
        <p>
          小さな工務店・設備工事会社の現場担当が、工種・場所・撮影日で写真を整理し、黒板風の情報を添えて提出用の写真帳を作成するアプリです。
        </p>
        <ol>
          <li>
            <strong>工事を選ぶ・登録する</strong> — 工事ごとに工種と場所を設定します。
          </li>
          <li>
            <strong>写真を撮る・選ぶ</strong> — 写真詳細で工種・場所・測点を整理します。
          </li>
          <li>
            <strong>黒板を添える</strong> — 四隅の位置とサイズを選んでJPEGを保存します。
          </li>
          <li>
            <strong>写真帳を作る</strong> — 掲載する写真を選び、A4縦で印刷・PDF保存します。
          </li>
        </ol>
        <h2>デモ用の架空データです</h2>
        <p>
          工事・会社・住所はすべて架空で、実在の企業・個人とは無関係です。初回の52枚の画像は、配管・型枠・足場などをcanvasで描いたイラストです。実在の写真は使用していません。
        </p>
        <h2>日時と保存先</h2>
        <p>
          初回起動時の日本時間を基準に、過去の撮影日を生成します。写真の追加時はEXIFを読み取らず、ファイルの更新日時を使います。撮影日時は詳細画面で編集できます。
        </p>
        <p>
          工事・写真の情報はlocalStorage（cpl:v1）、画像はIndexedDB（cpl-photos）に保存します。写真をサーバーへ送信しません。ブラウザの保存領域の削除により記録も消えるため、JSONバックアップをご利用ください。
        </p>
        <h2>対象外の機能</h2>
        <p>
          公的な電子小黒板の改ざん検知や電子納品の正式フォーマットには対応しません。検品・検収サイン、修理進捗、日報、工程・原価管理も対象外です。
        </p>
      </section>
      <section className="panel reset-panel">
        <h2>既定データに戻す</h2>
        <p>登録した工事・写真を削除し、現在の日本時間を基準にサンプル画像と日付を作り直します。</p>
        {confirm ? (
          <>
            <p className="amber">
              現在の記録は失われます。必要な記録は先にバックアップしてください。
            </p>
            <div className="action-bar">
              <button
                className="danger"
                onClick={() =>
                  void run(async () => {
                    replace(await resetLedger());
                    setConfirm(false);
                    notify("工事3件・写真52枚の既定データに戻しました。");
                  })
                }
              >
                記録を消去して再生成
              </button>
              <button onClick={() => setConfirm(false)}>キャンセル</button>
            </div>
          </>
        ) : (
          <button onClick={() => setConfirm(true)}>既定データに戻す</button>
        )}
      </section>
    </>
  );
}
