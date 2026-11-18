import type { Photo } from "./types.ts";
import { canvasBlob } from "./image.ts";

export async function sampleImage(photo: Photo, index: number) {
  const canvas = document.createElement("canvas");
  canvas.width = index % 13 === 0 ? 720 : 960;
  canvas.height = index % 13 === 0 ? 960 : 720;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("サンプル画像を生成できません。");
  const width = canvas.width;
  const height = canvas.height;
  context.fillStyle = `hsl(${195 + (index % 25)} 24% ${79 + (index % 9)}%)`;
  context.fillRect(0, 0, width, height);
  context.fillStyle = `hsl(35 18% ${54 + (index % 15)}%)`;
  context.beginPath();
  context.moveTo(0, height * 0.45);
  context.lineTo(width, height * 0.35);
  context.lineTo(width, height);
  context.lineTo(0, height);
  context.fill();
  context.save();
  context.translate(width * 0.06 + (index % 4) * 8, height * 0.12);
  context.scale(width / 960, height / 720);
  const trade = photo.trade || (photo.projectId === "midori" ? "土工" : "配管工");
  if (trade === "配管工") {
    context.fillStyle = "#595e58";
    context.fillRect(20, 85, 800, 430);
    for (let beam = 0; beam < 6; beam++) {
      context.fillStyle = "#baa183";
      context.fillRect(beam * 150, 60, 26, 490);
    }
    [130, 260, 380].forEach((offset, pipe) => {
      context.strokeStyle = "#383e3b";
      context.lineWidth = 39;
      context.beginPath();
      context.moveTo(30, offset);
      context.lineTo(470 + pipe * 80, offset);
      context.lineTo(470 + pipe * 80, 500);
      context.stroke();
      context.strokeStyle = ["#b7cfcd", "#bdc8d0", "#d9b6a6"][pipe];
      context.lineWidth = 27;
      context.stroke();
      context.fillStyle = "#e1e5df";
      context.fillRect(200 + pipe * 40, offset - 20, 20, 40);
    });
  } else if (trade === "内装工") {
    context.fillStyle = "#b0a083";
    context.fillRect(10, 10, 820, 480);
    for (let column = 0; column < 4; column++) {
      context.fillStyle = column % 2 ? "#e3d9bb" : "#d0c7ac";
      context.fillRect(20 + column * 200, 25, 188, 445);
      context.fillStyle = "#6e716c";
      for (let screw = 0; screw < 7; screw++) {
        context.beginPath();
        context.arc(32 + column * 200, 45 + screw * 65, 3, 0, Math.PI * 2);
        context.fill();
      }
    }
    context.fillStyle = "#535e5d";
    context.fillRect(560, 240, 80, 125);
  } else if (trade === "下地補修" || trade === "塗装工") {
    context.fillStyle = trade === "塗装工" ? "#e1d9c7" : "#b8b5ac";
    context.fillRect(15, 15, 810, 500);
    context.strokeStyle = "#94988e";
    context.lineWidth = 3;
    for (let row = 1; row < 5; row++) {
      context.beginPath();
      context.moveTo(15, row * 100);
      context.lineTo(825, row * 100);
      context.stroke();
    }
    context.fillStyle = "#677f85";
    context.fillRect(100, 90, 180, 190);
    context.fillRect(520, 90, 180, 190);
    if (trade === "下地補修") {
      context.strokeStyle = "#d5cec0";
      context.lineWidth = 18;
      context.beginPath();
      context.moveTo(385, 100);
      context.lineTo(358, 230);
      context.lineTo(401, 340);
      context.lineTo(378, 450);
      context.stroke();
    }
  } else if (trade === "外構工") {
    for (let row = 0; row < 5; row++) {
      for (let column = 0; column < 6; column++) {
        context.fillStyle = `hsl(45 5% ${54 + ((row + column + index) % 5) * 4}%)`;
        context.fillRect(column * 155 - (row % 2) * 70, 80 + row * 75, 148, 68);
      }
    }
    context.fillStyle = "#4d6954";
    context.beginPath();
    context.arc(760, 60, 95, 0, Math.PI * 2);
    context.fill();
  } else if (trade === "仮設工") {
    context.fillStyle = "#c6bca5";
    context.fillRect(30, 15, 780, 500);
    context.strokeStyle = "#697e7b";
    context.lineWidth = 13;
    for (let column = 0; column < 5; column++) {
      context.beginPath();
      context.moveTo(30 + column * 190, 0);
      context.lineTo(30 + column * 190, 550);
      context.stroke();
    }
    for (let row = 0; row < 4; row++) {
      context.fillStyle = "#899c99";
      context.fillRect(0, 70 + row * 145, 840, 18);
      context.beginPath();
      context.moveTo(30, 70 + row * 145);
      context.lineTo(790, 215 + row * 145);
      context.stroke();
    }
  } else {
    context.fillStyle = trade === "土工" ? "#947754" : "#a4aaa4";
    context.beginPath();
    context.moveTo(50, 240);
    context.lineTo(600, 90);
    context.lineTo(850, 310);
    context.lineTo(300, 520);
    context.closePath();
    context.fill();
    context.strokeStyle = "#7d5f3d";
    context.lineWidth = 30;
    context.stroke();
    context.strokeStyle = "#525b58";
    context.lineWidth = 6;
    for (let bar = 0; bar < 7; bar++) {
      context.beginPath();
      context.moveTo(100 + bar * 65, 230 - bar * 12);
      context.lineTo(340 + bar * 65, 470 - bar * 23);
      context.stroke();
    }
  }
  context.restore();
  context.fillStyle = "#ffffffaa";
  context.fillRect(width - 180, 16, 164, 36);
  context.fillStyle = "#243d35";
  context.font = '20px "Yu Gothic", Meiryo, sans-serif';
  context.fillText("サンプル画像", width - 164, 41);
  return canvasBlob(canvas);
}
