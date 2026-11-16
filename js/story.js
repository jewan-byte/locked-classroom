'use strict';
// ─────────────────────────────────────────────
// story.js — 「잠겨있던 교실」 이야기 진행
// 프롤로그: 집 → 버스 → 2학년 6반 (미신 수다, 내기)
// 1장 「잠긴 교실」: 방과 후 → 자물쇠 → 열쇠함 → 화장실 창문 → 창고 → 앨범 → 교감 → 저녁 집
//
// 대사는 '문자열'(서술) 또는 { who: '이름', text: '대사' }
// 스크립트는 async 함수라서 위에서 아래로 차례대로 읽으면 된다.
// 전체 설계: docs/스토리.md
// ─────────────────────────────────────────────

// 주인공: 서지후 (동산고 2학년 6반)
// 아빠: 서준호 — 동산고 2000년 졸업, 1998년 2학년 6반. 추리 동아리 「221B」의 '왓슨'
// 동행: 박건우 '돌쇠' — 내기 상대. 입이 가볍고 학교 커뮤니티 '동산 대숲' 단골
const ME = '지후';
const FRIEND = '돌쇠';

// 선택에 따라 쌓이는 숨은 값 — 플레이어에겐 보여 주지 않고 엔딩만 가른다
//   evidence: 밝혀낸 진실
//   rumor:    돌쇠가 대숲에 글을 올리려는 정도 (높으면 고형석이 먼저 움직인다)
//   heart:    아빠 / 이수아 선생님 / 정재민(홈즈)이 지후를 믿는 정도
const route = { evidence: 0, rumor: 0, heart: { dad: 0, suah: 0, jaemin: 0 } };
const addEvidence = n => { route.evidence += n; };
const addRumor = n => { route.rumor += n; };
const addHeart = (who, n) => { route.heart[who] += n; };

// 이야기 진행 상태 (조사·대화로 바뀐다)
const flags = {};
function resetFlags() {
  Object.assign(route, { evidence: 0, rumor: 0, heart: { dad: 0, suah: 0, jaemin: 0 } });
  for (const k of Object.keys(flags)) delete flags[k];
  Object.assign(flags, {
    // 프롤로그 (월요일 아침)
    talkedDad: false,    // 아침 먹으며 아빠와 얘기함
    calledBack: false,   // 밥 안 먹고 나가려다 아빠한테 불려옴
    sawAlbum: false,     // 장식장의 아빠 졸업앨범을 봄
    askedAlbum: false,   // 아빠에게 앨범에 대해 물어봄
    pushedDad: false,    // 앨범 얘기를 캐물음
    dadStory: false,     // 아빠가 고등학교 때 얘기를 조금 해 줌 ("친구랑 추리소설")
    betLost: false,      // 돌쇠와의 내기에서 짐 (교실 장면 끝)
    // 1장 (월요일 방과 후)
    afterSchool: false,  // 방과 후, 돌쇠와 함께
    friendJoined: false, // 돌쇠가 따라다님 (Q)
    triedDoor: false,    // 창고 자물쇠를 봄
    checkedKeys: false,  // 행정실 열쇠함: 창고 열쇠는 교감 보관
    inRoom: false,       // 화장실 창문 → 난간 → 창고 안
    foundAlbum: false,   // 사물함에서 학급 앨범 (파인 사진, 아빠)
    tookAlbum: false,    // 앨범을 통째로 가져옴 (아니면 사진만 찍음)
    leftRoom: false,     // 창고에서 나옴
    rumorOk: false,      // 돌쇠에게 대숲 글을 허락함
    mondayEvening: false,// 월요일 저녁, 집
    toldDad: false,      // 아빠에게 사진을 보여 줌
    day1Done: false,     // 1장 끝
  });
  companion.visible = false;
  companion.following = false;
  actors.length = 0;
  ambient = null;
  setPlayerLook(null);
}

// 사물에 붙지 않고 이야기로 얻는 단서 (수첩에는 처음부터 ??? 로 보인다)
// story: true — 조사로는 못 얻는다. 돌쇠의 "여기 아직 안 본 게 있어" 힌트에서 뺀다
function storyClue(name, place, ...text) {
  const c = { name, text, place, found: false, story: true };
  CLUES.push(c);
  return c;
}
const ALBUM_CLUE = storyClue('파인 사진', '2층 · 창고',
  '1998년 2학년 6반 학급 앨범. 어깨동무한 두 남학생.',
  '왼쪽 학생의 얼굴은 칼로 네모나게 파였다. 이름 칸도 긁혔다.',
  '오른쪽에서 웃는 건 열일곱 살의 아빠, "서준호".');
const ROLL_CLUE = storyClue('빈칸 하나', '2층 · 창고',
  '앨범 맨 뒤의 반 명렬표. 서른여섯 명.',
  '"서준호" 바로 위 한 줄만 수정액으로 하얗게 지워져 있다.');

// 화면 색 (main.js 의 ambient)
const DUST = ['rgba(255,150,70,0.16)', 'rgba(30,20,12,0.38)'];   // 해 질 녘, 먼지 낀 창고

// ── 과학실 실험 화면을 빌려 쓰는 '추리 대결' (2장부터) ──
const EXPERIMENTS = {};

resetFlags();

// ── 스크립트에서 쓰는 도구 ──
// 이야기가 새로 시작되거나 건너뛰면(storyRun 이 바뀌면) say·wait 다음에서 STOP 을 던져 스크립트를 끊는다
const STOP = Symbol('stop');
const alive = run => { if (run !== storyRun) throw STOP; };
const say = (...pages) => { const run = storyRun; return openDialog(pages).then(() => alive(run)); };
// 선택지: 마지막 페이지에서 options 중 하나를 고르면 그 번호로 끝난다
const choose = (pages, options) => {
  const run = storyRun;
  return new Promise(r => openDialog(pages, { options, index: 0, onPick: r })).then(i => { alive(run); return i; });
};
const wait = sec => { const run = storyRun; return new Promise(r => setTimeout(r, sec * 1000)).then(() => alive(run)); };
const fadeAsync = action => new Promise(r => fadeTo(action, r));
const fadeInAsync = () => new Promise(r => fadeIn(r));
// 어두워진 채로 멈춘다 (장 제목 카드 등을 띄울 때)
const fadeBlack = () => new Promise(r => fadeTo(() => { fade.dir = 0; r(); }));

