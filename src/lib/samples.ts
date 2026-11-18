import type { Photo } from "./types.ts";
import { canvasBlob } from "./image.ts";
import { sampleScene, type SampleScene } from "./sample-scene.ts";

// 固定数の図形だけで描画し、ピクセル走査・外部画像・非同期の追加処理を避ける。
function drawScene(c: CanvasRenderingContext2D, scene: SampleScene) {
  const { kind, state } = scene;
  const old = state === "existing";
  const done = state === "finished" || state === "repaired";
  const rect = (x: number, y: number, w: number, h: number, color: string) => {
    c.fillStyle = color;
    c.fillRect(x, y, w, h);
  };
  const line = (points: number[][], color: string, thickness = 6) => {
    c.beginPath();
    points.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y)));
    c.strokeStyle = color;
    c.lineWidth = thickness;
    c.stroke();
  };
  const circle = (x: number, y: number, r: number, color: string) => {
    c.beginPath();
    c.arc(x, y, r, 0, Math.PI * 2);
    c.fillStyle = color;
    c.fill();
  };
  const pipe = (points: number[][], thickness = 28, color = "#b7cbd0") => {
    line(
      points.map(([x, y]) => [x + scene.shadow, y + scene.shadow]),
      "#00000030",
      thickness + 5,
    );
    line(points, "#465353", thickness + 8);
    line(points, old ? "#967358" : color, thickness);
    line(
      points.map(([x, y]) => [x - 3, y - 3]),
      old ? "#bd9570" : "#ffffff65",
      4,
    );
  };
  const wall = () => {
    rect(65, 85, 830, 510, old ? "#aaa797" : "#dedbd1");
    for (let y = 110; y < 580; y += 90)
      line(
        [
          [65, y],
          [895, y],
        ],
        "#8f918c55",
        2,
      );
  };
  if (kind.startsWith("pipe-")) {
    rect(35, 55, 890, 585, "#626660");
    if (["pipe-studs", "pipe-insulation", "pipe-drain"].includes(kind)) {
      for (let x = 100; x < 900; x += 200) {
        rect(x + 10, 60, 30, 565, "#292f2b55");
        rect(x, 50, 30, 565, "#bea384");
      }
    } else rect(120, 100, 720, 490, "#c5c2b8");
    switch (kind) {
      case "pipe-tee":
        pipe(
          [
            [140, 300],
            [815, 300],
          ],
          48,
        );
        pipe(
          [
            [470, 300],
            [470, 540],
          ],
          48,
        );
        for (const x of [420, 505]) rect(x, 265, 24, 70, "#a0b4b6");
        rect(437, 345, 68, 25, "#a0b4b6");
        if (old) for (let i = 0; i < 9; i++) circle(420 + i * 11, 287 + (i % 3) * 15, 6, "#815038");
        break;
      case "pipe-drain":
        pipe(
          [
            [125, 310],
            [690, 390],
            [800, 490],
          ],
          66,
          "#a9afb2",
        );
        for (const x of [260, 610]) {
          const y = 310 + ((x - 125) * 80) / 565;
          line(
            [
              [x, 180],
              [x, y + 45],
              [x + 35, y + 45],
              [x + 35, 180],
            ],
            "#d6d8d1",
            8,
          );
        }
        break;
      case "pipe-studs":
      case "pipe-insulation":
        pipe(
          [
            [350, 590],
            [350, 220],
            [610, 220],
          ],
          28,
          "#cf9e89",
        );
        pipe(
          [
            [510, 590],
            [510, 325],
            [730, 325],
          ],
          28,
          "#90bdca",
        );
        pipe(
          [
            [350, 560],
            [350, kind === "pipe-insulation" ? 350 : 260],
          ],
          52,
          "#dad7bc",
        );
        for (let y = 380; y < 560; y += 30)
          line(
            [
              [322, y],
              [378, y - 10],
            ],
            "#b4b19c",
            3,
          );
        if (kind === "pipe-insulation") {
          rect(319, 350, 62, 24, "#eeeeea");
          rect(319, 520, 62, 20, "#eeeeea");
        }
        break;
      case "pipe-bracket":
        pipe(
          [
            [180, 325],
            [790, 325],
          ],
          48,
        );
        rect(440, 255, 70, 140, "#a2aaa6");
        circle(475, 275, 12, "#505b59");
        circle(done ? 475 : 492, done ? 375 : 389, 12, "#505b59");
        if (!done)
          line(
            [
              [510, 290],
              [530, 345],
            ],
            "#302f2b",
            9,
          );
        break;
      case "pipe-valve":
        rect(180, 130, 600, 45, "#f2eee4");
        for (const x of [325, 630]) {
          pipe([
            [x, 530],
            [x, 330],
            [x + 80, 330],
            [x + 80, 210],
          ]);
          circle(x, 330, 28, "#c3c7c3");
          line(
            [
              [x - 36, 300],
              [x + 36, 300],
            ],
            "#627a85",
            12,
          );
        }
        break;
      case "pipe-test":
        pipe(
          [
            [180, 400],
            [740, 400],
          ],
          45,
        );
        rect(445, 365, 70, 70, "#a0aca7");
        pipe(
          [
            [480, 365],
            [480, 270],
          ],
          15,
        );
        circle(480, 230, 66, "#596462");
        circle(480, 230, 55, "#f1eee0");
        for (let i = 0; i < 9; i++) {
          const a = (i * Math.PI) / 6;
          line(
            [
              [480 + Math.cos(a) * 41, 230 + Math.sin(a) * 41],
              [480 + Math.cos(a) * 49, 230 + Math.sin(a) * 49],
            ],
            "#52605a",
            3,
          );
        }
        line(
          [
            [480, 230],
            [510, 201],
          ],
          "#bc5040",
          4,
        );
        break;
      case "pipe-basin":
        rect(260, 300, 440, 270, "#e7e5dc");
        rect(230, 260, 500, 75, "#f8f7ef");
        c.beginPath();
        c.ellipse(480, 285, 165, 30, 0, 0, Math.PI * 2);
        c.fillStyle = "#adbdbd";
        c.fill();
        pipe(
          [
            [480, 250],
            [480, 175],
            [550, 175],
            [550, 205],
          ],
          18,
        );
        line(
          [
            [480, 350],
            [480, 560],
          ],
          "#aaa99e",
          3,
        );
    }
  } else if (kind.startsWith("interior-")) {
    wall();
    rect(50, 500, 860, 160, "#a88b6a");
    switch (kind) {
      case "interior-board":
        for (let x = 90; x < 850; x += 195) {
          rect(x, 100, 188, 390, "#e1d5b5");
          for (let y = 120; y < 490; y += 45) {
            circle(x + 12, y, 3, "#666a60");
            circle(x + 175, y, 3, "#666a60");
          }
        }
        break;
      case "interior-removal":
      case "interior-backing":
        rect(230, 170, 460, 310, "#595c54");
        for (let x = 260; x < 690; x += 130) rect(x, 165, 25, 320, "#baa07c");
        if (kind === "interior-removal")
          line(
            [
              [215, 490],
              [215, 150],
              [710, 150],
              [710, 490],
            ],
            "#4c6783",
            3,
          );
        else {
          rect(250, 265, 420, 115, "#d3b485");
          for (let x = 270; x < 670; x += 130) circle(x, 285, 5, "#65665d");
        }
        break;
      case "interior-corner":
        rect(65, 85, 390, 415, "#c1bba9");
        line(
          [
            [455, 85],
            [455, 500],
            [840, 610],
          ],
          "#f2eee3",
          24,
        );
        line(
          [
            [455, 90],
            [455, 490],
          ],
          "#c8c6bb",
          2,
        );
        break;
      case "interior-plywood":
        rect(65, 190, 830, 410, "#c4a477");
        for (let y = 205; y < 600; y += 24)
          line(
            [
              [70, y],
              [890, y + 12],
            ],
            "#8e704c35",
            2,
          );
        line(
          [
            [480, 190],
            [480, 600],
          ],
          "#5c5546",
          4,
        );
        line(
          [
            [65, 400],
            [480, 400],
          ],
          "#5c5546",
          4,
        );
        for (let y = 215; y < 595; y += 45) circle(468, y, 3, "#575c53");
        break;
      case "interior-skirting":
        rect(65, 455, 830, 55, "#e5d5b9");
        line(
          [
            [65, 510],
            [895, 510],
          ],
          "#655e50",
          4,
        );
        line(
          [
            [690, 455],
            [690, 510],
          ],
          "#a99c86",
          2,
        );
        break;
      case "interior-floor":
        rect(65, 310, 440, 300, "#b4bdb4");
        rect(505, 310, 390, 300, "#d3b38a");
        for (let y = 350; y < 610; y += 60)
          line(
            [
              [515, y],
              [895, y],
            ],
            "#aa8b65",
            2,
          );
        rect(498, 310, 18, 300, "#c6cbc5");
        break;
      case "interior-hatch":
        rect(220, 300, 520, 300, "#c8c8b8");
        rect(240, 320, 480, 260, "#383e37");
        line(
          [
            [270, 510],
            [670, 400],
          ],
          "#a2b5b1",
          25,
        );
        rect(265, 180, 430, 90, "#b69b77");
        break;
      case "interior-protection":
        rect(300, 100, 360, 400, "#827461");
        rect(325, 120, 310, 380, "#b6b5a4");
        rect(180, 500, 600, 140, "#7caaad");
        line(
          [
            [180, 505],
            [780, 505],
          ],
          "#e0d4a0",
          14,
        );
        line(
          [
            [480, 505],
            [480, 640],
          ],
          "#e0d4a0",
          12,
        );
    }
  } else if (kind.startsWith("ground-") || kind.startsWith("masonry-")) {
    rect(0, 260, 960, 460, "#a38e70");
    if (kind.startsWith("masonry-")) {
      const pillar = kind === "masonry-pillar";
      for (let row = 0; row < (pillar ? 6 : 4); row++)
        for (let col = 0; col < (pillar ? 2 : 5); col++)
          rect(
            (pillar ? 325 : 95) + col * 145 - (pillar ? 0 : (row % 2) * 35),
            150 + row * 75,
            138,
            68,
            (row + col) % 2 ? "#a5aaa3" : "#b6b9b0",
          );
      if (kind === "masonry-joint") {
        rect(375, 235, 18, 125, done ? "#c7c9bb" : "#55574f");
        if (!done)
          line(
            [
              [375, 270],
              [355, 290],
              [381, 307],
            ],
            "#55574f",
            13,
          );
      }
    } else if (kind === "ground-drain") {
      rect(240, 240, 480, 340, "#b8bcb3");
      rect(275, 270, 410, 270, "#3f4b46");
      pipe(
        [
          [685, 410],
          [855, 410],
        ],
        65,
      );
      rect(300, 295, 360, 215, "#667b76");
    } else if (kind === "ground-boundary") {
      rect(450, 285, 65, 270, "#c3c3b8");
      rect(450, 285, 65, 35, "#c75c47");
      line(
        [
          [475, 310],
          [180, 600],
        ],
        "#ece2a7",
        3,
      );
      line(
        [
          [490, 310],
          [820, 440],
        ],
        "#ece2a7",
        3,
      );
    } else if (kind === "ground-pavement" || kind === "ground-path") {
      rect(120, 295, 720, 320, kind === "ground-path" ? "#aeb5b0" : "#777b73");
      for (let x = 120; x < 840; x += 180)
        line(
          [
            [x, 295],
            [x, 615],
          ],
          "#555e54",
          3,
        );
      if (old)
        line(
          [
            [180, 350],
            [380, 390],
            [450, 530],
            [710, 570],
          ],
          "#444b43",
          5,
        );
      else rect(180, 450, 600, 110, "#82a6a6");
    } else {
      rect(145, 235, 670, 350, "#715a40");
      rect(180, 270, 600, 275, kind === "ground-excavation" ? "#8a7050" : "#a5a79a");
      if (kind === "ground-gravel" || kind === "ground-compaction") {
        for (let i = 0; i < 100; i++)
          circle(
            190 + ((i * 83) % 570),
            280 + ((i * 47) % 250),
            kind === "ground-gravel" ? 8 + (i % 5) : 5,
            i % 2 ? "#7d837b" : "#bec0b2",
          );
        if (kind === "ground-compaction") {
          rect(430, 360, 190, 70, "#444e4a");
          rect(450, 310, 130, 60, "#d9ab42");
          line(
            [
              [480, 320],
              [510, 200],
              [630, 200],
              [600, 380],
            ],
            "#525b53",
            12,
          );
        }
      }
      if (kind === "ground-formwork" || kind === "ground-rebar") {
        rect(145, 235, 670, 35, "#b69c71");
        rect(145, 545, 670, 40, "#b69c71");
        for (let x = 170; x < 810; x += 120) rect(x, 525, 18, 95, "#725a40");
      }
      if (kind === "ground-rebar") {
        for (let x = 210; x < 780; x += 70)
          line(
            [
              [x, 275],
              [x, 535],
            ],
            "#505e59",
            7,
          );
        for (let y = 300; y < 540; y += 60)
          line(
            [
              [190, y],
              [770, y],
            ],
            "#505e59",
            7,
          );
      }
      if (kind === "ground-concrete") {
        rect(210, 285, 540, 210, "#ced0c7");
        rect(210, 495, 540, 50, "#959e93");
      }
      if (kind === "ground-excavation")
        line(
          [
            [190, 295],
            [190, 520],
            [765, 520],
          ],
          "#554331",
          15,
        );
    }
  } else {
    wall();
    if (["facade-overview", "scaffold-platform", "scaffold-tie"].includes(kind)) {
      for (const x of [190, 570]) {
        rect(x - 9, 170, 199, 225, "#f0ede2");
        rect(x, 180, 180, 205, "#627c85");
        line(
          [
            [x + 90, 180],
            [x + 90, 385],
          ],
          "#c4c9c5",
          6,
        );
      }
    }
    if (kind === "facade-overview") {
      rect(45, 70, 870, 25, "#666e66");
      rect(400, 425, 140, 170, "#6a7975");
      if (old)
        for (let x = 150; x < 880; x += 175)
          line(
            [
              [x, 400],
              [x - 12, 510],
            ],
            "#867d6866",
            17,
          );
      if (done) {
        rect(50, 595, 860, 22, "#e0dfd6");
        rect(75, 622, 810, 18, "#a0ad9b");
      }
    }
    if (kind === "scaffold-platform") {
      for (let x = 140; x < 900; x += 200)
        line(
          [
            [x, 45],
            [x, 640],
          ],
          "#728881",
          14,
        );
      for (const y of [220, 440]) {
        rect(90, y, 790, 22, "#8d9f95");
        line(
          [
            [140, y],
            [740, y + 180],
          ],
          "#778c82",
          9,
        );
      }
      for (let x = 110; x < 850; x += 40)
        line(
          [
            [x, 440],
            [x, 460],
          ],
          "#4f615a",
          2,
        );
    }
    if (kind === "scaffold-tie") {
      rect(425, 270, 110, 110, "#8e9b91");
      pipe(
        [
          [480, 325],
          [735, 500],
        ],
        26,
      );
      pipe(
        [
          [735, 100],
          [735, 615],
        ],
        34,
      );
      for (const x of [445, 515]) for (const y of [290, 360]) circle(x, y, 8, "#465951");
    }
    if (kind === "facade-crack" || kind === "facade-patch") {
      rect(160, 130, 640, 65, "#9c9f93");
      line(
        [
          [430, 195],
          [470, 270],
          [440, 350],
          [510, 445],
          [485, 550],
        ],
        kind === "facade-crack" ? "#5d6056" : "#eee6d1",
        kind === "facade-crack" ? 5 : 27,
      );
      if (kind === "facade-crack")
        line(
          [
            [440, 350],
            [360, 380],
            [330, 430],
          ],
          "#5d6056",
          3,
        );
    }
    if (kind === "facade-anchors") {
      rect(250, 180, 460, 330, "#b4b4a7");
      for (let x = 290; x < 710; x += 100)
        for (let y = 220; y < 510; y += 110) {
          circle(x, y, 16, "#d4ccba");
          circle(x, y, 5, "#646f62");
        }
    }
    if (kind === "facade-canopy") {
      rect(250, 310, 460, 285, "#627572");
      rect(140, 225, 680, 80, done ? "#eee9d9" : "#acaea3");
      if (!done) {
        rect(245, 310, 470, 270, "#b5d1cd99");
        line(
          [
            [245, 590],
            [245, 310],
            [715, 310],
            [715, 590],
          ],
          "#698eaf",
          12,
        );
      }
    }
    if (kind === "facade-paint") {
      rect(160, 130, 470, 430, "#eee7d7");
      if (!done) {
        line(
          [
            [665, 550],
            [665, 340],
            [610, 340],
            [610, 280],
          ],
          "#65756b",
          9,
        );
        rect(510, 235, 180, 48, "#d7c9ac");
      }
    }
  }
  if (state !== "finished" && scene.prop === 1) {
    rect(160, 570, 270, 20, "#eee5bd");
    for (let x = 165; x < 430; x += 10)
      line(
        [
          [x, 570],
          [x, x % 50 === 15 ? 588 : 579],
        ],
        "#4d5147",
        2,
      );
  } else if (
    state !== "finished" &&
    scene.prop === 2 &&
    !kind.startsWith("pipe-") &&
    !kind.startsWith("interior-")
  ) {
    for (let y = 340; y < 620; y += 35) rect(850, y, 13, 35, y % 70 === 60 ? "#d35c49" : "#ede9dc");
  } else if (state !== "finished" && scene.prop === 3 && kind.startsWith("ground-")) {
    line(
      [
        [830, 590],
        [845, 520],
        [860, 590],
      ],
      "#d27844",
      20,
    );
    rect(812, 590, 68, 12, "#654f3c");
  }
}

