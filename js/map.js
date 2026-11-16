'use strict';
// ─────────────────────────────────────────────
// map.js — 동산고 1~3층과 운동장, 지후네 집, 등굣길 버스
// 좌표는 모두 타일 단위. 실내 방을 파내면(carve) 주변 벽은 자동으로 생긴다.
// obj/dec 마지막 인자로 clue(이름, 대사...)를 넘긴 것만 조사(F)할 수 있고, 조사하면 단서 수첩에 기록된다.
//
// 모든 층 공통 뼈대: 복도(y16~19), 엘리베이터(x32~33 벽), 계단(x30~37 아래쪽)
// ─────────────────────────────────────────────

const OUTDOOR = new Set(['grass', 'dirt', 'path']);

// 단서: 수첩에 적힐 이름 + 조사했을 때 나오는 대사 (한 줄 = 대사창 한 페이지)
const clue = (name, ...text) => ({ name, text });
// 수첩에 안 남는 그냥 살펴보기
const look = (...text) => ({ text });

// n: 학교 층 번호(1~3) 또는 장소 이름('home', 'bus', 'old1' …)
// style: 벽 모양 ('home', 'bus', 'roof'), scenery: 창밖 풍경이 흐르는 줄(타일 y)
// night: 밤 장면 { dark: 어둠 진하기 0~1, sky: 바깥에 별 } — 손전등과 lights 만 밝다 (main.js)
function createFloor(n, W, H, { label = `${n}층`, style = null, scenery = null, night = null } = {}) {
  const tiles = Array.from({ length: H }, () => new Array(W).fill(null));
  const b = {
    n, W, H, tiles, label, style, scenery, night,
    regions: [], deco: [], objects: [], warps: [], lights: [],
    carve(x, y, w, h, type) {
      for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) tiles[yy][xx] = type;
    },
    room(name, x, y, w, h, type) {
      b.carve(x, y, w, h, type);
      b.regions.push({ name, x, y, w, h });
    },
    obj(type, x, y, w = 1, h = 1, info) {
      const o = { type, x, y, w, h, ...info };
      b.objects.push(o);
      return o;
    },
    dec(type, x, y, w = 1, h = 1, info) {
      const d = { type, x, y, w, h, ...info };
      b.deco.push(d);
      return d;
    },
    // 밟으면 다른 층으로 이동 (to.x, to.y 는 도착 지점 픽셀/16, y는 발밑)
    warp(x, y, w, h, to) {
      b.warps.push({ x, y, w, h, to });
    },
    // 밤 장면의 불빛: 중심(타일), 반지름(px), 색('r,g,b' — 없으면 어둠만 걷힌다)
    light(x, y, r, color = null) {
      b.lights.push({ x, y, r, color });
    },
  };
  return b;
}

// ── 공통 뼈대 ──────────────────────────────────

const ELEVATOR_ARRIVE = { x: 33, y: 16, dir: 'down' };

function core(b, { up, down, roof }) {
  const n = b.n;
  b.room(`${n}층 복도`, 2, 16, 60, 4, 'hall');

  // 엘리베이터: 복도 위쪽 벽에 움푹 들어간 자리
  b.carve(32, 14, 2, 2, 'hall');
  const ev = b.dec('elevator', 32, 12, 2, 2);
  ev.floor = n;
  ev.elevator = true;

  // 계단: 왼쪽 절반은 올라가는 계단, 오른쪽 절반은 내려가는 계단
  b.room('계단', 30, 22, 8, 10, 'hall');
  b.carve(31, 20, 6, 2, 'hall');
  if (up || roof) {
    b.carve(30, 25, 4, 7, 'stairs');
    b.dec('arrowUp', 31, 24, 2, 1);
  }
  b.obj('rail', 33, 25, 1, 7);
  if (up) b.warp(30, 30, 4, 2, { floor: n + 1, x: 36, y: 25, dir: 'up' });
  if (roof) b.obj('chain', 30, 27, 4, 1, look('쇠사슬로 막혀 있다. "옥상 출입 금지"'));
  if (down) {
    b.carve(34, 25, 4, 7, 'stairsDown');
    b.dec('arrowDown', 35, 24, 2, 1);
    b.warp(34, 30, 4, 2, { floor: n - 1, x: 32, y: 25, dir: 'up' });
  } else {
    b.obj('plant', 37, 31);
  }
}