const HOME_START = { x: 5, y: 8, dir: 'down' };       // 침대 옆
const HOME_DOOR = { x: 20, y: 18.5, dir: 'up' };      // 집 현관 (저녁에 돌아오면)
const BUS_SEAT = { x: 13.5, y: 4.95, dir: 'up' };     // 창가 자리
const CLASS_SEAT = { x: 20, y: 30.4, dir: 'up' };     // 2학년 6반 뒷줄 통로
const ROOM_LAND = { x: 52.5, y: 24.4, dir: 'down' };  // 창고 창문 아래
const TOILET_BACK = { x: 60.5, y: 23.4, dir: 'down' };// 화장실 창문 아래

const hasClue = name => CLUES.some(c => c.name === name && c.found);
const giveClue = (c, msg = `새 단서: ${c.name}  (Tab)`) => {
  if (c.found) return;
  c.found = true;
  Toast.show(msg, clueImage(c.name));
};

// 방과 후: 노을, 돌쇠가 따라다닌다
function setupAfterSchool(where = 2, at = { x: 20, y: 30.4, dir: 'up' }) {
  ambient = DUSK;
  actors.length = 0;
  flags.friendJoined = true;
  companion.visible = true;
  companion.following = true;
  setFloor(where, at);
}

// 인물(돌쇠 또는 컷신용 NPC)을 (x, y)까지 sec초 동안 걷게 (타일 단위)
async function walkActor(a, x, y, sec) {
  const sx = a.x, sy = a.y, ex = x * TILE, ey = y * TILE;
  const animKey = a === player ? 'scriptAnim' : 'anim';
  a.dir = Math.abs(ex - sx) > Math.abs(ey - sy) ? (ex > sx ? 'right' : 'left') : (ey > sy ? 'down' : 'up');
  a.moving = true;
  a[animKey] = FRAME_TIME;
  const steps = Math.max(1, Math.round(sec * 60));
  try {
    for (let i = 1; i <= steps; i++) {
      a.x = sx + (ex - sx) * i / steps;
      a.y = sy + (ey - sy) * i / steps;
      a[animKey] += 1 / 60;
      await wait(1 / 60);
    }
  } finally {
    a.moving = false;
    a[animKey] = 0;
  }
}
const walkCompanion = (x, y, sec) => walkActor(companion, x, y, sec);

// 이야기가 새로 시작되거나 개발자 메뉴로 건너뛰면 번호가 바뀐다 → 진행 중이던 스크립트는 멈춘다
let storyRun = 0;

// 컷신: 실행 중엔 플레이어가 못 움직인다
async function runScript(name, arg) {
  if (cutscene) return;
  cutscene = true;
  const run = storyRun;
  try {
    await SCRIPTS[name](arg);
  } catch (e) {
    if (e !== STOP) throw e;
  } finally {
    if (run === storyRun) cutscene = false;
  }
}

// 왼쪽 위 "지금 하고 있는 일" — 할 일 한 줄 + 돌쇠가 어디 있는지
function statusLines() {
  const lines = [];
  const here = floor.map.n;
  let doing = null;
  if (flags.day1Done) doing = '2장 「사라진 얼굴」 — 만드는 중';
  else if (flags.mondayEvening) doing = flags.toldDad ? '…오늘은 이만 자자 (내 방 침대)' : '저녁 — 아빠한테 물어볼까';
  else if (flags.leftRoom) doing = '오늘은 집으로 (1층 현관)';
  else if (flags.foundAlbum) doing = '창고 창문으로 빠져나가기';
  else if (flags.inRoom) doing = '창고 안 둘러보기 — 인증샷 찍을 만한 것';
  else if (flags.checkedKeys) doing = '2층 화장실 창문 → 난간 → 창고';
  else if (flags.triedDoor) doing = '창고 열쇠 구하기 (1층 행정실 열쇠함?)';
  else if (flags.afterSchool) doing = '내기 벌칙 — 2층 잠긴 교실(창고)에 들어가기';
  else if (here === 'home') doing = flags.talkedDad ? '현관으로 나가는 중' : '등교 준비 중';
  else if (here === 'bus') doing = '학교 가는 중';
  if (doing) lines.push({ text: doing });
  if (companion.following) lines.push({ text: '돌쇠와 동행 중', key: 'Q', kind: 'friend' });
  return lines;
}

// 단서를 새로 찾을 때마다 (대사가 끝난 뒤)
function onClueFound() {}

// ── 타이틀 · 날짜 화면 ──
const titleEl = document.getElementById('title');
const chapterEl = document.getElementById('chapter');

// 아무 키나 (개발자 메뉴 키 ` 는 빼고), 패드에선 화면 터치
function waitAnyKey() {
  return new Promise(r => {
    const onKey = e => {
      if (e.code === 'Backquote') return;
      removeEventListener('keydown', onKey);
      removeEventListener('pointerdown', onKey);
      r();
    };
    addEventListener('keydown', onKey);
    addEventListener('pointerdown', onKey);
  });
}

async function showTitle() {
  titleEl.classList.add('show');
  await waitAnyKey();
  titleEl.classList.remove('show');
  await wait(0.6);
}

async function showChapter(text, sec) {
  chapterEl.textContent = text;
  chapterEl.classList.add('show');
  await wait(sec);
  chapterEl.classList.remove('show');
  await wait(0.8);
}

