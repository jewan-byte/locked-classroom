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

// ── 공통 뼈대 (실제 학교 배치도대로) ─────────────
// 한 층 = 위쪽 줄 교실 11칸(한 칸 = 10타일, 방 너비 8) · 복도(y16~19) · 아래쪽 방들
// 칸 번호 i → x = 2 + 10i.  0~3: 1~4반, 4: 특별실, 5: 연구실, 6: 계단, 7: 특별실, 8~10: 5~7반

const ELEVATOR_ARRIVE = { x: 33, y: 16, dir: 'down' };   // (엘리베이터 없음 — 옛 엔진 호환용)
const SLOT = i => 2 + i * 10;

// 위쪽 줄 방 (문은 아래 벽 가운데)
function northRoom(b, name, x0, w = 8, type = 'wood') {
  b.room(name, x0, 4, w, 10, type);
  b.carve(x0 + (w >> 1) - 1, 14, 2, 2, 'door');
}
// 위쪽 줄 교실: 칠판, 교탁, 책상 6개
function northClass(b, name, x0) {
  northRoom(b, name, x0);
  b.dec('blackboard', x0 + 1, 2, 6, 2);
  b.obj('podium', x0 + 3, 5, 2, 1);
  for (const cx of [2, 5]) for (const cy of [7, 9, 11]) b.obj('desk', x0 + cx, cy, 1, 2);
}
// 아래쪽 방 (문은 위 벽, doorX 에서 2칸)
function southRoom(b, name, x0, y0, w, h, type, doorX) {
  b.room(name, x0, y0, w, h, type);
  b.carve(doorX, y0 - 2, 2, 2, 'door');
}

// 계단 (6번 칸): 왼쪽 절반 올라가는 계단, 오른쪽 절반 내려가는 계단
function stairs(b, { up, down, roof }) {
  const n = b.n;
  b.room('계단', 62, 4, 8, 10, 'hall');
  b.carve(63, 14, 6, 2, 'hall');
  b.dec('window', 63, 2, 2, 2);
  b.dec('window', 67, 2, 2, 2);
  if (up || roof) {
    b.carve(62, 4, 4, 6, 'stairs');
    b.dec('arrowUp', 63, 10, 2, 1);
  }
  if (up) b.warp(62, 4, 4, 2, { floor: n + 1, x: 67.5, y: 12, dir: 'down' });
  if (roof) b.obj('chain', 62, 9, 4, 1, look('쇠사슬로 막혀 있다. "옥상 출입 금지"'));
  if (down) {
    b.carve(66, 4, 4, 6, 'stairsDown');
    b.dec('arrowDown', 67, 10, 2, 1);
    b.warp(66, 4, 4, 2, { floor: n - 1, x: 63.5, y: 12, dir: 'down' });
  } else {
    b.obj('plant', 68, 4);
  }
}

// 복도 + 교실 앞 사물함 (문 앞은 비운다)
function hallway(b) {
  b.room(`${b.n}층 복도`, 2, 16, 108, 4, 'hall');
  for (const i of [0, 1, 2, 3, 8, 9, 10]) b.obj('lockers', SLOT(i), 16, 3, 1);
  b.obj('plant', 2, 19);
  b.obj('plant', 109, 19);
}

// ── 1층 (+ 앞마당, 운동장, 체육관) ─────────────