// 위쪽 줄 교실 (문은 아래 벽, 칠판은 위 벽)
function topClassroom(b, name, x0, w = 14) {
  b.room(name, x0, 4, w, 10, 'wood');
  b.carve(x0 + w - 4, 14, 2, 2, 'door');
  b.dec('window', x0 + 1, 2, 2, 2);
  b.dec('blackboard', x0 + ((w - 6) >> 1), 2, 6, 2);
  b.dec('window', x0 + w - 3, 2, 2, 2);
  b.obj('plant', x0, 4);
  b.obj('podium', x0 + (w >> 1) - 1, 5, 2, 1);
  for (let cx = 2; cx <= w - 3; cx += 3) {
    for (const cy of [7, 9, 11]) b.obj('desk', x0 + cx, cy, 1, 2);
  }
}

// 아래쪽 줄 교실 (문과 칠판 모두 위 벽)
function bottomClassroom(b, name, x0, w = 14) {
  b.room(name, x0, 22, w, 9, 'wood');
  b.carve(x0 + w - 4, 20, 2, 2, 'door');
  const bw = Math.min(6, w - 6);
  b.dec('blackboard', x0 + 2, 21, bw, 1);
  b.obj('podium', x0 + 1 + (bw >> 1), 22, 2, 1);
  for (let cx = 2; cx <= w - 3; cx += 3) {
    for (const cy of [24, 26, 28]) b.obj('desk', x0 + cx, cy, 1, 2);
  }
}

// ── 1층 (+ 앞마당, 운동장, 체육관) ─────────────

