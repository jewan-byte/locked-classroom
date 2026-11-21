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

  '칠판 구석의 글씨'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#73532f');
    rect(g, 2, 2, 36, 26, '#2f5b47');
    for (let i = 0; i < 6; i++) rect(g, 4 + i * 4, 6 + (i % 3) * 3, 3, 1, 'rgba(188,211,197,0.25)');   // 지운 자국
    // 구석에 남은 글씨 "미스터리 추리동아리" (두 줄, 글자 덩어리로)
    for (let i = 0; i < 4; i++) { rect(g, 15 + i * 5, 14, 3, 1, '#f0f0f0'); rect(g, 15 + i * 5, 15, 1, 3, '#f0f0f0'); rect(g, 17 + i * 5, 16, 1, 2, '#f0f0f0'); }
    for (let i = 0; i < 5; i++) { rect(g, 13 + i * 5, 21, 3, 1, '#f0f0f0'); rect(g, 14 + i * 5, 22, 1, 3, '#f0f0f0'); rect(g, 13 + i * 5, 24, 3, 1, '#f0f0f0'); }
  },

  '기말고사 감독표'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#4a4038');
    rect(g, 5, 3, 30, 24, '#efe8d6');
    rect(g, 5, 3, 30, 3, '#7a6a5a');
    for (let x = 12; x < 35; x += 6) rect(g, x, 6, 1, 21, '#b8b0a0');
    for (let y = 10; y < 27; y += 4) rect(g, 5, y, 30, 1, '#b8b0a0');
    for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) if ((r + c) % 3) rect(g, 14 + c * 6, 12 + r * 4, 3, 1, '#b8323f');
  },

  '2026년 달력'(g) {
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

  '추리동아리 활동 보고서'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 6, 2, 28, 26, '#e8e0cc');
    rect(g, 6, 2, 28, 4, '#4a6a3a');
    rect(g, 9, 9, 12, 9, '#b8a888');                    // 붙인 사진
    rect(g, 10, 11, 4, 4, '#e2c098'); rect(g, 10, 11, 4, 1, '#2a2420'); rect(g, 10, 12, 4, 1, '#2a2a2a');   // 안경 쓴 재민
    rect(g, 16, 11, 4, 4, '#e2c098'); rect(g, 16, 11, 4, 1, '#2a2420');
    textLines(g, 23, 10, 9, 3, '#6a645a');
    textLines(g, 9, 21, 22, 2, '#6a645a');
    rect(g, 9, 26, 18, 1, '#8a2a2a');
  },

  '동창들의 답장'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#1a1a22');
    rect(g, 11, 1, 18, 28, '#2a2a34');
    rect(g, 12, 3, 16, 24, '#e8eef4');
    rect(g, 13, 5, 10, 4, '#c8d8e8');
    rect(g, 17, 11, 10, 4, '#fff6b0');
    rect(g, 13, 17, 12, 5, '#c8d8e8');
    rect(g, 14, 19, 8, 1, '#8a2a2a');
  },

  '사연 녹음'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 5, 6, 30, 19, '#2a2a30');
    rect(g, 7, 8, 26, 8, '#e8e2cc');
    rect(g, 8, 9, 24, 2, '#b8323f');
    textLines(g, 9, 13, 16, 1, '#6a645a');
    ring(g, 13, 20, 2, '#8a8a92');
    ring(g, 27, 20, 2, '#8a8a92');
    rect(g, 15, 19, 10, 3, '#5a3a20');
  },

  '쪽지 원본'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 8, 5, 24, 20, '#f4f0e0');
    for (let i = 0; i < 5; i++) {
      rect(g, 11, 8 + i * 3, 2, 1, '#3a3a6a');
      ring(g, 16 + (i * 3) % 7, 8 + i * 3, 1, '#3a3a6a');
    }
    rect(g, 22, 18, 8, 1, '#8a2a2a');                    // 뒷면에 비친 거친 글씨
    rect(g, 21, 20, 9, 1, '#8a2a2a');
    rect(g, 8, 5, 24, 1, '#d8d0bc');
  },

  '재민의 메모'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 6, 3, 28, 24, '#f4efe2');
    for (let y = 6; y < 26; y += 3) rect(g, 6, y, 28, 1, '#c8d8e8');
    rect(g, 9, 3, 1, 24, '#e0a0a0');
    textLines(g, 11, 7, 20, 5, '#2a2a5a');
    rect(g, 26, 22, 3, 3, '#2a2a5a');                    // J
  },

  '기념식 방명록'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 3, 5, 34, 21, '#f4efe2');
    rect(g, 19, 5, 1, 21, '#c8c0aa');
    textLines(g, 6, 9, 11, 3, '#8a847a');
    for (let i = 0; i < 9; i++) rect(g, 22 + i, 16 - Math.floor(i / 3), 2, 1, '#1a1a1a');   // 비스듬한 서명
    rect(g, 23, 20, 9, 1, '#1a1a1a');
    rect(g, 31, 20, 1, 2, '#1a1a1a');                                                   // 꺾인 줄표
  },

  '아빠의 고백'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#1e1a26');
    rect(g, 9, 4, 22, 22, '#5a4a3a');
    rect(g, 11, 6, 18, 18, '#e8e0cc');
    pixelDigit(g, 1, 13, 8, '#5a4a3a');
    textLines(g, 13, 15, 14, 3, '#6a645a');
    rect(g, 24, 19, 2, 3, '#6fa8d8');   // 번진 눈물 자국
  },

  '정재민 경위 기사'(g) {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#e8e4dc');
    rect(g, 3, 3, 34, 4, '#2a2a30');
    rect(g, 4, 10, 13, 15, '#b8b0a0');
    rect(g, 7, 13, 7, 7, '#e2c098'); rect(g, 7, 12, 7, 2, '#2a2420');
    rect(g, 7, 15, 3, 1, '#2a2a2a'); rect(g, 11, 15, 3, 1, '#2a2a2a');   // 동그란 안경
    rect(g, 6, 20, 9, 5, '#2a3a5a');
    textLines(g, 20, 11, 15, 5, '#6a645a');
  },
};

// 모순 단서: 금 간 사진 (기억이 어긋난 곳)
for (const name of ['모순: 친절한 부탁', '모순: 창밖을 보던 감독', '모순: 감독석의 담임', '모순: 그날 저녁의 손님']) {
  CLUE_ART[name] = g => {
    rect(g, 0, 0, CLUE_W, CLUE_H, '#2a2230');
    rect(g, 6, 4, 28, 22, '#c8a878');
    rect(g, 8, 6, 24, 18, '#8a6a4a');
    const seed = name.length;
    for (let i = 0; i < 18; i++) rect(g, 18 + Math.round(Math.sin(i * 0.9 + seed) * 3), 6 + i, 2, 1, '#f4efe2');   // 금
    rect(g, 11, 12, 4, 5, '#5a4030');
    rect(g, 25, 11, 4, 6, '#5a4030');
  };
}

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
