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
// 아빠: 서준호 — 동산고 2000년 졸업, 1998년 2학년 6반. 추리 동아리 「221B」 부원
// 동행: 박건우 — 내기 상대. 입이 가볍고 학교 커뮤니티 '동산 대숲' 단골
const ME = '지후';
const FRIEND = '건우';

// 선택에 따라 쌓이는 숨은 값 — 플레이어에겐 보여 주지 않고 엔딩만 가른다
//   evidence: 밝혀낸 진실
//   rumor:    건우가 대숲에 글을 올리려는 정도 (높으면 고형석이 먼저 움직인다)
//   heart:    아빠 / 이수아 선생님 / 정재민이 지후를 믿는 정도
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
    betLost: false,      // 건우와의 내기에서 짐 (교실 장면 끝)
    // 1장 (월요일 방과 후)
    afterSchool: false,  // 방과 후, 건우와 함께
    friendJoined: false, // 건우가 따라다님 (Q)
    triedDoor: false,    // 창고 자물쇠를 봄
    checkedKeys: false,  // 행정실 열쇠함: 창고 열쇠는 교감 보관
    inRoom: false,       // 화장실 창문 → 난간 → 창고 안
    foundAlbum: false,   // 사물함에서 학급 앨범 (파인 사진, 아빠)
    tookAlbum: false,    // 앨범을 통째로 가져옴 (아니면 사진만 찍음)
    leftRoom: false,     // 창고에서 나옴
    rumorOk: false,      // 건우에게 대숲 글을 허락함
    mondayEvening: false,// 월요일 저녁, 집
    toldDad: false,      // 아빠에게 사진을 보여 줌
    day1Done: false,     // 1장 끝
    // 2장 「사라진 얼굴」
    ch2: false,          // 11월 17일 화요일 점심시간
    sawReport: false,    // 동아리 창고: 221B 활동 보고서 (정재민)
    tueEvening: false,   // 화요일 저녁, 집
    askedJaemin: false,  // 아빠에게 정재민을 물어봄
    bandDone: false,     // 동창 밴드에 메시지 (아무도 모른다)
    wed: false,          // 11월 18일 수요일 점심시간
    toBroadcast: false,  // 은비가 방송실로 먼저 감
    heardTape: false,    // 1998년 사연 테이프를 들음
    decoded: false,      // 사연 해독 대결 승리: "앨범 내 얼굴 뒤"
    roomAgain: false,    // 앨범이 창고에 있어서 방과 후 다시 들어가야 한다
    inRoom2: false,      // 두 번째로 창고 안
    foundNote: false,    // 파인 사진 뒤에서 쪽지 원본 + 재민의 메모
    leftRoom2: false,    // 두 번째로 창고에서 나옴
    rumorNote: false,    // 쪽지 얘기까지 대숲에 올려도 된다고 함
    ch2Done: false,      // 2장 끝
    // 3장 「1998년의 시험」 — 11월 19일 목요일
    ch3: false,          // 목요일 1교시 국어
    memory: null,        // 지금 누구의 기억 속인지 ('suah' | 'gyogam'), 현실이면 null
    suahClass: false,    // 국어 시간: 판서의 ③ 꼬리 = 쪽지 글씨
    suahMet: false,      // 교무실: 쪽지를 보여 줌 → 이수아의 기억
    shHall: false,       // 기억 속: 복도의 고형석 패거리 (부탁 → 협박으로 뒤집힘)
    shExam: false,       // 기억 속: 2교시 국어, 쪽지, 재민의 눈, 창밖을 보던 감독
    suahMemDone: false,  // 기억에서 돌아옴 (모순 2개)
    gotGuestbook: false, // 체육관 방명록: 고형석의 서명
    suahWon: false,      // 필체 대조 승리
    suahTestify: false,  // 이수아 선생님이 금요일에 직접 말하겠다고 함
    gyogamWon: false,    // 교감의 기억 + 감독표 대조 승리
    thuEvening: false,   // 목요일 저녁, 집
    dadRefused: false,   // 아빠가 말을 피함 (마음이 낮을 때)
    readDiary: false,    // 아빠 가방 속 일기를 몰래 읽음
    dadConfessed: false, // 아빠의 고백 (1998년 12월)
    dadComes: false,     // 아빠가 내일 기념식에 온다
    calledJaemin: false, // 해원경찰서 정재민 경위와 통화
    jaeminMaybe: false,  // 재민이 "기억해 둘게" (올 수도 있다)
    ch3Done: false,      // 3장 끝
    // 4장 「다시 열린 교실」 — 11월 20일 금요일
    ch4: false,          // 금요일 아침
    finalChoice: null,   // 'public' | 'private' | 'dad'
    ch4Room: false,      // 엔딩: 쇠사슬이 풀린 창고
    ending: 0,           // 1 다시 열린 교실 · 2 221B · 3 소문 · 4 다시 잠긴 교실
  });
  companion.visible = false;
  companion.following = false;
  actors.length = 0;
  ambient = null;
  setPlayerLook(null);
  showPadlock(true);
}

// 창고 문의 자물쇠: 엔딩에서 쇠사슬이 풀리면 그림에서 뺀다
var PADLOCK = null;
function showPadlock(on) {
  const ps = FLOORS[2].props;
  PADLOCK = PADLOCK || ps.find(p => p.type === 'padlock');
  const i = ps.indexOf(PADLOCK);
  if (on && i < 0) ps.push(PADLOCK);
  if (!on && i >= 0) ps.splice(i, 1);
}

// 사물에 붙지 않고 이야기로 얻는 단서 (수첩에는 처음부터 ??? 로 보인다)
// story: true — 조사로는 못 얻는다. 건우의 "여기 아직 안 본 게 있어" 힌트에서 뺀다
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

// 2장 단서
const REPORT_CLUE = storyClue('221B 활동 보고서', '1층 · 동아리 창고',
  '추리 동아리 「221B」 1998년 보고서. 부장 정재민, 기록 서준호. 둘뿐이다.',
  '규칙 하나, 답은 언제나 맨 앞에 있다. 둘, 증거 없이는 말하지 않는다. 셋, 친구를 버리지 않는다.',
  '12월 활동: "2학년 6반 기말고사 건 — 조사 중". 마지막 줄: "12월 18일. 부장 전학. 활동 중지."');
const BAND_CLUE = storyClue('동창들의 답장', '집 · 내 방',
  '동산중 졸업생 밴드. 정재민의 연락처를 아는 사람은 아무도 없었다.',
  '"그때 동산고에서 무슨 일 있었잖아. 시험 때. 그 뒤로 걔 얘기 하면 안 되는 분위기였어."');
const TAPE_CLUE = storyClue('사연 테이프', '1층 · 방송실',
  '"98.12.16 점심 — 사연". 2학년 6반 J의 작별 사연.',
  '앨리스처럼 이상한 나라에 떨어진 기분이야. / 범인 찾기가 내 취미였던 거, 다들 알지? / 내일이면 나는 이 학교를 떠나.',
  '얼마 안 됐지만 정말 즐거웠어. / 굴러다니던 추리소설은 동아리방에 두고 갈게. / 뒤돌아보지 말라는데, 자꾸 돌아보게 되네.',
  '"그리고 J에게. 우리 첫 번째 규칙, 잊지 마."');
const NOTE_CLUE = storyClue('쪽지 원본', '2층 · 창고',
  '파인 사진 뒤, 앨범 대지 틈에 숨겨져 있던 작은 쪽지. 국어 기말고사 답이 깔끔한 글씨로 적혀 있다.',
  '뒷면엔 거친 글씨. "다음 시간도 똑같이. 안 하면 알지? — 형석"');
const MEMO_CLUE = storyClue('재민의 메모', '2층 · 창고',
  '"1998.12.15 2교시 국어. 고형석 책상 밑에서 주움. 답 글씨는 이수아. 수아는 협박당하고 있다."',
  '"담임 선생님께 말씀드렸지만 덮였다."',
  '"준호야, 이걸 찾았다면— 미안하다. 그리고 부탁한다. — J"');

// 3장 단서
const CONTRA_SH_THREAT = storyClue('모순: 친절한 부탁', '3장 · 이수아의 기억',
  '수아 선생님의 기억 속 형석은 "좀 도와주라"고 웃으며 부탁했다.',
  '…하지만 기억이 뒤집혔을 때, 형석은 사물함을 차며 "안 하면 알지?"라고 했다.');
const CONTRA_SH_WINDOW = storyClue('모순: 창밖을 보던 감독', '3장 · 이수아의 기억',
  '2교시 국어 시험 내내, 감독 문병철 선생님은 창밖만 보고 있었다.',
  '맨 뒷자리의 재민도 본 쪽지를, 감독만 못 봤다.');
const GUEST_CLUE = storyClue('기념식 방명록', '1층 · 체육관',
  '"모교의 무궁한 발전을 기원합니다. — 동문회장 고형석"',
  '비스듬히 누운 획. 갈고리처럼 꺾인 줄표.');
const CONTRA_GG_SEAT = storyClue('모순: 감독석의 담임', '3장 · 문병철의 기억',
  '기록은 "10시 55분, 2층 복도". 그 시각 문병철은 2학년 6반 감독석에 있었다.',
  '정재민은 맨 뒷자리에서 시험을 보고 있었다.');
const CONTRA_GG_GUEST = storyClue('모순: 그날 저녁의 손님', '3장 · 문병철의 기억',
  '그날 저녁, 빈 교실에 학교운영위원장(고형석의 아버지)이 찾아왔다.',
  '"기록은 이렇게 쓰시죠, 선생님."');
const DAD_CLUE = storyClue('아빠의 고백', '집 · 거실',
  '1998년 12월, 아빠는 담임 앞에서 "아무것도 못 봤어요"라고 했다.',
  '사연의 첫 글자를 알아챘지만, 앨범을 열지 않았다. 재민의 전화도 받지 않았다.');
const NEWS_CLUE = storyClue('정재민 경위 기사', '집 · 내 방',
  '"해원고 출신 정재민 경위, 10년 추적 끝에 보이스피싱 조직 검거" (2024년 지역 신문)',
  '"증거 없이는 말하지 않는다. 학창 시절 동아리 규칙이었죠."');