function build1F() {
  const b = createFloor(1, 114, 81);
  hallway(b);
  stairs(b, { up: true });

  // 위쪽 줄
  for (const [i, name] of [[0, '1-1'], [1, '1-2'], [2, '1-3'], [3, '1-4'], [8, '1-5'], [9, '1-6'], [10, '1-7']]) northClass(b, name, SLOT(i));
  northRoom(b, '여교사 휴게실', 42, 3, 'carpet');
  b.obj('sofa', 42, 4, 3, 1);
  northRoom(b, 'Wee 클래스', 46, 4, 'carpet');
  b.obj('sofa', 46, 4, 3, 1);
  b.obj('plant', 49, 12);
  // 제1연구실 (선생님들 자리 — 이수아 선생님, 교감 선생님)
  northRoom(b, '제1연구실', 52);
  b.dec('whiteboard', 53, 3, 6, 1);
  for (const [tx, ty] of [[53, 6], [57, 6], [53, 10], [57, 10]]) b.obj('tdesk', tx, ty, 2, 2);
  b.obj('cabinet', 52, 4, 1, 1, look('서류함. "학생 생활 기록 — 열람 시 교감 결재"'));
  b.obj('plant', 59, 4);
  b.warps.push({ x: 52, y: 4, w: 8, h: 10, script: 'office3' });   // 3장 (story.js)
  northRoom(b, '협의실', 72, 3, 'carpet');
  b.obj('table', 72, 7, 3, 2);
  northRoom(b, '학습자료실', 76, 4, 'carpet');
  b.obj('bookshelf', 76, 4, 4, 1, look('수업 자료 상자가 빼곡하다.'));

  b.dec('bulletin', 57, 15, 3, 1, clue('개교기념식 안내',
    '게시판. "개교 52주년 기념식 — 11월 20일(금) 오전 10시, 체육관"',
    '그 아래 작은 글씨. "동문회장 고형석 님(2000년 졸업) 감사패 전달"'));
  b.dec('bulletin', 12, 15, 3, 1, look('동아리 홍보 포스터. 밴드부, 로봇부, 방송부…', '추리 동아리 같은 건 없다.'));
  b.obj('fountain', 70, 16);

  // 복도 남쪽의 작은 방들 (y22~26)
  southRoom(b, '여직원 화장실', 14, 22, 6, 5, 'lab', 16);
  southRoom(b, '남직원 화장실', 21, 22, 6, 5, 'lab', 23);
  southRoom(b, '자료실', 28, 22, 4, 5, 'carpet', 29);
  b.obj('bookshelf', 28, 22, 4, 1, { script: 'reportShelf', prompt: '조사하기' });   // 없어진 동아리 보고서 철 (2장: 221B)
  b.obj('boxes', 31, 26);
  southRoom(b, '협의회실', 33, 22, 13, 5, 'carpet', 38);
  b.obj('table', 36, 23, 6, 2);
  southRoom(b, '화장실', 92, 22, 8, 5, 'lab', 94);
  b.obj('stall', 92, 22, 2, 2);
  b.obj('sink', 97, 25, 2, 1);

  // 작은 방들 사이로 이어지는 넓은 복도 + 아래쪽 복도 (y29~32)
  b.carve(2, 20, 10, 9, 'hall');
  b.carve(48, 20, 42, 9, 'hall');
  b.carve(102, 20, 8, 9, 'hall');
  b.room('1층 복도', 2, 29, 108, 4, 'hall');
  b.regions.push({ name: '1층 복도', x: 2, y: 20, w: 108, h: 9 });

  // 아래쪽 줄 (y35~43)
  southRoom(b, '과학실', 2, 35, 8, 9, 'lab', 4);
  b.obj('labtable', 3, 37, 3, 2);
  b.obj('labtable', 3, 41, 3, 2);
  b.dec('blackboard', 3, 34, 5, 1, look('칠판. "다음 시간: 산화와 환원"'));
  southRoom(b, '과학실험실', 12, 35, 8, 9, 'lab', 14);
  b.obj('labtable', 13, 38, 3, 2);
  b.obj('shelf', 17, 35, 3, 1);
  southRoom(b, '과학준비실', 22, 35, 6, 9, 'lab', 23);
  b.obj('shelf', 22, 35, 3, 1);
  b.obj('boxes', 26, 42);
  southRoom(b, '교장실', 30, 35, 8, 9, 'carpet', 32);
  b.obj('tdesk', 33, 37, 2, 2, look('교장 선생님 책상. 명패와 결재 서류.'));
  b.obj('sofa', 31, 41, 4, 1);
  // 행정실 (열쇠함)
  southRoom(b, '행정실', 40, 35, 12, 9, 'carpet', 46);
  b.dec('whiteboard', 41, 34, 4, 1, look('"이번 주 일정 — 금: 개교기념식 (내빈 접대 준비)"'));
  b.obj('cabinet', 40, 35, 2, 1, { script: 'keyBox', prompt: '열쇠함 보기' });
  b.obj('tdesk', 43, 38, 2, 2);
  b.obj('tdesk', 47, 38, 2, 2);
  b.obj('bookshelf', 41, 42, 4, 1, look('학교 서류철이 빼곡하다. "시설 관리 대장", "교실 배치도"…'));
  // 중앙현관 (아래로 나가면 앞마당)
  b.room('중앙현관', 54, 35, 12, 9, 'hall');
  b.carve(54, 33, 12, 2, 'hall');
  b.obj('shoelocker', 54, 37, 4, 1);
  b.obj('shoelocker', 62, 37, 4, 1);
  b.obj('shoelocker', 54, 40, 4, 1);
  b.obj('shoelocker', 62, 40, 4, 1);
  b.dec('mat', 58, 42, 4, 2);
  // 방송실 (2장: 옛 사연 테이프)
  southRoom(b, '방송실', 68, 35, 8, 9, 'carpet', 70);
  b.obj('speaker', 68, 35);
  b.obj('speaker', 75, 35);
  b.obj('table', 70, 37, 4, 2, look('방송용 믹서. 버튼이 수십 개다.', '"점심 방송 — 사연 읽어드립니다 (월·수·금)"라는 이름표가 붙어 있다.'));
  b.obj('shelf', 68, 42, 3, 1, look('CD와 USB가 가지런히 꽂힌 선반.'));
  b.obj('cabinet', 73, 42, 2, 1, { script: 'broadcastCabinet', prompt: '조사하기' });   // 방송부 자료 — 1990년대
  b.warps.push({ x: 68, y: 35, w: 8, h: 9, script: 'broadcastRoom' });   // 2장 수요일 (story.js)
  southRoom(b, '수학탐구실', 78, 35, 14, 9, 'wood', 80);
  b.obj('table', 81, 38, 4, 2);
  b.obj('table', 86, 38, 4, 2);
  southRoom(b, '학생자치실', 94, 35, 16, 9, 'carpet', 96);
  b.obj('table', 98, 38, 8, 2, look('학생회 회의 탁자. "기념식 합창 순서표"가 놓여 있다.'));

  // 건물 남쪽 외벽 + 현관 출입구
  b.carve(1, 44, 110, 3, 'wall');
  b.carve(58, 44, 4, 3, 'hall');
  b.warps.push({ x: 58, y: 45, w: 4, h: 2, script: 'schoolExit' });
  b.dec('plaque', 57, 44, 6, 1);
  for (let wx = 3; wx < 108; wx += 5) if (wx < 55 || wx > 63) b.dec('facadeWindow', wx, 45, 2, 2);

  // 앞마당
  b.room('앞마당', 1, 47, 110, 5, 'grass');
  b.carve(2, 47, 108, 2, 'path');
  b.carve(58, 49, 4, 3, 'path');
  b.obj('flagpole', 64, 49);
  for (const tx of [4, 14, 24, 34, 44, 74, 84, 94, 104]) b.obj('tree', tx, 50, 2, 1);
  b.obj('bench', 50, 50, 2, 1);
  b.obj('bench', 68, 50, 2, 1);

  // 운동장
  b.room('운동장', 1, 52, 78, 25, 'grass');
  b.carve(6, 53, 66, 20, 'dirt');
  b.dec('track', 6, 53, 66, 20);
  b.obj('goal', 7, 61, 1, 3);
  b.obj('goal', 70, 61, 1, 3).flip = true;
  b.obj('fence', 1, 52, 1, 25);
  b.obj('fence', 1, 76, 78, 1);
  b.obj('fence', 78, 52, 1, 21);   // 오른쪽 울타리는 체육관 가는 길(y73~75)만 비운다

  // 체육관 (개교기념식 무대)
  b.carve(78, 73, 8, 3, 'path');
  b.room('체육관', 86, 55, 26, 23, 'gym');
  b.carve(85, 73, 1, 3, 'door');
  b.dec('court', 88, 57, 22, 19);
  b.dec('scoreboard', 89, 53, 4, 2);
  b.dec('window', 94, 53, 2, 2);
  b.dec('window', 103, 53, 2, 2);
  b.dec('window', 107, 53, 2, 2);
  b.obj('hoop', 98, 55, 2, 1);
  b.obj('hoop', 98, 77, 2, 1);
  b.obj('ballcart', 110, 57);
  b.obj('gymmat', 110, 65, 2, 1);
  b.obj('gymmat', 110, 67, 2, 1);
  b.dec('banner', 96, 53, 6, 2, look('현수막. "개교 52주년 기념식 — 자랑스러운 동산인"'));
  b.obj('stage', 95, 57, 8, 2);
  b.obj('podium', 92, 59, 2, 1, { script: 'guestbook', prompt: '방명록 보기' });   // 기념식 방명록 (3장: 고형석의 글씨)
  b.obj('trophycase', 105, 58, 3, 1, look('기념식 때 쓸 감사패들이 진열돼 있다.', '맨 앞 감사패. "고형석 동문회장님 — 모교 발전 기금 5억 원"'));

  return finishFloor(b);
}

