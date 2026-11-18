import type { Metadata } from "next";
import { LedgerProvider } from "@/components/provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "工事・現場写真台帳",
  description:
    "工事写真を工種・場所・撮影日で整理。黒板風の情報を添えてA4写真帳を印刷・PDF保存できる、端末保存型の現場写真台帳です。",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body>
        <LedgerProvider>{children}</LedgerProvider>
      </body>
    </html>
  );
}