function build1F() {
  const b = createFloor(1, 96, 64);
  core(b, { up: true });

  b.obj('lockers', 3, 16, 8, 1);
  b.obj('lockers', 19, 16, 8, 1);
  b.dec('bulletin', 14, 15, 4, 1, clue('개교기념식 안내',
    '게시판. "개교 52주년 기념식 — 11월 20일(금) 오전 10시, 체육관"',
    '그 아래 작은 글씨. "동문회장 고형석 님(2000년 졸업) 감사패 전달"'));
  b.dec('bulletin', 30, 15, 2, 1);
  b.dec('extinguisher', 34, 15);
  b.dec('bulletin', 40, 15, 4, 1, look('동아리 홍보 포스터가 잔뜩 붙어 있다. 밴드부, 로봇부, 방송부…', '추리 동아리 같은 건 없다.'));
  b.obj('fountain', 46, 16);
  b.obj('plant', 52, 16);
  b.dec('bulletin', 58, 15, 3, 1);
  b.obj('plant', 61, 16);

  topClassroom(b, '1학년 1반', 2);
  topClassroom(b, '1학년 2반', 18);

  // 과학실
  b.room('과학실', 34, 4, 16, 10, 'lab');
  b.carve(36, 14, 2, 2, 'door');
  b.dec('window', 35, 2, 2, 2);
  b.dec('blackboard', 39, 2, 6, 2, look('칠판. "다음 시간: 산화와 환원"'));
  b.dec('window', 47, 2, 2, 2);
  b.obj('podium', 41, 4, 2, 1);
  for (const tx of [36, 41, 46]) {
    b.obj('labtable', tx, 6, 3, 2);
    b.obj('labtable', tx, 10, 3, 2);
  }

  // 방송실 (2장: 옛 사연 테이프)
  b.room('방송실', 52, 4, 10, 10, 'carpet');
  b.carve(55, 14, 2, 2, 'door');
  b.dec('window', 53, 2, 2, 2);
  b.dec('clock', 57, 2, 1, 2);
  b.obj('speaker', 52, 4);
  b.obj('speaker', 61, 4);
  b.obj('table', 55, 6, 4, 2, look('방송용 믹서. 버튼이 수십 개다.', '"점심 방송 — 사연 읽어드립니다 (월·수·금)"라는 이름표가 붙어 있다.'));
  b.obj('shelf', 52, 11, 3, 1, look('CD와 USB가 가지런히 꽂힌 선반.'));
  b.obj('cabinet', 59, 11, 2, 1, { script: 'broadcastCabinet', prompt: '조사하기' });   // 방송부 자료 — 1990년대
  // 2장 수요일: 은비와 방송실에 들어서면 테이프 장면 (story.js)
  b.warps.push({ x: 52, y: 4, w: 10, h: 10, script: 'broadcastRoom' });

  // 중앙 현관
  b.room('중앙 현관', 2, 22, 12, 10, 'hall');
  b.carve(4, 20, 8, 2, 'hall');
  b.obj('shoelocker', 5, 24, 6, 1);
  b.obj('shoelocker', 5, 27, 6, 1);
  b.obj('shoelocker', 12, 23, 2, 1);
  b.dec('mat', 6, 30, 4, 2);

  // 행정실 (열쇠함)
  b.room('행정실', 16, 22, 12, 9, 'carpet');
  b.carve(26, 20, 2, 2, 'door');
  b.dec('whiteboard', 18, 21, 4, 1, look('"이번 주 일정 — 금: 개교기념식 (내빈 접대 준비)"'));
  b.obj('cabinet', 16, 22, 2, 1, { script: 'keyBox', prompt: '열쇠함 보기' });
  b.obj('tdesk', 19, 25, 2, 2);
  b.obj('tdesk', 23, 25, 2, 2);
  b.obj('bookshelf', 17, 29, 4, 1, look('학교 서류철이 빼곡하다. "시설 관리 대장", "교실 배치도"…'));
  b.obj('plant', 27, 29);

  // 동아리 창고 (옛 동아리 물건, 2장)
  b.room('동아리 창고', 40, 22, 12, 9, 'wood');
  b.carve(44, 20, 2, 2, 'door');
  b.obj('bookshelf', 40, 22, 4, 1, { script: 'reportShelf', prompt: '조사하기' });   // 없어진 동아리 보고서 철 (2장: 221B)
  b.obj('bookshelf', 46, 22, 5, 1);
  b.obj('boxes', 40, 29);
  b.obj('boxes', 41, 29);
  b.obj('boxes', 50, 29);
  b.obj('table', 44, 25, 4, 2);

  // 교무실
  b.room('교무실', 54, 22, 8, 9, 'wood');
  b.carve(56, 20, 2, 2, 'door');
  b.dec('whiteboard', 58, 21, 2, 1);
  b.obj('plant', 54, 22);
  b.obj('cabinet', 60, 22, 2, 1, look('서류함. "학생 생활 기록 — 열람 시 교감 결재"'));
  for (const [tx, ty] of [[55, 24], [59, 24], [55, 27], [59, 27]]) b.obj('tdesk', tx, ty, 2, 2);

  // 건물 남쪽 외벽 + 현관 통로
  b.carve(1, 32, 62, 3, 'wall');
  b.carve(6, 32, 4, 3, 'hall');
  b.warps.push({ x: 6, y: 33, w: 4, h: 2, script: 'schoolExit' });
  b.dec('plaque', 5, 32, 6, 1);
  for (const wx of [2, 11, 15, 19, 23, 27, 31, 35, 39, 43, 47, 51, 55, 59]) b.dec('facadeWindow', wx, 33, 2, 2);

  // 앞마당
  b.room('앞마당', 1, 35, 62, 5, 'grass');
  b.carve(2, 35, 59, 2, 'path');
  b.carve(6, 37, 4, 3, 'path');
  b.obj('stage', 28, 37, 8, 2);
  b.obj('flagpole', 37, 37);
  for (const tx of [3, 12, 19, 42, 49, 56]) b.obj('tree', tx, 38, 2, 1);
  b.obj('bench', 15, 38, 2, 1);
  b.obj('bench', 52, 38, 2, 1);

  // 운동장
  b.room('운동장', 1, 40, 62, 23, 'grass');
  b.carve(6, 40, 52, 20, 'dirt');
  b.dec('track', 6, 40, 52, 20);
  b.obj('goal', 7, 48, 1, 3);
  b.obj('goal', 56, 48, 1, 3).flip = true;
  for (const ty of [44, 50, 56]) {
    b.obj('tree', 2, ty, 2, 1);
    b.obj('tree', 59, ty, 2, 1);
  }
  b.obj('fence', 1, 35, 1, 27);
  b.obj('fence', 62, 35, 1, 21);
  b.obj('fence', 62, 59, 1, 3);
  b.obj('fence', 1, 62, 65, 1);

  // 체육관 (개교기념식 무대)
  b.carve(63, 35, 3, 28, 'grass');
  b.obj('fence', 63, 35, 3, 1);
  b.carve(62, 56, 4, 3, 'path');
  b.room('체육관', 67, 38, 26, 23, 'gym');
  b.carve(66, 56, 1, 3, 'door');
  b.dec('court', 69, 40, 22, 19);
  b.dec('scoreboard', 70, 36, 4, 2);
  b.dec('window', 75, 36, 2, 2);
  b.dec('window', 84, 36, 2, 2);
  b.dec('window', 88, 36, 2, 2);
  b.obj('hoop', 79, 38, 2, 1);
  b.obj('hoop', 79, 60, 2, 1);
  b.obj('ballcart', 91, 40);
  b.obj('gymmat', 91, 48, 2, 1);
  b.obj('gymmat', 91, 50, 2, 1);
  b.dec('banner', 77, 36, 6, 2, look('현수막. "개교 52주년 기념식 — 자랑스러운 동산인"'));
  b.obj('stage', 76, 40, 8, 2);
  b.obj('trophycase', 86, 41, 3, 1, look('기념식 때 쓸 감사패들이 진열돼 있다.', '맨 앞 감사패. "고형석 동문회장님 — 모교 발전 기금 5억 원"'));

  return finishFloor(b);
}

