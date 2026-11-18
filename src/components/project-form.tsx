"use client";

import { useState, type FormEvent } from "react";
import { useLedger, AppLink } from "./provider";
import { trades, type Project } from "@/lib/types";

export function ProjectForm({ project, onDone }: { project?: Project; onDone?: () => void }) {
  const { data, today, updateProject, run, notify } = useLedger();
  const [draft, setDraft] = useState<Project>(
    project || {
      id: "",
      name: "",
      address: "",
      start: today,
      end: today,
      contractor: "やまびこ工務店（架空）",
      trades: ["配管工", "内装工"],
      places: ["1階 東側"],
      completed: false,
    },
  );
  const [places, setPlaces] = useState(draft.places.join("\n"));
  const allTrades = [...new Set([...trades, ...draft.trades])];
  function submit(event: FormEvent) {
    event.preventDefault();
    void run(async () => {
      const next = {
        ...draft,
        id: draft.id || crypto.randomUUID(),
        name: draft.name.trim(),
        address: draft.address.trim(),
        contractor: draft.contractor.trim(),
        places: [
          ...new Set(
            places
              .split(/\n/)
              .map((item) => item.trim())
              .filter(Boolean),
          ),
        ],
      };
      if (next.start > next.end) throw new Error("工期の終了日は開始日以降にしてください。");
      if (!next.trades.length || !next.places.length)
        throw new Error("工種と場所をそれぞれ1件以上設定してください。");
      if (next.places.some((place) => place.length > 60)) {
        throw new Error("場所は1件につき60文字以内で入力してください。");
      }
      const used = data.photos.filter((photo) => photo.projectId === next.id);
      if (
        used.some(
          (photo) =>
            (photo.trade && !next.trades.includes(photo.trade)) ||
            (photo.place && !next.places.includes(photo.place)),
        )
      )
        throw new Error(
          "写真で使用中の工種・場所は削除できません。先に写真の情報を変更してください。",
        );
      updateProject(next);
      notify("工事情報を保存しました。");
      onDone?.();
    });
  }
  return (
    <form onSubmit={submit} className="form-grid">
      <label className="span-two">
        工事名
        <input
          required
          maxLength={120}
          value={draft.name}
          placeholder="（架空）○○町 改修工事"
          onChange={(event) => setDraft({ ...draft, name: event.target.value })}
        />
      </label>
      <label className="span-two">
        工事場所（住所）
        <input
          required
          maxLength={200}
          value={draft.address}
          onChange={(event) => setDraft({ ...draft, address: event.target.value })}
        />
      </label>
      <label>
        工期の開始日
        <input
          type="date"
          required
          value={draft.start}
          onChange={(event) => setDraft({ ...draft, start: event.target.value })}
        />
      </label>
      <label>
        工期の終了日
        <input
          type="date"
          required
          min={draft.start}
          value={draft.end}
          onChange={(event) => setDraft({ ...draft, end: event.target.value })}
        />
      </label>
      <label className="span-two">
        施工者名
        <input
          required
          maxLength={120}
          value={draft.contractor}
          onChange={(event) => setDraft({ ...draft, contractor: event.target.value })}
        />
      </label>
      <fieldset className="span-two">
        <legend>この現場の工種</legend>
        <div className="check-list">
          {allTrades.map((trade) => (
            <label key={trade}>
              <input
                type="checkbox"
                checked={draft.trades.includes(trade)}
                onChange={(event) =>
                  setDraft({
                    ...draft,
                    trades: event.target.checked
                      ? [...draft.trades, trade]
                      : draft.trades.filter((item) => item !== trade),
                  })
                }
              />
              {trade}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="span-two">
        場所（1行に1件）
        <textarea
          required
          rows={4}
          value={places}
          onChange={(event) => setPlaces(event.target.value)}
        />
      </label>
      <label className="checkbox-label span-two">
        <input
          type="checkbox"
          checked={draft.completed}
          onChange={(event) => setDraft({ ...draft, completed: event.target.checked })}
        />
        完了した工事
      </label>
      <div className="span-two">
        <button className="primary" type="submit">
          工事情報を保存
        </button>
      </div>
    </form>
  );
}

export function SettingsView({ project }: { project: Project }) {
  return (
    <>
      <AppLink href={`/projects/${project.id}`} className="back-link">
        ← 写真一覧へ
      </AppLink>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PROJECT SETTINGS</p>
          <h1>工事情報の編集</h1>
          <p className="muted">{project.name}</p>
        </div>
      </div>
      <section className="panel narrow">
        <ProjectForm project={project} />
      </section>
    </>
  );
}
