'use strict';
// ─────────────────────────────────────────────
// clueart.js — 단서마다 작은 픽셀 일러스트 (40×30)
// 단서 수첩과 새 단서 알림에 쓴다. 키는 map.js 의 clue() 이름과 같다.
// ─────────────────────────────────────────────

const CLUE_W = 40, CLUE_H = 30;

// 원 위의 점 찍기 (시계, 망원경 렌즈 등)
function ring(g, cx, cy, r, color) {
  for (let a = 0; a < 360; a += 4) {
    rect(g, Math.round(cx + Math.cos(a * Math.PI / 180) * r), Math.round(cy + Math.sin(a * Math.PI / 180) * r), 1, 1, color);
  }
}
// 중심에서 각도 방향으로 선 (0° = 12시)
function hand(g, cx, cy, deg, len, color) {
  const rad = (deg - 90) * Math.PI / 180;
  for (let i = 0; i <= len; i++) rect(g, Math.round(cx + Math.cos(rad) * i), Math.round(cy + Math.sin(rad) * i), 1, 1, color);
}
// 글줄 흉내
function textLines(g, x, y, w, rows, color, gap = 3) {
  for (let r = 0; r < rows; r++) rect(g, x, y + r * gap, Math.max(2, w - (r * 7) % 9), 1, color);
}

const CLUE_ART = {
  '아빠의 졸업앨범'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 6, 3, 28, 24, '#1f3a5a');
    rect(g, 6, 3, 3, 24, '#16304a');
    rect(g, 13, 9, 16, 1, '#d8c070');
    rect(g, 15, 12, 12, 1, '#d8c070');
    pixelDigit(g, 2, 14, 18, '#d8c070');
    pixelDigit(g, 0, 18, 18, '#d8c070');
    pixelDigit(g, 0, 22, 18, '#d8c070');
    pixelDigit(g, 0, 26, 18, '#d8c070');
  },

  '개교기념식 안내'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#7c5a33');
    rect(g, 6, 3, 28, 24, '#f4efe2');
    rect(g, 6, 3, 28, 5, '#2f4f8a');
    textLines(g, 9, 11, 22, 4, '#6a645a');
    rect(g, 24, 20, 7, 5, '#d8b43a');   // 감사패
    rect(g, 25, 21, 5, 3, '#f0d870');
  },

  '칠판 구석의 221B'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#73532f');
    rect(g, 2, 2, 36, 26, '#2f5b47');
    for (let i = 0; i < 6; i++) rect(g, 4 + i * 4, 6 + (i % 3) * 3, 3, 1, 'rgba(188,211,197,0.25)');   // 지운 자국
    pixelDigit(g, 2, 15, 15, '#f0f0f0');
    pixelDigit(g, 2, 19, 15, '#f0f0f0');
    pixelDigit(g, 1, 23, 15, '#f0f0f0');
    // B
    rect(g, 28, 15, 1, 5, '#f0f0f0');
    rect(g, 29, 15, 2, 1, '#f0f0f0');
    rect(g, 29, 17, 2, 1, '#f0f0f0');
    rect(g, 29, 19, 2, 1, '#f0f0f0');
    rect(g, 31, 16, 1, 1, '#f0f0f0');
    rect(g, 31, 18, 1, 1, '#f0f0f0');
  },

  '기말고사 감독표'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#4a4038');
    rect(g, 5, 3, 30, 24, '#efe8d6');
    rect(g, 5, 3, 30, 3, '#7a6a5a');
    for (let x = 12; x < 35; x += 6) rect(g, x, 6, 1, 21, '#b8b0a0');
    for (let y = 10; y < 27; y += 4) rect(g, 5, y, 30, 1, '#b8b0a0');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if ((r + c) % 3) rect(g, 14 + c * 6, 12 + r * 4, 3, 1, '#b8323f');
  },

  '1998년 달력'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#3a3440');
    rect(g, 9, 3, 22, 25, '#e8e0cc');
    rect(g, 9, 3, 22, 6, '#b8323f');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 6; c++) rect(g, 11 + c * 3, 11 + r * 4, 2, 2, '#8a8478');
    ring(g, 21, 20, 2, '#d8202a');      // 18일 동그라미
    rect(g, 22, 22, 6, 4, 'rgba(160,120,60,0.35)');
  },

  '책상의 J & J'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#c99e68');
    for (let y = 3; y < CLUE_H; y += 6) rect(g, 0, y, CLUE_W, 1, '#b88a55');
    const C = '#5a3a1e';
    const J = x => { rect(g, x, 9, 7, 2, C); rect(g, x + 4, 9, 2, 9, C); rect(g, x, 17, 6, 2, C); rect(g, x, 15, 2, 2, C); };
    J(7);
    // &
    rect(g, 19, 12, 3, 2, C); rect(g, 18, 14, 2, 4, C); rect(g, 20, 17, 3, 2, C); rect(g, 22, 15, 1, 2, C);
    J(26);
  },

  '파인 사진'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 5, 3, 30, 24, '#f4efe2');
    rect(g, 7, 5, 26, 17, '#b8a888');
    // 오른쪽 학생 (아빠)
    rect(g, 22, 8, 6, 6, '#e2c098');
    rect(g, 22, 7, 6, 2, '#2a2420');
    rect(g, 20, 14, 10, 8, '#2f3f73');
    // 왼쪽 학생: 얼굴이 네모나게 파였다
    rect(g, 11, 14, 10, 8, '#2f3f73');
    rect(g, 12, 6, 7, 8, '#141018');
    rect(g, 12, 6, 7, 1, '#6a5a48');
    rect(g, 19, 15, 4, 2, '#2f3f73');   // 어깨동무
    rect(g, 8, 24, 10, 1, '#8a2a2a');   // 긁힌 이름 칸
    rect(g, 22, 24, 9, 1, '#6a645a');
  },

  '빈칸 하나'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 7, 2, 26, 26, '#f4efe2');
    for (let r = 0; r < 7; r++) {
      const y = 5 + r * 3;
      if (r === 3) rect(g, 9, y - 1, 22, 3, '#ffffff');
      else textLines(g, 10, y, 18, 1, '#8a847a');
    }
    rect(g, 9, 13, 22, 3, '#ffffff');
    rect(g, 9, 16, 22, 1, '#d8d0bc');
  },
};

// 단서 이름 → 일러스트 캔버스 (한 번만 그려서 재사용)
const clueImageCache = {};
function clueImage(name) {
  if (!clueImageCache[name]) {
    const c = makeCanvas(CLUE_W, CLUE_H);
    const g = c.getContext('2d');
    rect(g, 0, 0, CLUE_W, CLUE_H, '#141018');
    (CLUE_ART[name] || (() => {}))(g);
    clueImageCache[name] = c;
  }
  return clueImageCache[name];
}
