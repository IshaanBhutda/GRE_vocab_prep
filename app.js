import { firebaseConfig } from './firebase-config.js';
const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const $ = id => document.getElementById(id);
const SIZE = 30, RANK_MIN = 3;
let BASE = [], CUSTOM = [], SETS = [], SETMAP = new Map();
let db = null, uid = null, canWrite = true, isOwner = false, auth = null, AU = null, authUser = null;
let me = { nick: '', sets: {} };
let players = [];
let prog = { known: new Set(), learning: new Set() };
let resolveReady; const meReady = new Promise(r => resolveReady = r);

const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };
const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.random() * (i + 1) | 0; [a[i], a[j]] = [a[j], a[i]]; } return a; };
const pct = v => (v * 100).toFixed(v === 1 ? 0 : 1) + '%';
const fmtTime = ms => { const s = Math.round(ms / 1000); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
function toast(t) { const e = $('toast'); e.textContent = t; e.hidden = false; clearTimeout(toast.t); toast.t = setTimeout(() => e.hidden = true, 2200); }
function allWords() { return BASE.concat(CUSTOM); }

/* ---------- sets ---------- */
function buildSets() {
  SETS = [];
  for (let i = 0; i < BASE.length; i += SIZE) SETS.push({ id: String(i / SIZE + 1), label: 'Set ' + (i / SIZE + 1), words: BASE.slice(i, i + SIZE) });
  const cs = CUSTOM.slice().sort((a, b) => a.at - b.at);
  const chunks = [];
  for (let i = 0; i < cs.length; i += SIZE) chunks.push(cs.slice(i, i + SIZE));
  chunks.forEach((w, k) => SETS.push({ id: 'a' + (k + 1), label: chunks.length > 1 ? 'Added words ' + (k + 1) : 'Added words', words: w, custom: true }));
  SETMAP = new Map(SETS.map(s => [s.id, s]));
}
function nameOf(p) { return p.nick || p.name || 'Player'; }
function setRanking(id) {
  return players.filter(p => p.sets && p.sets[id]).map(p => ({ p, r: p.sets[id] }))
    .sort((a, b) => b.r.best - a.r.best || a.r.ms - b.r.ms || a.r.at - b.r.at);
}

/* ---------- routing ---------- */
let curSet = null, curTab = 'prep';
function route() {
  const h = location.hash.slice(1) || 'sets';
  let view = h;
  if (h.startsWith('set-')) {
    const s = SETMAP.get(h.slice(4));
    if (!s) { if (!BASE.length) return; view = 'sets'; } else { view = 'set'; if (curSet !== s) openSet(s); }
  }
  if (!['sets', 'set', 'board'].includes(view)) view = 'sets';
  ['sets', 'set', 'board'].forEach(v => $('v-' + v).hidden = v !== view);
  document.querySelectorAll('nav a').forEach(a => { if (a.dataset.r === view || (view === 'set' && a.dataset.r === 'sets')) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current'); });
  if (view !== 'set') stopQuiz();
  if (view === 'sets') renderHome();
  if (view === 'board') renderBoard();
  scrollTo(0, 0);
}
addEventListener('hashchange', route);

/* ---------- home ---------- */
let filter = 'all';
$('filters').querySelectorAll('button').forEach(b => b.onclick = () => {
  filter = b.dataset.f; $('filters').querySelectorAll('button').forEach(o => o.setAttribute('aria-pressed', o === b)); renderHome();
});
function setTile(s) {
  const a = el('a', 'set'); a.href = '#set-' + s.id;
  const top = el('div', 'top'); top.append(el('span', 'n', s.label));
  const mine = me.sets[s.id];
  if (mine) top.append(el('span', 'pill ' + (mine.best >= .9 ? 'good' : 'acc'), pct(mine.best)));
  a.append(top, el('div', 'preview', s.words.slice(0, 3).map(x => x.w).join(', ') + '…'));
  const known = s.words.filter(x => prog.known.has(x.w)).length;
  const bar = el('div', 'bar'); const i = el('i'); i.style.width = (known / s.words.length * 100) + '%'; bar.append(i);
  const foot = el('div', 'foot');
  const rk = setRanking(s.id);
  foot.append(el('span', null, known + '/' + s.words.length + ' known'));
  const lead = el('span'); if (rk.length) { lead.append('Top: '); lead.append(el('b', null, nameOf(rk[0].p))); lead.append(' ' + pct(rk[0].r.best)); } else lead.textContent = 'No scores yet';
  foot.append(lead);
  a.append(bar, foot);
  return a;
}
function renderHome() {
  if (!BASE.length) return;
  $('homeSub').textContent = BASE.length.toLocaleString() + ' words in ' + Math.ceil(BASE.length / SIZE) + ' sets of ' + SIZE + '. Earlier sets hold the words most typical of the GRE; the last sets are everyday words.';
  const host = $('setBands'); host.innerHTML = '';
  const keep = s => filter === 'all' || (filter === 'done' ? !!me.sets[s.id] : !me.sets[s.id]);
  const groups = [];
  const custom = SETS.filter(s => s.custom && keep(s)); if (custom.length) groups.push(['Added words', 'shared by players', custom]);
  const main = SETS.filter(s => !s.custom);
  for (let i = 0; i < main.length; i += 20) {
    const g = main.slice(i, i + 20).filter(keep);
    const note = i === 0 ? 'most GRE-relevant' : (i + 20 >= main.length ? 'everyday words' : '');
    if (g.length) groups.push(['Sets ' + (i + 1) + '–' + Math.min(i + 20, main.length), note, g]);
  }
  if (!groups.length) { host.append(el('p', 'sub', filter === 'done' ? 'You haven’t finished a set quiz yet.' : 'You’ve quizzed every set.')); return; }
  groups.forEach(([t, n, g]) => {
    const band = el('div', 'band'); band.append(el('h3', null, t)); if (n) band.append(el('span', null, n));
    const grid = el('div', 'sets'); g.forEach(s => grid.append(setTile(s)));
    host.append(band, grid);
  });
}

/* ---------- set page ---------- */
let deck = [], ci = 0;
function openSet(s) {
  curSet = s; deck = s.words.slice(); ci = 0;
  const idx = SETS.indexOf(s);
  $('sEyebrow').textContent = s.custom ? 'Added by players' : (idx < 20 ? 'Core GRE words' : 'GRE word list');
  $('sTitle').textContent = s.label;
  $('sSub').textContent = s.words.length + ' words · ' + s.words.slice(0, 4).map(x => x.w).join(', ') + '…';
  showTab('prep'); renderCard(); renderList();
}
document.querySelectorAll('.tabs button').forEach(b => b.onclick = () => showTab(b.dataset.t));
function showTab(t) {
  if (curTab === 'quiz' && t !== 'quiz') stopQuiz();
  curTab = t;
  document.querySelectorAll('.tabs button').forEach(b => b.setAttribute('aria-pressed', b.dataset.t === t));
  ['prep', 'quiz', 'rank', 'list'].forEach(n => $('t-' + n).hidden = n !== t);
  if (t === 'quiz') quizIntro();
  if (t === 'rank') renderSetRank();
}
function renderCard() {
  $('flash').classList.remove('flipped');
  const x = deck[ci]; if (!x) return;
  const pos = (ci + 1) + ' / ' + deck.length;
  $('fPos').textContent = pos; $('bPos').textContent = pos;
  $('fWord').textContent = x.w; $('bWord').textContent = x.w; $('bDef').textContent = x.d;
  $('bFull').textContent = x.f && x.f !== x.d ? x.f : '';
  const t = $('fTag'); t.innerHTML = '';
  if (prog.known.has(x.w)) t.append(el('span', 'pill good', 'Known')); else if (prog.learning.has(x.w)) t.append(el('span', 'pill bad', 'Learning'));
  const k = curSet.words.filter(w => prog.known.has(w.w)).length, l = curSet.words.filter(w => prog.learning.has(w.w)).length;
  $('pKnown').textContent = k + ' of ' + curSet.words.length + ' known'; $('pLearn').textContent = l + ' still learning';
  $('pBar').style.width = (k / curSet.words.length * 100) + '%';
  $('ctaText').textContent = k === curSet.words.length ? 'You know every word here. Time to quiz.' : 'Ready? Take the quiz to get on this set’s rankings.';
}
function move(d) { ci = (ci + d + deck.length) % deck.length; renderCard(); }
function mark(kind) {
  const x = deck[ci]; if (!x) return;
  if (kind === 'know') { prog.known.add(x.w); prog.learning.delete(x.w); } else { prog.learning.add(x.w); prog.known.delete(x.w); }
  saveProgress(); move(1);
}
$('flash').onclick = () => $('flash').classList.toggle('flipped');
$('cPrev').onclick = () => move(-1); $('cNext').onclick = () => move(1);
$('cKnow').onclick = () => mark('know'); $('cLearn').onclick = () => mark('learn');
$('cShuf').onclick = () => { deck = shuffle(deck); ci = 0; renderCard(); toast('Shuffled'); };
$('toQuiz').onclick = () => showTab('quiz');
function renderList() {
  const ul = $('wlist'); ul.innerHTML = '';
  curSet.words.forEach(x => { const li = el('li'); li.append(el('b', null, x.w), el('span', null, x.f || x.d)); ul.append(li); });
}

/* ---------- quiz ---------- */
let Q = [], qi = 0, qc = 0, answered = false, t0 = 0, tick = null, missed = [];
function quizIntro() {
  $('qIntro').hidden = false; $('qRun').hidden = true; $('qDone').hidden = true;
  const r = me.sets[curSet.id];
  $('qMyBest').textContent = r ? 'Your best: ' + pct(r.best) + ' in ' + fmtTime(r.ms) + ' · ' + r.tries + ' attempt' + (r.tries === 1 ? '' : 's') : (uid ? 'You haven’t quizzed this set yet.' : 'Sign in to save your score.');
}
function makeQ(x, dir, pool) {
  const src = pool.length >= 6 ? pool : allWords();
  const opts = [x], usedD = new Set([x.d]); let g = 0;
  while (opts.length < 4 && g++ < 300) { const y = src[Math.random() * src.length | 0]; if (opts.includes(y) || usedD.has(y.d) || y.w === x.w) continue; usedD.add(y.d); opts.push(y); }
  return { x, dir, opts: shuffle(opts) };
}
function maskWord(text, w) {
  const stem = w.slice(0, Math.max(4, w.length - 2)).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text.replace(new RegExp('\\b' + stem + '[a-z]*', 'gi'), '____');
}
function startQuiz() {
  const w = shuffle(curSet.words);
  Q = shuffle(w.map((x, i) => makeQ(x, i % 2 ? 'd2w' : 'w2d', curSet.words)));
  qi = 0; qc = 0; missed = []; t0 = performance.now();
  $('qIntro').hidden = true; $('qDone').hidden = true; $('qRun').hidden = false;
  clearInterval(tick); tick = setInterval(() => $('qTime').textContent = fmtTime(performance.now() - t0), 500);
  renderQ();
}
function stopQuiz() { clearInterval(tick); tick = null; }
function renderQ() {
  const q = Q[qi]; answered = false;
  $('qPos').textContent = (qi + 1) + ' / ' + Q.length; $('qScore').textContent = qc + ' correct';
  $('qBar').style.width = (qi / Q.length * 100) + '%';
  const p = $('qPrompt'); p.innerHTML = '';
  p.append(el('div', 'eyebrow', q.dir === 'w2d' ? 'What does this word mean?' : 'Which word matches this meaning?'));
  p.append(el('div', q.dir === 'w2d' ? 'w' : 'd', q.dir === 'w2d' ? q.x.w : maskWord(q.x.d, q.x.w)));
  const o = $('qOpts'); o.innerHTML = '';
  q.opts.forEach((y, i) => { const b = el('button', 'opt' + (q.dir === 'd2w' ? ' word' : '')); b.append(el('span', 'k', i + 1), el('span', null, q.dir === 'w2d' ? y.d : y.w)); b.onclick = () => answer(i); o.append(b); });
  $('qFb').hidden = true; $('qNext').hidden = true;
}
function answer(i) {
  if (answered || $('qRun').hidden) return; answered = true;
  const q = Q[qi], ok = q.opts[i] === q.x;
  [...$('qOpts').children].forEach((b, j) => { b.disabled = true; if (q.opts[j] === q.x) b.classList.add('right'); else if (j === i) b.classList.add('wrong'); });
  if (ok) qc++; else missed.push(q.x);
  $('qScore').textContent = qc + ' correct';
  const fb = $('qFb'); fb.hidden = false; fb.innerHTML = '';
  const h = el('div', null, ok ? 'Correct' : 'Not quite'); h.style.cssText = 'font-weight:700;color:var(--' + (ok ? 'good' : 'bad') + ')';
  const line = el('div'); line.append(el('b', null, q.x.w + ' '), document.createTextNode(q.x.f || q.x.d)); fb.append(h, line);
  if (!ok) { const y = q.opts[i]; const n = el('div', null, 'You picked: ' + y.w + ' — ' + y.d); n.style.cssText = 'color:var(--muted);margin-top:4px'; fb.append(n); }
  $('qNext').hidden = false; $('qNext').textContent = qi + 1 < Q.length ? 'Next' : 'See result'; $('qNext').focus();
}
function nextQ() { if (!answered) return; if (qi + 1 < Q.length) { qi++; renderQ(); } else finishQuiz(); }
function finishQuiz() {
  stopQuiz();
  const ms = Math.round(performance.now() - t0), n = Q.length, acc = qc / n;
  $('qBar').style.width = '100%';
  $('qRun').hidden = true; $('qDone').hidden = false;
  $('rPct').textContent = pct(acc); $('rLine').textContent = qc + ' of ' + n + ' correct in ' + fmtTime(ms);
  const prev = me.sets[curSet.id];
  const better = !prev || acc > prev.best || (acc === prev.best && ms < prev.ms);
  const rec = better ? { best: acc, c: qc, n, ms, at: Date.now(), tries: (prev ? prev.tries : 0) + 1 } : { ...prev, tries: prev.tries + 1 };
  me.sets = { ...me.sets, [curSet.id]: rec };
  const rb = $('rBest'); rb.innerHTML = '';
  rb.append(el('span', 'pill ' + (better ? 'good' : 'acc'), better ? (prev ? 'New personal best' : 'First score on this set') : 'Your best is still ' + pct(prev.best)));
  if (!uid) rb.append(el('span', 'sub', '  Not saved: sign in to compete.'));
  const ul = $('rMiss'); ul.innerHTML = '';
  missed.forEach(x => { const li = el('li'); li.append(el('b', null, x.w), document.createTextNode(x.d)); ul.append(li); prog.learning.add(x.w); prog.known.delete(x.w); });
  $('rMissWrap').hidden = !missed.length;
  if (missed.length) saveProgress();
  const idx = SETS.indexOf(curSet); $('rNextSet').hidden = !SETS[idx + 1];
  saveMe();
}
$('qStart').onclick = startQuiz; $('qNext').onclick = nextQ;
$('qQuit').onclick = () => { stopQuiz(); quizIntro(); };
$('rAgain').onclick = startQuiz; $('rRank').onclick = () => showTab('rank');
$('rNextSet').onclick = () => { const s = SETS[SETS.indexOf(curSet) + 1]; if (s) location.hash = 'set-' + s.id; };

/* ---------- rankings ---------- */
function playerCell(p, extra) {
  const td = el('td'); const w = el('div', 'who');
  if (p.photo) { const im = el('img'); im.src = p.photo; im.alt = ''; im.referrerPolicy = 'no-referrer'; w.append(im); }
  w.append(el('span', null, nameOf(p) + (p.id === uid ? ' (you)' : '')));
  if (extra) w.append(extra);
  td.append(w); return td;
}
function emptyRow(body, cols, text) { const tr = el('tr'); const td = el('td', 'empty', text); td.colSpan = cols; tr.append(td); body.append(tr); }
function renderSetRank() {
  if (!curSet) return;
  const body = $('srBody'); body.innerHTML = '';
  const rk = setRanking(curSet.id);
  if (!rk.length) return emptyRow(body, 5, 'No one has quizzed this set yet. Be the first.');
  rk.forEach(({ p, r }, i) => {
    const tr = el('tr', p.id === uid ? 'mine' : null);
    tr.append(el('td', 'rk' + (i === 0 ? ' r1' : ''), i + 1), playerCell(p), el('td', 'num', pct(r.best) + ' (' + r.c + '/' + r.n + ')'), el('td', 'num', fmtTime(r.ms)), el('td', 'num', r.tries));
    body.append(tr);
  });
}
function overall() {
  const leaders = {};
  SETS.forEach(s => { const rk = setRanking(s.id); if (rk.length) leaders[rk[0].p.id] = (leaders[rk[0].p.id] || 0) + 1; });
  return players.map(p => { const v = Object.entries(p.sets || {}).filter(([k]) => SETMAP.has(k)).map(([, r]) => r.best);
    return { p, n: v.length, avg: v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0, led: leaders[p.id] || 0 }; }).filter(o => o.n > 0);
}
function renderBoard() {
  const all = overall();
  const ranked = all.filter(o => o.n >= RANK_MIN).sort((a, b) => b.avg - a.avg || b.n - a.n);
  const warm = all.filter(o => o.n < RANK_MIN).sort((a, b) => b.n - a.n);
  const mine = all.find(o => o.p.id === uid) || { n: Object.keys(me.sets).length, avg: 0, led: 0 };
  if (!uid && mine.n) { const v = Object.values(me.sets).map(r => r.best); mine.avg = v.reduce((a, b) => a + b, 0) / v.length; }
  $('mAvg').textContent = mine.n ? pct(mine.avg) : '—'; $('mSets').textContent = mine.n; $('mWins').textContent = mine.led;
  const r = ranked.findIndex(o => o.p.id === uid);
  $('mRank').textContent = r >= 0 ? '#' + (r + 1) : (mine.n < RANK_MIN ? (RANK_MIN - mine.n) + ' more set' + (RANK_MIN - mine.n === 1 ? '' : 's') : '—');
  const body = $('obBody'); body.innerHTML = '';
  if (!db) return emptyRow(body, 5, 'Rankings aren’t available right now.');
  if (!ranked.length && !warm.length) return emptyRow(body, 5, 'No scores yet. Finish a set quiz to appear here.');
  ranked.forEach((o, i) => { const tr = el('tr', o.p.id === uid ? 'mine' : null);
    tr.append(el('td', 'rk' + (i === 0 ? ' r1' : ''), i + 1), playerCell(o.p), el('td', 'num', pct(o.avg)), el('td', 'num', o.n), el('td', 'num', o.led)); body.append(tr); });
  warm.forEach(o => { const tr = el('tr', o.p.id === uid ? 'mine' : null);
    tr.append(el('td', 'rk', '·'), playerCell(o.p, el('span', 'pill acc', (RANK_MIN - o.n) + ' more to rank')), el('td', 'num', pct(o.avg)), el('td', 'num', o.n), el('td', 'num', o.led)); body.append(tr); });
}

/* ---------- persistence ---------- */
let meWriting = false, meDirty = false;
async function saveMe() {
  if (!db || !uid || !canWrite) return;
  await meReady;
  if (meWriting) { meDirty = true; return; }
  meWriting = true;
  try { await db.doc('players/' + uid).set({ nick: me.nick, name: (authUser && authUser.displayName) || '', photo: (authUser && authUser.photoURL) || '', sets: me.sets, updatedAt: Date.now() }); }
  catch (e) { if (e && e.code === 'permission-denied') { canWrite = false; $('nowrite').hidden = false; } else toast('Couldn’t save your score. Check your connection.'); }
  meWriting = false; if (meDirty) { meDirty = false; saveMe(); }
}
let progTimer = null, progWriting = false, progDirty = false;
function saveProgress() {
  try { localStorage.setItem('gwd2-prog', JSON.stringify({ known: [...prog.known], learning: [...prog.learning] })); } catch (e) {}
  if (!db || !uid) return; clearTimeout(progTimer); progTimer = setTimeout(flushProgress, 1500);
}
async function flushProgress() {
  if (progWriting) { progDirty = true; return; } progWriting = true;
  try { await db.doc('progress/' + uid).set({ known: [...prog.known], learning: [...prog.learning] }); } catch (e) {}
  progWriting = false; if (progDirty) { progDirty = false; flushProgress(); }
}
try { const p = JSON.parse(localStorage.getItem('gwd2-prog') || 'null'); if (p) prog = { known: new Set(p.known), learning: new Set(p.learning) }; } catch (e) {}


function signIn() { if (!auth) return toast('Sign-in isn’t set up yet.'); AU.signInWithPopup(auth, new AU.GoogleAuthProvider()).catch(e => { if (e.code !== 'auth/popup-closed-by-user' && e.code !== 'auth/cancelled-popup-request') toast('Sign-in didn’t finish. Try again.'); }); }
$('signinBtn2').onclick = signIn;
function renderMe() {
  const box = $('me'); box.innerHTML = '';
  if (!uid) { const b = el('button', 'btn primary', 'Sign in with Google'); b.style.padding = '7px 14px'; b.onclick = signIn; box.append(b); return; }
  if (authUser.photoURL) { const im = el('img'); im.src = authUser.photoURL; im.alt = ''; im.referrerPolicy = 'no-referrer'; box.append(im); }
  const nm = el('span', 'nm'); nm.append(el('b', null, me.nick || authUser.displayName || 'You')); box.append(nm);
  const r = el('button', 'linkbtn', 'Rename'); r.onclick = openRename; box.append(r);
  const o = el('button', 'linkbtn', 'Sign out'); o.style.color = 'var(--muted)'; o.onclick = () => AU.signOut(auth); box.append(o);
}
function openRename() {
  const box = $('me'); box.innerHTML = '';
  const f = el('form'); f.style.cssText = 'display:flex;gap:6px';
  const i = el('input'); i.type = 'text'; i.id = 'nickIn'; i.maxLength = 24; i.value = me.nick || authUser.displayName || ''; i.style.cssText = 'width:150px;padding:5px 9px';
  const s = el('button', 'btn primary', 'Save'); s.style.padding = '5px 12px';
  f.append(i, s); box.append(f); i.focus();
  f.onsubmit = e => { e.preventDefault(); me.nick = i.value.trim().slice(0, 24); renderMe(); saveMe(); toast('Name saved'); };
}

/* ---------- keyboard ---------- */
addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName) || $('v-set').hidden) return;
  if (curTab === 'prep') {
    if (e.key === ' ') { e.preventDefault(); $('flash').classList.toggle('flipped'); }
    else if (e.key === 'ArrowRight') move(1); else if (e.key === 'ArrowLeft') move(-1);
    else if (e.key === 'k' || e.key === 'K') mark('know'); else if (e.key === 'l' || e.key === 'L') mark('learn');
  } else if (curTab === 'quiz' && !$('qRun').hidden) {
    if (/^[1-4]$/.test(e.key)) answer(+e.key - 1); else if (e.key === 'Enter') { e.preventDefault(); nextQ(); }
  }
});

