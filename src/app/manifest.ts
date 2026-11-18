import type { MetadataRoute } from "next";

export const dynamic = "force-static";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "工事・現場写真台帳",
    short_name: "現場写真台帳",
    description: "写真の整理・黒板・写真帳の印刷",
    start_url: "/",
    display: "standalone",
    lang: "ja",
    background_color: "#f5f6f3",
    theme_color: "#204f41",
    icons: [{ src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" }],
  };
}