// ── 2층 (2학년 6반, 잠긴 교실) ─────────────────

function build2F() {
  const b = createFloor(2, 66, 34);
  core(b, { up: true, down: true });

  b.obj('lockers', 3, 16, 8, 1);
  b.obj('lockers', 19, 16, 8, 1);
  b.obj('lockers', 35, 16, 8, 1);
  b.dec('bulletin', 14, 15, 4, 1, look('2학년 게시판. "기말고사 D-23"'));
  b.dec('extinguisher', 48, 15);
  b.obj('trophycase', 51, 16, 4, 1, look('복도 전시장. 체육대회 트로피와 졸업생 기증 기념품들.'));
  b.obj('plant', 61, 16);

  topClassroom(b, '2학년 1반', 2);
  topClassroom(b, '2학년 2반', 18);
  topClassroom(b, '2학년 3반', 34);
  topClassroom(b, '2학년 4반', 50, 12);
  bottomClassroom(b, '2학년 5반', 2, 12);

  // 2학년 6반 (지후네 반)
  bottomClassroom(b, '2학년 6반', 16, 12);
  b.objects.find(o => o.type === 'podium' && o.x === 20 && o.y === 22).text = ['교탁. 출석부 위에 "11/20 개교기념식 — 2학년은 합창"이라는 쪽지가 붙어 있다.'];
  Object.assign(b.objects.find(o => o.type === 'desk' && o.x === 21 && o.y === 26),
    look('내 자리. 책상 서랍에 구겨진 수학 학습지가 들어 있다.'));
  Object.assign(b.objects.find(o => o.type === 'desk' && o.x === 24 && o.y === 26),
    look('건우 자리. 책상 위에 "잠긴 교실 7대 미신"이라고 낙서돼 있다.', '…7개나 되나?'));

  // 잠긴 교실 — 지금은 '창고'. 1998년의 2학년 6반 교실
  b.room('창고', 40, 22, 14, 9, 'wood');
  b.carve(50, 20, 2, 2, 'door');
  b.obj('padlock', 50, 20, 2, 2, { script: 'lockedDoor', prompt: '살펴보기' });
  b.dec('blackboard', 41, 21, 6, 1, clue('칠판 구석의 221B',
    '칠판은 거의 다 지워져 있다.',
    '오른쪽 구석에만 유성 매직으로 쓴 글씨가 남아 있다. "221B"',
    '아무리 문질러도 안 지워진다. "칠판 글씨가 안 지워진다"는 미신… 이거였나.'));
  b.dec('chart', 47, 21, 2, 1, clue('기말고사 감독표',
    '벽에 붙은 표. "1998학년도 2학기 기말고사 감독 배정 — 2학년 6반"',
    '12월 14일부터 17일까지. 감독 칸 대부분에 같은 이름이 적혀 있다. "담임 문병철"',
    '…문병철? 어디서 들어 본 이름인데.'));
  b.dec('calendar', 49, 21, 1, 1, clue('1998년 달력',
    '벽에 걸린 달력. "1998년 12월"',
    '18일에 빨간 동그라미. 그 옆에 볼펜 글씨. "J 마지막 날"',
    '그 뒤로는 한 장도 넘겨지지 않았다.'));
  b.dec('dustyWindow', 52, 20, 2, 2, { script: 'roomWindow', prompt: '창문으로 나가기' });
  b.obj('stackdesk', 41, 23, 2, 1);
  b.obj('stackdesk', 44, 23, 2, 1);
  b.obj('stackdesk', 51, 27, 2, 1);
  b.obj('desk', 47, 25, 1, 2, clue('책상의 J & J',
    '먼지 쌓인 책상. 상판에 칼로 새긴 글자가 있다.',
    '"J & J — 221B 영원히"',
    'J랑 J… 누구 이니셜이지?'));
  b.obj('desk', 44, 26, 1, 2);
  b.obj('desk', 41, 27, 1, 2);
  b.obj('boxes', 52, 23);
  b.obj('boxes', 53, 23);
  b.obj('boxes', 40, 30);
  b.obj('oldlocker', 43, 30, 6, 1, { script: 'album', prompt: '사물함 열기' });
  b.obj('boxes', 52, 30);

  // 화장실 — 창문 밖 난간이 창고 창문까지 이어진다
  b.room('화장실', 56, 22, 6, 9, 'lab');
  b.carve(58, 20, 2, 2, 'door');
  b.dec('window', 60, 20, 2, 2, { script: 'toiletWindow', prompt: '창문 살펴보기' });
  b.obj('stall', 56, 22, 2, 2);
  b.obj('stall', 56, 25, 2, 2);
  b.obj('sink', 60, 28, 2, 1);

  return finishFloor(b);
}