export async function sampleImage(photo: Photo, index: number) {
  const scene = sampleScene(photo);
  const canvas = document.createElement("canvas");
  // indexは既存呼出しとの互換用。並べ替え後も同じIDの画像を保つ。
  void index;
  canvas.width = scene.portrait ? 720 : 960;
  canvas.height = scene.portrait ? 960 : 720;
  const c = canvas.getContext("2d");
  if (!c) throw new Error("サンプル画像を生成できません。");
  c.fillStyle = `hsl(${scene.skyHue} 25% 80%)`;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.save();
  // 縦長は等倍比率で中央を切り取り、被写体の縦横比を維持する。
  const scale = Math.max(canvas.width / 960, canvas.height / 720);
  c.translate(canvas.width / 2, canvas.height / 2);
  c.scale(scale * scene.camera.zoom, scale * scene.camera.zoom);
  c.rotate(scene.camera.angle);
  c.translate(-480 + scene.camera.x, -360 + scene.camera.y);
  drawScene(c, scene);
  c.restore();
  c.fillStyle = `rgba(255, 242, 216, ${scene.light})`;
  c.fillRect(0, 0, canvas.width, canvas.height);
  c.fillStyle = "#ffffffcc";
  c.fillRect(canvas.width - 180, 16, 164, 36);
  c.fillStyle = "#243d35";
  c.font = '20px "Yu Gothic", Meiryo, sans-serif';
  c.fillText("サンプル画像", canvas.width - 164, 41);
  return canvasBlob(canvas);
}