// ── 추리 대결 (experiment.js 의 '추리 노트' 화면) — 주장마다 대사와 단서 반응 ──
const EXPERIMENTS = {
  // 4장 금요일 — 동문회장 고형석 (기념식 무대, 또는 무대 옆에서 단둘이)
  final: {
    title: '최종 반박',
    mini: 'rebut',
    miniHelp: 'W/S 단서 고르기 · F 들이밀기',
    portrait: 'hyungseok',
    prop: 'paper',
    speaker: '고형석',
    claim: '"28년 전 애들 장난이야. 나는 아무도 협박한 적 없어."',
    source: '— 동문회장 고형석 (2000년 졸업)',
    intro: [
      '고형석이 감사패를 든 채 웃고 있다. 28년 동안 한 번도 흔들린 적 없는 웃음.',
      '이제, 모든 단서를 꺼낼 차례다.',
    ],
    observe: [
      ['주장을 다시 듣는다.', '"애들 장난이었다. 협박? 그런 단어는 처음 듣는다."'],
      ['고형석은 하나하나 빠져나갈 구멍을 준비해 왔다.', '쪽지, 글씨, 기록, 아버지… 하나씩 막아야 한다.'],
      ['먼저, 이 사람 손으로 쓴 그 쪽지부터. ([단서 제시])'],
    ],
    clues: {
      '쪽지 원본': {
        dmg: 15, unlock: true,
        text: [
          '쪽지 원본을 꺼내 들었다. 뒷면이 보이게.',
          { who: ME, text: '"다음 시간도 똑같이. 안 하면 알지? — 형석" 이게 장난이에요?' },
          '고형석의 눈썹이 꿈틀했다. 이제 [추리]로 변명을 하나씩 무너뜨릴 수 있다!',
        ],
      },
      '재민의 메모': {
        dmg: 10,
        text: [{ who: ME, text: '"수아는 협박당하고 있다." 열일곱 살 정재민 씨가 남긴 기록이에요.' }],
      },
      '아빠의 고백': {
        dmg: 10,
        text: [{ who: ME, text: '"너도 전학 가고 싶냐." 우리 아빠한테 하신 말이죠. 옥상 계단에서.' }, '고형석이 처음으로 웃음을 멈췄다.'],
      },
      '모순: 친절한 부탁': {
        dmg: 10,
        text: [{ who: ME, text: '수아 선생님은 28년 동안 사물함 차는 소리를 기억하고 계셨어요.' }],
      },
      '사연 테이프': {
        dmg: 5,
        text: [{ who: ME, text: '정재민 씨는 전학 가기 이틀 전, 암호로 증거 위치를 남겼어요. 왜 그렇게까지 해야 했을까요?' }],
      },
      '정재민 경위 기사': {
        dmg: 5,
        text: [{ who: ME, text: '당신이 "폭력 학생"이라고 한 사람은, 지금 경찰이에요. 증거 없이는 말하지 않는.' }],
      },
    },
    wrongClue: name => [`「${name}」을(를) 내밀었다.`, '…고형석이 코웃음을 쳤다. 이걸로는 안 된다.'],
    noTarget: ['어디서부터 무너뜨려야 할까.', '먼저, 이 사람이 직접 쓴 증거부터. ([단서 제시])'],
    expDone: ['이미 네 마디 변명을 모두 무너뜨렸다.'],
    notYet: ['아직 근거가 부족하다.', '성급했다. 고형석은 아직 웃고 있다.'],
    broken: ['"애들 장난"의 신뢰도가 바닥났다.', '지금이라면… [반박]할 수 있다!'],
    taunts: ['학생, 명예훼손이 뭔지 알아?', '28년 전 종이 쪼가리로 뭘 하겠다는 거지?', '우리 변호사들이 이 장면을 아주 좋아하겠군.'],
    tauntsWeak: ['…그건, 그냥.', '아버지가… 아버지가 알아서 한 일이야.'],
    win: [
      { who: ME, text: '협박은 당신이 했고, 기록은 당신 아버지가 바꿨고, 침묵은 모두가 강요당했어요.' },
      { who: ME, text: '28년 전 그 교실에서 쫓겨나야 했던 건 정재민 씨가 아니었어요.' },
      '고형석의 손에서 감사패가 미끄러졌다.',
      '「애들 장난이었다」를 반박했다!',
    ],
  },

  // 3장 목요일, 교무실 — 이수아 선생님의 28년 된 자책
  handwriting: {
    title: '필체 대조',
    mini: 'handwriting',
    miniHelp: 'A/D 견본 바꾸기 · F 같은 글씨',
    portrait: 'suah98',
    prop: 'paper',
    speaker: '기억 속 수아',
    claim: '"형석이는 시킨 적 없어. 내가 먼저 보여 줬어."',
    source: '— 이수아 (1998년 2학년 6반)',
    intro: [
      '기억 속 열일곱 살의 수아가 쪽지를 꼭 쥐고 있다.',
      '28년 동안, 이 아이는 모든 게 자기 탓이라고 말해 왔다.',
    ],
    observe: [
      ['주장을 다시 듣는다.', '"내가 먼저 보여 줬어. 형석이는 부탁만 했어."'],
      ['쪽지는 두 면이다. 앞면엔 답, 뒷면엔 "다음 시간도 똑같이. 안 하면 알지?"', '앞면은 수아의 글씨다. 그럼 뒷면은?'],
      ['뒷면 글씨가 누구 것인지 증명하려면… 고형석의 글씨 견본이 필요하다. ([단서 제시])'],
    ],
    clues: {
      '기념식 방명록': {
        dmg: 15, unlock: true,
        text: [
          '방명록 사진을 꺼냈다.',
          { who: ME, text: '어제 고형석 회장이 체육관 방명록에 쓴 서명이에요. 비스듬한 획, 꺾인 줄표.' },
          '비교할 견본을 손에 넣었다. 이제 [추리]로 직접 맞춰 볼 수 있다!',
        ],
      },
      '쪽지 원본': {
        dmg: 15,
        text: [{ who: ME, text: '"안 하면 알지?" 이건 부탁이 아니에요. 협박이에요.' }, '수아가 쪽지를 뒤집어 쥐었다.'],
      },
      '재민의 메모': {
        dmg: 15,
        text: [{ who: ME, text: '"수아는 협박당하고 있다." 재민 씨는 그때 이미 알고 있었어요.' }],
      },
      '모순: 친절한 부탁': {
        dmg: 15,
        text: [{ who: ME, text: '선생님 기억 속에서도, 형석은 부탁하지 않았어요. 사물함을 찼어요.' }, '"…그건." 수아의 목소리가 갈라졌다.'],
      },
      '모순: 창밖을 보던 감독': {
        dmg: 5,
        text: [{ who: ME, text: '감독 선생님도 일부러 안 본 거예요. 혼자 막을 수 있는 일이 아니었어요.' }],
      },
    },
    wrongClue: name => [`「${name}」을(를) 내밀었다.`, '…이 주장과는 관계가 없다.'],
    noTarget: ['무엇과 비교해야 할지 모르겠다.', '고형석의 글씨 견본이 있다면… ([단서 제시])'],
    expDone: ['이미 확인했다. 뒷면은 고형석의 글씨다.'],
    notYet: ['아직 근거가 부족하다.', '성급했다. 수아는 아직 자기 탓이라고 믿고 있다.'],
    broken: ['"내가 먼저"의 신뢰도가 바닥났다.', '지금이라면… [반박]할 수 있다!'],
    taunts: ['내가 쓴 거야. 내 글씨잖아.', '형석이는 부탁만 했어. 거절 못 한 건 나야.', '다 내 잘못이야. 그러니까 이제 그만해.'],
    tauntsWeak: ['…그 애 발소리가 아직도 들려.', '무서웠어. …무서웠다고 말하면, 뭐가 달라져?'],
    win: [
      { who: ME, text: '선생님은 먼저 보여 준 게 아니에요. 협박당한 거예요. 쪽지 뒷면이 그 증거예요.' },
      { who: ME, text: '28년 동안 선생님이 지고 있던 건, 선생님 잘못이 아니었어요.' },
      '기억 속 수아가 쪽지를 놓았다. 손이 더는 떨리지 않았다.',
      '「내가 먼저 보여 줬어」를 반박했다!',
    ],
  },

  // 3장 목요일, 교무실 — 문병철 교감의 생활기록부
  timetable: {
    title: '감독표 대조',
    mini: 'timetable',
    miniHelp: '방향키 칸 고르기 · F 확정',
    portrait: 'gyogam98',
    prop: 'paper',
    speaker: '기억 속 문병철',
    claim: '"정재민이 고형석을 때렸다. 내가 직접 봤다."',
    source: '— 생활기록부 1998.12.15 (담임 문병철)',
    intro: [
      '기억 속 젊은 문병철이 생활기록부를 펼쳐 든다.',
      '"10시 55분, 2층 복도." 28년 동안 아무도 의심하지 않은 한 줄.',
    ],
    observe: [
      ['기록을 다시 읽는다.', '"1998년 12월 15일 10시 55분, 2층 복도에서 정재민이 고형석을 폭행. 담임 직접 목격."'],
      ['12월 15일은 기말고사 둘째 날이다.', '시험 날 그 시각에, 모두 어디 있었을까?'],
      ['시험 시간표와 감독 배정이 적힌 표가 있다면… ([단서 제시])'],
    ],
    clues: {
      '기말고사 감독표': {
        dmg: 15, unlock: true,
        text: [
          '감독표를 펼쳤다. "1998학년도 2학기 기말고사 — 2학년 6반"',
          { who: ME, text: '시험 시간표와 감독 배정이 다 적혀 있어요. 선생님 이름도요.' },
          '기록의 시각을 맞춰 볼 수 있다. [추리]로 직접 확인하자!',
        ],
      },
      '모순: 감독석의 담임': {
        dmg: 15,
        text: [{ who: ME, text: '선생님 기억 속에서도, 그 시각 선생님은 감독석에 앉아 계셨어요.' }, '젊은 문병철이 눈을 피했다.'],
      },
      '모순: 그날 저녁의 손님': {
        dmg: 15,
        text: [{ who: ME, text: '"기록은 이렇게 쓰시죠, 선생님." 그날 저녁, 누가 그 말을 했죠?' }],
      },
      '재민의 메모': {
        dmg: 10,
        text: [{ who: ME, text: '"담임 선생님께 말씀드렸지만 덮였다." 정재민 씨는 선생님한테 먼저 갔어요.' }],
      },
      '동창들의 답장': {
        dmg: 5,
        text: [{ who: ME, text: '"그 뒤로 걔 얘기 하면 안 되는 분위기였어요." 그 분위기, 누가 만든 거예요?' }],
      },
    },
    wrongClue: name => [`「${name}」을(를) 내밀었다.`, '…이 기록과는 관계가 없다.'],
    noTarget: ['무엇과 맞춰 봐야 할지 모르겠다.', '그날의 시험 시간표가 있다면… ([단서 제시])'],
    expDone: ['이미 확인했다. 10시 55분은 3교시 시험 중이었다.'],
    notYet: ['아직 근거가 부족하다.', '성급했다. 기록은 아직 굳건하다.'],
    broken: ['"내가 직접 봤다"의 신뢰도가 바닥났다.', '지금이라면… [반박]할 수 있다!'],
    taunts: ['내가 담임이었다. 내 눈으로 봤어.', '기록은 기록이다. 28년간 아무도 문제 삼지 않았어.', '학생이 교사의 기록을 의심하는 건가?'],
    tauntsWeak: ['…10시 55분. 그래, 그때는…', '복도였어. 복도였을 거야…'],
    win: [
      { who: ME, text: '10시 55분, 선생님은 교실 감독석에 계셨어요. 정재민 씨는 시험을 보고 있었고요.' },
      { who: ME, text: '그 기록은 본 걸 쓴 게 아니라, 받아 적은 거예요. 그날 저녁 찾아온 사람이 불러 주는 대로.' },
      '젊은 문병철의 손에서 생활기록부가 떨어졌다.',
      '「내가 직접 봤다」를 반박했다!',
    ],
  },

  // 2장 수요일, 방송실 — 1998년 12월 16일 점심 방송의 사연
  acrostic: {
    title: '사연 해독',
    mini: 'acrostic',
    miniHelp: 'A/D 읽는 법 · W/S 순서 · F 확정',
    portrait: 'dj98',
    prop: 'tape',
    speaker: '1998년 방송부 DJ',
    claim: '"그냥 평범한 작별 인사였어."',
    source: '— 1998.12.16 점심 방송',
    intro: [
      '데크에서 지지직거리는 목소리가 흘러나온다. 28년 전 점심시간.',
      '기억 속 방송부 DJ가 테이프를 흔든다. 별것 아닌 사연이었다고.',
    ],
    observe: [
      ['사연을 다시 떠올린다.', '여섯 문장. 말투가 이상하게 딱딱 끊긴다. 한 문장, 한 문장.'],
      ['마지막 인사가 걸린다.', '"J에게. 우리 첫 번째 규칙, 잊지 마."', '평범한 작별 인사에 왜 "규칙" 얘기를 할까?'],
      ['첫 번째 규칙… 동아리 규칙이라면 어딘가 적혀 있을 것이다. ([단서 제시])'],
    ],
    clues: {
      '221B 활동 보고서': {
        dmg: 25, unlock: true,
        text: [
          '활동 보고서를 펼쳤다.',
          { who: ME, text: '221B 규칙 하나. "답은 언제나 맨 앞에 있다."' },
          { who: ME, text: '"J에게"의 J는 준호, 우리 아빠예요. 규칙을 잊지 말라는 건… 맨 앞을 읽으라는 거예요.' },
          '읽는 법을 알아냈다. 이제 [추리]로 직접 풀 수 있다!',
        ],
      },
      '동창들의 답장': {
        dmg: 15,
        text: [
          { who: ME, text: '"그때 동산고에서 무슨 일 있었잖아. 시험 때." 동창이 그랬어요.' },
          { who: ME, text: '평범한 전학이 아니었어요. 그 뒤로 이름도 꺼내면 안 되는 분위기였대요.' },
          'DJ가 테이프를 쥔 손을 멈칫했다.',
        ],
      },
      '1998년 달력': {
        dmg: 10,
        text: [
          { who: ME, text: '방송은 12월 16일. 달력의 "J 마지막 날"은 12월 18일.' },
          { who: ME, text: '떠나기 이틀 전에, 친구한테 꼭 남겨야 할 말이 있었던 거예요.' },
        ],
      },
      '파인 사진': {
        dmg: 15,
        text: [
          { who: ME, text: '평범하게 전학 간 사람이면, 앨범 사진이 왜 칼로 파여 있어요?' },
          '"…그건 나도 몰라." DJ의 목소리가 작아졌다.',
        ],
      },
      '빈칸 하나': {
        dmg: 10,
        text: [{ who: ME, text: '명렬표에서도 이름이 지워졌어요. 누군가 이 사람을 없었던 일로 만들려고 했어요.' }],
      },
      '책상의 J & J': {
        dmg: 5,
        text: [{ who: ME, text: '"J & J — 221B 영원히." 이 사연은 두 사람만 아는 말로 쓰였어요.' }],
      },
      '사연 테이프': {
        dmg: -5,
        text: ['테이프를 다시 내밀었다.', '…이건 주장 그 자체다. 겉으로 들으면 정말 평범한 인사일 뿐이다.'],
      },
    },
    wrongClue: name => [`「${name}」을(를) 내밀었다.`, '…이 사연과는 관계가 없다.'],
    noTarget: ['어떻게 읽어야 할지 모르겠다.', '"첫 번째 규칙"이 뭔지 먼저 알아내자. ([단서 제시])'],
    expDone: ['이미 풀었다. "앨범 내 얼굴 뒤."'],
    notYet: ['아직 근거가 부족하다.', '성급했다. 사연이 평범하지 않다는 걸 더 보여 줘야 한다.'],
    broken: ['"평범한 작별 인사"의 신뢰도가 바닥났다.', '지금이라면… [반박]할 수 있다!'],
    taunts: ['전학 가는 애들 사연, 일주일에 세 통은 왔어.', '그냥 감성 터진 고딩 편지야.', '숨은 뜻? 추리소설을 너무 많이 봤네.'],
    tauntsWeak: ['…그러고 보니 그 애, 사연 낼 때 표정이 이상했어.', '읽는 내내 누군가한테 말하는 것 같긴 했어…'],
    win: [
      { who: ME, text: '이건 작별 인사가 아니라 암호예요. 221B 규칙대로, 맨 앞 글자만 읽으면 돼요.' },
      { who: ME, text: '"앨범 내 얼굴 뒤." 정재민 씨는 증거를 앨범 속 자기 사진 뒤에 숨겼어요.' },
      { who: ME, text: '얼굴을 판 건 누가 미워해서가 아니에요. 본인이 숨길 자리를 만든 거예요.' },
      'DJ의 손에서 테이프가 툭 떨어졌다.',
      '「평범한 작별 인사」를 반박했다!',
    ],
  },
};

// 기억 속 (1998년): 빛바랜 사진 색
const PAST = ['rgba(200,160,90,0.20)', 'rgba(30,24,40,0.10)'];
const MEMORY_LOOK = { suah: 'suah98', gyogam: 'gyogam98' };

// 누군가의 기억으로: 건우·현재 인물은 사라지고, 지후는 그 사람이 된다
function beginMemory(who, where, at) {
  ambient = PAST;
  actors.length = 0;
  companion.following = false;
  companion.visible = false;
  flags.memory = who;
  setPlayerLook(MEMORY_LOOK[who]);
  setFloor(where, at);
  addMemoryActors();
}

// 기억 속에 처음부터 있는 사람들
function addMemoryActors() {
  if (flags.memory !== 'suah') return;
  for (const [x, y] of [[42, 24.2], [44, 26.2], [48, 24.2], [50, 28.2], [42, 28.2]]) addActor('student98', x, y, 'up', 'p2');
  addActor('junho98', 52.5, 26.2, 'left', 'p2');
  addActor('jaemin98', 52.5, 28.2, 'left', 'p2');
  if (!flags.shHall) {
    addActor('hyungseok98', 47.5, 17.4, 'down', 'p2');
    addActor('gang98', 46.2, 17.9, 'right', 'p2');
    addActor('gang98', 48.8, 17.9, 'left', 'p2');
  } else {
    addActor('hyungseok98', 44, 28.2, 'up', 'p2');
  }
}

// 기억에서 현재로
function endMemory() {
  flags.memory = null;
  actors.length = 0;
  setPlayerLook(null);
  ambient = sceneAmbient();
}

// 장면마다 화면 색 (저장을 불러올 때도 쓴다)
function sceneAmbient() {
  if (flags.memory) return PAST;
  if (flags.ch3) return flags.thuEvening ? EVENING : null;
  if (flags.ch2) {
    if (flags.inRoom2 && !flags.leftRoom2) return DUST;
    if (flags.roomAgain && !flags.ch2Done) return DUSK;
    if (flags.tueEvening && !flags.wed) return EVENING;
    return null;
  }
  if (flags.mondayEvening) return EVENING;
  if (flags.inRoom && !flags.leftRoom) return DUST;
  return flags.afterSchool ? DUSK : null;
}

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

// 방과 후: 노을, 건우가 따라다닌다
function setupAfterSchool(where = 2, at = { x: 20, y: 30.4, dir: 'up' }) {
  ambient = DUSK;
  actors.length = 0;
  flags.friendJoined = true;
  companion.visible = true;
  companion.following = true;
  setFloor(where, at);
}