// ── 3층 ───────────────────────────────────────

function build3F() {
  const b = createFloor(3, 66, 34);
  core(b, { roof: true, down: true });

  b.obj('lockers', 3, 16, 8, 1);
  b.obj('lockers', 19, 16, 8, 1);
  b.obj('lockers', 35, 16, 8, 1);
  b.dec('bulletin', 14, 15, 4, 1);
  b.dec('extinguisher', 48, 15);
  b.dec('clock', 51, 15);
  b.obj('plant', 61, 16);

  topClassroom(b, '3학년 1반', 2);
  topClassroom(b, '3학년 2반', 18);
  topClassroom(b, '3학년 3반', 34);
  topClassroom(b, '3학년 4반', 50, 12);
  bottomClassroom(b, '3학년 5반', 2, 12);

  // 진로상담실
  b.room('진로상담실', 18, 22, 10, 9, 'carpet');
  b.carve(24, 20, 2, 2, 'door');
  b.obj('tdesk', 20, 25, 2, 2);
  b.obj('bookshelf', 18, 22, 4, 1, look('대학 안내 책자가 빼곡하다.'));

  // 도서관
  b.room('도서관', 40, 22, 22, 9, 'carpet');
  b.carve(42, 20, 2, 2, 'door');
  b.dec('bulletin', 46, 21, 4, 1, look('"이달의 추천 도서 — 셜록 홈즈의 모험"'));
  b.dec('clock', 52, 21);
  for (const tx of [45, 50, 55]) {
    b.obj('bookshelf', tx, 24, 4, 1);
    b.obj('bookshelf', tx, 27, 4, 1);
  }
  b.obj('plant', 61, 22);

  return finishFloor(b);
}

// ── 벽 생성 · 충돌 · 조사 ─────────────────────