// ── 2층 (2학년 6반, 잠긴 창고) ─────────────────

function build2F() {
  const b = createFloor(2, 114, 34);
  hallway(b);
  stairs(b, { up: true, down: true });

  for (const [i, name] of [[0, '2-1'], [1, '2-2'], [2, '2-3'], [3, '2-4'], [8, '2-5'], [9, '2-6'], [10, '2-7']]) northClass(b, name, SLOT(i));
  northRoom(b, '진로진학실', 42, 8, 'carpet');
  b.obj('bookshelf', 42, 4, 4, 1, look('대학 안내 책자가 빼곡하다.'));
  b.obj('table', 45, 8, 3, 2);
  northRoom(b, '제2연구실', 52);
  for (const [tx, ty] of [[53, 6], [57, 6], [53, 10], [57, 10]]) b.obj('tdesk', tx, ty, 2, 2);
  northRoom(b, '컴퓨터실', 72, 8, 'lab');
  for (const ty of [6, 9, 12]) b.obj('table', 73, ty, 6, 1, ty === 6 ? look('컴퓨터가 줄지어 있다. 화면 보호기에 학교 로고가 떠다닌다.') : {});

  b.dec('bulletin', 12, 15, 3, 1, look('2학년 게시판. "기말고사 D-23"'));
  b.obj('trophycase', 72, 16, 3, 1, look('복도 전시장. 체육대회 트로피와 졸업생 기증 기념품들.'));

  // 2학년 6반 (지후네 반)
  const six = SLOT(9);
  b.objects.find(o => o.type === 'podium' && o.x === six + 3).text = ['교탁. 출석부 위에 "11/20 개교기념식 — 2학년은 합창"이라는 쪽지가 붙어 있다.'];
  Object.assign(b.objects.find(o => o.type === 'desk' && o.x === six + 2 && o.y === 11), look('내 자리. 책상 서랍에 구겨진 수학 학습지가 들어 있다.'));
  Object.assign(b.objects.find(o => o.type === 'desk' && o.x === six + 5 && o.y === 11), look('건우 자리. 책상 위에 "잠긴 교실 7대 미신"이라고 낙서돼 있다.', '…7개나 되나?'));

  // 전산실 (통제구역), 영어교과교실2
  southRoom(b, '전산실', 16, 22, 12, 9, 'lab', 20);
  b.obj('padlock', 20, 20, 2, 2, look('"전산실 — ※통제구역※ 관계자 외 출입 금지"'));
  southRoom(b, '영어교과교실2', 34, 22, 14, 9, 'wood', 38);
  b.dec('blackboard', 41, 21, 6, 1, look('칠판. "Today\'s expression — Long time no see."'));
  for (const cx of [36, 39, 42, 45]) for (const cy of [24, 27]) b.obj('desk', cx, cy, 1, 2);

  // 잠긴 교실 — 지금은 '창고'. 1998년의 2학년 6반 교실 (우리 반 바로 앞, 화장실 옆)
  b.room('창고', 78, 22, 12, 9, 'wood');
  b.carve(88, 20, 2, 2, 'door');
  b.obj('padlock', 88, 20, 2, 2, { script: 'lockedDoor', prompt: '살펴보기' });
  // 밖에서는 안이 안 보이게 어둡게 (안에 들어가야 보인다). 자물쇠 달린 문(88~89)은 빼고 위쪽 벽면까지
  b.regions.find(r => r.name === '창고').dark = [[78, 20, 10, 2], [78, 22, 12, 9]];
  b.dec('dustyWindow', 78, 20, 2, 2, { script: 'roomWindow', prompt: '창문으로 나가기' });
  b.dec('blackboard', 80, 21, 6, 1, clue('칠판 구석의 221B',
    '칠판은 거의 다 지워져 있다.',
    '오른쪽 구석에만 유성 매직으로 쓴 글씨가 남아 있다. "221B"',
    '아무리 문질러도 안 지워진다. "칠판 글씨가 안 지워진다"는 미신… 이거였나.'));
  b.dec('calendar', 86, 21, 1, 1, clue('1998년 달력',
    '벽에 걸린 달력. "1998년 12월"',
    '18일에 빨간 동그라미. 그 옆에 볼펜 글씨. "J 마지막 날"',
    '그 뒤로는 한 장도 넘겨지지 않았다.'));
  b.dec('chart', 87, 21, 1, 1, clue('기말고사 감독표',
    '벽에 붙은 표. "1998학년도 2학기 기말고사 감독 배정 — 2학년 6반"',
    '12월 14일부터 17일까지. 감독 칸 대부분에 같은 이름이 적혀 있다. "담임 문병철"',
    '…문병철? 어디서 들어 본 이름인데.'));
  b.obj('stackdesk', 80, 23, 2, 1);
  b.obj('stackdesk', 83, 23, 2, 1);
  b.obj('stackdesk', 87, 27, 2, 1);
  b.obj('desk', 85, 25, 1, 2, clue('책상의 J & J',
    '먼지 쌓인 책상. 상판에 칼로 새긴 글자가 있다.',
    '"J & J — 221B 영원히"',
    'J랑 J… 누구 이니셜이지?'));
  b.obj('desk', 82, 26, 1, 2);
  b.obj('desk', 80, 27, 1, 2);
  b.obj('boxes', 88, 23);
  b.obj('boxes', 89, 24);
  b.obj('boxes', 78, 30);
  b.obj('oldlocker', 81, 30, 6, 1, { script: 'album', prompt: '사물함 열기' });
  b.obj('boxes', 89, 30);

  // 화장실 — 창문 밖 난간이 창고 창문까지 이어진다
  southRoom(b, '화장실', 92, 22, 8, 9, 'lab', 94);
  b.dec('window', 98, 20, 2, 2, { script: 'toiletWindow', prompt: '창문 살펴보기' });
  b.obj('stall', 92, 22, 2, 2);
  b.obj('stall', 92, 25, 2, 2);
  b.obj('sink', 97, 28, 2, 1);

  return finishFloor(b);
}