// 금요일 오전 10시, 체육관 기념식: 무대엔 고형석과 교감, 객석엔 학생들, 교사석엔 이수아 선생님, (온다면) 뒤쪽에 아빠
function setupCeremony() {
  ambient = null;
  actors.length = 0;
  companion.visible = true;
  companion.following = false;
  setFloor(1, { x: 79.5, y: 51.5, dir: 'up' });
  camFocus = { x: 79.5 * TILE, y: 47 * TILE };
  Object.assign(companion, { floor: 1, x: 81 * TILE, y: 51.6 * TILE, dir: 'up' });
  addActor('hyungseok', 80.5, 42.7, 'down', 1);   // 무대 앞 (무대 그림에 가리지 않게)
  addActor('gyogam', 77, 42.7, 'down', 1);
  for (const [x, y] of [[72.5, 46.5], [74.5, 46.5], [76.5, 46.5], [82.5, 46.5], [84.5, 46.5], [86.5, 46.5], [73.5, 48.5], [75.5, 48.5], [77.5, 48.5], [81.5, 48.5], [83.5, 48.5], [85.5, 48.5]]) {
    addActor(['student1', 'student2', 'student3'][Math.floor(x + y) % 3], x, y, 'up', 1);
  }
  addActor('eunbi', 88.5, 44.5, 'left', 1);
  addActor('suah', 70, 45.5, 'right', 1);
  if (flags.dadComes) addActor('dad', 75.5, 52.5, 'up', 1);
}

// 낮 장면 (점심시간 등): 건우가 따라다닌다. amb: 화면 색 (없으면 null)
function setupDay(where, at, amb = null) {
  ambient = amb;
  actors.length = 0;
  flags.friendJoined = true;
  companion.visible = true;
  companion.following = true;
  setFloor(where, at);
}

// 인물(건우 또는 컷신용 NPC)을 (x, y)까지 sec초 동안 걷게 (타일 단위)
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

// 왼쪽 위 "지금 하고 있는 일" — 할 일 한 줄 + 건우가 어디 있는지
function statusLines() {
  const lines = [];
  const here = floor.map.n;
  let doing = null;
  if (flags.memory === 'suah') {
    return [{ text: '이수아의 기억 — 1998년 12월 15일' }, { text: flags.shHall ? '2교시 시작 — 내 자리로' : '쉬는 시간 — 복도 정수기에 다녀오자' }];
  }
  if (flags.memory) return [{ text: '1998년 — 기억 속' }];
  if (flags.ch4) doing = '11월 20일 금요일 — 개교기념식';
  else if (flags.ch3Done) doing = '…내일은 기념식';
  else if (flags.ch3) doing = ch3Doing();
  else if (flags.ch2Done) doing = '3장 「1998년의 시험」 — 만드는 중';
  else if (flags.ch2) doing = ch2Doing();
  else if (flags.mondayEvening) doing = '저녁 — 아빠한테 물어볼까';
  else if (flags.leftRoom) doing = '오늘은 집으로 (1층 현관)';
  else if (flags.foundAlbum) doing = '창고 창문으로 빠져나가기';
  else if (flags.inRoom) doing = '창고 안 둘러보기 — 인증샷 찍을 만한 것';
  else if (flags.checkedKeys) doing = '2층 화장실 창문 → 난간 → 창고';
  else if (flags.triedDoor) doing = '창고 열쇠 구하기 (1층 행정실 열쇠함?)';
  else if (flags.afterSchool) doing = '내기 벌칙 — 2층 잠긴 교실(창고)에 들어가기';
  else if (here === 'home') doing = flags.talkedDad ? '현관으로 나가는 중' : '등교 준비 중';
  else if (here === 'bus') doing = '학교 가는 중';
  if (doing) lines.push({ text: doing });
  if (companion.following) lines.push({ text: '건우와 동행 중', key: 'Q', kind: 'friend' });
  return lines;
}

// 3장에서 지금 할 일
function ch3Doing() {
  if (flags.calledJaemin) return '…내일은 기념식';
  if (flags.dadConfessed) return '내 방 책상 — 해원고 정재민 찾아보기';
  if (flags.dadRefused && !flags.readDiary) return '아빠는 방으로 들어갔다… 거실 구석의 검은 가방';
  if (flags.thuEvening) return '저녁 — 아빠와 이야기하기';
  if (flags.gotGuestbook && !flags.suahWon) return '1층 교무실 — 수아 선생님께 필체 대조';
  if (flags.suahMemDone) return '체육관 — 기념식 방명록 (고형석의 글씨)';
  if (flags.suahClass) return '1층 교무실 — 이수아 선생님 찾아가기';
  return '1교시 국어';
}