// ── 스크립트 ──
const SCRIPTS = {
  // ───────── 프롤로그: 월요일 아침 ─────────
  async wakeUp() {
    await showChapter('프롤로그\n내기', 2.2);
    await showChapter('2026년 11월 16일 월요일\n오전 7시 40분', 2.2);
    await fadeInAsync();
    await wait(0.4);
    await say(
      '삐비빅— 삐비빅—',
      '…알람 소리에 눈을 떴다.',
      '월요일이다. 부엌에서 달그락거리는 소리가 들린다.',
    );
  },

  // 아빠 (식탁)
  async dad() {
    if (flags.mondayEvening) return SCRIPTS.dadEvening();
    if (!flags.talkedDad) {
      flags.talkedDad = true;
      await say(flags.calledBack
        ? { who: '아빠', text: '아침 거르면 3교시부터 머리 안 돌아간다. 앉아.' }
        : { who: '아빠', text: '일어났어? 국 식는다, 얼른 앉아.' });
      await say(
        { who: ME, text: '잘 먹겠습니다.' },
        '김치찌개에 계란프라이. 아빠는 맞은편에서 휴대폰으로 뉴스를 넘긴다.',
        { who: '아빠', text: '기말고사 한 달도 안 남았지? 공부는 좀 하고 있고?' },
        { who: ME, text: '…하고 있어. 대충.' },
        { who: '아빠', text: '대충은. 아빠 때는 동산고 시험 엄청 빡셌어.' },
      );
      // 선택 (집 ①): 아빠의 학교 얘기 — 아빠의 마음
      const ask = await choose(['아빠가 "아빠 때"라는 말을 꺼내는 건 드문 일이다.'],
        ['"아빠 학교 다닐 때 얘기 해 줘."', '"…알았어, 할게."']) === 0;
      if (ask) {
        addHeart('dad', 1);
        flags.dadStory = true;
        await say(
          { who: ME, text: '아빠 학교 다닐 때 얘기 해 줘. 아빠도 동산고였잖아.' },
          { who: '아빠', text: '얘기랄 게 있나. 공부하고… 친구랑 맨날 추리소설 돌려 읽고.' },
          { who: ME, text: '친구? 아빠한테 고등학교 친구 있었어? 한 번도 못 봤는데.' },
          '아빠가 숟가락을 내려놓았다.',
          { who: '아빠', text: '…있었지. 옛날 얘기야. 얼른 먹어.' },
        );
      } else {
        await say({ who: ME, text: '…알았어, 할게.' }, { who: '아빠', text: '그래. 학생은 공부가 남는 거다.' });
      }
      if (flags.sawAlbum) await SCRIPTS.askAlbum();
    } else if (flags.sawAlbum && !flags.askedAlbum) {
      await SCRIPTS.askAlbum();
    } else {
      await say({ who: '아빠', text: '다 먹었으면 얼른 가. 버스 놓친다.' });
    }
  },

  // 아빠의 졸업앨범에 대해 묻기
  async askAlbum() {
    flags.askedAlbum = true;
    await say(
      { who: ME, text: '아빠, 장식장에 있는 졸업앨범 봤는데.' },
      { who: ME, text: '왜 아빠만 다 혼자 찍혀 있어? 친구랑 찍은 사진이 하나도 없던데.' },
      '휴대폰을 넘기던 아빠의 손가락이 멈췄다.',
      { who: '아빠', text: '……사진 찍는 거 싫어했어, 아빠가.' },
    );
    // 선택 (집 ②): 캐물을지, 넘어갈지 — 아빠의 마음
    const patient = await choose(['거짓말이다. 아빠는 가족사진 찍을 때마다 제일 신나 한다.'],
      ['"…그렇구나."', '"에이, 아빠 사진 찍는 거 좋아하잖아."']) === 0;
    flags.pushedDad = !patient;
    if (patient) {
      addHeart('dad', 1);
      await say({ who: ME, text: '…그렇구나.' }, { who: '아빠', text: '…버스 시간 다 됐다. 얼른 가.' });
    } else {
      await say(
        { who: ME, text: '에이, 아빠 사진 찍는 거 좋아하잖아. 맨날 가족사진 찍자고 하면서.' },
        { who: '아빠', text: '지후야.' },
        { who: '아빠', text: '…늦겠다.' },
        '아빠는 일어나서 빈 그릇을 싱크대로 가져갔다.',
      );
    }
  },

  // 집 거실 시계
  async homeClock() {
    if (flags.mondayEvening) await say('밤 9시 10분.');
    else await say('7시 52분.', '…버스 시간이 빠듯하다.');
  },

  // 현관으로 나가기 → 버스 → 교실
  async leaveHome() {
    if (flags.mondayEvening) {
      player.y -= 10;
      player.dir = 'up';
      await say('…이 시간에 나가 봐야 할 데는 없다.');
      return;
    }
    if (!flags.talkedDad) {
      player.y -= 10;
      player.dir = 'up';
      if (!flags.calledBack) {
        flags.calledBack = true;
        await say({ who: '아빠', text: '서지후! 아침은 먹고 가야지!' }, { who: ME, text: '아, 맞다…' });
      } else {
        await say({ who: '아빠', text: '밥은 먹고 가라니까.' });
      }
      return;
    }
    await say({ who: ME, text: '다녀오겠습니다!' }, { who: '아빠', text: '그래. 차 조심하고.' });
    await fadeAsync(() => setFloor('bus', BUS_SEAT));
    await wait(1.2);
    await say('버스 창밖으로 익숙한 동네가 흘러간다.');
    if (flags.askedAlbum) {
      await say('…혼자만 찍힌 졸업앨범.', flags.pushedDad ? '"지후야." 아빠 목소리가 이상하게 낮았다.' : '사진 찍는 걸 싫어했다니. 그럴 리가 없는데.');
    } else if (flags.dadStory) {
      await say('"친구랑 맨날 추리소설 돌려 읽고."', '아빠한테 그런 친구가 있었다니. 지금은 왜 한 번도 안 만나는 걸까.');
    } else {
      await say('기말고사까지 23일.', '…생각하지 말자.');
    }
    await wait(0.6);
    await say({ who: '안내 방송', text: '이번 정류장은 동산고등학교, 동산고등학교입니다.' });
    await fadeAsync(() => {
      setFloor(2, CLASS_SEAT);
      addActor('dolsoe', 23, 30.4, 'left', 2);
      addActor('eunbi', 21.5, 28.2, 'down', 2);
      addActor('student1', 18.5, 24.2, 'up', 2);
      addActor('student3', 25.5, 24.2, 'up', 2);
    });
    await SCRIPTS.classroom();
  },

  // 2학년 6반 — 미신 수다와 내기
  async classroom() {
    await wait(0.4);
    await say(
      '8시 10분, 2학년 6반. 조회 전이라 교실이 시끄럽다.',
      { who: FRIEND, text: '서지후! 너 그거 알아? 잠긴 교실 얘기.' },
      { who: ME, text: '…아침부터 또 그거야?' },
      '박건우. 다들 돌쇠라고 부른다. 힘은 장사인데 겁은 나보다 많다.',
      { who: FRIEND, text: '어제 대숲에 또 올라왔다니까? 밤에 그 교실에서 누가 중얼거리는 소리가 들렸대.' },
      { who: '은비', text: '그거 야자 끝난 3학년 선배들이 지어낸 거야.' },
      '최은비. 같은 반, 방송부. 미신 얘기만 나오면 팩트 체크를 한다.',
      { who: FRIEND, text: '아니거든? 잠긴 교실 7대 미신, 내가 정리했어. 들어 봐.' },
      { who: FRIEND, text: '하나, 밤마다 그 교실에서 말소리가 들린다.' },
      { who: FRIEND, text: '둘, 칠판 구석 글씨가 아무리 지워도 안 지워진다.' },
      { who: FRIEND, text: '셋, 그 안에 얼굴 파인 사진이 있는데, 그걸 본 사람은 전학 간다.' },
      { who: FRIEND, text: '넷, 문을 건드리면 교감 선생님이 나타난다.' },
      { who: ME, text: '…넷은 미신이 아니라 그냥 교감쌤이 부지런한 거잖아.' },
      { who: FRIEND, text: '다섯부터는 아직 못 정했어.' },
      { who: '은비', text: '그 교실, 원래는 진짜 교실이었대. 엄청 옛날에 무슨 일이 있어서 잠근 거래.' },
      { who: '은비', text: '방송부 선배가 그러는데, 그 뒤로 이십 몇 년째 한 번도 안 열었대.' },
      { who: FRIEND, text: '그러니까! 누가 들어가서 확인을 해 봐야 한다니까?' },
      { who: FRIEND, text: '…지후야. 우리 내기할래? 가위바위보. 진 사람이 방과 후에 들어가서 인증샷 찍어 오기.' },
    );
    const pick = await choose(['돌쇠가 주먹을 내민다.'], ['가위', '바위', '보']);
    const mine = ['가위', '바위', '보'][pick];
    const his = ['바위', '보', '가위'][pick];
    await say(
      { who: FRIEND, text: '가위, 바위— 보!' },
      `나는 ${mine}. 돌쇠는… 한 박자 늦게 ${his}.`,
      { who: ME, text: '야, 너 방금 늦게 냈잖아!' },
      { who: FRIEND, text: '안 늦었는데? 은비야, 늦었어?' },
      { who: '은비', text: '…나는 못 봤어.' },
      { who: FRIEND, text: '봐! 진 사람이 들어가는 거다. 오늘 방과 후!' },
      { who: ME, text: '…너도 같이 가. 망은 봐 줘야 할 거 아냐.' },
      { who: FRIEND, text: '어, 어? 나, 나는 밖에서… 아, 알았어. 같이 가 줄게.' },
    );
    flags.betLost = true;
    Sound.sfx('chime');
    await say('딩동댕동—', { who: '은비', text: '조회 시작한다. 둘 다 자리 앉아.' });
    await fadeBlack();
    actors.length = 0;
    await showChapter('1장\n잠긴 교실', 2.4);
    await showChapter('같은 날, 방과 후\n오후 4시 20분', 2.2);
    setupAfterSchool(2, { x: 20, y: 30.4, dir: 'up' });
    flags.afterSchool = true;
    await fadeInAsync();
    await say(
      '교실엔 우리 둘만 남았다. 창밖으로 해가 기울고 있다.',
      { who: FRIEND, text: '…진짜 가는 거야?' },
      { who: ME, text: '내기 하자고 한 사람이 누군데.' },
      { who: FRIEND, text: '그, 그렇지. 잠긴 교실은 이 층 끝, 화장실 옆이야. 지금은 "창고"라고 붙어 있어.' },
    );
  },

  // ───────── 1장: 잠긴 교실 ─────────

  // 창고 문의 자물쇠
  async lockedDoor() {
    if (!flags.afterSchool) {
      await say('문에 자물쇠가 채워져 있다. "창고 — 관계자 외 출입금지"');
      return;
    }
    if (flags.leftRoom) {
      await say('자물쇠는 아까 그대로 채워져 있다.', '…안에서 본 걸 생각하면 이 문이 다르게 보인다.');
      return;
    }
    if (flags.inRoom) {
      await say('안쪽에서 보니 문틈으로 쇠사슬이 보인다. 이쪽으로는 못 나간다.', '…나갈 때도 창문이다.');
      return;
    }
    const first = !flags.triedDoor;
    flags.triedDoor = true;
    Sound.sfx('lock');
    await say(
      '쇠사슬이 문고리를 두 바퀴 감고, 커다란 자물쇠가 채워져 있다.',
      '종이가 붙어 있다. "창고 — 관계자 외 출입금지. 열쇠는 교감 보관"',
      '자물쇠는 녹슬었는데 쇠사슬은 반짝인다. …누가 최근에 새로 감았다.',
    );
    if (first && !flags.checkedKeys) {
      await say(
        { who: FRIEND, text: '거 봐, 미신 넷. 문 건드렸으니까 이제 교감쌤 나타난다?' },
        { who: ME, text: '…열쇠가 어딘가 있겠지. 행정실 열쇠함에 학교 열쇠 다 있지 않아?' },
        { who: FRIEND, text: '1층 행정실. 지금 직원분들 퇴근 준비하실 시간이야.' },
      );
    }
  },

  // 1층 행정실 열쇠함
  async keyBox() {
    if (!flags.afterSchool || flags.leftRoom) {
      await say('벽에 붙은 열쇠함. 교실마다 열쇠가 걸려 있다.');
      return;
    }
    if (flags.checkedKeys) {
      await say('"2층 창고" 고리만 비어 있다. "교감 보관 — 무단 출입 시 징계"');
      return;
    }
    flags.checkedKeys = true;
    await say(
      '행정실 직원분들은 벌써 퇴근했다. 열쇠함 문이 살짝 열려 있다.',
      '"2-1", "2-2", "과학실", "방송실"… 고리마다 열쇠가 걸려 있다.',
      '"2층 창고" 고리만 비어 있다. 이름표에 볼펜 글씨.',
      '"교감 보관 — 무단 출입 시 징계"',
      { who: FRIEND, text: '…창고 열쇠를 교감쌤이 직접 갖고 다닌다고? 창고 열쇠를?' },
      { who: ME, text: '창고에 뭐가 있길래.' },
      { who: FRIEND, text: '…야, 그냥 포기할까? 매점 빵은 내가 살게.' },
      { who: ME, text: '…아니. 이제 진짜 궁금해졌어.' },
      { who: FRIEND, text: '아, 하나 있긴 해. 2층 화장실 창문 밖에 좁은 난간 있잖아.' },
      { who: FRIEND, text: '거기로 옆 교실… 그러니까 창고 창문까지 갈 수 있어. 1학년 때 형들이 거기로 담배 피우러 나갔대.' },
    );
  },

  // 2층 화장실 창문
  async toiletWindow() {
    if (!flags.afterSchool || flags.leftRoom) {
      await say('화장실 창문. 바깥에 좁은 콘크리트 난간이 있다.');
      return;
    }
    if (!flags.checkedKeys) {
      await say('창문 밖으로 좁은 난간이 보인다. 옆 교실 창문까지 이어져 있다.', '…설마 여기로?', { who: FRIEND, text: '열쇠부터 찾아보자. 난간은 진짜 최후의 수단이야.' });
      return;
    }
    const go = await choose(['창문 밖 난간. 한 뼘 반쯤 되는 폭이다. 2층이지만 아래를 보면 아찔하다.'], ['난간으로 나간다', '…조금만 더 생각한다']) === 0;
    if (!go) return;
    await say(
      '창틀에 올라서서 난간에 발을 내디뎠다. 벽에 등을 딱 붙였다.',
      { who: FRIEND, text: '아래 보지 마! 앞만 봐, 앞만!' },
      '한 발, 한 발. 바람이 교복 사이로 파고든다.',
      '창고 창문… 걸쇠가 녹슬어서 제대로 안 잠겨 있다.',
      '끼이익—',
    );
    flags.inRoom = true;
    await fadeAsync(() => {
      setFloor(2, ROOM_LAND);
      ambient = DUST;
    });
    await say(
      '…들어왔다.',
      '먼지 냄새. 오래된 나무 냄새. 해 질 녘 빛이 먼지 사이로 기울어 들어온다.',
      '창고라더니… 칠판도, 사물함도, 책상도 그대로다. 그냥 교실이다.',
      '시간이 멈춘 교실.',
      { who: FRIEND, text: '으아아… 나 진짜 들어왔어. 지후야, 사진만 빨리 찍고 나가자.' },
      { who: ME, text: '…잠깐만. 좀 둘러보고.' },
    );
  },

  // 창고 사물함 — 학급 앨범
  async album() {
    if (flags.foundAlbum) {
      await say(flags.tookAlbum ? '사물함은 비어 있다. 앨범은 가방 안에 있다.' : '사물함 안에 학급 앨범이 그대로 꽂혀 있다.', '파인 사진은… 다시 보고 싶지 않다.');
      return;
    }
    await say(
      '뒤쪽 사물함. 번호표가 누렇게 바랬다.',
      '다른 칸은 다 비었는데, 맨 끝 칸 하나만 문이 덜 닫혀 있다.',
      '안에 두꺼운 앨범이 한 권 꽂혀 있다.',
      '"1998 동산고 2학년 6반 — 우리들의 1년"',
      { who: FRIEND, text: '…1998년? 우리 태어나기도 전이잖아.' },
      '앨범을 펼쳤다. 소풍, 체육대회, 교실에서 장난치는 사진들.',
      '…그리고 한 장.',
      '쉬는 시간, 이 교실. 두 남학생이 책상에 앉아 어깨동무를 하고 있다.',
      '왼쪽 학생의 얼굴은… 칼로 네모나게 파여 나갔다.',
      { who: FRIEND, text: '야, 야, 야… 미신 셋. 얼굴 파인 사진. 진짜 있잖아…!' },
      '사진 밑 이름 칸도 날카로운 걸로 긁혀 있다.',
      '그리고 오른쪽에서 웃고 있는 학생은.',
      '……',
      { who: ME, text: '…아빠?' },
      { who: FRIEND, text: '뭐?' },
      { who: ME, text: '오른쪽. 우리 아빠야. 이름도… "서준호". 아빠 이름이야.' },
      { who: FRIEND, text: '너네 아빠가 이 반이었다고? 이 교실에?' },
    );
    giveClue(ALBUM_CLUE);
    await say(
      '앨범 맨 뒤에 반 명렬표가 있다. 서른여섯 명.',
      '"서준호" 바로 위, 한 줄만 수정액으로 하얗게 지워져 있다.',
    );
    giveClue(ROLL_CLUE);
    flags.foundAlbum = true;
    addEvidence(1);
    await SCRIPTS.gyogamComes();
  },

  // 교감 선생님이 문을 연다
  async gyogamComes() {
    await wait(0.6);
    Sound.sfx('step');
    await wait(0.5);
    Sound.sfx('step');
    await say('…저벅. 저벅.', '복도에서 발소리가 다가온다.', { who: FRIEND, text: '(…미, 미신 넷!)' });
    await fadeAsync(() => {
      player.x = 42.5 * TILE;
      player.y = 25.4 * TILE;
      player.dir = 'right';
      Object.assign(companion, { x: 41.4 * TILE, y: 25.4 * TILE, dir: 'right', floor: 2 });
      trail = [{ x: companion.x, y: companion.y }, { x: player.x, y: player.y }];
    });
    await say('쌓아 둔 책상 더미 뒤로 몸을 숨겼다.');
    Sound.sfx('lock');
    await wait(0.6);
    const g = addActor('gyogam', 50.5, 20.5, 'down', 2);
    await walkActor(g, 50.5, 24.5, 1.2);
    await say('회색 양복, 반쯤 벗어진 머리. 문병철 교감 선생님이다.');
    await walkActor(g, 46.5, 29.3, 1.6);
    g.dir = 'down';
    await wait(0.8);
    await say(
      '교감 선생님은 사물함 앞에 한참 서 있었다.',
      { who: '교감', text: '…….' },
      { who: '교감', text: '…아직 그대로군.' },
    );
    await wait(0.6);
    g.dir = 'up';
    await say('교감 선생님이 고개를 들어 칠판 쪽을 본다.', '바닥 먼지 위에… 우리 발자국이.');
    await wait(0.6);
    await say('지이잉— 교감 선생님의 휴대폰이 울렸다.', { who: '교감', text: '네, 회장님. …네, 금요일 기념식 준비는 다 됐습니다. 걱정 마십시오.' });
    await walkActor(g, 50.5, 24.5, 1.4);
    await walkActor(g, 50.5, 20.5, 1);
    removeActor(g);
    Sound.sfx('lock');
    await say(
      '철컥. 자물쇠 채우는 소리.',
      { who: FRIEND, text: '……나, 나 숨 쉬어도 돼?' },
      { who: ME, text: '…"아직 그대로군." 그게 무슨 뜻이지.' },
      { who: FRIEND, text: '몰라! 그리고 "회장님"은 또 누구야. 지후야, 나가자, 제발.' },
    );
    // 선택 (1장 끝): 앨범을 가져갈지 — 증거
    const take = await choose(['손에 든 앨범이 무겁다.'], ['앨범을 통째로 가져간다', '파인 사진만 휴대폰으로 찍어 둔다']) === 0;
    flags.tookAlbum = take;
    if (take) {
      addEvidence(1);
      await say(
        '앨범을 가방에 넣었다.',
        { who: FRIEND, text: '그거 가져가도 돼? 교감쌤이 "아직 그대로"인지 확인하러 왔었잖아…' },
        { who: ME, text: '…그러니까 가져가는 거야. 아빠한테 물어봐야겠어.' },
      );
    } else {
      await say(
        '찰칵. 파인 사진과 명렬표를 휴대폰으로 찍고, 앨범은 제자리에 꽂아 두었다.',
        { who: FRIEND, text: '잘했어. 없어진 거 알면 큰일 나.' },
      );
    }
    await say({ who: FRIEND, text: '창문! 들어온 데로 나가자!' });
  },

  // 창고 창문으로 나가기
  async roomWindow() {
    if (!flags.inRoom || flags.leftRoom) {
      await say('먼지 낀 창문.');
      return;
    }
    if (!flags.foundAlbum) {
      await say({ who: FRIEND, text: '벌써? 인증샷은 찍어야지. 그게 내기잖아.' }, { who: FRIEND, text: '…아까 사물함 하나 문이 덜 닫혀 있던데.' });
      return;
    }
    flags.leftRoom = true;
    await say('다시 난간으로. 이번엔 아래가 하나도 무섭지 않았다.', '머릿속이 사진으로 꽉 차 있어서.');
    await fadeAsync(() => {
      ambient = DUSK;
      setFloor(2, TOILET_BACK);
    });
    await say(
      { who: FRIEND, text: '하아… 살았다.' },
      { who: FRIEND, text: '…근데 지후야. 그 사진. 너네 아빠 옆에 얼굴 파인 사람 말이야.' },
      { who: FRIEND, text: '어깨동무까지 했으면 엄청 친한 사이잖아. 근데 누가 왜 얼굴을 칼로 팠을까.' },
      { who: ME, text: '…명렬표에서도 지워져 있었어. 아빠 바로 위 한 줄.' },
      { who: FRIEND, text: '…이거 미신 아니다. 진짜 무슨 일이 있었던 거야.' },
      { who: FRIEND, text: '야, 이거 대숲에 올리면 난리 난다. "잠긴 교실 진짜 들어가 봄 (사진 있음)". 올려도 돼?' },
    );
    // 선택: 대숲 글 — 소문
    const ok = await choose(['돌쇠가 벌써 휴대폰을 꺼내 들었다.'], ['"…아직 안 돼. 우리 아빠도 나와."', '"…마음대로 해."']) === 1;
    flags.rumorOk = ok;
    if (ok) {
      addRumor(2);
      await say(
        { who: ME, text: '…마음대로 해. 내기는 내기니까.' },
        { who: FRIEND, text: '오케이! 얼굴은 다 가리고 올릴게. 걱정 마.' },
        '…걱정이 된다.',
      );
    } else {
      await say(
        { who: ME, text: '아직 안 돼. 그 사진, 우리 아빠도 나와.' },
        { who: FRIEND, text: '…아, 맞네. 미안. 알았어, 입 꾹.' },
        { who: FRIEND, text: '대신 뭔지 알게 되면 나한테 제일 먼저 말해 줘야 돼.' },
      );
    }
    await say({ who: FRIEND, text: '오늘은 일단 집에 가자. 1층 현관.' });
  },

  // 1층 현관을 나서면
  async schoolExit() {
    if (!flags.leftRoom || flags.mondayEvening) {
      player.y -= 10;
      player.dir = 'up';
      if (flags.afterSchool) await say({ who: FRIEND, text: '어디 가! 내기는 하고 가야지.' });
      else await say('…아직 수업이 남았다.');
      return;
    }
    await say({ who: FRIEND, text: '내일 보자. …너네 아빠한테 물어보면 나한테도 알려 줘.' });
    await fadeAsync(() => {
      flags.mondayEvening = true;
      companion.visible = false;
      companion.following = false;
      ambient = EVENING;
      setFloor('home', HOME_DOOR);
    });
    await say('저녁 9시. 아빠는 식탁에서 노트북을 보고 있다.', flags.tookAlbum ? '가방 속 앨범이 돌덩이처럼 무겁다.' : '휴대폰 속 사진이 자꾸 떠오른다.');
  },

  // 월요일 저녁: 아빠에게 사진을 보여 줄지
  async dadEvening() {
    if (flags.day1Done || flags.toldDad) {
      await say('아빠는 노트북을 덮은 채 가만히 앉아 있다.');
      return;
    }
    await say({ who: '아빠', text: '왔어? 밥은?' }, { who: ME, text: '먹었어. …아빠.' });
    const show = await choose(['물어볼까. 1998년 2학년 6반.'], ['사진을 보여 준다', '"…아니야, 아무것도."']) === 0;
    if (!show) {
      await say(
        { who: ME, text: '…아니야, 아무것도.' },
        { who: '아빠', text: '싱겁긴. 얼른 씻고 자.' },
        '…말하지 못했다.',
      );
      await SCRIPTS.endDay1();
      return;
    }
    flags.toldDad = true;
    await say(
      { who: ME, text: '아빠, 고등학교 2학년 때 2학년 6반이었어?' },
      { who: '아빠', text: '…그건 어떻게 알아?' },
      flags.tookAlbum ? '가방에서 앨범을 꺼내 파인 사진을 펼쳤다.' : '휴대폰으로 찍은 사진을 내밀었다.',
      '아빠의 얼굴에서 핏기가 빠져나갔다.',
      { who: '아빠', text: '…이걸 어디서.' },
      { who: ME, text: '학교에 잠긴 교실 있잖아. 창고. 거기 사물함에 있었어.' },
      { who: '아빠', text: '그 교실에 들어갔어?' },
      '처음 듣는 목소리였다. 화난 것도 아니고, 무서워하는 것 같았다.',
      { who: ME, text: '…아빠 옆에 있는 사람, 누구야? 누가 얼굴을 이렇게…' },
      { who: '아빠', text: '…………' },
      { who: '아빠', text: '친구. 오래전에… 연락이 끊긴.' },
      { who: '아빠', text: '누가 그랬는지는 아빠도 몰라.' },
    );
    const gentle = await choose(['아빠는 사진에서 눈을 떼지 못한다.'], ['"…알았어. 더 안 물을게."', '"이름이 뭔데? 왜 연락이 끊겼어?"']) === 0;
    if (gentle) {
      addHeart('dad', 1);
      await say(
        { who: ME, text: '…알았어. 오늘은 더 안 물을게.' },
        { who: '아빠', text: '……고맙다.' },
        { who: '아빠', text: '그 교실엔… 다시 들어가지 마라. 부탁이야.' },
        '아빠는 방으로 들어갔다. 문틈으로 오래도록 불빛이 새어 나왔다.',
      );
    } else {
      flags.pushedDad = true;
      await say(
        { who: ME, text: '이름이 뭔데? 왜 연락이 끊겼어? 명렬표에서도 지워져 있었다고.' },
        { who: '아빠', text: '지후야. 그만.' },
        { who: '아빠', text: '…다 지난 일이야. 그 교실엔 다시 들어가지 마.' },
        '아빠는 노트북을 덮고 방으로 들어가 버렸다.',
      );
    }
    await SCRIPTS.endDay1();
  },

  async endDay1() {
    await say(
      '…방에 누워 천장을 봤다.',
      '얼굴이 파인 사진. 지워진 이름. "아직 그대로군." 그리고 아빠의 얼굴.',
      '미신 셋. 얼굴 파인 사진을 본 사람은 전학 간다.',
      '…그 사람은, 어디로 간 걸까.',
    );
    flags.day1Done = true;
    await fadeBlack();
    await showChapter('1장 「잠긴 교실」 끝', 2.4);
    await showChapter('2장 「사라진 얼굴」\n— 만드는 중 —', 2.6);
    setFloor('home', HOME_START);
    await fadeInAsync();
  },

  // ───────── 돌쇠에게 묻기 (Q) ─────────
  async friend() {
    let pages;
    if (flags.leftRoom) {
      pages = [{ who: FRIEND, text: '오늘은 집에 가자. 1층 현관.' }, { who: FRIEND, text: '…너네 아빠, 그 사람 누군지 알고 계실 거야.' }];
    } else if (flags.foundAlbum) {
      pages = [{ who: FRIEND, text: '창문! 들어온 데로 나가자, 얼른!' }];
    } else if (flags.inRoom) {
      const left = CLUES.filter(c => c.place === '2층 · 창고' && !c.story && !c.found).length;
      pages = left
        ? [{ who: FRIEND, text: '칠판, 벽에 붙은 종이, 책상… 미신이 진짜인지 하나씩 보자.' }, { who: FRIEND, text: '…아까 뒤쪽 사물함 하나 문이 덜 닫혀 있던데. 나는 무서워서 못 열어.' }]
        : [{ who: FRIEND, text: '뒤쪽 사물함! 문 덜 닫힌 거. 그거 열면 끝이야.' }];
    } else if (flags.checkedKeys) {
      pages = [{ who: FRIEND, text: '2층 화장실, 창고 바로 옆이야. 창문 밖 난간.' }, { who: FRIEND, text: '…나 진짜 높은 데 무서운데.' }];
    } else if (flags.triedDoor) {
      pages = [{ who: FRIEND, text: '1층 행정실 열쇠함. 현관에서 오른쪽, 계단 쪽으로 가다 보면 있어.' }];
    } else if (flags.afterSchool) {
      pages = [{ who: FRIEND, text: '잠긴 교실은 이 층 끝, 화장실 바로 옆이야.' }, { who: FRIEND, text: '…문 앞까지만 가 보자. 앞까지만.' }];
    } else {
      pages = [{ who: FRIEND, text: '…' }];
    }
    await say(...pages);
  },
};

