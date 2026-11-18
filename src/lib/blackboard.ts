import type { BoardSize, Photo, Position, Project } from "./types.ts";

export function boardFields(project: Project, photo: Photo) {
  return [
    ["工事名", project.name],
    ["工種", photo.trade || "未設定"],
    ["場所", photo.place || "未設定"],
    ["測点", photo.point || "―"],
    ["撮影日", photo.date],
    ["施工者", project.contractor],
  ];
}

export function boardLayout(width: number, height: number, position: Position, size: BoardSize) {
  const ratio = { 小: 0.43, 中: 0.55, 大: 0.68 }[size];
  const boardWidth = Math.min(width * ratio, height * 0.95);
  const boardHeight = boardWidth * 0.56;
  const margin = Math.min(width, height) * 0.025;
  return {
    x: position.startsWith("左") ? margin : width - boardWidth - margin,
    y: position.endsWith("上") ? margin : height - boardHeight - margin,
    width: boardWidth,
    height: boardHeight,
    fontSize: boardWidth * 0.038,
  };
}

export function drawBoard(
  context: CanvasRenderingContext2D,
  width: number,
  height: number,
  project: Project,
  photo: Photo,
) {
  const layout = boardLayout(width, height, photo.position, photo.size);
  const { x, y, width: boardWidth, height: boardHeight, fontSize } = layout;
  context.fillStyle = "#174b3e";
  context.fillRect(x, y, boardWidth, boardHeight);
  context.strokeStyle = "#eee8d5";
  context.lineWidth = Math.max(1, boardWidth / 250);
  context.strokeRect(x + 4, y + 4, boardWidth - 8, boardHeight - 8);
  const fields = boardFields(project, photo);
  const rowHeight = (boardHeight - 8) / fields.length;
  context.fillStyle = "#fffdf0";
  context.textBaseline = "middle";
  context.font = `600 ${fontSize}px "Yu Gothic", Meiryo, sans-serif`;
  fields.forEach(([label, value], index) => {
    const rowY = y + 4 + index * rowHeight;
    if (index > 0) {
      context.beginPath();
      context.moveTo(x + 4, rowY);
      context.lineTo(x + boardWidth - 4, rowY);
      context.stroke();
    }
    context.fillText(label, x + boardWidth * 0.025, rowY + rowHeight / 2, boardWidth * 0.19);
    context.fillText(value, x + boardWidth * 0.25, rowY + rowHeight / 2, boardWidth * 0.72);
  });
  context.beginPath();
  context.moveTo(x + boardWidth * 0.23, y + 4);
  context.lineTo(x + boardWidth * 0.23, y + boardHeight - 4);
  context.stroke();
}