/* ---------- boot ---------- */
fetch('words.json').then(r => r.json()).then(d => { BASE = d; buildSets(); route(); })
  .catch(() => { $('homeSub').textContent = 'Couldn’t load the word list. Reload the page to try again.'; });

function adapter(F, fs) {
  const snapOf = d => ({ id: d.id, exists: d.exists(), data: () => d.data() });
  return {
    doc(path) { const r = F.doc(fs, path); return { get: async () => snapOf(await F.getDoc(r)), set: d => F.setDoc(r, d), delete: () => F.deleteDoc(r) }; },
    collection(path) { const c = F.collection(fs, path); return {
      add: d => F.addDoc(c, d),
      onSnapshot: (next, err) => F.onSnapshot(c, s => next({ docs: s.docs.map(d => ({ id: d.id, data: () => d.data() })) }), err)
    }; }
  };
}
(async () => {
  if (!firebaseConfig || !firebaseConfig.apiKey || firebaseConfig.apiKey.startsWith('PASTE')) {
    resolveReady(); renderMe(); $('signin').hidden = true;
    $('nowrite').hidden = false; $('nowriteText').textContent = 'Practice mode: sign-in and rankings turn on once firebase-config.js is filled in (see README).';
    auth = null; return;
  }
  const [{ initializeApp }, F, A] = await Promise.all([import(FB + 'firebase-app.js'), import(FB + 'firebase-firestore.js'), import(FB + 'firebase-auth.js')]);
  const app = initializeApp(firebaseConfig);
  db = adapter(F, F.getFirestore(app)); AU = A; auth = A.getAuth(app);
  db.collection('players').onSnapshot(snap => {
    players = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (!$('v-sets').hidden) renderHome();
    if (!$('v-board').hidden) renderBoard();
    if (!$('v-set').hidden && curTab === 'rank') renderSetRank();
  }, () => {});
  let first = true;
  A.onAuthStateChanged(auth, async u => {
    authUser = u; uid = u ? u.uid : null;
    $('signin').hidden = !!u;
    if (!u) { if (first) resolveReady(); first = false; me = { nick: '', sets: {} }; renderMe(); route(); return; }
    try { const s = await db.doc('players/' + uid).get(); if (s.exists) { const d = s.data(); me = { nick: d.nick || '', sets: { ...(d.sets || {}) } }; } } catch (e) {}
    if (first) resolveReady(); first = false;
    renderMe(); saveMe();
    try { const p = await db.doc('progress/' + uid).get();
      if (p.exists) { const d = p.data(); (d.known || []).forEach(w => prog.known.add(w)); (d.learning || []).forEach(w => prog.learning.add(w)); } } catch (e) {}
    if (curSet) renderCard(); route();
  });
})();