// ── 시작 ──
async function startStory(withTitle) {
  const run = ++storyRun;
  cutscene = true;
  fade.alpha = 1;
  fade.dir = 0;
  setFloor('home', HOME_START);
  try {
    if (withTitle) await showTitle();
    if (run !== storyRun) return;
    const saved = withTitle && Save.load();
    if (saved) {
      const when = new Date(saved.savedAt);
      const cont = await choose(
        [`저장된 기록이 있다. (${when.getMonth() + 1}월 ${when.getDate()}일 ${when.getHours()}시 ${String(when.getMinutes()).padStart(2, '0')}분)`],
        ['이어하기', '처음부터'],
      ) === 0;
      if (cont) {
        Save.restore(saved);
        await fadeInAsync();
        return;
      }
      Save.clear();
    }
    await SCRIPTS.wakeUp();
    currentRegion = null;
  } catch (e) {
    if (e !== STOP) throw e;
  } finally {
    if (run === storyRun) cutscene = false;
  }
}

// Esc 메뉴의 '처음부터 다시'
function restartStory() {
  stopStory();
  resetFlags();
  startStory(false);
}

// 진행 중인 컷신·대사·화면 전환을 모두 멈춘다 (처음부터 다시, 개발자 메뉴 이동)
function stopStory() {
  storyRun++;
  titleEl.classList.remove('show');
  chapterEl.classList.remove('show');
  closeDialog();
  Experiment.abort();
  cutscene = false;
  Object.assign(fade, { alpha: 0, dir: 0, action: null, done: null });
  actors.length = 0;
}