function finishFloor(b) {
  const { W, H, tiles, regions, deco, objects, warps } = b;
  const inside = (x, y) => x >= 0 && y >= 0 && x < W && y < H;
  const isFloor = (x, y) => inside(x, y) && tiles[y][x] !== null && tiles[y][x] !== 'wall';
  const isIndoor = (x, y) => isFloor(x, y) && !OUTDOOR.has(tiles[y][x]);
  const isOutdoor = (x, y) => isFloor(x, y) && OUTDOOR.has(tiles[y][x]);

  // 실내 바닥을 둘러싸는 벽
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (tiles[y][x] !== null) continue;
      let near = false;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) near ||= isIndoor(x + dx, y + dy);
      if (near) tiles[y][x] = 'wall';
    }
  }
  // 바닥 위쪽 벽은 한 칸 더 높여서 벽면이 보이게
  for (let y = 1; y < H; y++) {
    for (let x = 0; x < W; x++) {
      if (tiles[y][x] === 'wall' && isIndoor(x, y + 1) && tiles[y - 1][x] === null) tiles[y - 1][x] = 'wall';
    }
  }

  // 그릴 모양
  const isWallAt = (x, y) => inside(x, y) && tiles[y][x] === 'wall';
  const kinds = tiles.map((row, y) => row.map((t, x) => {
    if (t !== 'wall') return t;
    if (isOutdoor(x, y + 1)) return 'facadeLower';
    if (isFloor(x, y + 1)) return 'faceLower';
    if (isWallAt(x, y + 1) && isOutdoor(x, y + 2)) return 'facadeUpper';
    const aboveEmpty = !inside(x, y - 1) || tiles[y - 1][x] === null;
    if (isWallAt(x, y + 1) && isIndoor(x, y + 2) && aboveEmpty) return 'faceUpper';
    return 'wallTop';
  }));

  // 충돌
  const solid = tiles.map(row => row.map(t => t === null || t === 'wall'));
  for (const o of objects) {
    for (let yy = o.y; yy < o.y + o.h; yy++) for (let xx = o.x; xx < o.x + o.w; xx++) solid[yy][xx] = true;
  }

  const covers = (r, x, y) => x >= r.x && x < r.x + r.w && y >= r.y && y < r.y + r.h;

  return {
    n: b.n,
    label: b.label,
    style: b.style,
    scenery: b.scenery,
    night: b.night,
    lights: b.lights,
    w: W,
    h: H,
    kinds,
    regions,
    deco,
    objects,
    isFloor,
    isSolid: (x, y) => !inside(x, y) || solid[y][x],
    regionAt: (x, y) => regions.find(r => covers(r, x, y)) || null,
    warpAt: (x, y) => warps.find(r => covers(r, x, y)) || null,
    // 조사(F)할 수 있는 것: 대사가 있는 사물·장식, 엘리베이터, 말 걸 수 있는 사람(script)
    examinables: [...objects, ...deco].filter(r => r.text || r.elevator || r.script),
  };
}

// ── 지후네 집 ─────────────────────────────────

function buildHome() {
  const b = createFloor('home', 34, 24, { label: '집', style: 'home' });

  // 내 방
  b.room('내 방', 2, 4, 10, 8, 'wood');
  b.obj('bed', 2, 4, 2, 3);
  b.dec('poster', 5, 2, 2, 2, look('별자리 포스터. 어릴 때 아빠가 붙여 준 거다.'));
  b.dec('window', 8, 2, 2, 2);
  b.obj('tdesk', 8, 4, 2, 2, { script: 'myDesk', prompt: '조사하기' });   // 2장 화요일 밤: 동창 밴드
  b.obj('wardrobe', 10, 4, 2, 1);
  b.obj('bookshelf', 2, 10, 3, 1, look('만화책 사이에 낡은 추리소설이 한 권 끼어 있다.', '"셜록 홈즈 전집 1 — 주홍색 연구". 아빠 책이다.', '첫 장에 볼펜 글씨. "준호에게 — 생일 축하한다. J"'));
  b.obj('plant', 11, 11);
  b.carve(12, 9, 2, 2, 'door');

  // 거실 + 부엌
  b.room('거실', 14, 4, 16, 12, 'wood');
  b.carve(24, 4, 6, 4, 'lab');
  b.regions.unshift({ name: '부엌', x: 24, y: 4, w: 6, h: 4 });
  b.obj('tv', 15, 4, 3, 1);
  b.obj('sofa', 15, 8, 4, 1);
  b.dec('window', 20, 2, 2, 2);
  b.dec('clock', 23, 2, 1, 2, { script: 'homeClock', prompt: '조사하기' });
  b.dec('window', 25, 2, 2, 2);
  b.obj('counter', 24, 4, 4, 1);
  b.obj('fridge', 28, 4, 2, 1);
  b.obj('npc', 21, 6, 1, 1, { who: 'dad', dir: 'down', script: 'dad' });
  b.obj('dining', 20, 7, 3, 2);
  b.obj('sideboard', 25, 13, 3, 1, {
    ...clue('아빠의 졸업앨범',
      '장식장에 두꺼운 앨범이 꽂혀 있다. "동산고등학교 제28회 졸업앨범 — 2000"',
      '아빠네 반 페이지. 3학년 2반 서준호. 지금이랑 똑같이 생겼다.',
      '…이상하다. 다른 사람들은 친구랑 찍은 사진이 많은데, 아빠는 전부 혼자 찍혀 있다.'),
    flag: 'sawAlbum',
  });
  b.obj('bag', 29, 14, 1, 1, look('아빠의 검은 가방. 회사 서류가 들어 있겠지.'));
  b.obj('plant', 14, 15);

  // 현관 (아래로 나가면 등교)
  b.carve(19, 16, 2, 2, 'door');
  b.room('현관', 17, 18, 6, 3, 'hall');
  b.obj('shoelocker', 17, 18, 2, 1);
  b.dec('mat', 18, 19, 4, 2);
  b.carve(19, 21, 2, 1, 'door');
  b.warps.push({ x: 19, y: 21, w: 2, h: 1, script: 'leaveHome' });

  return finishFloor(b);
}

