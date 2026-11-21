'use strict';
// ─────────────────────────────────────────────
// artlc.js — 「CLASS X」에서 새로 쓰는 그림과 인물
// (art.js 다음에 읽는다. 같은 TILE_ART / DECO_ART / OBJ_ART / PEOPLE 에 덧붙인다)
// ─────────────────────────────────────────────

Object.assign(PEOPLE, {
  // 상욱(변상욱): 지후의 친구. 반에서 제일 큰 덩치, 짧게 깎은 머리, 초록 체육복, 책가방
  dolsoe: {
    pal: { ...PLAYER_PAL, hair: '#1a1410', hairHi: '#2e241c', blazer: '#2f6a4a', blazerDk: '#24543a', tie: '#2f6a4a', skin: '#e2b98e', skinSh: '#c99a70' },
    tie: false, hair: 'crop', big: true, bag: true,
  },
  // 최은비: 같은 반, 방송부. 하늘색 양 갈래 머리, 베이지 조끼, 방송부 헤드셋
  eunbi: {
    pal: { ...PLAYER_PAL, hair: '#7fc4e8', hairHi: '#b4e2f6', blazer: '#d8c49a', blazerDk: '#b8a47a', tie: '#d9a43a', skirt: '#3a4468', skirtDk: '#2a3250' },
    hair: 'twin', skirt: true, headset: true,
  },
  // 권도윤 교감: 벗어진 회색 머리, 회색 양복, 안경
  gyogam: {
    pal: {
      ...PLAYER_PAL, hair: '#76767c', hairHi: '#9a9aa2', blazer: '#6a5038', blazerDk: '#523c28',
      shirt: '#f0f0f0', tie: '#3a4a6a', pants: '#523c28', pantsDk: '#3e2c1c',
    },
    glasses: true, hair: 'balding',
  },
  // 담임 (2학년 6반): 남색 카디건
  homeroom: {
    pal: { ...PLAYER_PAL, hair: '#2a1e1a', hairHi: '#4a3428', blazer: '#34446a', blazerDk: '#283554', shirt: '#f0ece2' },
    tie: false, hair: 'slick',
  },
});

Object.assign(DECO_ART, {
  // 벽에 걸린 낡은 달력 (2026년 12월)
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

// 2026년 방송부 DJ (사연 해독 대결의 상대): 2026년 남색 교복, 붉은 넥타이, 헤드폰
PEOPLE.dj98 = {
  pal: { ...PLAYER_PAL, hair: '#2a1a14', hairHi: '#4a3020', blazer: '#2a3256', blazerDk: '#1e2442', tie: '#a82a34' },
  glasses: true, headset: true,
};

// ── 3장: 이수아 선생님과 2026년의 사람들 ──
Object.assign(PEOPLE, {
  // 이수아 선생님 (국어): 긴 머리를 묶었다, 베이지 카디건
  suah: {
    pal: { ...PLAYER_PAL, hair: '#2a1a14', hairHi: '#4a3024', blazer: '#9aa0a8', blazerDk: '#7c828a', shirt: '#f4f0e8', pants: '#4a4a56', pantsDk: '#3a3a44', skirt: '#3e3a44', skirtDk: '#2e2a34' },
    tie: false, hair: 'bob', glasses: true, skirt: true,
  },
  // 2026년 교복: 진남색 재킷, 붉은 넥타이
  suah98: { pal: { ...PLAYER_PAL, hair: '#2a1a14', hairHi: '#4a3024', blazer: '#2a3256', blazerDk: '#1e2442', tie: '#a82a34', skirt: '#2a3256', skirtDk: '#1e2442' }, hair: 'long', skirt: true },
  jaemin98: { pal: { ...PLAYER_PAL, hair: '#1a1410', hairHi: '#3a2c20', blazer: '#2a3256', blazerDk: '#1e2442', tie: '#a82a34' }, glasses: true, hair: 'crop' },
  junho98: { pal: { ...PLAYER_PAL, hair: '#16141a', hairHi: '#34303c', blazer: '#2a3256', blazerDk: '#1e2442', tie: '#a82a34' }, hair: 'spiky' },
  // 허진 (2026): 재킷을 풀어 헤치고 넥타이 없이, 갈색 물들인 머리
  hyungseok98: { pal: { ...PLAYER_PAL, hair: '#7a4a24', hairHi: '#9a6434', blazer: '#2a3256', blazerDk: '#1e2442', shirt: '#f4f4f4' }, tie: false, hair: 'slick' },
  gang98: { pal: { ...PLAYER_PAL, hair: '#141014', hairHi: '#2a2228', blazer: '#2a3256', blazerDk: '#1e2442', shirt: '#e8e8e8' }, tie: false, big: true, hair: 'crop' },
  // 권도윤 (2026, 담임): 검은 머리, 회색 양복, 안경
  gyogam98: {
    pal: { ...PLAYER_PAL, hair: '#1a1a1e', hairHi: '#33333a', blazer: '#6a5038', blazerDk: '#523c28', shirt: '#f0f0f0', tie: '#3a4a6a', pants: '#523c28', pantsDk: '#3e2c1c' },
    glasses: true, hair: 'slick',
  },
  // 학교운영위원장 허승원 (허진의 아버지): 짙은 양복, 금색 넥타이
  chairman98: {
    pal: { ...PLAYER_PAL, hair: '#8a8a90', hairHi: '#b0b0b8', blazer: '#1e1e26', blazerDk: '#141418', shirt: '#f0f0f0', tie: '#c8a03a', pants: '#1e1e26', pantsDk: '#141418' },
    hair: 'slick', beard: true, big: true,
  },
  student98: { pal: { ...PLAYER_PAL, hair: '#241a14', hairHi: '#3e2e22', blazer: '#2a3256', blazerDk: '#1e2442', tie: '#a82a34' } },
});

// ── 4장: 지금의 허진과 정재민 ──
Object.assign(PEOPLE, {
  // 동문회장 허진: 넘긴 머리, 짙은 남색 양복, 금색 넥타이
  hyungseok: {
    pal: { ...PLAYER_PAL, hair: '#9a9aa2', hairHi: '#c4c4cc', blazer: '#1e2440', blazerDk: '#151a30', shirt: '#f4f4f4', tie: '#c8a03a', pants: '#1e2440', pantsDk: '#151a30' },
    hair: 'slick', glasses: true,
  },
  // 정재민 경위: 짧은 머리, 동그란 안경, 회색 점퍼
  jaemin: {
    pal: { ...PLAYER_PAL, hair: '#2a2420', hairHi: '#4a4038', blazer: '#5a5e66', blazerDk: '#464a52', shirt: '#9ab4d8', pants: '#3a3a44', pantsDk: '#2e2e36' },
    glasses: true, tie: false, hair: 'crop',
  },
  // 양복을 입은 아빠 (금요일 기념식)
  dadSuit: {
    pal: { ...PLAYER_PAL, hair: '#57524d', hairHi: '#7a756e', blazer: '#3a3e4a', blazerDk: '#2a2e38', shirt: '#f0f0f0', tie: '#7a2a34', pants: '#3a3e4a', pantsDk: '#2a2e38' },
    glasses: true,
  },
});