// ─────────────────────────────────────────────
// 개발자 메뉴 (` 키) — 테스트할 때 원하는 장소·이야기 단계로 바로 가기
// ─────────────────────────────────────────────

// [이름, 장소, x, y] (x, y 는 발밑 위치, 타일 단위)
const DEV_SPOTS = [
  ['집 · 내 방', 'home', 5, 8],
  ['집 · 거실', 'home', 21, 11],
  ['버스 (창밖 풍경)', 'bus', 13.5, 4.95],
  ['1층 · 앞마당', 1, 8, 37],
  ['1층 · 행정실', 1, 20, 24],
  ['1층 · 방송실', 1, 57, 10],
  ['1층 · 동아리 창고', 1, 46, 29],
  ['1층 · 교무실', 1, 57.5, 30],
  ['1층 · 체육관', 1, 80, 50],
  ['2층 · 2학년 6반', 2, 20, 30.4],
  ['2층 · 창고 문 앞', 2, 50.5, 19],
  ['2층 · 창고 안', 2, 52.5, 24.4],
  ['2층 · 화장실', 2, 60.5, 24],
  ['3층 · 도서관', 3, 50, 23],
];

// 이야기 단계: 그 시점까지의 플래그·단서를 맞추고 그 자리로
const DEV_STAGES = [
  ['처음부터 (타이틀)', 'title'],
  ['프롤로그 — 2학년 6반 아침 (내기)', 'class'],
  ['1장 — 방과 후, 돌쇠와', 'after'],
  ['1장 — 열쇠함 본 뒤 (화장실 창문으로)', 'keys'],
  ['1장 — 창고 안', 'room'],
  ['1장 — 앨범 찾은 뒤 (교감 장면 끝)', 'album'],
  ['1장 — 월요일 저녁, 집', 'evening'],
];