// 2장에서 지금 할 일
function ch2Doing() {
  if (flags.foundNote) return '건우와 이야기하기';
  if (flags.inRoom2) return '창고 사물함 — 앨범 속 파인 사진 뒤';
  if (flags.roomAgain) return '앨범은 창고에 — 2층 화장실 창문으로 다시';
  if (flags.decoded) return '앨범 내 얼굴 뒤';
  if (flags.toBroadcast) return '1층 방송실로 (은비가 기다린다)';
  if (flags.wed) return '수요일 점심시간';
  if (flags.bandDone) return '…자자';
  if (flags.askedJaemin) return '내 방 책상 — 아빠의 중학교 동창 찾아보기';
  if (flags.tueEvening) return '저녁 — 아빠에게 정재민에 대해 묻기';
  if (flags.sawReport) return '오후 수업';
  return '1층 동아리 창고에서 1998년 기록 찾기';
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
    if (flags.ch3) return SCRIPTS.dadThu();
    if (flags.ch2) return SCRIPTS.dadTue();
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
    if (flags.tueEvening && !flags.wed) await say('밤 10시 30분.', '…28년 전에도 이 시간은 똑같이 흘렀겠지.');
    else     if (flags.mondayEvening) await say('밤 9시 10분.');
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
      '박건우. 덩치는 반에서 제일 큰데 겁은 나보다 많다.',
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
    const pick = await choose(['건우가 주먹을 내민다.'], ['가위', '바위', '보']);
    const mine = ['가위', '바위', '보'][pick];
    const his = ['바위', '보', '가위'][pick];
    await say(
      { who: FRIEND, text: '가위, 바위— 보!' },
      `나는 ${mine}. 건우는… 한 박자 늦게 ${his}.`,
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
    if (flags.inRoom2 && !flags.leftRoom2) {
      await say('문틈으로 새 쇠사슬이 보인다. 나갈 땐 창문이다.');
      return;
    }
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
    if (flags.roomAgain && !flags.inRoom2) return SCRIPTS.backToRoom();
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
    if (flags.inRoom2) return flags.foundNote ? say('파인 사진 뒤의 틈은 이제 비어 있다.') : SCRIPTS.findNote();
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
    if (flags.inRoom2 && !flags.leftRoom2) return SCRIPTS.leaveRoom2();
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
    const ok = await choose(['건우가 벌써 휴대폰을 꺼내 들었다.'], ['"…아직 안 돼. 우리 아빠도 나와."', '"…마음대로 해."']) === 1;
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
    if (flags.ch2) {
      player.y -= 10;
      player.dir = 'up';
      await say('…아직 학교에서 할 일이 남았다.');
      return;
    }
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
    await SCRIPTS.ch2Start();
  },

  // ───────── 2장 「사라진 얼굴」 ─────────

  // 1층 방송실 캐비닛 (방송부 자료)
  async broadcastCabinet() {
    if (flags.heardTape) await say('90년대 테이프 칸. "98.12 점심 — 사연" 자리만 비어 있다. 데크에 꽂혀 있으니까.');
    else await say('철제 캐비닛. 문에 "방송부 자료 — 1990년대"라고 적혀 있다.', '잠겨 있다. 방송부 열쇠가 있어야 한다.');
  },

  // 화요일 점심, 2학년 6반
  async ch2Start() {
    await showChapter('2장\n사라진 얼굴', 2.4);
    await showChapter('11월 17일 화요일\n점심시간', 2.2);
    flags.ch2 = true;
    setupDay(2, CLASS_SEAT);
    addActor('student1', 18.5, 24.2, 'up', 2);
    addActor('student2', 25.5, 26.2, 'up', 2);
    await fadeInAsync();
    if (flags.rumorOk) {
      await say(
        { who: FRIEND, text: '지후야, 이거 봐. 대숲 글 조회수 3천 넘었어!' },
        '"[잠긴 교실 진짜 들어가 봄] 얼굴 파인 사진 실존함 (사진 있음)"',
        '댓글: "합성 아님?" "미신 셋 실화냐" "나 그 옆 화장실 쓰는데 이제 못 감"',
        '그때, 교실 스피커가 지직거렸다.',
        { who: '교내 방송', text: '교감입니다. 어제 방과 후 2층 창고에 무단으로 들어간 학생은, 오늘 중으로 교무실로 오기 바랍니다.' },
        { who: FRIEND, text: '……' },
        { who: FRIEND, text: '…글, 지금 지울게.' },
        { who: ME, text: '…이미 늦었어. 교감쌤도 본 거야.' },
      );
    } else {
      await say(
        { who: FRIEND, text: '지후야. 어제 그거… 나 진짜 아무한테도 말 안 했다?' },
        { who: ME, text: '…고마워.' },
      );
    }
    await say(
      { who: FRIEND, text: flags.toldDad ? '그래서, 아빠는 뭐래?' : '그래서, 아빠한테 물어봤어?' },
      flags.toldDad
        ? { who: ME, text: '"친구. 오래전에 연락이 끊긴." …그게 다야. 이름도 안 알려 줬어.' }
        : { who: ME, text: '…못 물어봤어. 아빠 얼굴 보니까 말이 안 나오더라.' },
      { who: FRIEND, text: '흠. 그럼 이름부터 알아내야겠네. 얼굴 파인 사람.' },
      { who: FRIEND, text: '1998년이면… 아! 동아리 활동 보고서. 1층 동아리 창고에 없어진 동아리 서류가 다 쌓여 있대.' },
      { who: FRIEND, text: '칠판의 "221B"가 동아리 이름이면, 거기 있을 거야.' },
    );
  },

  // 1층 동아리 창고 — 221B 활동 보고서
  async reportShelf() {
    if (!flags.ch2) {
      await say('없어진 동아리들의 활동 보고서 철이 꽂혀 있다.', '먼지가 너무 쌓여서 지금은 손대고 싶지 않다.');
      return;
    }
    if (flags.sawReport) {
      await say('「221B」 보고서 철. 마지막 줄이 자꾸 눈에 밟힌다.', '"12월 18일. 부장 전학. 활동 중지."');
      return;
    }
    flags.sawReport = true;
    await say(
      '보고서 철이 연도별로 꽂혀 있다. 천문부, 문예부, 바둑부… 전부 없어진 동아리들이다.',
      '"1998" 칸 맨 끝에 얇은 파일 하나.',
      '"추리 동아리 「221B」 — 1998학년도 활동 보고서"',
      { who: FRIEND, text: '찾았다…!' },
      '첫 장, 부원 명단. "부장: 2학년 6반 정재민 / 기록: 2학년 6반 서준호" — 부원은 둘뿐이다.',
      '그 아래 붙은 동아리 사진. 두 남학생이 책상에 앉아 어깨동무를 하고 있다.',
      '앨범의 그 사진과 똑같은 자세. 그런데 이번엔… 왼쪽 학생의 얼굴이 있다.',
      '동그란 안경. 장난기 가득한 웃음. 정재민.',
      { who: ME, text: '…이 사람이었구나.' },
      '다음 장. 손글씨로 적힌 규칙.',
      '"221B 규칙. 하나, 답은 언제나 맨 앞에 있다. 둘, 증거 없이는 말하지 않는다. 셋, 친구를 버리지 않는다."',
      '활동 기록. "10월 — 「사라진 체육복」 해결. 11월 — 「급식 우유 미스터리」 해결."',
      '"12월 — 「2학년 6반 기말고사 건」 조사 중. 증거 확보."',
      '그리고 마지막 줄. 아빠 글씨다. 꾹꾹 눌러쓴, 흔들린 글씨.',
      '"12월 18일. 부장 전학. 활동 중지."',
    );
    giveClue(REPORT_CLUE);
    addEvidence(1);
    await say(
      { who: FRIEND, text: '…J & J. 재민이랑 준호. 책상에 새긴 거, 너네 아빠랑 이 사람이었어.' },
      hasClue('1998년 달력')
        ? { who: FRIEND, text: '달력의 "J 마지막 날"도. 12월 18일. 이 사람이 전학 간 날이야.' }
        : { who: FRIEND, text: '12월 18일에 전학… 겨울방학도 되기 전에 갑자기 떠난 거네.' },
      { who: ME, text: '"기말고사 건"을 조사하다가… 갑자기 전학.' },
      { who: FRIEND, text: '셋, 친구를 버리지 않는다… 근데 너네 아빠는 이 사람 얘기를 안 하잖아.' },
      { who: ME, text: '……' },
    );
    Sound.sfx('chime');
    await say('딩동댕동— 점심시간이 끝났다.', { who: FRIEND, text: '일단 수업 들어가자. 오늘 저녁엔 꼭 물어봐. 이제 이름을 알잖아.' });
    await fadeBlack();
    actors.length = 0;
    await showChapter('그날 저녁', 1.8);
    flags.tueEvening = true;
    companion.visible = companion.following = false;
    ambient = EVENING;
    setFloor('home', HOME_DOOR);
    await fadeInAsync();
    await say('아빠는 식탁에서 노트북을 보고 있다.', '…정재민. 그 이름을 꺼내 봐야 한다.');
  },

  // 화요일 저녁: 아빠에게 정재민을 묻는다
  async dadTue() {
    if (!flags.tueEvening || flags.wed) {
      await say({ who: '아빠', text: '…응?' });
      return;
    }
    if (flags.askedJaemin) {
      await say('아빠는 노트북 화면만 보고 있다. 한 글자도 안 치면서.');
      return;
    }
    flags.askedJaemin = true;
    await say(
      { who: ME, text: '아빠. 정재민이 누구야?' },
      '타자를 치던 손이 멈췄다.',
      { who: '아빠', text: '…그 이름은 어디서.' },
      { who: ME, text: '학교 동아리 창고. 221B 활동 보고서. 부장 정재민, 기록 서준호.' },
      { who: ME, text: '앨범에서 얼굴 파인 사람, 그 사람이지?' },
      { who: '아빠', text: '……' },
      { who: '아빠', text: '중학교 때부터 친구였어. 동산중, 동산고. 맨날 붙어 다녔지.' },
      { who: '아빠', text: '추리소설 돌려 읽고, 쓸데없는 사건 쫓아다니고. …재민이가 추리하고, 아빠가 받아 적고.' },
      { who: ME, text: '근데 왜 연락 안 해?' },
      { who: '아빠', text: '언젠가부터 연락이 안 됐어.' },
    );
    // 선택: 기다릴지, 캐물을지 — 아빠의 마음
    const patient = await choose(['아빠는 그 이상 말할 생각이 없어 보인다.'],
      ['"…그렇구나."', '"그게 다일 리가 없잖아. 기말고사 건은 뭔데?"']) === 0;
    if (patient) {
      addHeart('dad', 1);
      await say({ who: ME, text: '…그렇구나.' });
      if (route.heart.dad >= 2) {
        await say(
          '한참 뒤, 아빠가 노트북을 덮었다.',
          { who: '아빠', text: '…재민이가 떠나던 날.' },
          { who: '아빠', text: '아빠는 배웅을 안 갔어. 못 간 게 아니라… 안 갔어.' },
          { who: '아빠', text: '오늘은 그게 다야.' },
        );
      } else {
        await say({ who: '아빠', text: '…일찍 자.' });
      }
    } else {
      flags.pushedDad = true;
      await say(
        { who: ME, text: '그게 다일 리가 없잖아. 보고서에 "기말고사 건 조사 중"이라고 돼 있었어. 그러고 바로 전학 갔고.' },
        { who: '아빠', text: '지후야.' },
        { who: '아빠', text: '…그 일은 너랑 상관없어.' },
        '아빠는 노트북을 들고 방으로 들어가 버렸다.',
      );
    }
    await say('…아빠한테서는 더 들을 수 없다.', '정재민. 지금 어디 있을까. 중학교 동창이라면… 내 방에서 찾아보자.');
  },

  // 내 방 책상 (화요일 밤: 동창 밴드)
  async myDesk() {
    if (flags.ch3) {
      if (flags.thuEvening && flags.dadConfessed && !flags.calledJaemin) return SCRIPTS.callJaemin();
      if (flags.thuEvening && !flags.dadConfessed) await say('…먼저 아빠와 이야기해야 한다.');
      else await say('책상 위에 수학 학습지가 펼쳐져 있다.');
      return;
    }
    if (!flags.tueEvening || flags.wed) {
      await say('책상 위에 수학 학습지가 펼쳐져 있다.', '…주말 내내 한 문제도 안 풀었다.');
      return;
    }
    if (!flags.askedJaemin) {
      await say('…먼저 아빠한테 물어보자.');
      return;
    }
    if (flags.bandDone) return;
    await say(
      '휴대폰으로 검색했다. "동산중학교 95년 졸업".',
      '…있다. 공개 밴드. "동산중 17회 졸업생 모임 — 멤버 84명"',
      '"정재민" 검색. 결과 없음. 대신 아빠 이름이 있다. 서준호 — 가입만 하고 글은 하나도 없다.',
      '최근에 글을 쓴 세 사람에게 메시지를 보냈다.',
      '"안녕하세요, 갑자기 죄송합니다. 혹시 정재민 씨 연락처를 아시나요? 아버지의 친구분이라서요."',
      '……',
      '띠링. 김태호.',
      '"정재민? 아, 고등학교 때 갑자기 전학 간 애. 그 뒤로는 몰라요. 근데 누구네 애예요? ㅎㅎ"',
      '띠링. 박선영.',
      '"재민이… 오랜만에 듣는 이름이네요. 동창회에 한 번도 안 나왔어요. 번호 아는 사람 없을 거예요. 준호는 잘 지내요?"',
      '…한참 뒤, 밤 11시 52분. 이동욱.',
      '"재민이 얘기는 좀 그래요. 그때 동산고에서 무슨 일 있었잖아요. 시험 때."',
      '"그 뒤로 걔 얘기 하면 안 되는 분위기였어요. 학생도 그만 찾는 게 좋을 거예요. 좋은 일 아니에요."',
    );
    giveClue(BAND_CLUE);
    flags.bandDone = true;
    addEvidence(1);
    await say(
      '…아무도 모른다.',
      '28년 동안, 아무도 그 사람을 찾지 않았다.',
      '"그 뒤로 걔 얘기 하면 안 되는 분위기였어요."',
      '…누가, 그런 분위기를 만든 걸까.',
    );
    await SCRIPTS.wedStart();
  },

  // 수요일 점심: 은비와 미신 하나
  async wedStart() {
    await fadeBlack();
    await showChapter('11월 18일 수요일\n점심시간', 2.2);
    flags.wed = true;
    setupDay(2, CLASS_SEAT);
    const eunbi = addActor('eunbi', 21.5, 28.2, 'down', 2);
    await fadeInAsync();
    await say(
      { who: FRIEND, text: '…그래서 동창들도 아무도 모른다고?' },
      { who: ME, text: '응. 한 명은 "시험 때 무슨 일"이 있었다면서, 그만 찾으래.' },
      { who: FRIEND, text: '기말고사 건, 시험 때 무슨 일… 다 같은 얘기잖아.' },
      { who: '은비', text: '너네 요즘 둘이서 뭘 그렇게 수군거려?' },
      flags.rumorOk
        ? { who: '은비', text: '대숲 글, 너네지? 교감쌤 방송까지 나왔잖아.' }
        : { who: '은비', text: '창고 쪽에서 너네 봤다는 애 있던데.' },
    );
    const tell = await choose(['은비는 방송부다. 그리고 미신 얘기만 나오면 팩트 체크를 한다.'],
      ['"…사실은." (다 털어놓는다)', '"미신 하나 물어보려고. 밤에 들리는 말소리."']) === 0;
    if (tell) {
      await say(
        '창고, 앨범, 파인 사진, 221B, 정재민. 은비는 끝까지 한마디도 끼어들지 않았다.',
        { who: '은비', text: '…알았어. 아무한테도 말 안 할게.' },
        { who: '은비', text: '근데 그거 알아? 미신 하나. 밤에 그 교실에서 말소리 들린다는 거.' },
      );
    } else {
      await say({ who: ME, text: '미신 하나. 밤에 그 교실에서 말소리 들린다는 거, 너 뭐 알아?' }, { who: '은비', text: '…그거 왜?' });
    }
    await say(
      { who: '은비', text: '그거 방송부 전설이야. 방송실에 진짜 오래된 카세트 데크가 있거든.' },
      { who: '은비', text: '고장 나서 가끔 혼자 돌아가. 근데 배선이 옛날 그대로라, 그 소리가 창고 교실 스피커로만 나간대.' },
      { who: FRIEND, text: '뭐가 나오는데?' },
      { who: '은비', text: '선배들 말로는… 옛날 점심 방송. 사연 읽어 주는 거.' },
      { who: ME, text: '…사연.' },
      { who: '은비', text: '방송부 자료 캐비닛에 90년대 테이프 다 있어. 열쇠는 나한테 있고.' },
      { who: '은비', text: '점심 방송 끝났으니까… 가 볼래? 1층 방송실. 먼저 가 있을게.' },
    );
    await walkActor(eunbi, 24.5, 22.5, 1.0);
    await walkActor(eunbi, 24.5, 20.5, 0.5);
    removeActor(eunbi);
    flags.toBroadcast = true;
    addActor('eunbi', 57.5, 9.2, 'down', 1);
  },

  // 1층 방송실에 들어서면: 1998년 사연 테이프 → 사연 해독
  async broadcastRoom() {
    if (!flags.toBroadcast || flags.heardTape) return;
    flags.heardTape = true;
    await say(
      { who: '은비', text: '왔어? 여기, 90년대 칸.' },
      '은비가 캐비닛을 열었다. 라벨 붙은 카세트테이프가 빼곡하다.',
      '"97.3 입학식", "98.5 체육대회", … "98.12 점심 — 사연".',
      { who: '은비', text: '이거다. 데크에 늘 끼어 있던 거. 미신 하나의 범인.' },
      '은비가 낡은 데크에 테이프를 넣었다. 철컥. 지지지직—',
      { who: '1998년 DJ', text: '…네, 점심 맛있게 드셨나요? 오늘의 마지막 사연입니다.' },
      { who: '1998년 DJ', text: '2학년 6반 J 학생이 보내 주셨어요. 이번 주에 전학을 간대요.' },
      { who: '1998년 DJ', text: '"앨리스처럼 이상한 나라에 떨어진 기분이야."' },
      { who: '1998년 DJ', text: '"범인 찾기가 내 취미였던 거, 다들 알지?"' },
      { who: '1998년 DJ', text: '"내일이면 나는 이 학교를 떠나."' },
      { who: '1998년 DJ', text: '"얼마 안 됐지만 정말 즐거웠어."' },
      { who: '1998년 DJ', text: '"굴러다니던 추리소설은 동아리방에 두고 갈게."' },
      { who: '1998년 DJ', text: '"뒤돌아보지 말라는데, 자꾸 돌아보게 되네."' },
      { who: '1998년 DJ', text: '"그리고 J에게. 우리 첫 번째 규칙, 잊지 마." …라고 하네요. J 학생, 어디 가서든 잘 지내요!' },
      '지지직— 노래가 흘러나오다 끊겼다.',
      { who: FRIEND, text: '…J가 J한테. 재민이 준호한테 보낸 거네.' },
      { who: '은비', text: '그냥 작별 인사 같은데?' },
      { who: ME, text: '…아니. 말투가 이상해. 문장이 딱딱 끊겨. 그리고 작별 인사에 규칙 얘기는 왜 해?' },
    );
    giveClue(TAPE_CLUE);
    await wait(0.3);
    if (!await Experiment.start(EXPERIMENTS.acrostic)) return;
    flags.decoded = true;
    addEvidence(1);
    await say(
      { who: '은비', text: '…앨범 내 얼굴 뒤. 소름 돋았어.' },
      { who: FRIEND, text: '얼굴 판 게 본인이었던 거야? 증거를 숨기려고?' },
    );
    if (flags.tookAlbum) {
      await say({ who: ME, text: '앨범… 내 가방에 있어.' });
      await SCRIPTS.findNote();
      return;
    }
    await say(
      { who: ME, text: '앨범은… 창고 사물함에 두고 왔어.' },
      { who: FRIEND, text: '…또 가야 돼? 그 난간?' },
      { who: '은비', text: '난간? 너네 진짜 미쳤구나.' },
      { who: ME, text: '방과 후에. 이번엔 진짜 마지막이야.' },
    );
    Sound.sfx('chime');
    await fadeBlack();
    actors.length = 0;
    await showChapter('같은 날, 방과 후\n오후 4시 30분', 2);
    flags.roomAgain = true;
    setupDay(2, { x: 58.5, y: 19, dir: 'down' }, DUSK);   // 화장실 앞 복도
    await fadeInAsync();
    await say({ who: FRIEND, text: '…가자. 빨리 끝내자. 화장실 창문.' });
  },

  // 방과 후, 두 번째 난간
  async backToRoom() {
    await say(
      '다시 창틀에 올라섰다.',
      { who: FRIEND, text: '아래 안 봐. 앞만 봐. …나 스스로한테 하는 말이야.' },
    );
    flags.inRoom2 = true;
    await fadeAsync(() => {
      setFloor(2, ROOM_LAND);
      ambient = DUST;
    });
    await say(
      '창고 안. 어제와 똑같은 먼지 냄새.',
      '…아니. 바닥이 다르다.',
      '우리 발자국 옆에, 큰 구두 발자국이 새로 찍혀 있다. 사물함 앞까지 갔다가 돌아 나갔다.',
      { who: FRIEND, text: '교감쌤… 또 왔다 갔어.' },
      { who: ME, text: '…앨범이 아직 있어야 할 텐데.' },
    );
  },

  // 파인 사진 뒤 — 쪽지 원본과 재민의 메모
  async findNote() {
    if (flags.inRoom2) await say('사물함 맨 끝 칸. …앨범은 그대로 있다.', '교감 선생님은 "아직 그대로인지"만 확인하고 간 거다. 사진 뒤까지는 모르고.');
    await say(
      '앨범을 펼쳐 파인 사진을 찾았다.',
      '네모나게 파인 자리. 손끝으로 가장자리를 만져 봤다.',
      '…두꺼운 대지가 두 겹이다. 파인 자리 안쪽, 겹 사이가 살짝 벌어져 있다.',
      '그 틈으로 접힌 종이 끝이 보인다.',
      { who: FRIEND, text: '…진짜 있어.' },
      '조심스럽게 꺼냈다. 작은 쪽지 하나, 그리고 반으로 접힌 공책 한 장.',
      '쪽지에는 번호와 동그라미가 깔끔한 글씨로 적혀 있다. "국어 — 1.③ 2.① 3.④ 4.② 5.⑤ …"',
      '시험 답이다.',
      '뒷면엔 전혀 다른, 거친 글씨. "다음 시간도 똑같이. 안 하면 알지? — 형석"',
    );
    giveClue(NOTE_CLUE);
    await say(
      '공책 종이를 펼쳤다. 보고서 규칙과 같은 글씨. 정재민의 글씨다.',
      '"1998.12.15 2교시 국어 기말. 고형석 책상 밑에서 주움."',
      '"답 글씨는 이수아. 수아는 협박당하고 있다."',
      '"담임 선생님께 말씀드렸지만 덮였다. 나는 금요일에 전학 간다."',
      '"준호야, 이걸 찾았다면— 미안하다. 너까지 휘말리게 해서."',
      '"그리고 부탁한다. — J"',
    );
    giveClue(MEMO_CLUE);
    flags.foundNote = true;
    addEvidence(2);
    await say(
      { who: ME, text: '…시험 부정. 고형석이 이수아를 협박해서, 시험 중에 쪽지로 답을 받았어.' },
      { who: ME, text: '재민 씨가 그걸 알아내서 담임한테 말했는데… 덮였어. 그리고 재민 씨만 전학 갔어.' },
      hasClue('개교기념식 안내')
        ? { who: FRIEND, text: '잠깐. 고형석… 1층 게시판! 금요일 기념식에서 감사패 받는 동문회장 이름이 고형석이야!' }
        : { who: FRIEND, text: '잠깐. 고형석… 어디서 봤는데. 아! 1층 게시판. 금요일 기념식에서 감사패 받는 동문회장!' },
      { who: ME, text: '그리고 이수아는…' },
      { who: ME, text: '…우리 국어 선생님 이름이잖아.' },
      { who: FRIEND, text: '……' },
      { who: ME, text: '담임은 감독표에 있던 문병철. …지금 교감.' },
      { who: FRIEND, text: '다 아직 이 학교에 있어. 28년 동안, 다.' },
    );
    if (flags.inRoom2) {
      await say({ who: FRIEND, text: '나가자. 교감쌤 또 오기 전에. 창문!' });
      return;
    }
    await SCRIPTS.rumorChoice2();
  },

  // 두 번째로 창고 창문을 나서면
  async leaveRoom2() {
    if (!flags.foundNote) {
      await say({ who: FRIEND, text: '앨범! 사물함 맨 끝 칸!' });
      return;
    }
    flags.leftRoom2 = true;
    await fadeAsync(() => {
      ambient = DUSK;
      setFloor(2, TOILET_BACK);
    });
    await SCRIPTS.rumorChoice2();
  },

  // 건우: 이번엔 진짜 대숲에 올리자 — 소문 / 재민의 마음
  async rumorChoice2() {
    await say(
      { who: FRIEND, text: '지후야. 이거… 이번엔 진짜 큰일이다.' },
      { who: FRIEND, text: '금요일이 기념식이잖아. 그 전에 대숲에 올리면, 고형석은 감사패 못 받아. 교감도 끝이고.' },
      { who: FRIEND, text: '올리자. 이건 올려야 돼.' },
    );
    const post = await choose(['건우 말이 틀린 건 아니다. 하지만…'],
      ['"아직이야. 증거 없이는 말하지 않는다."', '"…그래. 올리자."']) === 1;
    flags.rumorNote = post;
    if (post) {
      addRumor(2);
      await say(
        { who: ME, text: '…그래. 올리자. 다들 알아야 돼.' },
        { who: FRIEND, text: '쪽지 사진이랑 메모, 이름만 가리고. 오늘 밤에 올린다.' },
        '…가슴이 쿵쾅거린다. 잘하는 짓일까.',
      );
    } else {
      addHeart('jaemin', 1);
      await say(
        { who: ME, text: '아직이야. 221B 규칙 둘. 증거 없이는 말하지 않는다.' },
        { who: ME, text: '쪽지만으론 부족해. 이수아 선생님이 직접 말해 줘야 돼. 그리고… 재민 씨도 찾아야 돼.' },
        { who: FRIEND, text: '…너 지금 좀 탐정 같았다.' },
      );
    }
    await SCRIPTS.ch2End();
  },

  async ch2End() {
    if (!flags.inRoom2) {
      await say(
        { who: '은비', text: '…하나만 말해 줄게. 금요일 기념식 생중계, 방송부가 맡아.' },
        { who: '은비', text: '그냥… 알고 있으라고.' },
      );
    }
    await say(
      '…미신 셋. 얼굴 파인 사진을 본 사람은 전학 간다.',
      '사진을 판 건 재민 씨 자신이었다. 떠나야 한다는 걸 알고, 마지막으로 숨길 자리를 만든 거다.',
      '그리고 28년 동안, 이 쪽지는 사진 뒤에서 아빠를 기다렸다.',
    );
    flags.ch2Done = true;
    await fadeBlack();
    actors.length = 0;
    await showChapter('2장 「사라진 얼굴」 끝', 2.4);
    await SCRIPTS.ch3Start();
  },

  // ───────── 3장 「1998년의 시험」 ─────────

  // 목요일 1교시 국어 — 판서의 ③
  async ch3Start() {
    await showChapter('3장\n1998년의 시험', 2.4);
    await showChapter('11월 19일 목요일\n1교시 국어', 2.2);
    flags.ch3 = true;
    setupDay(2, CLASS_SEAT);
    const t = addActor('suah', 20.5, 23.6, 'down', 2);
    addActor('student1', 18.5, 24.2 + 2, 'up', 2);
    addActor('eunbi', 21.5, 28.2, 'up', 2);
    addActor('student3', 25.5, 24.2, 'up', 2);
    await fadeInAsync();
    await say(
      '1교시, 국어. 이수아 선생님이 교탁 앞에 섰다.',
      flags.rumorNote
        ? '교실이 수군거린다. 어젯밤 대숲에 올라간 쪽지 사진 때문이다. 이름은 가렸지만… 선생님 얼굴이 하얗다.'
        : '평소와 똑같은 목소리. 평소와 똑같은 미소.',
      { who: '이수아 선생님', text: '자, 기말 대비 문제. 답 번호만 칠판에 적을게.' },
      '선생님이 칠판에 번호를 적는다. "1.③ 2.① 3.④"',
      '…③의 꼬리가 동그랗게 말려 올라간다.',
      '가방 속 쪽지를 책상 밑에서 펼쳤다. "국어 — 1.③ 2.①…"',
      '똑같다. 꼬리를 마는 버릇까지.',
      { who: FRIEND, text: '(…지후야.)' },
      { who: ME, text: '(…응. 선생님 글씨야.)' },
    );
    Sound.sfx('chime');
    await say('딩동댕동—', { who: '이수아 선생님', text: '오늘은 여기까지. 질문 있으면 쉬는 시간에 교무실로 와.' });
    await walkActor(t, 24.5, 22.5, 0.9);
    await walkActor(t, 24.5, 20.5, 0.5);
    actors.length = 0;
    flags.suahClass = true;
    addActor('suah', 57.5, 25.4, 'down', 1);
    // 1장에서 감독표를 못 봤어도 3장 대결에 쓸 수 있게: 건우가 찍어 둔 사진
    const chart = CLUES.find(c => c.name === '기말고사 감독표');
    if (!chart.found) {
      await say(
        { who: FRIEND, text: '아 맞다. 월요일에 창고 벽에 붙어 있던 표, 나 사진 찍어 놨어. 인증샷 겸.' },
        { who: FRIEND, text: '기말고사 감독표였던 것 같은데. 보내 줄게.' },
      );
      giveClue(chart);
    }
    await say({ who: FRIEND, text: '…교무실 가자. 1층 오른쪽 끝.' });
  },

  // 1층 교무실에 들어서면 (3장)
  async office3() {
    if (!flags.ch3 || flags.memory || flags.thuEvening) return;
    if (flags.suahClass && !flags.suahMet) return SCRIPTS.suahScene();
    if (flags.gotGuestbook && flags.suahMemDone && !flags.suahWon) return SCRIPTS.suahFight();
  },

  // 교무실: 쪽지를 내민다 → 이수아의 기억
  async suahScene() {
    flags.suahMet = true;
    await say(
      '이수아 선생님이 창가 자리에서 수행평가지를 넘기고 있다.',
      { who: '이수아 선생님', text: '지후랑 건우네. 질문?' },
      { who: ME, text: '…선생님. 이거, 선생님 글씨 맞죠?' },
      '쪽지를 책상 위에 내려놓았다.',
      '선생님의 손이 멈췄다. 빨간 펜이 수행평가지 위로 굴러떨어졌다.',
      { who: '이수아 선생님', text: '……이걸, 어디서.' },
      { who: ME, text: '2층 창고. 1998년 2학년 6반 앨범 속, 정재민 씨 사진 뒤에서요.' },
      { who: '이수아 선생님', text: '재민이가… 그걸, 거기에.' },
      '선생님은 한참 쪽지를 내려다봤다.',
      { who: '이수아 선생님', text: '…맞아. 내 글씨야. 내가 형석이한테 답을 보여 줬어.' },
      { who: '이수아 선생님', text: '내가 먼저. 내가 약해서.' },
      { who: FRIEND, text: '협박당하신 거 아니에요? 메모에는—' },
      { who: '이수아 선생님', text: '아니야. …그날 얘기, 해 줄까. 그럼 알 거야. 다 내 탓이라는 거.' },
    );
    startGlitch(1.2);
    await fadeBlack();
    await showChapter('1998년 12월 15일 화요일\n2교시 직전, 쉬는 시간', 2.4);
    beginMemory('suah', 'p2', { x: 46, y: 29.4, dir: 'up' });
    await fadeInAsync();
    startGlitch(0.6);
    await say(
      '…나는 이수아. 열일곱 살. 2학년 6반.',
      '기말고사 둘째 날. 다음은 국어. 제일 자신 있는 과목이다.',
      '쉬는 시간. 교실엔 문제집 넘기는 소리뿐이다.',
      '…목이 마르다. 복도 정수기에 다녀오자.',
    );
  },

  // 기억 속: 복도의 고형석 패거리 — 부탁이 협박으로 뒤집힌다
  async suahHall() {
    if (flags.memory !== 'suah' || flags.shHall) return;
    flags.shHall = true;
    await say('복도에 나서자마자, 사물함 앞에 형석이 패거리가 있었다.', { who: '고형석', text: '어, 수아야. 마침 잘 왔다.' });
    await say(
      '형석이가 웃으면서 다가왔다.',
      { who: '고형석', text: '이번 국어 말이야. 나 진짜 망하면 아빠한테 죽거든. 좀 도와주라. 응?' },
      { who: '이수아', text: '…응. 알았어. 답, 보여 줄게.' },
      '…그래. 그렇게 된 거였다. 형석이는 부탁했고, 나는 그러겠다고 했다. 내가 먼저—',
    );
    startGlitch(1.0);
    await wait(0.3);
    Sound.sfx('hit');
    await say(
      '쾅!',
      '형석이가 내 옆 사물함을 발로 찼다.',
      { who: '고형석', text: '다음 시간. 답 써서 책상 밑으로 넘겨.' },
      { who: '고형석', text: '안 하면 알지? 너희 엄마 가게, 시장 입구 맞지? 우리 매일 놀러 간다?' },
      '패거리가 낄낄 웃었다. 다리가 떨려서 서 있을 수가 없었다.',
    );
    startGlitch(0.8);
    await say({ who: '이수아', text: '…아니야. 내가 그러겠다고 한 거야. 내가.' });
    for (const a of actors.filter(a => a.who === 'hyungseok98' || a.who === 'gang98')) removeActor(a);
    addActor('hyungseok98', 44, 28.2, 'up', 'p2');
    Sound.sfx('chime');
    await say('딩동댕동— 2교시 시작종.', '…자리로 돌아가야 한다.');
  },

  // 기억 속: 내 자리 — 2교시 국어
  async suahDesk() {
    if (flags.memory !== 'suah' || flags.shExam) return;
    if (!flags.shHall) {
      await say('내 자리. 국어 문제집이 펼쳐져 있다.', '…시험 전에 물 한 잔만 마시고 오자.');
      return;
    }
    flags.shExam = true;
    player.x = 44.5 * TILE;
    player.y = 26.4 * TILE;
    player.dir = 'up';
    addActor('gyogam98', 47, 21.9, 'down', 'p2');
    await say(
      '2교시, 국어. 감독은 담임 문병철 선생님.',
      { who: '문병철 선생님', text: '시작.' },
      '…문제가 하나도 눈에 안 들어온다. 그래도 손은 답을 쓴다. 다 아는 문제다.',
      '답을 다 쓰고, 작은 쪽지에 번호만 한 번 더 옮겨 적었다.',
      '뒤에서 의자를 툭. 형석이의 발이다.',
      '쪽지를… 책상 밑으로 떨어뜨렸다.',
      '그때, 맨 뒷자리. 재민이가 고개를 들었다. 나랑 눈이 마주쳤다.',
      '재민이는 아무 말도 하지 않았다. 대신 아주 천천히 고개를 끄덕였다. "알아." 하듯이.',
      '그리고 감독석의 문병철 선생님은…',
      '…창밖만 보고 계셨다. 처음부터 끝까지.',
    );
    startGlitch(1.2);
    await fadeBlack();
    endMemory();
    setupDay(1, { x: 57.5, y: 27.6, dir: 'up' });
    addActor('suah', 57.5, 25.4, 'down', 1);
    await fadeInAsync();
    await say(
      { who: '이수아 선생님', text: '…그래서 재민이는 나 때문에 전학 갔어. 형석이는 시킨 적 없어. 내가 보여 준 거야.' },
      { who: '이수아 선생님', text: '그렇게 말해야 했어. 그래야 끝났으니까.' },
      '…선생님의 기억에는, 금이 간 곳이 두 군데 있었다.',
    );
    giveClue(CONTRA_SH_THREAT);
    giveClue(CONTRA_SH_WINDOW, '새 단서: 모순 2개  (Tab)');
    flags.suahMemDone = true;
    addEvidence(2);
    await say(
      { who: ME, text: '선생님 기억 속 형석이는… 부탁하지 않았어요. 사물함을 찼어요.' },
      { who: '이수아 선생님', text: '…증거 있니? 28년 전 일이야. 형석이는 지금 동문회장이고.' },
      { who: FRIEND, text: '(지후야. 쪽지 뒷면 글씨. 그게 고형석 글씨라는 걸 보여 주면 돼.)' },
      { who: FRIEND, text: '(체육관! 기념식 방명록. 어제 리허설 때 동문회장이 와서 썼다고 은비가 그랬어.)' },
    );
  },

  // 체육관 무대 옆 방명록
  async guestbook() {
    if (!flags.ch3 || !flags.suahMemDone) {
      await say('기념식 방명록. 아직 몇 장 안 찼다.');
      return;
    }
    if (flags.gotGuestbook) {
      await say('방명록. 고형석의 서명이 첫 장을 크게 차지하고 있다.');
      return;
    }
    flags.gotGuestbook = true;
    await say(
      '무대 옆 받침대 위에 방명록이 펼쳐져 있다. "개교 52주년 기념식 방명록"',
      '첫 장, 굵은 펜 글씨.',
      '"모교의 무궁한 발전을 기원합니다. — 동문회장 고형석"',
      '비스듬히 누운 획. 갈고리처럼 꺾인 줄표.',
      { who: FRIEND, text: '…쪽지 뒷면이랑 똑같은데?' },
      '휴대폰으로 서명을 찍었다.',
    );
    giveClue(GUEST_CLUE);
    await say({ who: FRIEND, text: '교무실로 가자. 수아 선생님한테 보여 드리자.' });
  },

  // 교무실: 필체 대조 → 교감의 기억 → 감독표 대조
  async suahFight() {
    await say('이수아 선생님은 아직 그 자리에 앉아 있었다.', { who: ME, text: '선생님. 확인하고 싶은 게 있어요.' });
    if (!await Experiment.start(EXPERIMENTS.handwriting)) return;
    flags.suahWon = true;
    addEvidence(1);
    await say(
      '이수아 선생님이 두 손으로 얼굴을 감쌌다.',
      { who: '이수아 선생님', text: '…28년 동안, 내 탓이라고 생각하면 견딜 수 있었어.' },
      { who: '이수아 선생님', text: '형석이가 무서웠다고 말하는 것보다, 내가 나빴다고 말하는 게 덜 무서웠거든.' },
      { who: '이수아 선생님', text: '재민이는… 날 지켜 주려다 쫓겨났는데.' },
    );
    // 선택: 공감 / 증언 요구 — 수아의 마음
    const kind = await choose(['선생님의 어깨가 떨린다.'],
      ['"선생님 잘못이 아니에요."', '"내일 기념식에서, 사실대로 말해 주세요."']) === 0;
    if (kind) {
      addHeart('suah', 2);
      await say(
        { who: ME, text: '선생님 잘못이 아니에요. 열일곱 살이었잖아요.' },
        '선생님이 고개를 들었다. 눈가가 빨갰다.',
        { who: '이수아 선생님', text: '…고마워, 지후야.' },
        { who: '이수아 선생님', text: '내일. …내가, 내 입으로 말할게. 이번엔.' },
      );
    } else {
      addHeart('suah', 1);
      await say(
        { who: ME, text: '내일 기념식에서, 사실대로 말해 주세요. 고형석 앞에서.' },
        { who: '이수아 선생님', text: '……' },
        { who: '이수아 선생님', text: '…생각해 볼게. 그게 지금 할 수 있는 대답이야.' },
      );
    }
    flags.suahTestify = route.heart.suah >= 2;
    await SCRIPTS.gyogamScene();
  },

  async gyogamScene() {
    const g = addActor('gyogam', 56.5, 20.6, 'down', 1);
    await walkActor(g, 56.5, 23, 0.8);
    g.dir = 'down';
    await say(
      { who: '교감', text: '서지후. 박건우.' },
      '교감 선생님이 교무실 문 앞에 서 있었다.',
      { who: '교감', text: '창고 무단 침입. 학교 기물 반출. 그리고 지금은… 선생님을 몰아세우는 건가.' },
      { who: ME, text: '정재민 씨는 왜 전학 갔어요? 담임이셨잖아요.' },
      { who: '교감', text: '…그 학생은 친구를 모함하고, 폭력까지 썼다. 생활기록부에 다 남아 있다.' },
      { who: '교감', text: '"12월 15일 10시 55분, 2층 복도에서 정재민이 고형석을 폭행." 내가 직접 봤다.' },
      { who: '이수아 선생님', text: '…교감 선생님.' },
      { who: '교감', text: '이 선생님은 가만히 계세요. 내가 본 걸 말해 주지. 똑똑히.' },
    );
    // 문병철의 기억: 말하는 대로의 장면 → 뒤집힌 진짜 장면 → 그날 저녁
    startGlitch(1.2);
    await fadeBlack();
    await showChapter('문병철의 기억\n1998년 12월 15일 오전 10시 55분', 2.2);
    beginMemory('gyogam', 'p2', { x: 36, y: 18.4, dir: 'right' });
    const j = addActor('jaemin98', 40.5, 18.4, 'left', 'p2');
    const h = addActor('hyungseok98', 41.6, 18.4, 'left', 'p2');
    await fadeInAsync();
    await say('복도. 시험 기간이라 조용하다.', '그때 정재민이 고형석의 멱살을 잡았다.');
    h.dir = 'left';
    j.dir = 'right';
    await say({ who: '정재민', text: '너 수아한테 무슨 짓 했어!' }, '주먹이 날아갔다. 고형석이 사물함에 부딪혔다.', '…나는 똑똑히 봤다.');
    startGlitch(1.4);
    await wait(0.4);
    actors.length = 0;
    player.x = 48.5 * TILE;
    player.y = 22.6 * TILE;
    player.dir = 'right';
    camFocus = { x: 47 * TILE, y: 25 * TILE };
    for (const [x, y] of [[42, 24.2], [44, 26.2], [48, 24.2], [50, 28.2], [42, 28.2], [44, 28.2]]) addActor('student98', x, y, 'up', 'p2');
    addActor('suah98', 44.5, 26.4 - 2, 'up', 'p2');
    addActor('jaemin98', 52.5, 28.2, 'up', 'p2');
    await say(
      '…10시 55분.',
      '3교시 수학. 나는 2학년 6반 감독석에 서 있었다.',
      '정재민은 맨 뒷자리에서 시험지를 풀고 있었다.',
      '복도에는… 아무도 없었다.',
    );
    startGlitch(1.4);
    await wait(0.4);
    actors.length = 0;
    player.dir = 'down';
    addActor('chairman98', 48.5, 25, 'up', 'p2');
    await say(
      '그날 저녁. 빈 교실.',
      { who: '운영위원장', text: '선생님. 기록은 이렇게 쓰시죠. "10시 55분, 2층 복도. 정재민이 폭행."' },
      { who: '운영위원장', text: '신관 공사, 이번에 우리 회사가 맡기로 했잖습니까. 선생님 교무부장 자리도 얘기 다 됐고요.' },
      '…나는 펜을 들었다.',
    );
    startGlitch(1.2);
    await fadeBlack();
    endMemory();
    setupDay(1, { x: 57.5, y: 27.6, dir: 'up' });
    addActor('suah', 57.5, 25.4, 'down', 1);
    const g2 = addActor('gyogam', 56.5, 23, 'down', 1);
    await fadeInAsync();
    await say({ who: '교감', text: '…나는 봤다. 봤어.' }, '교감 선생님의 목소리가 조금 흔들렸다.');
    giveClue(CONTRA_GG_SEAT);
    giveClue(CONTRA_GG_GUEST, '새 단서: 모순 2개  (Tab)');
    addEvidence(2);
    await wait(0.3);
    if (!await Experiment.start(EXPERIMENTS.timetable)) return;
    flags.gyogamWon = true;
    addEvidence(2);
    await say(
      '교감 선생님이 빈 의자에 털썩 주저앉았다.',
      { who: '교감', text: '…운영위원장님이 쓰라는 대로 썼다. 형석이 아버지.' },
      { who: '교감', text: '신관 공사, 학교 예산, 내 자리… 그 사람 말 한마디에 다 달려 있었다. 스물아홉 살 담임이 뭘 할 수 있었겠나.' },
      { who: '교감', text: '정재민이 증거를 들고 왔을 때, 나는 그 애를 막았다. 전학을 "권했다". 조용히 끝내자고.' },
      { who: '교감', text: '그 교실을 잠근 것도 나다. 열 때마다… 그 애 자리가 보여서.' },
      { who: ME, text: '…"아직 그대로군." 그 말, 그 뜻이었어요?' },
      { who: '교감', text: '……' },
      { who: '교감', text: '내일 기념식은 예정대로 한다. 고형석 회장은 감사패를 받는다. 너희가 뭘 하든.' },
      '교감 선생님은 그 말만 남기고 교무실을 나갔다. 등이 작아 보였다.',
    );
    await walkActor(g2, 56.5, 20.6, 0.9);
    removeActor(g2);
    await say(
      { who: '이수아 선생님', text: '…지후야. 재민이, 찾을 수 있겠니?' },
      { who: ME, text: '…찾아볼게요.' },
      { who: FRIEND, text: '너네 아빠. 이제 진짜 다 물어봐야 해.' },
    );
    await fadeBlack();
    actors.length = 0;
    await showChapter('그날 저녁', 1.8);
    flags.thuEvening = true;
    companion.visible = companion.following = false;
    ambient = EVENING;
    setFloor('home', HOME_DOOR);
    await fadeInAsync();
    await say('아빠는 식탁에 앉아 있다. 노트북은 꺼져 있다.', '…내일은 기념식이다. 오늘 물어봐야 한다.');
  },

  // 목요일 저녁: 아빠
  async dadThu() {
    if (flags.dadConfessed) {
      await say('아빠는 메모를 손에 쥔 채 가만히 앉아 있다.');
      return;
    }
    if (flags.dadRefused) {
      await say('아빠 방 문은 닫혀 있다.');
      return;
    }
    if (route.heart.dad < 2) {
      flags.dadRefused = true;
      await say(
        { who: ME, text: '아빠. 오늘 이수아 선생님이랑 교감 선생님 만났어.' },
        '아빠가 의자에서 일어났다.',
        { who: '아빠', text: '…그만하라고 했잖아.' },
        { who: '아빠', text: '피곤하다. 먼저 잘게.' },
        '아빠는 방으로 들어갔다. 검은 가방이 거실 구석에 그대로 놓여 있다.',
      );
      return;
    }
    await say(
      { who: ME, text: '아빠. 오늘 이수아 선생님이랑 교감 선생님 만났어. 다 들었어. 시험, 쪽지, 생활기록부.' },
      '아빠가 한참 아무 말도 하지 않았다.',
      { who: '아빠', text: '…앉아. 이제는 말해야겠다.' },
    );
    await SCRIPTS.dadConfess();
  },

  // 목요일 밤: 아빠의 검은 가방 (아빠가 말을 피했을 때)
  async dadBag() {
    if (!flags.thuEvening || !flags.dadRefused || flags.readDiary || flags.dadConfessed) {
      await say('아빠의 검은 가방. 회사 서류가 들어 있겠지.');
      return;
    }
    const open = await choose(['아빠의 검은 가방. 지퍼 사이로 낡은 공책 모서리가 보인다.'], ['열어 본다', '…그만둔다']) === 0;
    if (!open) return;
    flags.readDiary = true;
    addHeart('dad', -1);
    await say(
      '공책을 꺼냈다. 표지에 "1998"이라고 적혀 있다. 아빠의 일기장이다.',
      '"12월 16일. 점심 방송에 재민이 사연이 나왔다. 첫 글자. 알아챘다. 앨범 내 얼굴 뒤."',
      '"12월 17일. 담임이 물었다. 정재민 말이 맞냐고. 나는… 아무것도 못 봤다고 했다."',
      '"12월 18일. 재민이 가는 날. 나가지 않았다. 앨범도 열지 않았다."',
      '"셋, 친구를 버리지 않는다. 나는 버렸다."',
      '…등 뒤에서 문 열리는 소리.',
      { who: '아빠', text: '…그거.' },
      '아빠가 서 있었다. 화를 내지 않았다. 그냥, 아주 지친 얼굴이었다.',
      { who: '아빠', text: '…그래. 이제는 말해야겠다.' },
    );
    await SCRIPTS.dadConfess();
  },

  async dadConfess() {
    flags.dadConfessed = true;
    await say(
      { who: '아빠', text: '재민이가 증거를 모았을 때, 아빠도 같이 있었어. 221B 마지막 사건이었지.' },
      { who: '아빠', text: '재민이가 그랬어. 담임한테 같이 가자고. 너는 증인만 서 주면 된다고.' },
      { who: '아빠', text: '그날 방과 후, 옥상 계단에서 형석이 패거리가 아빠를 막았어. "너도 전학 가고 싶냐."' },
      { who: '아빠', text: '다음 날 담임이 물었어. 정재민 말이 맞냐고. 아빠는… "아무것도 못 봤어요."라고 했어.' },
      { who: '아빠', text: '셋, 친구를 버리지 않는다. …아빠가 버렸어.' },
      { who: '아빠', text: '사연도 들었어. 첫 글자. 알아챘어. 근데 앨범을 열지 않았어.' },
      { who: '아빠', text: '열면… 내가 비겁했다는 걸 다시 봐야 하니까.' },
      { who: '아빠', text: '재민이 가던 날도 안 나갔어. 그 뒤로 몇 번 전화가 왔는데, 안 받았어. 그러다 끊겼어.' },
    );
    giveClue(DAD_CLUE);
    addEvidence(1);
    await say(
      '재민 씨의 메모를 아빠 앞에 펼쳤다.',
      '"준호야, 이걸 찾았다면— 미안하다. 너까지 휘말리게 해서. 그리고 부탁한다."',
      '아빠가 메모를 한참 내려다봤다.',
      { who: '아빠', text: '…미안하다고? 재민이가? 왜… 왜 걔가.' },
      '아빠가 울었다. 처음 보는 얼굴이었다.',
    );
    // 선택: 내일 같이 가 달라고 할지 — 아빠의 마음
    const ask = await choose(['…내일은 기념식이다.'], ['"내일, 같이 가 줘."', '"…아빠는 안 와도 돼. 내가 할게."']) === 0;
    if (ask) {
      addHeart('dad', 1);
      flags.dadComes = route.heart.dad >= 2;
      await say(
        { who: ME, text: '내일, 같이 가 줘. 아빠가 열지 못한 앨범, 내가 열었어. 이번엔 같이 가자.' },
        flags.dadComes
          ? { who: '아빠', text: '…가자. 이번엔. 28년 늦었지만.' }
          : { who: '아빠', text: '…생각해 볼게. 아빠가 거기 설 자격이 있는지.' },
      );
    } else {
      await say({ who: ME, text: '…아빠는 안 와도 돼. 내가 할게.' }, '아빠는 대답하지 않았다. 대신 메모를 오래 쥐고 있었다.');
    }
    await say(
      { who: '아빠', text: '재민이는 해원고로 전학 갔어. …그 뒤는 아빠도 몰라.' },
      '…해원고. 찾아볼 수 있다. 내 방 책상에서.',
    );
  },

  // 목요일 밤: 정재민 경위에게 전화
  async callJaemin() {
    flags.calledJaemin = true;
    await say(
      '"해원고 정재민" 검색.',
      '…졸업생 인터뷰 기사 하나. 2024년, 지역 신문.',
      '"해원고 출신 정재민 경위, 10년 추적 끝에 보이스피싱 조직 검거"',
      '사진 속 남자. 동그란 안경. 장난기는 사라졌지만… 그 얼굴이다.',
      '"증거 없이는 말하지 않는다. 학창 시절 동아리 규칙이었죠." — 정재민 경위',
    );
    giveClue(NEWS_CLUE);
    await say(
      '기사에 적힌 해원경찰서 번호로 전화를 걸었다. 밤 10시.',
      '…신호음.',
      { who: '당직 경찰관', text: '해원경찰서입니다.' },
      { who: ME, text: '저… 정재민 경위님 계세요? 개인적인 일인데요.' },
      { who: '당직 경찰관', text: '잠깐만요. …마침 계시네.' },
      '……',
      { who: '정재민', text: '정재민입니다.' },
      { who: ME, text: '…저, 서지후라고 합니다. 서준호 아들이에요.' },
      '긴 침묵.',
      { who: '정재민', text: '…준호, 아들.' },
      { who: '정재민', text: '준호는… 잘 지내니.' },
      { who: ME, text: '동산고 2층 창고에서 앨범을 찾았어요. 사진 뒤의 쪽지도요.' },
      { who: '정재민', text: '……' },
      { who: '정재민', text: '…미안하다. 그 학교 일엔 다시 엮이고 싶지 않아. 28년이야. 다 끝난 일이다.' },
    );
    // 선택: 무슨 말로 붙잡을지 — 재민의 마음
    const pick = await choose(['전화가 끊길 것 같다. 뭐라고 해야 할까.'],
      ['메모의 마지막 줄을 읽어 드린다', '"아빠가… 울었어요."', '"내일 기념식에서 다 밝힐 거예요."']);
    if (pick === 0) {
      addHeart('jaemin', 2);
      await say(
        { who: ME, text: '"준호야, 이걸 찾았다면— 미안하다. 그리고 부탁한다. — J"' },
        { who: '정재민', text: '…그걸 찾았구나. 결국 준호가 아니라, 준호 애가.' },
        { who: '정재민', text: '부탁한다고 썼었지. 열일곱 살짜리가 뭘 부탁할 수 있었을까. …수아를 부탁한다는 거였어.' },
      );
    } else if (pick === 1) {
      addHeart('jaemin', flags.dadComes ? 2 : 1);
      await say(
        { who: ME, text: '아빠가 울었어요. 사연 첫 글자, 알아챘는데 무서워서 앨범을 못 열었대요.' },
        { who: '정재민', text: '…준호가.' },
        { who: '정재민', text: '알아챘구나. …그걸로 됐어. 그거면 됐다.' },
      );
    } else {
      await say(
        { who: ME, text: '내일 개교기념식에서 다 밝힐 거예요. 고형석 앞에서.' },
        { who: '정재민', text: '…그러다 너만 다친다. 고형석은 그때도 지금도, 변호사가 다섯은 붙어 있어.' },
      );
    }
    flags.jaeminMaybe = route.heart.jaemin >= 2;
    await say(flags.jaeminMaybe
      ? { who: '정재민', text: '…내일 몇 시라고? 열 시. …약속은 못 한다. 그래도, 기억해 둘게.' }
      : { who: '정재민', text: '…늦었다. 끊자. 준호한테… 아니다. 끊을게.' });
    await say(
      '뚝. 전화가 끊겼다.',
      '내일은 금요일. 개교 52주년 기념식.',
      '28년 동안 잠겨 있던 교실의 문을, 내일 연다.',
    );
    flags.ch3Done = true;
    await fadeBlack();
    await showChapter('3장 「1998년의 시험」 끝', 2.4);
    await SCRIPTS.ch4Start();
  },

  // ───────── 4장 「다시 열린 교실」 ─────────

  // 금요일 아침, 집
  async ch4Start() {
    await showChapter('4장\n다시 열린 교실', 2.4);
    await showChapter('11월 20일 금요일\n오전 7시 40분', 2.2);
    flags.ch4 = true;
    actors.length = 0;
    ambient = null;
    companion.visible = companion.following = false;
    setFloor('home', { x: 21.5, y: 11, dir: 'up' });
    await fadeInAsync();
    if (flags.dadComes) {
      await say(
        '아빠가 식탁 앞에 서 있었다. 양복 차림. 넥타이를 몇 번이나 고쳐 매고 있다.',
        { who: '아빠', text: '…졸업식 이후로 처음 매 본다, 이 넥타이.' },
        { who: '아빠', text: '먼저 가 있어. 기념식 시작 전에 갈게. 이번엔… 간다.' },
      );
    } else if (flags.dadConfessed) {
      await say(
        '아빠는 벌써 출근하고 없었다. 식탁 위에 쪽지 한 장.',
        '"밥 먹고 가. — 아빠"',
        '…그 밑에, 지웠다가 다시 쓴 듯한 글씨. "미안하다."',
      );
    } else {
      await say('아빠는 벌써 출근하고 없었다.', '식탁 위엔 식은 계란프라이 하나.');
    }
    await fadeBlack();
    await showChapter('오전 8시 10분\n2학년 6반', 1.8);
    setupDay(2, CLASS_SEAT);
    addActor('eunbi', 21.5, 28.2, 'down', 2);
    await fadeInAsync();
    await SCRIPTS.fridayClass();
  },

  // 2학년 6반: 마지막 작전 회의 → 최종 선택
  async fridayClass() {
    // 소문이 너무 커졌다 — 엔딩 3 「소문」
    if (route.rumor >= 4) return SCRIPTS.endingRumor();
    await say(
      { who: FRIEND, text: '…드디어 오늘이네.' },
      route.rumor >= 2
        ? { who: '은비', text: '동문회 쪽에서 대숲 글 신고했대. "허위 사실 유포". 고형석, 벌써 눈치챘어.' }
        : { who: '은비', text: '고형석 회장, 아홉 시 반에 학교 도착한대. 기념식은 열 시.' },
      { who: '은비', text: '생중계 카메라는 무대 바로 앞이야. …마이크 하나, 빼 둘 수 있어.' },
      { who: FRIEND, text: '어떻게 할 거야, 지후야? 네가 정해.' },
      '쪽지 원본. 재민 씨의 메모. 방명록. 감독표.',
      flags.suahTestify ? '…수아 선생님은 "내 입으로 말할게"라고 했다.' : '…수아 선생님은 "생각해 볼게"라고만 했다.',
      flags.dadComes ? '아빠는 "이번엔 간다"고 했다.' : '아빠는… 오지 않을지도 모른다.',
      flags.jaeminMaybe ? '재민 씨는 "기억해 둘게"라고 했다.' : '재민 씨는 전화를 끊었다.',
    );
    const options = ['기념식에서, 모두 앞에서 밝힌다', '기념식 전에 고형석을 따로 만난다'];
    if (flags.dadComes) options.push('아빠에게 맡긴다');
    const pick = await choose(['28년 동안 잠겨 있던 교실. 어떻게 열까.'], options);
    flags.finalChoice = ['public', 'private', 'dad'][pick];
    if (flags.finalChoice === 'private') {
      await say(
        { who: ME, text: '모두 앞에서 망신 주는 게 목적이 아니야. 고형석이 직접 인정하게 만들 거야.' },
        { who: FRIEND, text: '…따로 만나자고? 그 사람 혼자 안 올걸.' },
        { who: '은비', text: '아홉 시 반, 체육관 무대 뒤에서 혼자 감사 인사 연습한대. 방송부가 마이크 설치하다 봤어.' },
      );
      return SCRIPTS.privateMeet();
    }
    if (flags.finalChoice === 'dad') {
      await say(
        { who: ME, text: '…아빠한테 맡길 거야. 아빠가 28년 전에 못 한 말이니까.' },
        { who: FRIEND, text: '너네 아빠가 무대에 선다고? …멋있다.' },
        { who: ME, text: '증거는 내가 들고 있을게. 아빠가 말하면, 내가 증명할 거야.' },
      );
    } else {
      await say(
        { who: ME, text: '기념식에서 밝힐 거야. 28년 전엔 다들 조용히 덮었잖아. 이번엔 다 같이 보게 할 거야.' },
        { who: '은비', text: '…좋아. 마이크는 내가 줄게. 생중계는 끊기지 않게 할게.' },
        { who: FRIEND, text: '나는 네 옆에 서 있을게. 덩치 값은 해야지.' },
      );
    }
    await SCRIPTS.ceremony();
  },

  // 오전 10시, 체육관 — 개교 52주년 기념식
  async ceremony() {
    await fadeBlack();
    actors.length = 0;
    await showChapter('오전 10시\n체육관 — 개교 52주년 기념식', 2.2);
    setupCeremony();
    await fadeInAsync();
    await say(
      '체육관이 꽉 찼다. 학생, 선생님, 동문회 사람들. 무대 앞엔 방송부 카메라.',
      { who: '교감', text: '…다음은 감사패 전달이 있겠습니다. 모교 발전에 힘써 주신 고형석 동문회장님.' },
      '박수 소리. 고형석이 무대 가운데로 걸어 나왔다.',
      { who: '고형석', text: '사랑하는 후배 여러분. 이 학교는 제 인생의 뿌리입니다.' },
      { who: '고형석', text: '저는 이 교실들에서 정직과 용기를 배웠습니다.' },
      { who: FRIEND, text: '(…정직? 용기?)' },
    );
    if (flags.finalChoice === 'dad') {
      const dad = actors.find(a => a.who === 'dad');
      await say('그때, 뒤쪽에서 누군가 일어섰다.', { who: '아빠', text: '…잠깐만요.' });
      await walkActor(dad, 78.5, 47.5, 1.4);
      dad.dir = 'up';
      await say(
        { who: '아빠', text: '저는 2000년 졸업생 서준호입니다. 1998년, 2학년 6반이었습니다.' },
        { who: '고형석', text: '……준호?' },
        { who: '아빠', text: '28년 전에 하지 못한 말이 있습니다. 그때 저는 "아무것도 못 봤다"고 했습니다. 거짓말이었습니다.' },
        '체육관이 술렁였다. 아빠가 나를 돌아봤다.',
        { who: '아빠', text: '증거는… 제 아이가 찾았습니다.' },
        '은비가 마이크를 건넸다. 카메라의 빨간 불이 나를 향했다.',
      );
    } else {
      await say(
        '…지금이다.',
        { who: ME, text: '잠깐만요!' },
        '수백 개의 눈이 한꺼번에 나를 봤다. 은비가 재빨리 마이크를 건넸다.',
        '카메라의 빨간 불. 생중계 중.',
        { who: ME, text: '2학년 6반 서지후입니다. 그 감사패를 드리기 전에, 확인할 게 있어요.' },
        { who: ME, text: '1998년 12월 15일, 2교시 국어 시험. 고형석 회장님은 그날 무엇을 하셨어요?' },
      );
    }
    await say(
      '고형석의 얼굴에서 웃음이 사라졌다가, 금세 다시 걸렸다.',
      { who: '고형석', text: '…하하. 학생, 무슨 소린지 모르겠는데. 28년 전 애들 장난 얘기인가?' },
    );
    if (!await Experiment.start(EXPERIMENTS.final)) return;
    addEvidence(2);
    await SCRIPTS.testimonies();
  },

  // 대결 뒤: 누가 일어서 주는가
  async testimonies() {
    let count = 0;
    await say('체육관이 쥐 죽은 듯 조용해졌다.', { who: '고형석', text: '…쪽지 한 장, 글씨 몇 개. 그걸로 뭘 하겠다는 거지? 증인이라도 있나?' });
    if (flags.suahTestify) {
      count++;
      const s = actors.find(a => a.who === 'suah');
      await walkActor(s, 74.5, 47.5, 1.0);
      await say(
        '교사석에서 이수아 선생님이 일어섰다.',
        { who: '이수아 선생님', text: '…있습니다. 제가 그 쪽지를 썼습니다. 1998년 2학년 6반, 이수아입니다.' },
        { who: '이수아 선생님', text: '고형석 씨가 시켰습니다. 안 하면 저희 엄마 가게에 찾아오겠다고 했습니다.' },
        { who: '이수아 선생님', text: '28년 동안 제 탓이라고 말해 왔습니다. 오늘은 사실을 말하겠습니다.' },
      );
      await say(
        '교감 선생님이 마이크 앞에서 한참 서 있다가, 고개를 숙였다.',
        { who: '교감', text: '…정재민 학생의 생활기록부는, 제가 사실과 다르게 썼습니다. 운영위원장님의 요청으로.' },
      );
    }
    if (flags.dadComes && flags.finalChoice !== 'dad') {
      count++;
      await say(
        '뒤쪽에서 아빠가 일어섰다. 양복 차림.',
        { who: '아빠', text: '…저도 증인입니다. 2000년 졸업생 서준호. 그때 정재민과 함께 증거를 모았습니다.' },
        { who: '아빠', text: '그리고 겁이 나서 침묵했습니다. 28년 동안.' },
      );
    } else if (flags.finalChoice === 'dad') {
      count++;
    }
    if (flags.jaeminMaybe) {
      count++;
      const j = addActor('jaemin', 66.5, 57.5, 'right', 1);
      await say('…체육관 뒷문이 열렸다.');
      await walkActor(j, 71.5, 53.5, 1.4);
      j.dir = 'up';
      await say(
        '회색 점퍼. 동그란 안경. 숨이 조금 차 있다.',
        { who: '정재민', text: '…늦었습니다. 해원경찰서 정재민입니다. 1998년 2학년 6반이었고요.' },
        { who: '정재민', text: '증거 없이는 말하지 않는다. …그래서 28년 동안 말하지 않았습니다. 증거는 앨범 속에 두고 왔으니까.' },
        { who: '정재민', text: '그 증거를, 이 학생이 찾아 줬습니다.' },
        '아빠와 재민 씨의 눈이 마주쳤다.',
      );
    }
    if (count >= 2) return SCRIPTS.endingOpen();
    return SCRIPTS.endingLocked('public');
  },

  // 기념식 전, 무대 뒤에서 고형석과 단둘이
  async privateMeet() {
    await fadeBlack();
    actors.length = 0;
    await showChapter('오전 9시 30분\n체육관 무대 옆', 2.0);
    setupDay(1, { x: 84.5, y: 45.5, dir: 'up' });
    addActor('hyungseok', 86.5, 43.4, 'down', 1);
    await fadeInAsync();
    await say(
      '고형석이 감사패를 들고 거울 앞에서 표정을 연습하고 있었다.',
      { who: '고형석', text: '…응? 학생들은 아직 입장 시간이 아닌데.' },
      { who: ME, text: '서지후예요. 서준호 아들이에요.' },
      { who: '고형석', text: '…서준호. 하하, 이거 반갑네. 그래서? 뭘 원하지? 장학금? 우리 회사 인턴?' },
      { who: ME, text: '1998년 12월 15일, 2교시 국어 시험. 그 얘기를 하러 왔어요.' },
      { who: '고형석', text: '……28년 전 애들 장난 얘기를, 굳이.' },
    );
    if (!await Experiment.start(EXPERIMENTS.final)) return;
    addEvidence(2);
    await say(
      '고형석이 감사패를 내려놓았다.',
      { who: '고형석', text: '…이걸 들고 기념식에 들어가면 어떻게 될까. 생중계라던데.' },
      { who: '고형석', text: '좋아. 거래하자. 감사패는 받지 않겠다. "몸이 안 좋아서". 그걸로 끝내지.' },
    );
    const ask = await choose(['고형석은 사과할 생각이 없어 보인다.'],
      ['"이수아 선생님과 정재민 씨한테 사과하세요."', '"…감사패만 받지 마세요. 그걸로 됐어요."']) === 0;
    if (ask) {
      await say(
        { who: ME, text: '이수아 선생님과 정재민 씨한테 사과하세요. 직접.' },
        { who: '고형석', text: '……' },
        { who: '고형석', text: '…수아한텐, 편지를 쓰지. 재민이는… 걔가 받을지 모르겠군.' },
      );
      addHeart('suah', 1);
    } else {
      await say({ who: ME, text: '…감사패만 받지 마세요. 그걸로 됐어요.' }, { who: '고형석', text: '현명하군.' });
    }
    await say(
      '그날 기념식에서, 감사패 순서는 조용히 빠졌다.',
      '"동문회장님께서 건강상의 이유로 불참하셨습니다." 교감 선생님의 목소리가 조금 떨렸다.',
      '아무도 이유를 몰랐다. 우리 말고는.',
    );
    if (flags.dadComes && flags.jaeminMaybe) return SCRIPTS.endingReunion();
    return SCRIPTS.endingLocked('private');
  },

  // ── 엔딩 1 「다시 열린 교실」 ──
  async endingOpen() {
    flags.ending = 1;
    await say(
      '고형석은 감사패를 내려놓고 무대를 내려갔다. 아무도 박수를 치지 않았다.',
      '생중계 영상은 그날 오후 지역 뉴스에 나왔다.',
      '고형석의 감사패와 발전 기금은 반환됐다. 교감 선생님은 그 주에 사직서를 냈다.',
      '정재민 씨의 생활기록부는 28년 만에 정정됐다.',
    );
    await fadeBlack();
    actors.length = 0;
    await showChapter('다음 주 월요일\n방과 후', 2.2);
    flags.ch4Room = true;
    showPadlock(false);
    setupDay(2, { x: 50.5, y: 24, dir: 'down' }, DUSK);
    if (flags.dadComes) addActor('dad', 45.5, 29.2, 'right', 2);
    if (flags.jaeminMaybe) addActor('jaemin', 47.5, 29.2, 'left', 2);
    await fadeInAsync();
    await say(
      '2층 창고의 쇠사슬이 풀렸다. 문이 열려 있다.',
      '창문으로 들어오던 교실에, 처음으로 문으로 들어왔다.',
      '먼지를 털어 낸 칠판 구석에, 그 글씨가 아직 남아 있다. "221B"',
    );
    if (flags.dadComes && flags.jaeminMaybe) {
      await say(
        { who: '정재민', text: '…늦었다, 준호야.' },
        { who: '아빠', text: '……응. 28년.' },
        { who: '아빠', text: '재민아. 사연, 알아챘었어. 근데 무서워서 앨범을 못 열었어.' },
        { who: '정재민', text: '알아. 그래서 미안하다고 썼잖아. 너까지 휘말리게 해서.' },
        { who: '아빠', text: '…규칙 셋. 친구를 버리지 않는다. 내가 버렸는데.' },
        { who: '정재민', text: '아니. 네 애가 주워 왔잖아.' },
        '두 사람이 동시에 나를 봤다. 그리고 동시에 웃었다. 사진 속 그 웃음이었다.',
      );
    } else if (flags.dadComes) {
      await say(
        { who: '아빠', text: '…재민이 자리가 저기였어. 맨 뒷줄 창가.' },
        { who: '아빠', text: '연락해 볼게. 이번엔 아빠가 먼저.' },
      );
    } else {
      await say(
        { who: '정재민', text: '…준호는 아직 못 오겠다더라. 괜찮아. 문이 열렸으니까.' },
        { who: '정재민', text: '언제든 들어올 수 있잖아.' },
      );
    }
    await SCRIPTS.finish(1);
  },

  // ── 엔딩 2 「221B」 ──
  async endingReunion() {
    flags.ending = 2;
    await fadeBlack();
    actors.length = 0;
    await showChapter('그날 오후\n2층 창고', 2.2);
    flags.ch4Room = true;
    showPadlock(false);
    setupDay(2, { x: 50.5, y: 24, dir: 'down' }, DUSK);
    addActor('dad', 45.5, 29.2, 'right', 2);
    addActor('jaemin', 47.5, 29.2, 'left', 2);
    await fadeInAsync();
    await say(
      '교감 선생님이 말없이 열쇠를 건네줬다. "열어 줄 사람은… 너희 같다."',
      '쇠사슬이 풀린 창고. 기념식이 끝난 오후, 아빠와 재민 씨가 마주 섰다.',
      { who: '정재민', text: '…감사패, 안 받았다며. 네 애가 혼자 해냈다고.' },
      { who: '아빠', text: '…응. 나는 옆에 서 있기만 했어. 28년 전처럼은 아니게.' },
      { who: '정재민', text: '그거면 됐어.' },
      '아무도 모르는 진실. 아무도 박수 치지 않은 승리.',
      '그래도 이 교실의 문은 열렸고, 두 사람은 다시 같은 교실에 서 있다.',
      { who: '아빠', text: '…규칙 셋.' },
      { who: '정재민', text: '친구를 버리지 않는다.' },
    );
    await SCRIPTS.finish(2);
  },

  // ── 엔딩 3 「소문」 ──
  async endingRumor() {
    flags.ending = 3;
    await say(
      { who: FRIEND, text: '…지후야. 미안해.' },
      '대숲 글은 밤새 수천 번 공유됐다. 쪽지 사진, 메모, 그리고 누군가 덧붙인 이름들.',
      '아침 7시, 학교 홈페이지에 공지가 떴다. "허위 사실 유포에 대해 법적 대응을 검토 중입니다. — 동산고 동문회"',
      { who: '은비', text: '수아 선생님… 오늘 병가 내셨대. 교감쌤은 앨범 증거물로 가져가셨고.' },
      '기념식은 예정대로 열렸다. 고형석은 웃으며 감사패를 받았다.',
      '"잠긴 교실 8대 미신 — 얼굴 파인 사진엔 협박 쪽지가 숨어 있다(?)"',
      '…진실은, 미신이 되어 버렸다.',
    );
    await fadeBlack();
    await showChapter('그날 저녁', 1.8);
    ambient = EVENING;
    companion.visible = companion.following = false;
    actors.length = 0;
    setFloor('home', { x: 21.5, y: 11, dir: 'up' });
    await fadeInAsync();
    await say(
      { who: '아빠', text: '…학교 얘기 들었다.' },
      { who: ME, text: '…증거 없이는 말하지 않는다. 그 규칙, 내가 어겼어.' },
      { who: '아빠', text: '그래도 넌 열어 봤잖아. 아빤 28년 동안 못 열었는데.' },
      flags.dadConfessed ? { who: '아빠', text: '…재민이한텐, 아빠가 직접 연락할게. 그건 소문이 아니니까.' } : { who: '아빠', text: '…밥 먹자.' },
    );
    await SCRIPTS.finish(3);
  },

  // ── 엔딩 4 「다시 잠긴 교실」 ──
  async endingLocked(how) {
    flags.ending = 4;
    if (how === 'public') {
      await say(
        '…아무도 일어서지 않았다.',
        { who: '고형석', text: '보세요. 증인은 없습니다. 학생의 상상력이 좀 지나쳤을 뿐이죠.' },
        '동문회 측 변호사가 은비의 카메라 앞을 막아섰다. 생중계가 끊겼다.',
        '기념식은 "잠시 소란이 있었습니다"라는 말과 함께 다시 이어졌다.',
      );
    } else {
      await say('고형석은 아무 일 없었다는 듯 기념식에 나타났다. 감사패를 받고, 웃었다.', '단둘이 나눈 이야기는, 단둘의 이야기로 끝났다.');
    }
    await say(
      '그 주 금요일 오후, 2층 창고의 쇠사슬이 한 겹 더 감겼다.',
      '교실은 다시 잠겼다.',
    );
    await fadeBlack();
    await showChapter('그날 밤', 1.8);
    ambient = EVENING;
    companion.visible = companion.following = false;
    actors.length = 0;
    setFloor('home', { x: 21.5, y: 11, dir: 'up' });
    await fadeInAsync();
    await say(
      '아빠가 거실에 앉아 있었다. 장식장의 졸업앨범을 무릎에 펼친 채.',
      { who: '아빠', text: '…지후야. 이리 와 봐.' },
      { who: '아빠', text: '221B 첫 사건, 얘기해 줄까. 「사라진 체육복」. 재민이가 범인을 30분 만에 찾았지.' },
      { who: '아빠', text: '…다 얘기해 줄게. 하나도 빼지 않고.' },
      '교실은 다시 잠겼지만, 아빠의 이야기는 처음으로 열렸다.',
    );
    await SCRIPTS.finish(4);
  },

  // 엔딩 이름 → (숨은 에필로그) → 끝 → 크레딧 → 타이틀
  async finish(n) {
    const NAMES = { 1: '다시 열린 교실', 2: '221B', 3: '소문', 4: '다시 잠긴 교실' };
    await fadeBlack();
    await showChapter(`엔딩 ${n}\n「${NAMES[n]}」`, 3.2);
    // 숨은 에필로그: 프롤로그에서 아빠의 학교 얘기를 들었고, 진실을 소문으로 만들지 않았다면
    if (flags.dadStory && !flags.rumorNote && (n === 1 || n === 2)) {
      await showChapter('에필로그\n「221B, 다시」', 2.6);
      setupDay(2, { x: 46, y: 28.4, dir: 'up' }, DUSK);
      addActor('eunbi', 48.5, 28.4, 'up', 2);
      await fadeInAsync();
      await say(
        '한 달 뒤. 창고였던 교실은, 다시 교실이 됐다.',
        '책상 위에 동아리 등록 신청서가 놓여 있다.',
        '"동아리명: 추리 동아리 221B"',
        '"부장: 2학년 6반 서지후 / 기록: 2학년 6반 박건우 / 부원: 최은비"',
        flags.suahTestify ? '"지도 교사: 이수아"' : '"지도 교사: (구하는 중)"',
        { who: FRIEND, text: '근데 내가 왜 기록이야? 덩치로 보면 내가 부장인데.' },
        { who: '은비', text: '네 글씨가 제일 크잖아.' },
        { who: ME, text: '규칙은 그대로 갈 거야. 하나, 답은 언제나 맨 앞에 있다.' },
        { who: FRIEND, text: '둘, 증거 없이는 말하지 않는다.' },
        { who: '은비', text: '셋.' },
        '셋이 동시에 말했다.',
        '"친구를 버리지 않는다."',
      );
      await fadeBlack();
    }
    await showChapter('잠겨있던 교실\n\n— 끝 —', 3);
    await showChapter('제작자: 사람', 3.5);
    // 처음 화면으로 (저장은 지운다)
    Save.clear();
    stopStory();
    resetFlags();
    for (const c of CLUES) c.found = false;
    startStory(true);
  },

  // ───────── 건우에게 묻기 (Q) ─────────
  async friend() {
    let pages;
    if (flags.ch4) {
      await say({ who: FRIEND, text: '…떨려. 근데 네 옆에 있을게.' });
      return;
    }
    if (flags.ch3) {
      if (flags.thuEvening) pages = [{ who: FRIEND, text: '(건우는 집에 갔다.)' }];
      else if (flags.gotGuestbook) pages = [{ who: FRIEND, text: '교무실! 방명록 서명이랑 쪽지 뒷면, 수아 선생님 앞에서 맞춰 보자.' }];
      else if (flags.suahMemDone) pages = [{ who: FRIEND, text: '체육관 무대 옆에 방명록 있어. 운동장 오른쪽 끝.' }, { who: FRIEND, text: '고형석 글씨만 있으면 돼.' }];
      else pages = [{ who: FRIEND, text: '교무실은 1층 오른쪽 끝이야. 수아 선생님, 창가 자리.' }];
      await say(...pages);
      return;
    }
    if (flags.ch2) {
      if (flags.ch2Done) pages = [{ who: FRIEND, text: '이수아 선생님… 국어 시간에 얼굴 어떻게 보지.' }, { who: FRIEND, text: '(3장은 아직 만드는 중이다.)' }];
      else if (flags.foundNote) pages = [{ who: FRIEND, text: '창문! 나가서 얘기하자.' }];
      else if (flags.inRoom2) pages = [{ who: FRIEND, text: '뒤쪽 사물함 맨 끝 칸. 앨범 속 파인 사진, 그 뒤야.' }];
      else if (flags.roomAgain) pages = [{ who: FRIEND, text: '2층 화장실 창문. …이번이 진짜 마지막이다.' }];
      else if (flags.toBroadcast) pages = [{ who: FRIEND, text: '1층 방송실. 과학실 오른쪽 끝이야. 은비가 기다려.' }];
      else if (flags.sawReport) pages = [{ who: FRIEND, text: '…정재민. 이름을 알았으니까, 이제 사람을 찾아야지.' }];
      else pages = [
        { who: FRIEND, text: '1층 동아리 창고. 행정실이랑 교무실 사이야.' },
        { who: FRIEND, text: '안쪽 왼쪽 책장에 옛날 보고서 철이 꽂혀 있어.' },
      ];
      await say(...pages);
      return;
    }
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
  ['1장 — 방과 후, 건우와', 'after'],
  ['1장 — 열쇠함 본 뒤 (화장실 창문으로)', 'keys'],
  ['1장 — 창고 안', 'room'],
  ['1장 — 앨범 찾은 뒤 (교감 장면 끝)', 'album'],
  ['1장 — 월요일 저녁, 집', 'evening'],
  ['2장 — 화요일 점심 (동아리 창고로)', 'ch2'],
  ['2장 — 화요일 저녁, 집 (아빠)', 'tue'],
  ['2장 — 수요일 점심 (은비)', 'wed'],
  ['2장 — 방송실 앞 (사연 테이프·해독)', 'tape'],
  ['2장 — 해독 후, 창고 다시 (앨범 두고 온 경우)', 'room2'],
  ['3장 — 목요일 1교시 국어', 'ch3'],
  ['3장 — 교무실 (이수아의 기억 들어가기)', 'suah'],
  ['3장 — 기억에서 돌아옴 (방명록 찾으러)', 'guest'],
  ['3장 — 방명록 얻음 (교무실로: 필체·감독표 대결)', 'hand'],
  ['3장 — 목요일 저녁 (아빠 마음 높음)', 'thu'],
  ['3장 — 목요일 저녁 (아빠 마음 낮음 → 가방)', 'thulow'],
  ['4장 — 금요일 (증인 모두: 엔딩 1·2)', 'd5high'],
  ['4장 — 금요일 (증인 없음: 엔딩 4)', 'd5low'],
  ['4장 — 금요일 (소문 많음: 엔딩 3)', 'd5rumor'],
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
  if (stage === 'evening') {
    ambient = EVENING;
    setFloor('home', HOME_DOOR);
    return;
  }
  // 2장: 1장을 다 본 상태 (room2 는 앨범을 두고 온 경우)
  Object.assign(flags, { toldDad: true, day1Done: true, ch2: true, tookAlbum: stage !== 'room2' });
  route.heart.dad = 1;
  ['칠판 구석의 221B', '기말고사 감독표', '1998년 달력', '책상의 J & J'].forEach(findClue);
  if (stage === 'ch2') return setupDay(2, CLASS_SEAT);
  flags.sawReport = REPORT_CLUE.found = true;
  route.evidence = 3;
  if (stage === 'tue') {
    flags.tueEvening = true;
    companion.visible = companion.following = false;
    ambient = EVENING;
    return setFloor('home', HOME_DOOR);
  }
  Object.assign(flags, { tueEvening: true, askedJaemin: true, bandDone: true, wed: true });
  BAND_CLUE.found = true;
  route.evidence = 4;
  if (stage === 'wed') {
    setupDay(2, CLASS_SEAT);
    return runScript('wedStart');
  }
  flags.toBroadcast = true;
  if (stage === 'tape') {
    setupDay(1, { x: 55.5, y: 17.5, dir: 'up' });
    addActor('eunbi', 57.5, 9.2, 'down', 1);
    return;
  }
  Object.assign(flags, { heardTape: true, decoded: true, roomAgain: true });
  TAPE_CLUE.found = true;
  route.evidence = 5;
  if (stage === 'room2') return setupDay(2, { x: 58.5, y: 19, dir: 'down' }, DUSK);
  // 3장: 2장을 다 본 상태
  Object.assign(flags, { roomAgain: false, foundNote: true, ch2Done: true, ch3: true });
  NOTE_CLUE.found = MEMO_CLUE.found = true;
  route.evidence = 7;
  route.heart.jaemin = 1;
  if (stage === 'ch3') return runScript('ch3Start');
  flags.suahClass = true;
  if (stage === 'suah') {
    setupDay(1, { x: 57.5, y: 20.5, dir: 'down' });
    addActor('suah', 57.5, 25.4, 'down', 1);
    return;
  }
  Object.assign(flags, { suahMet: true, shHall: true, shExam: true, suahMemDone: true });
  CONTRA_SH_THREAT.found = CONTRA_SH_WINDOW.found = true;
  route.evidence = 9;
  if (stage === 'guest') {
    setupDay(1, { x: 74, y: 44.4, dir: 'up' });
    addActor('suah', 57.5, 25.4, 'down', 1);
    return;
  }
  flags.gotGuestbook = GUEST_CLUE.found = true;
  if (stage === 'hand') {
    setupDay(1, { x: 57.5, y: 20.5, dir: 'down' });
    addActor('suah', 57.5, 25.4, 'down', 1);
    return;
  }
  Object.assign(flags, { suahWon: true, suahTestify: true, gyogamWon: true, thuEvening: true });
  CONTRA_GG_SEAT.found = CONTRA_GG_GUEST.found = true;
  route.evidence = 14;
  route.heart.suah = 2;
  route.heart.dad = stage === 'thu' ? 3 : 0;
  if (stage.startsWith('d5')) {
    const high = stage === 'd5high';
    Object.assign(flags, { dadConfessed: true, calledJaemin: true, ch3Done: true, dadComes: high, jaeminMaybe: high, suahTestify: high, dadStory: high });
    DAD_CLUE.found = NEWS_CLUE.found = true;
    Object.assign(route.heart, high ? { dad: 4, suah: 2, jaemin: 3 } : { dad: 1, suah: 1, jaemin: 1 });
    route.rumor = stage === 'd5rumor' ? 4 : 0;
    return runScript('ch4Start');
  }
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
