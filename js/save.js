'use strict';
// ─────────────────────────────────────────────
// save.js — 자동 저장 (브라우저 localStorage)
// 컷신·대사·대결·화면 전환이 없을 때(= 스크립트와 스크립트 사이)만 2초마다 저장한다.
// 그래서 불러오면 항상 "자유롭게 걸어 다니던 순간"으로 돌아온다. 타이틀에서 이어하기를 고른다.
// ─────────────────────────────────────────────

const Save = (() => {
  const KEY = 'locked-classroom.save.v2';   // v2: 이름·연도가 바뀌어 예전 저장과 단서 이름이 맞지 않는다   // 「혜성이 지나갔던 밤에」 저장과 섞이지 않게
  let last = '';

  const calm = () => !cutscene && !dialog.pages && !Experiment.isOpen && !fade.dir && fade.alpha === 0
    && !titleEl.classList.contains('show');

  function snapshot() {
    return {
      v: 1,
      savedAt: Date.now(),
      flags: { ...flags },
      route: JSON.parse(JSON.stringify(route)),
      clues: CLUES.filter(c => c.found).map(c => c.name),
      floor: floor.map.n,
      x: player.x, y: player.y, dir: player.dir,
      companion: {
        visible: companion.visible, following: companion.following, floor: companion.floor,
        x: companion.x, y: companion.y, dir: companion.dir,
      },
    };
  }

  function tick() {
    if (!calm()) return;
    const s = snapshot();
    const key = JSON.stringify({ ...s, savedAt: 0 });   // 시각만 다르면 다시 쓰지 않는다
    if (key === last) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
      last = key;
    } catch (e) { /* 저장소를 못 쓰는 브라우저 — 저장 없이 진행 */ }
  }
  setInterval(tick, 2000);

  function load() {
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      return s && s.v === 1 && FLOORS[s.floor] ? s : null;
    } catch (e) {
      return null;
    }
  }

  function clear() {
    last = '';
    try { localStorage.removeItem(KEY); } catch (e) { /* 없음 */ }
  }

  // 저장해 둔 순간으로: 플래그·숨은 값·단서·위치, 그리고 그 장면의 색감
  function restore(s) {
    resetFlags();
    Object.assign(flags, s.flags);
    syncDad();
    Object.assign(route, JSON.parse(JSON.stringify(s.route)));
    for (const c of CLUES) c.found = s.clues.includes(c.name);

    ambient = sceneAmbient();
    setFloor(s.floor, { x: s.x / TILE, y: s.y / TILE, dir: s.dir });
    // 상욱이는 저장 당시 자리 그대로, 따라오는 길(trail)만 그 자리에서 다시 시작
    Object.assign(companion, s.companion);
    trail = [{ x: companion.x, y: companion.y }, { x: player.x, y: player.y }];
    // 수요일 점심: 방송실에서 기다리는 은비
    if (flags.toBroadcast && !flags.heardTape) addActor('eunbi', 71.5, 39.8, 'down', 1);
    // 3장: 기억 속이면 그 사람의 모습과 기억 속 인물들, 아니면 교무실의 이수아 선생님
    if (flags.memory) {
      setPlayerLook(MEMORY_LOOK[flags.memory]);
      addMemoryActors();
    } else if (flags.suahClass && !flags.thuEvening) {
      addActor('suah', 56, 8.8, 'down', 1);
    }
    last = JSON.stringify({ ...snapshot(), savedAt: 0 });
  }

  return { load, clear, restore };
})();