const findClue = name => { const c = CLUES.find(k => k.name === name); if (c) c.found = true; };

function devStage(stage) {
  stopStory();
  ambient = null;
  setPlayerLook(null);
  resetFlags();
  for (const c of CLUES) c.found = false;
  if (stage === 'title') {
    startStory(true);
    return;
  }
  Object.assign(flags, { talkedDad: true });
  if (stage === 'class') {
    setFloor('home', HOME_DOOR);
    runScript('leaveHome');
    return;
  }
  flags.betLost = flags.afterSchool = true;
  if (stage === 'after') {
    setupAfterSchool();
    return;
  }
  Object.assign(flags, { triedDoor: true, checkedKeys: true });
  if (stage === 'keys') {
    setupAfterSchool(2, { x: 58.5, y: 24, dir: 'up' });
    return;
  }
  flags.inRoom = true;
  if (stage === 'room') {
    setupAfterSchool(2, ROOM_LAND);
    ambient = DUST;
    return;
  }
  Object.assign(flags, { foundAlbum: true, tookAlbum: true });
  ALBUM_CLUE.found = ROLL_CLUE.found = true;
  route.evidence = 2;
  if (stage === 'album') {
    setupAfterSchool(2, { x: 52.5, y: 24.4, dir: 'up' });
    ambient = DUST;
    return;
  }
  Object.assign(flags, { leftRoom: true, mondayEvening: true });
  ambient = EVENING;
  setFloor('home', HOME_DOOR);
}

