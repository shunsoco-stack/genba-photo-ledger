"use client";

import { useEffect, useRef, useState } from "react";
import type { Photo, Project } from "@/lib/types";
import { getImage } from "@/lib/idb";
import { loadImage } from "@/lib/image";
import { drawBoard } from "@/lib/blackboard";

export function PhotoImage({
  photo,
  project,
  blackboard = false,
}: {
  photo: Photo;
  project: Project;
  blackboard?: boolean;
}) {
  const reference = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    let source = "";
    async function render() {
      const blob = await getImage(photo.id);
      if (!blob) throw new Error("画像が見つかりません。");
      source = URL.createObjectURL(blob);
      const image = await loadImage(source);
      if (!active || !reference.current) return;
      const canvas = reference.current;
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d");
      if (!context) throw new Error("画像を表示できません。");
      context.drawImage(image, 0, 0);
      if (blackboard) drawBoard(context, canvas.width, canvas.height, project, photo);
    }
    render()
      .catch((reason: Error) => active && setError(reason.message))
      .finally(() => {
        if (source) URL.revokeObjectURL(source);
      });
    return () => {
      active = false;
      if (source) URL.revokeObjectURL(source);
    };
  }, [photo, project, blackboard]);
  return error ? (
    <div className="image-error" role="alert">
      {error}
    </div>
  ) : (
    <canvas
      ref={reference}
      className="photo-image"
      role="img"
      aria-label={`${photo.trade || "未整理"}・${photo.place}・${photo.date} ${blackboard ? "黒板付き" : ""}`}
    />
  );
}
