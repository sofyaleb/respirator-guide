// Shared bits for the four ways of showing time on the Time adds up page: the mask list, time formatting, chip buttons and a player that runs a stretch of the day.
window.TP = (() => {
  const { MASKS, NONE } = window.RG;
  // the same masks and order as the picker
  const ORDER = ['none', 'cloth', 'surgical', 'ffp2ear', 'ffp1', 'ffp2', 'ffp3', 'half', 'hood', 'full', 'papr']
    .map((id) => [NONE, ...MASKS].find((m) => m.id === id));
  const WEAR = ORDER.slice(1);
  const byId = (id) => ORDER.find((m) => m.id === id);
  const SHORT = { none: 'No mask', cloth: 'Cloth', surgical: 'Face mask', ffp2ear: 'Ear-loop', ffp1: 'Dust mask', ffp2: 'FFP2 / N95', ffp3: 'FFP3', half: 'Half face', hood: 'Helmet', full: 'Full face', papr: 'Powered' };
  const pfText = (m) => m.pf === 1 ? '1×' : `${m.est || m.ill ? '~' : ''}${m.pf}×`;
  const dur = (min) => {
    min = Math.round(min); if (min <= 0) return '0 min'; if (min < 60) return `${min} min`;
    const h = Math.floor(min / 60), r = min % 60; return r ? `${h} h ${r} min` : `${h} h`;
  };
  // minutes since midnight → "08:30"
  const clock = (min) => { min = Math.floor(min); return `${String(Math.floor(min / 60) % 24).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`; };

  // A row of toggle chips. items: [[value, label], ...]
  function chips(el, items, initial, onPick) {
    el.replaceChildren(...items.map(([v, label]) => {
      const b = document.createElement('button'); b.type = 'button'; b.dataset.v = v; b.textContent = label; return b;
    }));
    const set = (v) => el.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.v === String(v))));
    el.addEventListener('click', (e) => { const b = e.target.closest('button'); if (!b) return; set(b.dataset.v); onPick(b.dataset.v); });
    set(initial); return { set };
  }
  const maskChips = (el, initial, onPick, list = WEAR) =>
    chips(el, list.map((m) => [m.id, `${SHORT[m.id]} · ${pfText(m)}`]), initial, (id) => onPick(byId(id)));

  // Runs the clock from start to end (minutes since midnight). onTime(t, dt) gets the time and the clock minutes
  // since the last call; dt is null after a jump (slider, replay), so pages can reset rather than add up.
  function player({ start, end, onTime, playBtn, slider, seconds = 30 }) {
    let t = start, playing = false, raf = 0, last = 0;
    const label = () => { playBtn.textContent = playing ? '❚❚ Pause' : t >= end ? '↺ Replay' : '▶ Play'; };
    const seek = (v, dt = null) => {
      t = Math.max(start, Math.min(end, v));
      if (slider) slider.value = t;
      onTime(t, dt);
    };
    const frame = (now) => {
      if (!playing) return;
      const s = last ? Math.min(.1, (now - last) / 1000) : 0; last = now;
      const dt = Math.min(end - t, s * (end - start) / seconds);
      seek(t + dt, dt);
      if (t >= end) { playing = false; label(); return; }
      raf = requestAnimationFrame(frame);
    };
    const play = () => { if (t >= end) seek(start); playing = true; last = 0; label(); raf = requestAnimationFrame(frame); };
    const pause = () => { playing = false; cancelAnimationFrame(raf); label(); };
    playBtn.addEventListener('click', () => (playing ? pause() : play()));
    if (slider) {
      Object.assign(slider, { min: start, max: end, step: 1 });
      slider.addEventListener('input', () => { pause(); seek(+slider.value); });
    }
    seek(start); label();
    return { seek, play, pause, get t() { return t; } };
  }

  return { ORDER, WEAR, byId, SHORT, pfText, dur, clock, chips, maskChips, player };
})();