const onOff = v => (v ? '켬' : '끔');
function devMenuItems() {
  return [
    { id: 'spots', label: '장소 이동 ▶' },
    { id: 'stages', label: '이야기 단계로 이동 ▶' },
    { id: 'allClues', label: '단서 모두 얻기' },
    { id: 'noClues', label: '단서 모두 지우기' },
    { id: 'noclip', label: `벽 통과: ${onOff(dev.noclip)}` },
    { id: 'fastText', label: `대사 빠르게: ${onOff(dev.fastText)}` },
    { id: 'fastMove', label: `빠르게 걷기: ${onOff(dev.fastMove)}` },
    { id: 'info', label: `FPS·좌표·플래그 보기: ${onOff(dev.info)}` },
    { id: 'close', label: '닫기' },
  ];
}

function pickDev(id) {
  const main = (at, msg = '') => DevMenu.show(devMenuItems(), msg, at);
  if (id === 'spots') {
    DevMenu.show([...DEV_SPOTS.map((s, i) => ({ id: `go:${i}`, label: s[0] })), { id: 'back', label: '◀ 뒤로' }]);
  } else if (id === 'stages') {
    DevMenu.show([...DEV_STAGES.map(([label, key]) => ({ id: `stage:${key}`, label })), { id: 'back', label: '◀ 뒤로' }],
      '그 시점까지의 단서·진행 상태로 맞춘다.');
  } else if (id.startsWith('go:')) {
    const [, where, x, y] = DEV_SPOTS[Number(id.slice(3))];
    stopStory();
    companion.visible = companion.following = flags.friendJoined && where !== 'home' && where !== 'bus';
    setFloor(where, { x, y, dir: 'down' });
    DevMenu.close();
  } else if (id.startsWith('stage:')) {
    devStage(id.slice(6));
    DevMenu.close();
  } else if (id === 'allClues') {
    for (const c of CLUES) c.found = true;
    main(2, '단서를 모두 얻었다.');
  } else if (id === 'noClues') {
    for (const c of CLUES) c.found = false;
    main(3, '단서를 모두 지웠다.');
  } else if (id in dev) {
    dev[id] = !dev[id];
    main(['noclip', 'fastText', 'fastMove', 'info'].indexOf(id) + 4);
  } else if (id === 'back') {
    main(0);
  } else if (id === 'close') {
    DevMenu.close();
  }
}

// 개발용: index.html?at=타일x,타일y[,장소][&friend] — 프롤로그 건너뛰고 그 자리에서 시작
//         index.html?stage=room — 개발자 메뉴의 이야기 단계로 바로 시작 (DEV_STAGES 의 키)
const devParams = new URLSearchParams(location.search);
const devAt = devParams.get('at');
if (devParams.get('stage')) {
  devStage(devParams.get('stage'));
} else if (devAt) {
  const [tx, ty, where = '1'] = devAt.split(',');
  if (devParams.has('friend')) {
    flags.friendJoined = true;
    companion.visible = true;
    companion.following = true;
  }
  setFloor(isNaN(where) ? where : Number(where), { x: Number(tx) + 0.5, y: Number(ty) + 1, dir: 'down' });
} else {
  startStory(true);
}
