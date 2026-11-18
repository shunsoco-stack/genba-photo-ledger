export const categories = ["着工前", "施工中", "完了", "是正"] as const;

export const trades = ["仮設工", "土工", "基礎工", "配管工", "内装工", "外構工"];

export type Category = (typeof categories)[number];

export type Position = "左下" | "右下" | "左上" | "右上";

export type BoardSize = "小" | "中" | "大";

export interface Project {
  id: string;
  name: string;
  address: string;
  start: string;
  end: string;
  contractor: string;
  trades: string[];
  places: string[];
  completed: boolean;
}

export interface Photo {
  id: string;
  projectId: string;
  trade: string;
  place: string;
  date: string;
  time: string;
  point: string;
  category: Category;
  memo: string;
  included: boolean;
  position: Position;
  size: BoardSize;
}

export interface Ledger {
  version: 1;
  projects: Project[];
  photos: Photo[];
}

export interface Backup {
  format: "cpl-backup";
  version: 1;
  data: Ledger;
  images: Record<string, string>;
}