// ── 등굣길 버스 (창밖 풍경이 흘러간다) ────────────

function buildBus() {
  const b = createFloor('bus', 32, 12, { label: '버스', style: 'bus', scenery: 2 });
  b.room('버스', 2, 4, 28, 5, 'busfloor');
  for (let wx = 3; wx < 28; wx += 4) b.dec('busWindow', wx, 2, 3, 2);

  // 승객은 좌석보다 먼저 넣어야 좌석이 하반신을 가려서 앉은 것처럼 보인다
  const seat = (x, y, who) => {
    if (who) b.obj('npc', x, y, 1, 1, { who, dir: 'right' });
    b.obj('busseat', x, y);
  };
  for (const [x, who] of [[3], [5, 'student2'], [7], [9, 'student1'], [11], [13], [15], [17, 'student3'], [19], [21], [23]]) seat(x, 4, who);
  for (const [x, who] of [[4], [6], [8, 'student1'], [10], [16], [18], [20, 'student2'], [22]]) seat(x, 8, who);
  b.obj('buspole', 12, 6);
  b.obj('buspole', 24, 6);
  b.obj('npc', 28, 6, 1, 1, { who: 'driver', dir: 'right' });

  return finishFloor(b);
}

function buildWorld() {
  return { home: buildHome(), bus: buildBus(), 1: build1F(), 2: build2F(), 3: build3F() };
}

// 바닥·벽·장식을 한 장의 큰 캔버스에 미리 그려둔다
function renderFloor(floor) {
  const c = makeCanvas(floor.w * TILE, floor.h * TILE);
  const g = c.getContext('2d');
  const kindAt = (x, y) => (floor.kinds[y] && floor.kinds[y][x]) || null;
  const WALLS = new Set(['wallTop', 'faceUpper', 'faceLower', 'facadeUpper', 'facadeLower']);
  const isWall = k => WALLS.has(k);

  for (let y = 0; y < floor.h; y++) {
    for (let x = 0; x < floor.w; x++) {
      const k = kindAt(x, y);
      if (!k) continue;
      const px = x * TILE, py = y * TILE;
      // 장소마다 벽 모양이 다르다 (faceLower → faceLowerHome 등)
      const styled = floor.style && TILE_ART[k + floor.style[0].toUpperCase() + floor.style.slice(1)];
      (styled || TILE_ART[k])(g, px, py, x, y);

      if (k === 'wallTop') {
        // 바닥과 맞닿은 가장자리에 옅은 테두리
        if (floor.isFloor(x - 1, y)) rect(g, px, py, 1, 16, '#4b4058');
        if (floor.isFloor(x + 1, y)) rect(g, px + 15, py, 1, 16, '#4b4058');
        if (floor.isFloor(x, y - 1)) rect(g, px, py, 16, 1, '#4b4058');
      } else if (!isWall(k)) {
        // 벽 아래·옆 바닥에 그림자
        if (isWall(kindAt(x, y - 1))) rect(g, px, py, 16, 3, 'rgba(0,0,0,0.18)');
        if (isWall(kindAt(x - 1, y))) rect(g, px, py, 2, 16, 'rgba(0,0,0,0.12)');
      }
    }
  }

  for (const d of floor.deco) {
    DECO_ART[d.type](g, d.x * TILE, d.y * TILE, d.w * TILE, d.h * TILE, d);
  }
  return c;
}
