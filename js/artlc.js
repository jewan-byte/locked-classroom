'use strict';
// ─────────────────────────────────────────────
// artlc.js — 「잠겨있던 교실」에서 새로 쓰는 그림과 인물
// (art.js 다음에 읽는다. 같은 TILE_ART / DECO_ART / OBJ_ART / PEOPLE 에 덧붙인다)
// ─────────────────────────────────────────────

Object.assign(PEOPLE, {
  // 건우(박건우): 지후의 친구. 짧게 깎은 머리, 체육복 상의(초록) 위에 교복
  dolsoe: {
    pal: { ...PLAYER_PAL, hair: '#1a1410', hairHi: '#2e241c', blazer: '#2f6a4a', blazerDk: '#24543a', tie: '#2f6a4a', skin: '#e2b98e', skinSh: '#c99a70' },
    tie: false,
  },
  // 최은비: 같은 반, 방송부. 갈색 단발, 노란 넥타이(방송부 배지 색)
  eunbi: {
    pal: { ...PLAYER_PAL, hair: '#5a3422', hairHi: '#7a4a32', tie: '#d9a43a' },
  },
  // 문병철 교감: 벗어진 회색 머리, 회색 양복, 안경
  gyogam: {
    pal: {
      ...PLAYER_PAL, hair: '#76767c', hairHi: '#9a9aa2', blazer: '#55585f', blazerDk: '#43464c',
      shirt: '#f0f0f0', tie: '#3a4a6a', pants: '#43464c', pantsDk: '#36383e',
    },
    glasses: true,
  },
  // 담임 (2학년 6반): 남색 카디건
  homeroom: {
    pal: { ...PLAYER_PAL, hair: '#2a1e1a', hairHi: '#4a3428', blazer: '#34446a', blazerDk: '#283554', shirt: '#f0ece2' },
    tie: false,
  },
});

Object.assign(DECO_ART, {
  // 벽에 걸린 낡은 달력 (1998년 12월)
  calendar(g, x, y, w) {
    const X = x + (w >> 1) - 5;
    rect(g, X, y + 2, 10, 12, '#e8e0cc');
    rect(g, X, y + 2, 10, 3, '#b8323f');
    for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) rect(g, X + 1 + c * 2, y + 6 + r * 2, 1, 1, '#6a6458');
    rect(g, X + 4, y + 1, 2, 1, '#555');
    // 누렇게 바랜 얼룩
    rect(g, X + 6, y + 10, 3, 3, 'rgba(160,120,60,0.35)');
  },
  // 벽에 붙은 표 (시간표·감독표): 칸이 그어진 종이
  chart(g, x, y, w) {
    rect(g, x + 2, y + 1, w - 4, 12, '#efe8d6');
    for (let cx = x + 5; cx < x + w - 3; cx += 4) rect(g, cx, y + 2, 1, 10, '#b8b0a0');
    for (let cy = y + 4; cy < y + 12; cy += 3) rect(g, x + 3, cy, w - 6, 1, '#b8b0a0');
    rect(g, x + 3, y + 2, w - 6, 1, '#7a6a5a');
  },
  // 먼지 낀 창 (창고 교실)
  dustyWindow(g, x, y, w, h) {
    DECO_ART.window(g, x, y, w, h);
    g.fillStyle = 'rgba(120,100,80,0.45)';
    g.fillRect(x + 2, y + 4, w - 4, h - 14);
  },
});

Object.assign(OBJ_ART, {
  // 쌓아 올린 책상 (창고)
  stackdesk: {
    up: 14,
    draw(g, w) {
      for (let i = 0; i < 3; i++) {
        const yy = 6 - i * 7, sh = (i % 2) * 2;
        rect(g, 1 + sh, yy - 6, w - 4, 6, '#a8865a');
        rect(g, 1 + sh, yy - 6, w - 4, 1, '#c09a6a');
        rect(g, 2 + sh, yy, 1, 6, '#4b4f57');
        rect(g, w - 4 + sh, yy, 1, 6, '#4b4f57');
      }
      rect(g, 1, 12, w - 2, 1, 'rgba(0,0,0,0.25)');
    },
  },
  // 문에 건 자물쇠 + 쇠사슬 (2칸 문)
  padlock: {
    up: 4,
    draw(g, w) {
      for (let cx = 1; cx < w - 1; cx += 3) rect(g, cx, 2 + (cx % 2), 2, 1, '#9a9a9a');
      rect(g, (w >> 1) - 3, 1, 6, 4, 'rgba(0,0,0,0)');
      rect(g, (w >> 1) - 2, 0, 4, 1, '#8a8a8a');
      rect(g, (w >> 1) - 3, 1, 1, 3, '#8a8a8a');
      rect(g, (w >> 1) + 2, 1, 1, 3, '#8a8a8a');
      rect(g, (w >> 1) - 4, 4, 8, 6, '#c9a43a');
      rect(g, (w >> 1) - 4, 4, 8, 1, '#e8c860');
      rect(g, (w >> 1) - 1, 6, 2, 2, '#3a2a10');
      // "관계자 외 출입금지" 종이
      rect(g, 2, 11, w - 4, 4, '#f0ead8');
      rect(g, 4, 12, w - 8, 1, '#b8323f');
    },
  },
  // 낡은 학급 사물함 (뒤쪽 벽)
  oldlocker: {
    up: 10,
    draw(g, w) {
      rect(g, 1, -9, w - 2, 22, '#7a6a52');
      rect(g, 1, -9, w - 2, 1, '#9a8a6a');
      for (let cx = 2; cx < w - 2; cx += 8) {
        rect(g, cx, -7, 7, 8, '#8a7a5e');
        rect(g, cx, 3, 7, 8, '#8a7a5e');
        rect(g, cx + 5, -4, 1, 2, '#3a3020');
        rect(g, cx + 5, 6, 1, 2, '#3a3020');
      }
    },
  },
});

// 단서 그림에 쓰는 숫자 0 (art.js 의 DIGITS 는 엘리베이터용 1~3만 있다)
DIGITS[0] = ['111', '101', '101', '101', '111'];
