"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
  type MouseEvent,
} from "react";
import { initializeLedger, saveLedger } from "@/lib/storage";
import type { Ledger, Photo, Project } from "@/lib/types";
import { japanNow } from "@/lib/dates";

interface Store {
  data: Ledger;
  today: string;
  path: string;
  busy: boolean;
  commit: (data: Ledger) => void;
  replace: (data: Ledger) => void;
  updatePhoto: (photo: Photo) => void;
  updateProject: (project: Project) => void;
  navigate: (path: string) => void;
  run: (action: () => Promise<void>) => Promise<void>;
  notify: (message: string) => void;
}

const StoreContext = createContext<Store | null>(null);

export function useLedger() {
  const store = useContext(StoreContext);
  if (!store) throw new Error("保存データが準備されていません。");
  return store;
}

export function AppLink({
  href,
  children,
  className = "",
}: {
  href: string;
  children: ReactNode;
  className?: string;
}) {
  const { navigate } = useLedger();
  function open(event: MouseEvent<HTMLAnchorElement>) {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0)
      return;
    event.preventDefault();
    navigate(href);
  }
  return (
    <a href={href} onClick={open} className={className}>
      {children}
    </a>
  );
}

export function LedgerProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Ledger | null>(null);
  const [today, setToday] = useState("");
  const [path, setPath] = useState("/");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);
  const [fatal, setFatal] = useState("");

  useEffect(() => {
    let active = true;
    const locationChanged = () => setPath(window.location.pathname.replace(/\/$/, "") || "/");
    window.addEventListener("popstate", locationChanged);
    initializeLedger()
      .then((result) => {
        if (!active) return;
        setData(result.data);
        setNotice(result.notice);
        setToday(japanNow().date);
        locationChanged();
      })
      .catch((error: Error) => active && setFatal(error.message));
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        if (active) setNotice("オフライン機能を登録できませんでした。通常の操作は利用できます。");
      });
    }
    return () => {
      active = false;
      window.removeEventListener("popstate", locationChanged);
    };
  }, []);

  if (!data)
    return (
      <main className="loading">
        <div className="brand-mark">写</div>
        <h1>工事・現場写真台帳</h1>
        <p role="status">{fatal || "現場の写真を準備しています…"}</p>
        {fatal && <button onClick={() => window.location.reload()}>再読み込み</button>}
      </main>
    );

  function commit(next: Ledger) {
    saveLedger(next);
    setData(next);
  }

  async function run(action: () => Promise<void>) {
    setBusy(true);
    try {
      await action();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "処理に失敗しました。");
    } finally {
      setBusy(false);
    }
  }

  const store: Store = {
    data,
    today,
    path,
    busy,
    commit,
    replace: setData,
    run,
    notify: setNotice,
    navigate: (destination) => {
      window.history.pushState(null, "", destination);
      setPath(destination);
      window.scrollTo(0, 0);
    },
    updatePhoto: (photo) =>
      commit({ ...data, photos: data.photos.map((item) => (item.id === photo.id ? photo : item)) }),
    updateProject: (project) =>
      commit({
        ...data,
        projects: data.projects.some((item) => item.id === project.id)
          ? data.projects.map((item) => (item.id === project.id ? project : item))
          : [...data.projects, project],
      }),
  };

  return (
    <StoreContext.Provider value={store}>
      <aside className="sidebar no-print">
        <AppLink href="/" className="brand">
          <span className="brand-mark">写</span>
          <span>
            現場写真台帳<small>GENBA PHOTO LEDGER</small>
          </span>
        </AppLink>
        <div className="company">
          <span className="eyebrow">WORKSPACE</span>
          <strong>やまびこ工務店</strong>
          <span>架空の工務店 / デモ</span>
        </div>
        <nav aria-label="メインナビゲーション">
          <AppLink
            href="/"
            className={path === "/" || path.startsWith("/projects") ? "active" : ""}
          >
            <span>▦</span>工事一覧
          </AppLink>
          <AppLink href="/backup" className={path === "/backup" ? "active" : ""}>
            <span>⇩</span>バックアップ
          </AppLink>
          <AppLink href="/about" className={path === "/about" ? "active" : ""}>
            <span>ⓘ</span>このデモについて
          </AppLink>
        </nav>
        <div className="sidebar-bottom">
          <span className="local-dot" />
          この端末に保存<p>写真は外部へ送信されません。</p>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar no-print">
          <span>写真を残す。現場を伝える。</span>
          <span className="demo-badge">デモ用の架空データです</span>
        </header>
        <main className="main-content" aria-busy={busy}>
          {notice && (
            <div className="notice no-print" role="status">
              <span>{notice}</span>
              <button aria-label="通知を閉じる" onClick={() => setNotice("")}>
                ×
              </button>
            </div>
          )}
          {busy && (
            <div className="working no-print" role="status">
              処理中です。しばらくお待ちください…
            </div>
          )}
          <fieldset className="app-fieldset" disabled={busy}>
            {children}
          </fieldset>
        </main>
      </div>
    </StoreContext.Provider>
  );
}