// ── 3층 ───────────────────────────────────────

function build3F() {
  const b = createFloor(3, 114, 34);
  hallway(b);
  stairs(b, { roof: true, down: true });

  for (const [i, name] of [[0, '3-1'], [1, '3-2'], [2, '3-3'], [3, '3-4'], [8, '3-5'], [9, '3-6'], [10, '3-7']]) northClass(b, name, SLOT(i));
  northRoom(b, '미술실', 42, 8, 'wood');
  b.obj('easel', 43, 6, 2, 1, look('이젤 위에 그리다 만 정물화. 사과가 하나 빠져 있다.'));
  b.obj('table', 44, 9, 4, 2);
  northRoom(b, '제3연구실', 52);
  for (const [tx, ty] of [[53, 6], [57, 6], [53, 10], [57, 10]]) b.obj('tdesk', tx, ty, 2, 2);
  northRoom(b, '무한상상교실', 72, 8, 'carpet');
  b.obj('table', 73, 7, 3, 2, look('3D 프린터와 로봇 부품이 흩어져 있다.'));
  b.obj('table', 76, 10, 3, 2);
  b.dec('clock', 52, 15);

  // 3층 옥상 (야외교실)
  b.room('3층 옥상 (야외교실)', 14, 22, 24, 9, 'path');
  b.carve(24, 20, 4, 2, 'path');
  for (const bx of [17, 23, 29]) {
    b.obj('bench', bx, 25, 2, 1);
    b.obj('bench', bx, 28, 2, 1);
  }
  b.obj('plant', 14, 22);
  b.obj('plant', 37, 22);
  b.obj('plant', 14, 30);
  b.obj('plant', 37, 30);

  // 화장실
  southRoom(b, '화장실', 92, 22, 8, 9, 'lab', 94);
  b.obj('stall', 92, 22, 2, 2);
  b.obj('stall', 92, 25, 2, 2);
  b.obj('sink', 97, 28, 2, 1);

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
  b.obj('bag', 29, 14, 1, 1, { script: 'dadBag', prompt: '조사하기' });   // 3장 목요일 밤: 아빠의 일기
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

// 1998년 기억 속 층에서 쓰는 옛 교실 모양 (14칸)
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

// ── 1998년 2층 (기억 속): 지금의 창고가 아직 2학년 6반이던 때 ──
function buildPast2F() {
  const b = createFloor('p2', 66, 34, { label: '1998년 · 2층' });
  b.room('2층 복도', 2, 16, 60, 4, 'hall');
  b.obj('lockers', 3, 16, 8, 1);
  b.obj('lockers', 19, 16, 8, 1);
  b.obj('lockers', 35, 16, 8, 1, look('철제 사물함. 누군가 발로 찬 자국이 움푹 패어 있다.'));
  b.dec('bulletin', 14, 15, 4, 1, look('"기말고사 기간 — 복도에서 떠들지 말 것"'));
  b.dec('bulletin', 48, 15, 4, 1, look('"제12회 동산 독서 퀴즈 — 1등 2학년 6반 이수아"'));
  b.obj('plant', 61, 16);
  b.obj('plant', 2, 16);
  topClassroom(b, '2학년 1반', 2);
  topClassroom(b, '2학년 2반', 18);
  topClassroom(b, '2학년 3반', 34);
  topClassroom(b, '2학년 4반', 50, 12);

  // 2학년 6반 (1998)
  b.room('2학년 6반', 40, 22, 14, 9, 'wood');
  b.carve(50, 20, 2, 2, 'door');
  b.dec('blackboard', 41, 21, 6, 1, look('칠판. "2학기 기말고사 둘째 날 — 2교시 국어, 3교시 수학"', '오른쪽 구석에 작게, 유성 매직으로. "221B"'));
  b.dec('chart', 47, 21, 2, 1, look('감독 배정표. 2교시도 3교시도 "담임 문병철".'));
  b.dec('calendar', 49, 21, 1, 1, look('1998년 12월 달력. 아직 아무 표시도 없다.'));
  // 이수아의 기억: 복도로 나서면 고형석 패거리 (story.js 의 suahHall)
  b.warps.push({ x: 2, y: 16, w: 60, h: 4, script: 'suahHall', once: 'shHall' });
  b.dec('window', 52, 20, 2, 2);
  b.obj('podium', 46, 22, 2, 1);
  for (const cx of [41, 43, 45, 47, 49, 51]) {
    for (const cy of [23, 25, 27]) {
      const d = b.obj('desk', cx, cy, 1, 2);
      if (cx === 45 && cy === 25) Object.assign(d, { script: 'suahDesk', prompt: '내 자리' });
    }
  }
  b.obj('oldlocker', 43, 30, 6, 1, look('반 사물함. 아직 번호표가 새것이다.'));
  return finishFloor(b);
}

function buildWorld() {
  return { home: buildHome(), bus: buildBus(), 1: build1F(), 2: build2F(), 3: build3F(), p2: buildPast2F() };
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
