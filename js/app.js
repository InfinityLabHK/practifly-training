/* Practifly AI 三賽道自學培訓網站 v3.0(2026-11-16)
   定位:服務已報名的參加者及家長;個人報名的同學用這個網站代替校內培訓自學。
   紅線:不接任何 LLM、不收集或上傳資料、不用帳號;進度只存本機 localStorage(try/catch);保留「清除進度」。
   只用已批示範題及現有模擬題;不自行新增比賽題目、數字、日期、金額、名額、獎項或服務。
   所有日期、連結、聯絡方法由 config.js 讀取;文字內容在 js/c-<語言>.js(繁體為正本,簡體由 tools/make_sc.py 產生)。
   提示只問不答;示範要先自己試才看。舊連結 #t1-tc、#t2-tc、#t3-tc、#ws-sc、#tpl-sc、#preview-lib-sc 照舊可用。 */
(() => {
'use strict';
const CFG = window.PF_CONFIG;
const LANGS = ['tc', 'sc', 'en'], HL = { tc: 'zh-Hant-HK', sc: 'zh-Hans-CN', en: 'en' }, TTSL = { tc: 'zh-HK', sc: 'zh-CN', en: 'en-US' };
const HAS = { tc: 1, sc: 1 };            // 已有新內容的語言;EN 於第三次預覽加入,之前先顯示繁體並說明
const KEY = 'pf-training-v3', LEG = 'pf-track2-demo-v1', LKEY = 'pf-track2-lang', TKEY = 'pf-track2-theme';
const VIEWS = ['home', 'setup', 't1', 't2', 't3', 'day', 'parents', 'teachers', 'passport'];
const GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'U'];
const TRK = ['t1', '2a', '2b', 't3'];
const $ = id => document.getElementById(id);
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const ls = { get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) { } }, del(k) { try { localStorage.removeItem(k) } catch (e) { } } };

/* ---------- 狀態(只存本機) ---------- */
const fresh = () => ({ v: 3, setup: null, a: { fs: 0, hc: 0, rm: 0 }, m: {}, done: {}, cat: null, seed: 0 });
let S = fresh();
try { const o = JSON.parse(ls.get(KEY) || 'null'); if (o && o.v === 3) S = Object.assign(fresh(), o) } catch (e) { }
const save = () => ls.set(KEY, JSON.stringify(S));
function legacy() { try { return JSON.parse(ls.get(LEG) || 'null') || {} } catch (e) { return {} } }

/* ---------- 語言及內容 ---------- */
function pickLang() {
  const h = parse(); if (h.lang) return h.lang;
  const s = ls.get(LKEY); if (LANGS.includes(s)) return s;
  const a = (navigator.languages && navigator.languages.length ? navigator.languages : [navigator.language || '']).map(x => String(x).toLowerCase());
  for (const x of a) { if (x === 'zh' || /^zh-(cn|sg|my|hans)/.test(x)) return 'sc'; if (/^zh/.test(x)) return 'tc'; if (/^en/.test(x)) return 'en' } return 'tc';
}
let LANG = 'tc', X = null;                 // X = 目前語言的內容
const CL = () => HAS[LANG] ? LANG : 'tc';  // 內容實際使用的語言
const loaded = {};
function loadLang(l) {
  const c = HAS[l] ? l : 'tc';
  if (!loaded[c]) loaded[c] = new Promise((res, rej) => { const s = document.createElement('script'); s.src = 'js/c-' + c + '.js'; s.onload = () => res(window.PF_C[c]); s.onerror = rej; document.head.appendChild(s) });
  return loaded[c];
}
function T(k, v) { let s = X.ui[k]; if (s == null) return k; if (v) s = s.replace(/\{(\w+)\}/g, (m, x) => v[x] != null ? v[x] : m); return s }

/* ---------- 日期(由 config.js 讀取) ---------- */
const todayHK = () => new Date(Date.now() + 8 * 3600e3).toISOString().slice(0, 10);
function fmtD(iso) {
  const [y, m, d] = iso.split('-').map(Number), wd = new Date(Date.UTC(y, m - 1, d)).getUTCDay(), l = CL();
  if (l === 'en') return d + ' ' + 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m - 1] + (y !== 2026 ? ' ' + y : '') + ' (' + 'Sun Mon Tue Wed Thu Fri Sat'.split(' ')[wd] + ')';
  return (y !== 2026 ? y + ' 年 ' : '') + m + ' 月 ' + d + ' 日（' + '日一二三四五六'[wd] + '）';
}
function fmtShort(iso) { const [, m, d] = iso.split('-').map(Number); return CL() === 'en' ? d + ' ' + 'Jan Feb Mar Apr May Jun Jul Aug Sep Oct Nov Dec'.split(' ')[m - 1] : m + ' 月 ' + d + ' 日' }
const pendTag = () => `<span class="tag pend">${esc(T('pend'))}</span>`;
function dateHTML(k) {
  const e = CFG.dates[k]; if (!e) return esc(k);
  let h = `<b>${esc(fmtD(e.d))}${e.d2 ? ' – ' + esc(fmtD(e.d2)) : ''}</b>`;
  if (e.was) h += ` <span class="tag chg">${esc(T('chg', { was: fmtShort(e.was) }))}</span>`;
  if (e.pending) h += ' ' + pendTag();
  return h;
}
const daysTo = iso => Math.round((Date.parse(iso + 'T00:00:00Z') - Date.parse(todayHK() + 'T00:00:00Z')) / 864e5);
/* 文字標記:**粗體**、{d:日期鍵}、{pend}、{mail}、{id} */
function fx(s) {
  return esc(s).replace(/\*\*(.+?)\*\*/g, '<b>$1</b>').replace(/\{d:(\w+)\}/g, (m, k) => dateHTML(k)).replace(/\{pend\}/g, pendTag())
    .replace(/\{mail\}/g, `<a href="mailto:${esc(CFG.contact.email)}">${esc(CFG.contact.email)}</a>`).replace(/\{id\}/g, esc(CFG.contact.idFormat));
}

/* ---------- 路由:#t3-m2-tc;舊連結照舊可用 ---------- */
function parse() {
  const tk = (location.hash || '').replace(/^#\/?/, '').toLowerCase().split(/[-\/]/).filter(Boolean);
  return {
    lang: tk.find(x => LANGS.includes(x)) || null,
    old: tk.find(x => ['ws', 'tpl', 'preview', 'solo', 'team'].includes(x)) || null,
    view: tk.find(x => VIEWS.includes(x)) || 'home',
    mod: tk.find(x => /^(m[1-9]|make|talk|exam)$/.test(x)) || null,
    g: (tk.find(x => /^(p[1-6]|s[1-6]|u)$/.test(x)) || '').toUpperCase() || null
  };
}
const href = (view, mod) => '#' + [view === 'home' ? '' : view, mod || '', LANG].filter(Boolean).join('-');
let R = { view: 'home', mod: null, g: null };
function toLegacy(hash) { try { sessionStorage.setItem('pf-back', location.hash || '#' + LANG) } catch (e) { } location.href = CFG.links.legacy + '#' + hash + '-' + LANG }

/* ---------- 設定(賽道、年級、身份) ---------- */
const su = () => S.setup || { tr: [], g: null, role: 's', city: false };
const has = t => su().tr.includes(t);
function stage(g) { g = g || su().g; return !g ? '' : g === 'U' ? 'u' : g[0] === 'S' ? (+g[1] <= 3 ? 's13' : 's46') : (+g[1] <= 2 ? 'p12' : +g[1] <= 4 ? 'p34' : 'p56') }
function cond(c) {
  return c.split('|').some(x => {
    const neg = x[0] === '!'; if (neg) x = x.slice(1);
    const g = su().g || 'P4', st = stage(g);
    const v = x === 'p13' ? /^P[1-3]$/.test(g) : x === 'pri' ? g[0] === 'P' : x === 'sec' ? g[0] === 'S' : x === 'par' ? su().role === 'p' : x === 'city' ? !!su().city
      : x === '2a' || x === '2b' || x === 't1' || x === 't3' ? has(x) : x === 'k12' ? g !== 'U' : x === 'sc' ? CL() === 'sc' : x === st;
    return neg ? !v : v;
  });
}
const showPar = () => cond('p13|par');

/* ---------- 機械貓夥伴及本機廣場 ----------
   每位同學有一隻機械貓夥伴(隨機配對,可更換);每完成一個模組,廣場多一位機械貓同學。
   全部只存本機:沒有連線、沒有其他用戶的資料、沒有排名。 */
const CATS = window.PF_CATS || [];
const catN = id => { const c = CATS.find(x => x.id === id); return c ? c.n[CL()] : '' };
const catSrc = id => 'img/cats/' + id + '.webp';
function ensureCat() { if (!CATS.length) return; if (!S.cat || !CATS.some(c => c.id === S.cat)) S.cat = CATS[Math.floor(Math.random() * CATS.length)].id; if (!S.seed) S.seed = 1 + Math.floor(Math.random() * 1e6) }
function friends() {
  const o = CATS.map(c => c.id).filter(x => x !== S.cat); let s = S.seed || 7;
  for (let i = o.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1);[o[i], o[j]] = [o[j], o[i]] }
  return o.slice(0, Math.min(Object.keys(S.done).length, o.length));
}
const PPOS = [[17, 31], [83, 31], [30, 20], [70, 20], [9, 14], [91, 14], [22, 4], [78, 4], [38, 3], [62, 3]];
function plaza(msg) {
  ensureCat(); if (!S.cat) return ''; const fr = friends(), show = fr.slice(-10);
  return `<section class="plaza" aria-label="${esc(T('plzH'))}"><div class="pb say">${esc(msg)}</div>${show.map((id, i) => `<img class="fr" src="${catSrc(id)}" alt="${esc(catN(id))}" style="left:${PPOS[i][0]}%;bottom:${PPOS[i][1]}%" width="199" height="240">`).join('')}<img class="me" src="${catSrc(S.cat)}" alt="${esc(T('plzMe', { n: catN(S.cat) }))}" width="199" height="240"><button class="pbtn" data-a="catsheet" id="catbtn">${esc(T('plzChange'))}</button></section>
   <p class="fine say">${esc(fr.length ? T('plzN', { n: fr.length }) : T('plz0'))}</p>`;
}
function catSheet() {
  const old = $('sheet'); if (old) { old.remove(); const b = $('catbtn'); if (b) b.focus(); return }
  const el = document.createElement('div'); el.className = 'sheet'; el.id = 'sheet';
  el.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-label="${esc(T('plzPick'))}"><div class="row sb"><h2>${esc(T('plzPick'))}</h2><button class="btn s" data-a="catsheet" id="shx">${esc(T('close'))}</button></div><p class="fine">${esc(T('plzPickP'))}</p>
   <div class="catgrid">${CATS.map(c => `<button data-a="catpick" data-c="${c.id}" aria-pressed="${S.cat === c.id}"><img src="${catSrc(c.id)}" alt="" loading="lazy" width="199" height="240">${esc(c.n[CL()])}</button>`).join('')}</div></div>`;
  document.body.appendChild(el); $('shx').focus();
}

/* ---------- 模組 ---------- */
const mods = trk => X[trk].mods.filter(m => !m.for || !S.setup || !(has('2a') || has('2b')) || m.for.some(has));
const mod = (trk, id) => X[trk].mods.find(m => m.id === id);
const mkey = (trk, id) => trk + '.' + id;
function mst(trk, id) { const k = mkey(trk, id); return S.m[k] || (S.m[k] = { step: 0, d: {} }) }
const isDone = (trk, id) => !!S.done[mkey(trk, id)];
function nextMod(trk) { return mods(trk).find(m => !isDone(trk, m.id)) || null }
function progress(trk) { const a = mods(trk); return { n: a.filter(m => isDone(trk, m.id)).length, all: a.length } }
function blocks(bs, out) { out = out || []; bs.forEach(b => { if (b[0] === 'if') { if (cond(b[1])) blocks(b[2], out) } else out.push(b) }); return out }

let CURM = null;   // 目前模組(賽道二五個準則模組由對應的思維英雄做教練)
function guide(txt) { const h = CURM && CURM.hero; return `<div class="guide"><img src="img/f${h || 0}.webp" alt="" width="52" height="52"><div class="bub say"><b>${esc(h ? X.ui.heroN[h - 1] : T('cat'))}</b>${fx(txt)}</div></div>` }
const t3sub = () => { const d = (S.m['t3.m1'] || { d: {} }).d.sub; return d === 1 ? 'b' : 'a' };
const cntOf = (s, unit) => unit === 'w' ? (s.trim() ? s.trim().split(/\s+/).length : 0) : s.replace(/\s/g, '').length;

/* 各種內容塊:回傳 HTML */
const BL = {
  p: b => `<p class="say">${fx(b[1])}</p>`,
  h: b => `<h3 class="say">${fx(b[1])}</h3>`,
  ul: b => `<ul class="ul say">${b[1].map(x => `<li>${fx(x)}</li>`).join('')}</ul>`,
  tip: b => guide(b[1]),
  note: b => `<p class="fine say">${fx(b[1])}</p>`,
  box: b => `<div class="card soft say"><b>${fx(b[1])}</b>${Array.isArray(b[2]) ? `<ul class="ul">${b[2].map(x => `<li>${fx(x)}</li>`).join('')}</ul>` : `<p>${fx(b[2])}</p>`}</div>`,
  ok: b => `<div class="okbox say">${fx(b[1])}</div>`,
  warn: b => `<div class="warnbox say">${fx(b[1])}</div>`,
  par: b => showPar() ? `<div class="par say"><b>${esc(T('parH'))}</b>${fx(b[1])}</div>` : '',
  date: b => `<p class="say"><b>${fx(b[2])}：</b>${dateHTML(b[1])}</p>`,
  notes: b => `<p><a class="lnk" href="${esc(CFG.links.notes[b[1]])}" target="_blank" rel="noopener">${esc(T('notes_' + b[1]))} ↗</a></p>`,
  flip: b => b[1].map(x => `<details class="flip"><summary><b class="say">${fx(x[0])}</b></summary><span class="say">${fx(x[1])}</span></details>`).join(''),
  go: b => `<button class="btn s w" data-a="leg" data-h="${esc(b[3])}">${fx(b[1])} →${b[2] ? `<small>${fx(b[2])}</small>` : ''}</button>`,
  leg: b => { const p = (legacy().p || {})[b[1]] || {}; return `<p class="fine"><b>${esc(T('legSt'))}：</b>${esc(p.doneAt ? T('legDone') : p.max ? T('legGo', { n: (p.step || 0) + 1 }) : T('legNew'))}</p>` },
  mcq(b, d) {
    const [, id, q, opts, ans, hint, why] = b, s = d[id] || { w: [], a: null }, fin = s.a != null;
    let h = `<p class="q say">${fx(q)}</p><div class="choices" role="group" aria-label="${esc(T('pickOne'))}">` + opts.map((o, i) => {
      const wrong = s.w.includes(i), cls = fin ? (i === ans ? 'ok' : (i === s.a || wrong) ? 'no' : '') : (wrong ? 'no' : '');
      return `<button class="opt ${cls}" data-a="mcq" data-id="${id}" data-i="${i}" data-fk="${id}:${i}" ${fin || wrong ? 'disabled' : ''}><span class="mk" aria-hidden="true">${cls === 'ok' ? '✓' : cls === 'no' ? '✗' : ''}</span><span class="say">${fx(o)}</span></button>`
    }).join('') + `</div><div id="fb-${id}" role="status" tabindex="-1">`;
    if (!fin && s.w.length) h += `<div class="hint say"><b>${esc(T('hintH'))}</b> ${fx(hint)}</div><p><b>${esc(T('retry'))}</b></p>`;
    if (fin) h += `<div class="${s.a === ans ? 'okbox' : 'nobox'}"><b>${esc(T(s.a === ans ? (s.w.length ? 'right2' : 'right1') : 'wrong2'))}</b></div><div class="why say"><b>${esc(T('whyH'))}</b>${fx(why)}</div>`;
    return h + '</div>';
  },
  cls(b, d) {
    const [, id, labels, items] = b, s = d[id] || [];
    return items.map((it, i) => {
      const a = s[i], done = a != null, ok = a === it[1];
      return `<div class="clsc ${done ? (ok ? 'y' : 'n') : ''}"><p class="say">${i + 1}. ${fx(it[0])}</p><div class="seg" role="group" aria-label="${esc(T('pickOne'))}">` +
        labels.map((l, j) => `<button data-a="cls" data-id="${id}" data-i="${i}" data-j="${j}" data-fk="${id}:${i}:${j}" aria-pressed="${a === j}" class="${done ? (j === it[1] ? 'ok' : a === j ? 'no' : '') : ''}" ${done ? 'disabled' : ''}>${done && j === it[1] ? '✓ ' : done && a === j ? '✗ ' : ''}${fx(l)}</button>`).join('') +
        `</div><div id="fb-${id}-${i}" role="status" tabindex="-1">${done ? `<div class="why say"><b>${ok ? '✓ ' + esc(T('judgeOk')) : '✗ ' + esc(T('judgeNo'))}</b>${fx(it[2])}</div>` : ''}</div></div>`
    }).join('');
  },
  pick(b, d) {
    const [, id, opts] = b, a = d[id];
    return `<div class="choices" role="group" aria-label="${esc(T('pickOne'))}">` + opts.map((o, i) => `<button class="opt" data-a="pick" data-id="${id}" data-i="${i}" data-fk="${id}:${i}" aria-pressed="${a === i}"><span class="mk" aria-hidden="true">${a === i ? '✓' : ''}</span><span class="say">${fx(o[0])}${o[1] ? `<small>${fx(o[1])}</small>` : ''}</span></button>`).join('') + '</div>';
  },
  sort(b, d) {
    const [, id, slots, sets, shuf, fn] = b, cards = Array.isArray(sets) ? sets : sets[t3sub()], s = d[id] || { ord: slots.map(() => null), ck: 0 };
    const full = s.ord.every(x => x != null), bad = s.ord.filter((c, i) => c !== i).length;
    const inn = c => `<span class="say">${fx(cards[c][0])}</span><em>${esc(T('sbEl'))}：${fx(cards[c][1])}</em>`;
    let h = slots.map((q, i) => { const c = s.ord[i], v = s.ck && c != null ? (c === i ? 'y' : 'n') : ''; return `<button class="slot ${c != null ? 'fill' : ''} ${v}" data-a="sortslot" data-id="${id}" data-i="${i}" data-fk="${id}:s${i}"><b>${fx(q)}${v ? (v === 'y' ? ' ✓' : ' ✗') : ''}</b><small>${fx(fn[i])}</small>${c != null ? inn(c) : `<em>${esc(T('sortEmpty'))}</em>`}</button>` }).join('');
    h += `<div class="card soft">${full ? `<p>${esc(T('sortFull'))}</p>` : `<b>${esc(T('sortPool'))}</b><div class="pool">${shuf.filter(c => !s.ord.includes(c)).map(c => `<button data-a="sortcard" data-id="${id}" data-i="${c}" data-fk="${id}:c${c}">${inn(c)}</button>`).join('')}</div>`}
      <div class="row" style="margin-top:10px"><button class="btn" data-a="sortcheck" data-id="${id}" data-fk="${id}:ck" ${full ? '' : 'disabled'}>${esc(T('sortCheck'))}</button><button class="btn s" data-a="sortreset" data-id="${id}">${esc(T('sortReset'))}</button>${s.ck && bad ? `<button class="btn s" data-a="sortshow" data-id="${id}">${esc(T('sortShow'))}</button>` : ''}</div></div>`;
    h += `<div id="fb-${id}" role="status" tabindex="-1">${s.ck ? (bad ? `<div class="nobox say">${esc(T('sortNo', { n: bad }))}</div>` : `<div class="okbox say">${esc(T('sortOk'))}</div>`) : ''}</div>`;
    return h;
  },
  prompt(b, d) {
    const [, id, P] = b, k = t3sub(), O = P.opts[k], s = d[id] || { pr: [null, null, null, null], v1: null, goal: null }, all = s.pr.every(x => x != null);
    const txt = pr => P.tpl.replace('{subj}', O[0][pr[0]]).replace('{scene}', O[1][pr[1]]).replace('{style}', O[2][pr[2]]).replace('{mood}', O[3][pr[3]]);
    const box = (cls, lab, t) => `<div class="prm ${cls} say"><b>${esc(lab)}</b>${esc(t)}</div>`;
    let h = P.cats.map((c, i) => `<div class="pcat"><b>${esc(c)}</b><div class="chips" role="group" aria-label="${esc(c)}">${O[i].map((o, j) => `<button data-a="pr" data-id="${id}" data-i="${i}" data-j="${j}" data-fk="${id}:${i}:${j}" aria-pressed="${s.pr[i] === j}">${esc(o)}</button>`).join('')}</div></div>`).join('');
    h += `<p class="fine say">${fx(P.tip)}</p><div class="card soft"><b>${esc(T('prLog'))}</b>${box('', T('prVague'), P.vague[k])}`;
    if (s.v1) h += box('', T('prV1'), txt(s.v1)) + `<p class="q">${esc(T('prGoal'))}</p><div class="seg" role="group">${P.cats.map((c, i) => `<button data-a="prgoal" data-id="${id}" data-i="${i}" data-fk="${id}:g${i}" aria-pressed="${s.goal === i}">${esc(c)}</button>`).join('')}</div>`;
    if (all) h += box('now', s.v1 ? T('prV2') : T('prNow'), txt(s.pr));
    h += s.v1 ? `<p class="say">${fx(P.iter)}</p>` : `<div class="row"><button class="btn s" data-a="prkeep" data-id="${id}" data-fk="${id}:keep" ${all ? '' : 'disabled'}>${esc(T('prKeep'))}</button></div>`;
    return h + '</div>';
  },
  write(b, d) {
    const [, id, label, ph, o = {}] = b, v = d[id] || '', lim = o.lim ? o.lim[d[id + '_u'] || 0] : null;
    let h = `<div class="fld"><label for="w-${id}" class="say">${fx(label)}</label>`;
    if (o.lim && o.lim.length > 1) h += `<div class="seg" role="group" style="margin:0 0 8px">${o.lim.map((l, i) => `<button data-a="wunit" data-id="${id}" data-i="${i}" data-fk="${id}:u${i}" aria-pressed="${(d[id + '_u'] || 0) === i}">${esc(l[2])}</button>`).join('')}</div>`;
    h += o.line ? `<input type="text" id="w-${id}" data-w="${id}" value="${esc(v)}" placeholder="${esc(ph || '')}" autocomplete="off">` : `<textarea id="w-${id}" data-w="${id}" rows="${o.rows || 3}" placeholder="${esc(ph || '')}">${esc(v)}</textarea>`;
    if (lim) { const n = cntOf(v, lim[0]); h += `<div class="cnt"><span>${esc(T('cntLim', { n: lim[1], u: T(lim[0] === 'w' ? 'uW' : 'uC') }))}</span><b id="c-${id}" data-u="${lim[0]}" data-max="${lim[1]}" class="${n > lim[1] ? 'over' : n ? 'fit' : ''}" aria-live="polite">${n} / ${lim[1]}</b></div>` }
    return h + '</div>';
  },
  check(b, d) {
    const [, id, items] = b, s = d[id] || [];
    return `<div class="card soft" role="group" aria-label="${esc(T('chkH'))}">${items.map((x, i) => `<label class="chk"><input type="checkbox" data-c="${id}" data-i="${i}" ${s[i] ? 'checked' : ''}><span class="say">${fx(x)}</span></label>`).join('')}</div>`;
  },
  sb(b, d) {
    const [, id, P] = b, s = d[id] || { n: 4, p: [], num: null };
    let h = '';
    for (let i = 0; i < s.n; i++) {
      const p = s.p[i] || ['', ''];
      h += `<div class="panel"><b>${esc(T('sbPanel', { n: i + 1 }))}${i < 4 && s.n === 4 ? ' · ' + esc(P.slots[i]) : ''}</b>
       <div class="fld"><label for="sb-${id}-${i}-0">${esc(P.l1)}</label><input type="text" id="sb-${id}-${i}-0" data-sb="${id}" data-i="${i}" data-j="0" value="${esc(p[0])}" autocomplete="off"></div>
       <div class="fld"><label for="sb-${id}-${i}-1">${esc(P.l2)}</label><input type="text" id="sb-${id}-${i}-1" data-sb="${id}" data-i="${i}" data-j="1" value="${esc(p[1])}" autocomplete="off"></div>
       <button class="opt" data-a="sbnum" data-id="${id}" data-i="${i}" data-fk="${id}:n${i}" aria-pressed="${s.num === i}"><span class="mk" aria-hidden="true">${s.num === i ? '✓' : ''}</span><span>${esc(P.num)}</span></button></div>`;
    }
    return h + `<div class="row"><button class="btn s" data-a="sbadd" data-id="${id}" data-fk="${id}:add" ${s.n >= 8 ? 'disabled' : ''}>${esc(P.add)}</button><button class="btn s" data-a="sbdel" data-id="${id}" data-fk="${id}:del" ${s.n <= 4 ? 'disabled' : ''}>${esc(P.del)}</button></div>`;
  },
  timer(b) {
    const [, id, opts, note] = b;
    return `<div class="card timer" id="tm-${id}" data-tm="${id}"><div class="seg" role="group" aria-label="${esc(T('tmPick'))}">${opts.map((o, i) => `<button data-a="tmset" data-id="${id}" data-s="${o[0]}" data-fk="${id}:t${i}" aria-pressed="${TM.id === id ? TM.dur === o[0] : i === 0}">${fx(o[1])}</button>`).join('')}</div>
     <div class="t" role="timer" aria-live="off" id="tmv-${id}">${mmss(TM.id === id ? tmLeft() : opts[0][0])}</div><p class="fine" id="tms-${id}" role="status"></p>
     <div class="row" style="justify-content:center"><button class="btn" data-a="tmgo" data-id="${id}" data-s="${opts[0][0]}" data-fk="${id}:go">${esc(T('tmStart'))}</button><button class="btn s" data-a="tmreset" data-id="${id}" data-s="${opts[0][0]}">${esc(T('tmReset'))}</button></div>${note ? `<p class="fine say">${fx(note)}</p>` : ''}</div>`;
  }
};
/* 過關條件:回傳空字串 = 可以繼續 */
function gateOf(b, d) {
  const id = b[1], s = d[id];
  switch (b[0]) {
    case 'mcq': return s && s.a != null ? '' : T('gMcq');
    case 'cls': return s && b[3].every((x, i) => s[i] != null) ? '' : T('gCls');
    case 'pick': return s != null ? '' : T('gPick');
    case 'sort': return s && s.seen ? '' : T('gSort');
    case 'prompt': return !s || s.pr.some(x => x == null) ? T('gPr1') : !s.v1 ? T('gPr2') : (s.goal == null || s.pr[s.goal] === s.v1[s.goal]) ? T('gPr3') : '';
    case 'check': return b[3] === 'all' && !(s && b[2].every((x, i) => s[i])) ? T('gChk') : '';
  } return '';
}
function stepGate(trk, id) { const M = mod(trk, id), ms = mst(trk, id); if (ms.step >= M.steps.length) return ''; for (const b of blocks(M.steps[ms.step].b)) { const g = gateOf(b, ms.d); if (g) return g } return '' }

/* ---------- 計時器(不排名,只幫助掌握時間) ---------- */
let TM = { id: null, dur: 0, end: 0, left: 0, on: false, iv: 0 };
const mmss = s => { s = Math.max(0, Math.round(s)); return String(Math.floor(s / 60)).padStart(2, '0') + ':' + String(s % 60).padStart(2, '0') };
const tmLeft = () => TM.on ? (TM.end - Date.now()) / 1000 : TM.left;
function tmPaint() {
  const v = $('tmv-' + TM.id); if (!v) { tmStop(); return }
  const l = tmLeft(); v.textContent = mmss(l);
  if (l <= 0 && TM.on) { tmStop(); TM.left = 0; v.parentNode.classList.add('end'); const s = $('tms-' + TM.id); if (s) s.textContent = T('tmUp'); const go = v.parentNode.querySelector('[data-a="tmgo"]'); if (go) go.textContent = T('tmStart') }
}
function tmStop() { clearInterval(TM.iv); TM.on = false }

/* ---------- 朗讀(瀏覽器內建語音合成;不上傳) ---------- */
const canSay = 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
let saying = false;
function sayStop() { if (canSay) speechSynthesis.cancel(); saying = false; const b = $('tts'); if (b) { b.setAttribute('aria-pressed', 'false'); b.lastChild.textContent = T('ttsOn') } }
function sayPage() {
  if (!canSay) return; if (saying) { sayStop(); return }
  const parts = [...document.querySelectorAll('#main .say')].filter(e => !e.closest('details:not([open])') || e.closest('summary')).map(e => e.innerText.trim()).filter(Boolean)
    .join('\n').split(/(?<=[。！？!?\n])/).map(x => x.trim()).filter(Boolean);
  if (!parts.length) return; saying = true; const b = $('tts'); b.setAttribute('aria-pressed', 'true'); b.lastChild.textContent = T('ttsOff');
  parts.forEach((p, i) => { const u = new SpeechSynthesisUtterance(p); u.lang = TTSL[CL()]; u.rate = .9; if (i === parts.length - 1) u.onend = () => sayStop(); speechSynthesis.speak(u) });
}
const ttsBtn = () => canSay ? `<button class="tts" id="tts" data-a="tts" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9H4zM16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/></svg><span>${esc(T('ttsOn'))}</span></button>` : '';

/* ---------- 畫面 ---------- */
const trkOf = t => t === '2a' || t === '2b' ? 't2' : t;
const myTrks = () => [...new Set(su().tr.map(trkOf))];
/* 每項報名對應的下一個截止日 */
function deadlines() {
  const U = su().g === 'U', out = [], add = (t, k, lab) => { const e = CFG.dates[k]; if (e && daysTo(e.d2 || e.d) >= 0) out.push({ t, k, lab, d: e.d2 || e.d }) };
  if (has('t1')) { if (U) add('t1', 'uniReg', 'dlUniReg'); else if (su().city) add('t1', 'regFinal', 'dlRegFinal'); else add('t1', 't1PrelimLast', 'dlPrelim'); add('t1', 'final', 'dlFinalT1') }
  if (has('2a')) { add('2a', U ? 'uniWorksDue' : 'worksDue', 'dlWorks2a'); add('2a', 'regFinal', 'dlRegFinal'); add('2a', 'shortlist', 'dlShort') }
  if (has('t3')) { add('t3', U ? 'uniWorksDue' : 'worksDue', 'dlWorksT3'); add('t3', 'regFinal', 'dlRegFinal'); add('t3', 'shortlist', 'dlShort') }
  if (has('2b')) { add('2b', 'noticeBy', 'dlNotice'); add('2b', 'final', 'dlFinal2b') }
  return out.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0);
}
const firstDl = t => deadlines().find(x => x.t === t);
function legT1Done() { const g = su().g, a = ((legacy().t1 || {}).a || {})[g + '-a'] || []; return a.filter(x => x != null).length >= 5 }
/* 今天做一件事:最近截止的賽道裏,下一個未完成的模組 */
function todayItem() {
  const c = [];
  su().tr.forEach(t => {
    const trk = trkOf(t), dl = firstDl(t), d = dl ? dl.d : '9999';
    if (trk === 't1') { if (!legT1Done()) c.push({ d, trk, t1: true }) }
    else { const m = nextMod(trk); if (m && !c.some(x => x.trk === trk)) c.push({ d, trk, m }) }
  });
  c.sort((a, b) => a.d < b.d ? -1 : a.d > b.d ? 1 : 0); return c[0] || null;
}
const trkName = t => X.ui['n_' + t];
function vHome() {
  if (!S.setup) return vSetup();
  const s = su(), it = todayItem(), dls = deadlines(), near = dls[0];
  let today;
  if (!it) today = `<section class="today"><span class="eb">${esc(T('todayEb'))}</span><h2>${esc(T('allDoneH'))}</h2><p>${esc(T('allDoneP'))}</p></section>`;
  else if (it.t1) today = `<section class="today"><span class="eb">${esc(T('todayEb'))} · ${esc(trkName('t1'))}</span><h2>${esc(T('t1TodayH', { g: X.ui.grades[s.g] }))}</h2><p>${esc(T('t1TodayP'))}</p><button class="btn" data-a="leg" data-h="t1-${s.g.toLowerCase()}">${esc(T('start'))} →</button></section>`;
  else { const ms = S.m[mkey(it.trk, it.m.id)]; today = `<section class="today"><span class="eb">${esc(T('todayEb'))} · ${esc(trkName(it.trk))}</span><h2>${esc(it.m.t)}</h2><p>${esc(T('mins', { n: it.m.mins }))} · ${esc(it.m.aim)}</p><a class="btn" href="${href(it.trk, it.m.id)}">${esc(T(ms && ms.step ? 'cont' : 'start'))} →</a></section>` }
  const prog = myTrks().map(trk => {
    if (trk === 't1') return `<div class="card prog"><div class="hd"><b><img src="img/f6.webp" alt="" width="34" height="34">${esc(trkName('t1'))}</b><span>${esc(T('t1Soon'))}</span></div><p class="dl">${dlLine('t1')}</p><a class="lnk" href="${href('t1')}">${esc(T('openMap'))} →</a></div>`;
    const p = progress(trk), who = trk === 't2' ? ['2a', '2b'].filter(has) : [trk];
    return `<div class="card prog"><div class="hd"><b><img src="img/f${trk === 't2' ? 5 : 0}.webp" alt="" width="34" height="34">${esc(trkName(trk))}${trk === 't2' ? ' · ' + who.map(x => x.toUpperCase()).join('＋') : ''}</b><span>${esc(T('progN', p))}</span></div>
     <div class="meter" role="progressbar" aria-valuemin="0" aria-valuemax="${p.all}" aria-valuenow="${p.n}" aria-label="${esc(trkName(trk))}"><i style="width:${p.all ? Math.round(p.n / p.all * 100) : 0}%"></i></div>
     ${who.map(w => `<p class="dl">${dlLine(w)}</p>`).join('')}<a class="lnk" href="${href(trk)}">${esc(T('openMap'))} →</a></div>`
  }).join('');
  ensureCat(); save();
  const tc = S.cat ? `<img class="tcat" src="${catSrc(S.cat)}" alt="" width="199" height="240">` : '';
  today = today.replace('<section class="today">', '<section class="today' + (tc ? ' hascat' : '') + '">').replace('</section>', tc + '</section>');
  return `<span class="eb">${esc(T('homeEb'))}</span><h1>${esc(T(s.role === 'p' ? 'homeHP' : 'homeH'))}</h1>
   ${plaza(T(!it ? 'plzHiDone' : s.role === 'p' ? 'plzHiP' : 'plzHi', { n: catN(S.cat) }))}
   <p><span class="tag">${esc(X.ui.grades[s.g])}</span>${s.tr.map(t => `<span class="tag ${trkOf(t)}">${esc(X.ui['c_' + t])}</span>`).join('')}${s.city ? `<span class="tag">${esc(T('cityTag'))}</span>` : ''}<a class="lnk" href="${href('setup')}">${esc(T('change'))}</a></p>
   ${s.city && has('t1') ? `<div class="okbox say">${fx(T('cityNote'))}</div>` : ''}
   ${today}
   ${near ? `<p class="lead say"><b>${esc(T('nearH'))}：</b>${esc(X.ui['c_' + near.t])} · ${esc(T(near.lab))} ${dateHTML(near.k)} <span class="fine">${esc(daysTo(near.d) === 0 ? T('dToday') : T('dLeft', { n: daysTo(near.d) }))}</span></p>` : ''}
   <h2>${esc(T('progH'))}</h2>${prog}
   <p class="fine say">${esc(T('pace'))}</p>
   <nav class="nav2" aria-label="${esc(T('moreH'))}"><a href="${href('day')}">${esc(T('nav_day'))}<small>${esc(T('nav_dayS'))}</small></a><a href="${href('parents')}">${esc(T('nav_parents'))}<small>${esc(T('nav_parentsS'))}</small></a>
   <a href="${href('passport')}">${esc(T('nav_passport'))}<small>${esc(T('nav_passportS'))}</small></a><a href="${href('setup')}">${esc(T('nav_setup'))}<small>${esc(T('nav_setupS'))}</small></a></nav>
   <div class="card soft"><b>${esc(T('notesH'))}</b><p class="fine">${esc(T('notesP'))}</p>${myTrks().map(t => `<a class="lnk" href="${esc(CFG.links.notes[t])}" target="_blank" rel="noopener">${esc(T('notes_' + t))} ↗</a>`).join('<br>')}</div>`;
}
function dlLine(t) { const d = firstDl(t); return d ? `${esc(X.ui['c_' + t])}：${esc(T(d.lab))} ${dateHTML(d.k)}` : `${esc(X.ui['c_' + t])}：${esc(T('dlNone'))}` }

/* 三步設定 */
let W = null;
function vSetup() {
  if (!W) { W = Object.assign({ step: 0 }, JSON.parse(JSON.stringify(su()))); if (!S.setup) W.role = null }
  const k = W.step, bar = `<div class="steps3" aria-hidden="true">${[0, 1, 2].map(i => `<i class="${i <= k ? 'on' : ''}"></i>`).join('')}</div>`;
  let body, ok;
  if (k === 0) {
    ok = W.tr.length > 0;
    body = `<h1>${esc(T('su1H'))}</h1><p class="lead">${esc(T('su1P'))}</p><div class="choices">${TRK.map(t => `<button class="opt" role="checkbox" data-a="sutr" data-t="${t}" data-fk="su:${t}" aria-checked="${W.tr.includes(t)}"><span class="mk" aria-hidden="true">${W.tr.includes(t) ? '✓' : ''}</span><span>${esc(X.ui['c_' + t])}<small>${esc(X.ui['cs_' + t])}</small></span></button>`).join('')}</div>
     ${W.tr.includes('t1') ? `<button class="opt" role="checkbox" data-a="sucity" data-fk="su:city" aria-checked="${!!W.city}"><span class="mk" aria-hidden="true">${W.city ? '✓' : ''}</span><span>${esc(T('suCity'))}<small>${esc(T('suCityS'))}</small></span></button>` : ''}`;
  } else if (k === 1) {
    ok = !!W.g;
    const row = (lab, gs) => `<p class="q">${esc(lab)}</p><div class="choices g3">${gs.map(g => `<button class="opt c" data-a="sug" data-g="${g}" data-fk="su:${g}" aria-pressed="${W.g === g}">${esc(X.ui.grades[g])}</button>`).join('')}</div>`;
    body = `<h1>${esc(T('su2H'))}</h1><p class="lead">${esc(T('su2P'))}</p>${row(T('pri'), GRADES.slice(0, 6))}${row(T('sec'), GRADES.slice(6, 12))}${row(T('uni'), ['U'])}`;
  } else {
    ok = !!W.role;
    body = `<h1>${esc(T('su3H'))}</h1><p class="lead">${esc(T('su3P'))}</p><div class="choices">${[['s', 'roleS', 'roleSS'], ['p', 'roleP', 'rolePS']].map(r => `<button class="opt" data-a="surole" data-r="${r[0]}" data-fk="su:${r[0]}" aria-pressed="${W.role === r[0]}"><span class="mk" aria-hidden="true">${W.role === r[0] ? '✓' : ''}</span><span>${esc(T(r[1]))}<small>${esc(T(r[2]))}</small></span></button>`).join('')}</div><p class="fine">${esc(T('suPriv'))}</p>`;
  }
  return `<span class="eb">${esc(T('suEb', { n: k + 1 }))}</span>${bar}${body}
   <div class="nextbar"><span class="g">${k ? `<button class="lnk" data-a="suback">← ${esc(T('prev'))}</button>` : ''}</span><button class="btn" data-a="sunext" data-fk="su:next" ${ok ? '' : 'aria-disabled="true"'}>${esc(T(k < 2 ? 'next' : 'suDone'))} →</button></div>`;
}

/* 培訓地圖 */
function vMap(trk) {
  const D = X[trk], list = mods(trk), nx = nextMod(trk), who = trk === 't2' ? ['2a', '2b'].filter(has) : [trk];
  const item = (m, i) => { const done = isDone(trk, m.id), ms = S.m[mkey(trk, m.id)]; return `<li><a href="${href(trk, m.id)}" class="${done ? 'done' : nx && nx.id === m.id ? 'cur' : ''}">${m.hero ? `<img class="hf" src="img/f${m.hero}.webp" alt="" width="48" height="48">` : `<span class="no" aria-hidden="true">${done ? '✓' : i + 1}</span>`}<span class="tx"><b>${esc(m.t)}</b><small>${m.hero ? esc(X.ui.heroN[m.hero - 1]) + ' · ' : ''}${esc(m.tag)} · ${esc(T('mins', { n: m.mins }))}</small></span>${!done && nx && nx.id === m.id && S.cat ? `<img class="here" src="${catSrc(S.cat)}" alt="${esc(T('here'))}" width="199" height="240">` : `<span class="st">${esc(done ? T('stDone') : ms && ms.step ? T('stGo') : '')}</span>`}</a></li>` };
  let h = `<span class="eb">${esc(T('mapEb'))}</span><h1>${esc(D.name)}</h1><p class="lead say">${fx(D.lead)}</p>`;
  if (D.see) h += `<div class="okbox say">${fx(D.see)}</div>`;
  if (!S.setup) h += `<div class="warnbox say">${esc(T('needSetup'))} <a class="lnk" href="${href('setup')}">${esc(T('nav_setup'))} →</a></div>`;
  if (S.setup) h += who.filter(has).map(w => `<p class="dl say">${dlLine(w)}</p>`).join('');
  if (D.tier && S.setup) h += `<div class="card soft say"><b>${esc(T('tierH', { s: X.ui.stages[stage()], g: X.ui.grades[su().g] }))}</b><p>${fx(D.tier[stage()])}</p></div>`;
  const secs = D.secs || [[null, list.map(m => m.id)]];
  let n = 0;
  secs.forEach(sec => { const ms = list.filter(m => sec[1].includes(m.id)); if (!ms.length) return; if (sec[0]) h += `<h2>${esc(sec[0])}</h2>`; h += `<ol class="map">${ms.map(m => item(m, n++)).join('')}</ol>` });
  h += `<p class="fine say">${esc(T('pace'))}</p><p><a class="lnk" href="${esc(CFG.links.notes[trk])}" target="_blank" rel="noopener">${esc(T('notes_' + trk))} ↗</a></p>`;
  return h;
}
function vT1() {
  const g = R.g || su().g;
  return `<span class="eb">${esc(T('mapEb'))}</span><h1>${esc(X.t1.name)}</h1><p class="lead say">${fx(X.t1.lead)}</p>
   ${S.setup && has('t1') ? `<p class="dl say">${dlLine('t1')}</p>` : ''}${su().city ? `<div class="okbox say">${fx(T('cityNote'))}</div>` : ''}
   <div class="warnbox say">${fx(X.t1.soon)}</div>
   <button class="btn w" data-a="leg" data-h="t1${g ? '-' + g.toLowerCase() : ''}">${esc(g ? T('t1TodayH', { g: X.ui.grades[g] }) : T('t1Open'))} →</button>
   <div class="card soft say"><b>${esc(X.t1.rulesH)}</b><ul class="ul">${X.t1.rules.map(x => `<li>${fx(x)}</li>`).join('')}</ul></div>
   <p><a class="lnk" href="${esc(CFG.links.notes.t1)}" target="_blank" rel="noopener">${esc(T('notes_t1'))} ↗</a></p>`;
}
/* 模組頁 */
function vMod(trk, id) {
  const M = mod(trk, id); if (!M) return vMap(trk); CURM = M;
  const ms = mst(trk, id), n = M.steps.length, list = mods(trk), idx = list.findIndex(m => m.id === id);
  if (ms.step >= n) {
    ensureCat(); const nx = nextMod(trk), d = new Date(S.done[mkey(trk, id)] || Date.now()), FR = friends(), NF = FR[FR.length - 1];
    return `<span class="eb">${esc(X[trk].name)}</span><h1>${esc(T('modDoneH'))}</h1><div class="celebr">${S.cat ? `<img src="${catSrc(S.cat)}" alt="" width="199" height="240">` : ''}<div class="stampbig" role="img" aria-label="${esc(T('stDone'))}"><span>${esc(T('stDone'))}<br><small>${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}</small></span></div>${NF ? `<img class="nf" src="${catSrc(NF)}" alt="" width="199" height="240">` : ''}</div>${NF ? `<p class="okbox say" style="text-align:center">${esc(T('plzNew', { n: catN(NF), all: FR.length }))}</p>` : ''}
     <p class="lead say" style="text-align:center"><b>${esc(M.t)}</b><br>${fx(M.take || '')}</p>
     <div class="row" style="justify-content:center">${nx ? `<a class="btn" href="${href(trk, nx.id)}">${esc(T('nextMod'))}：${esc(nx.t)} →</a>` : `<a class="btn" href="${href('home')}">${esc(T('backHome'))} →</a>`}<a class="btn s" href="${href(trk)}">${esc(T('backMap'))}</a><button class="btn s" data-a="redo">${esc(T('redo'))}</button></div><p class="fine" style="text-align:center">${esc(T('rest'))}</p>`;
  }
  const st = M.steps[ms.step], g = stepGate(trk, id);
  return `<span class="eb">${esc(X[trk].name)} · ${esc(T('modN', { n: idx + 1, all: list.length }))}</span><h1>${esc(M.t)}</h1>
   <div class="dots" aria-hidden="true">${M.steps.map((s, i) => `<i class="${i === ms.step ? 'on' : i < ms.step ? 'done' : ''}">${esc(s.n)}</i>`).join('')}</div>
   <p class="sr" role="status">${esc(T('stepSr', { n: ms.step + 1, all: n, s: st.n }))}</p>
   ${ms.step === 0 ? `<p class="lead say"><b>${esc(T('aimH'))}：</b>${fx(M.aim)}</p>${M.par && showPar() ? `<div class="par say"><b>${esc(T('parH'))}</b>${fx(M.par)}</div>` : ''}` : ''}
   <div class="row sb"><h2 class="say">${esc(st.n)}${st.h ? '：' + esc(st.h) : ''}</h2>${ttsBtn()}</div>
   ${blocks(st.b).map(b => BL[b[0]] ? BL[b[0]](b, ms.d) : '').join('')}
   <div class="nextbar"><span class="g" id="gate" role="status">${ms.step ? `<button class="lnk" data-a="mprev">← ${esc(T('prev'))}</button> ` : ''}${esc(g)}</span><button class="btn" data-a="mnext" data-fk="mnext" ${g ? 'aria-disabled="true"' : ''}>${esc(ms.step < n - 1 ? T('next') : T('finish'))} →</button></div>`;
}
/* 給老師:原首頁的課程對應、學校方案、數學集市攤位、列印檔 */
function vTeachers() {
  const P = X.teach, f = (CL() === 'sc' ? 'sc' : 'tc');
  return `<span class="eb">${esc(T('teachEb'))}</span><h1>${esc(P.h)}</h1><p class="lead say">${fx(P.p)}</p>
   <div class="choices">${P.tools.map(x => `<button class="opt" data-a="leg" data-h="${esc(x[2])}"><span>${esc(x[0])}<small>${esc(x[1])}</small></span></button>`).join('')}</div>
   <h2>${esc(P.pdfH)}</h2><ul class="ul">${P.pdfs.map(x => `<li><a href="files/${esc(x[1].replace('{l}', f))}" target="_blank" rel="noopener">${esc(x[0])}</a></li>`).join('')}</ul><p class="fine say">${fx(P.note)}</p>`;
}
const vSoon = k => `<span class="eb">${esc(T('soonEb'))}</span><h1>${esc(T('nav_' + k))}</h1><div class="warnbox say">${fx(X.soon[k])}</div><p><a class="btn s" href="${href('home')}">${esc(T('backHome'))}</a></p>`;

function title() {
  const v = R.view;
  if (R.mod && X[v] && mod(v, R.mod)) return mod(v, R.mod).t;
  return v === 'home' ? T(S.setup ? 'homeH' : 'su1H') : v === 'setup' ? T('nav_setup') : X[v] ? X[v].name : v === 'teachers' ? X.teach.h : T('nav_' + v);
}
let lastRoute = '';
function render(focusKey) {
  const v = R.view; sayStop(); if (!R.mod) tmStop();
  document.documentElement.lang = HL[CL()];
  document.title = title() + ' · ' + T('site');
  $('ev').textContent = T('event'); $('ttl').textContent = title(); $('skip').textContent = T('skip');
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  $('lang').setAttribute('aria-label', T('langAria')); $('disp').setAttribute('aria-label', T('dispH')); $('disp').title = T('dispH');
  const up = R.mod ? href(v) : href('home'), bk = $('back');
  bk.classList.toggle('hide', v === 'home' && !R.mod); $('mark').classList.toggle('hide', !(v === 'home' && !R.mod)); bk.href = up; bk.textContent = '←'; bk.setAttribute('aria-label', R.mod ? T('backMap') : T('backHome'));
  let h;
  if (v === 'home') h = vHome(); else if (v === 'setup') h = vSetup(); else if (v === 't1') h = vT1();
  else if (v === 't2' || v === 't3') h = R.mod ? vMod(v, R.mod) : vMap(v);
  else if (v === 'teachers') h = vTeachers(); else h = vSoon(v);
  if (!HAS[LANG]) h = `<div class="warnbox" lang="en">The English version of the new training modules will be added in the next preview. Traditional Chinese is shown for now.</div>` + h;
  $('main').innerHTML = h + `<p class="disc say">${esc(T('disc'))}</p>`;
  $('ft').innerHTML = `${esc(T('org'))}<br>${fx(T('contact'))}<br><a href="${href('teachers')}">${esc(T('nav_teachers'))}</a> · <a href="${esc(CFG.links.register[LANG])}" target="_blank" rel="noopener">${esc(T('notReg'))}</a> · <button id="clr" data-a="clr">${esc(T('clr'))}</button><br>${esc(T('ver', { v: CFG.version }))}`;
  const route = v + '/' + (R.mod || '') + '/' + (R.mod && X[v] && mod(v, R.mod) ? mst(v, R.mod).step : W ? W.step : '');
  if (route !== lastRoute) { lastRoute = route; window.scrollTo(0, 0); if (focusKey !== false) $('main').focus({ preventScroll: true }) }
  else if (focusKey) { const el = document.querySelector(`[data-fk="${focusKey}"]`); if (el && !el.disabled) el.focus({ preventScroll: true }); else { const fb = document.getElementById('fb-' + focusKey.split(':').slice(0, 2).join('-')) || document.getElementById('fb-' + focusKey.split(':')[0]); if (fb) fb.focus({ preventScroll: true }) } }
}
function applyA11y() {
  const r = document.documentElement, a = S.a;
  a.fs ? r.setAttribute('data-fs', a.fs) : r.removeAttribute('data-fs');
  a.hc ? r.setAttribute('data-hc', '') : r.removeAttribute('data-hc');
  a.rm ? r.setAttribute('data-rm', '') : r.removeAttribute('data-rm');
  const th = ls.get(TKEY); if (th === 'dark' || th === 'light') r.setAttribute('data-theme', th); else r.removeAttribute('data-theme');
}
function toast(m) { document.querySelectorAll('.toast').forEach(x => x.remove()); const d = document.createElement('div'); d.className = 'toast'; d.setAttribute('role', 'status'); d.textContent = m; document.body.appendChild(d); setTimeout(() => d.remove(), 2600) }
/* 顯示設定:字體三級、高對比、減少動畫、深色 */
function sheet() {
  const old = $('sheet'); if (old) { old.remove(); $('disp').focus(); return }
  const a = S.a, th = ls.get(TKEY), el = document.createElement('div'); el.className = 'sheet'; el.id = 'sheet';
  const tog = (k, on, lab) => `<button class="opt" role="switch" data-a="a11y" data-k="${k}" aria-checked="${!!on}"><span class="mk" aria-hidden="true">${on ? '✓' : ''}</span><span>${esc(lab)}</span></button>`;
  el.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-label="${esc(T('dispH'))}"><div class="row sb"><h2>${esc(T('dispH'))}</h2><button class="btn s" data-a="sheet" id="shx">${esc(T('close'))}</button></div>
   <p class="q">${esc(T('fsH'))}</p><div class="seg" role="group">${[0, 1, 2].map(i => `<button data-a="fs" data-i="${i}" aria-pressed="${a.fs === i}" style="font-size:${[1, 1.15, 1.3][i]}rem">${esc(X.ui.fsL[i])}</button>`).join('')}</div>
   <div class="choices">${tog('hc', a.hc, T('hcL'))}${tog('rm', a.rm, T('rmL'))}${tog('dark', th === 'dark', T('darkL'))}</div><p class="fine">${esc(T('dispP'))}</p></div>`;
  document.body.appendChild(el); $('shx').focus();
}

/* ---------- 事件 ---------- */
function reroute() {
  const h = parse();
  if (h.old) { location.replace(CFG.links.legacy + location.hash); return }
  if (h.lang && h.lang !== LANG) { setLang(h.lang, true); return }
  R = { view: h.view, mod: h.mod, g: h.g }; if (R.view !== 'setup') W = null;
  render();
}
function setLang(l, fromHash) {
  if (!LANGS.includes(l)) return; LANG = l; ls.set(LKEY, l);
  loadLang(l).then(c => { X = c; if (!fromHash) { history.replaceState(null, '', href(R.view, R.mod)) } const h = parse(); R = { view: h.view, mod: h.mod, g: h.g }; lastRoute = ''; render() });
}
window.addEventListener('hashchange', reroute);
document.addEventListener('keydown', e => { if (e.key === 'Escape' && $('sheet')) sheet() });
document.addEventListener('click', e => {
  if (e.target.id === 'sheet') { sheet(); return }
  const b = e.target.closest('button,[data-a]'); if (!b || b.disabled) return; const d = b.dataset, fk = d.fk;
  if (d.lang) { setLang(d.lang); return }
  if (b.id === 'disp' || d.a === 'sheet') { sheet(); return }
  if (d.a === 'fs') { S.a.fs = +d.i; save(); applyA11y(); sheet(); sheet(); return }
  if (d.a === 'a11y') { if (d.k === 'dark') { const on = ls.get(TKEY) === 'dark'; on ? ls.set(TKEY, 'light') : ls.set(TKEY, 'dark') } else S.a[d.k] = S.a[d.k] ? 0 : 1; save(); applyA11y(); sheet(); sheet(); return }
  if (d.a === 'clr') { if (!d.sure) { d.sure = '1'; b.textContent = T('clrSure'); setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = T('clr') } }, 4000); return } ls.del(KEY); ls.del(LEG); S = fresh(); W = null; applyA11y(); location.hash = '#' + LANG; lastRoute = ''; reroute(); toast(T('cleared')); return }
  if (d.a === 'leg') { toLegacy(d.h); return }
  if (d.a === 'catsheet') { catSheet(); return }
  if (d.a === 'catpick') { S.cat = d.c; save(); $('sheet').remove(); render(false); const cb = $('catbtn'); if (cb) cb.focus(); toast(T('plzNow', { n: catN(S.cat) })); return }
  if (d.a === 'tts') { sayPage(); return }
  /* 設定 */
  if (d.a === 'sutr') { const i = W.tr.indexOf(d.t); i < 0 ? W.tr.push(d.t) : W.tr.splice(i, 1); W.tr.sort((a, b) => TRK.indexOf(a) - TRK.indexOf(b)); if (!W.tr.includes('t1')) W.city = false; render(fk); return }
  if (d.a === 'sucity') { W.city = !W.city; render(fk); return }
  if (d.a === 'sug') { W.g = d.g; render(fk); return }
  if (d.a === 'surole') { W.role = d.r; render(fk); return }
  if (d.a === 'suback') { W.step--; render(); return }
  if (d.a === 'sunext') {
    if (b.getAttribute('aria-disabled')) { toast(T(['suG1', 'suG2', 'suG3'][W.step])); return }
    if (W.step < 2) { W.step++; render(); return }
    S.setup = { tr: W.tr, g: W.g, role: W.role, city: !!W.city }; ensureCat(); save(); W = null; location.hash = '#' + LANG; lastRoute = ''; reroute(); return
  }
  /* 模組 */
  if (!R.mod) return; const trk = R.view, ms = mst(trk, R.mod), D = ms.d, id = d.id, re = () => { save(); render(fk) };
  const blk = () => blocks(mod(trk, R.mod).steps[ms.step].b).find(x => x[1] === id);
  switch (d.a) {
    case 'mnext': { const g = stepGate(trk, R.mod); if (g) { toast(g); return } ms.step++; if (ms.step >= mod(trk, R.mod).steps.length && !S.done[mkey(trk, R.mod)]) S.done[mkey(trk, R.mod)] = Date.now(); save(); render(); return }
    case 'mprev': ms.step = Math.max(0, ms.step - 1); save(); render(); return;
    case 'redo': S.m[mkey(trk, R.mod)] = { step: 0, d: {} }; save(); render(); return;
    case 'mcq': { const s = D[id] || (D[id] = { w: [], a: null }), i = +d.i, ans = blk()[4]; if (s.a != null) return; if (i === ans || s.w.length) s.a = i; else s.w.push(i); re(); return }
    case 'cls': { const s = D[id] || (D[id] = []); if (s[+d.i] == null) s[+d.i] = +d.j; re(); return }
    case 'pick': D[id] = +d.i; re(); return;
    case 'sortcard': { const s = D[id] || (D[id] = { ord: blk()[2].map(() => null), ck: 0 }), i = s.ord.indexOf(null); if (i >= 0) { s.ord[i] = +d.i; s.ck = 0 } re(); return }
    case 'sortslot': { const s = D[id]; if (s && s.ord[+d.i] != null) { s.ord[+d.i] = null; s.ck = 0 } re(); return }
    case 'sortcheck': { const s = D[id]; if (s && s.ord.every(x => x != null)) { s.ck = 1; if (s.ord.every((c, i) => c === i)) s.seen = true } re(); return }
    case 'sortreset': D[id] = { ord: blk()[2].map(() => null), ck: 0, seen: D[id] && D[id].seen }; re(); return;
    case 'sortshow': D[id] = { ord: blk()[2].map((x, i) => i), ck: 1, seen: true }; re(); return;
    case 'pr': { const s = D[id] || (D[id] = { pr: [null, null, null, null], v1: null, goal: null }); s.pr[+d.i] = +d.j; re(); return }
    case 'prkeep': { const s = D[id]; if (s && s.pr.every(x => x != null)) s.v1 = s.pr.slice(); re(); return }
    case 'prgoal': { const s = D[id]; if (s && s.v1) s.goal = +d.i; re(); return }
    case 'wunit': D[id + '_u'] = +d.i; re(); return;
    case 'sbnum': { const s = D[id] || (D[id] = { n: 4, p: [], num: null }); s.num = s.num === +d.i ? null : +d.i; re(); return }
    case 'sbadd': { const s = D[id] || (D[id] = { n: 4, p: [], num: null }); if (s.n < 8) s.n++; re(); return }
    case 'sbdel': { const s = D[id]; if (s && s.n > 4) { s.n--; s.p.length = Math.min(s.p.length, s.n); if (s.num >= s.n) s.num = null } re(); return }
    case 'tmset': tmStop(); TM = { id, dur: +d.s, left: +d.s, end: 0, on: false, iv: 0 }; render(fk); return;
    case 'tmreset': { tmStop(); const dur = TM.id === id ? TM.dur : +d.s; TM = { id, dur, left: dur, end: 0, on: false, iv: 0 }; render(fk); return }
    case 'tmgo': {
      if (TM.id !== id) TM = { id, dur: +d.s, left: +d.s, end: 0, on: false, iv: 0 };
      if (TM.on) { TM.left = tmLeft(); tmStop(); b.textContent = T('tmStart') } else { if (TM.left <= 0) TM.left = TM.dur; TM.end = Date.now() + TM.left * 1000; TM.on = true; TM.iv = setInterval(tmPaint, 500); b.textContent = T('tmPause'); const c = $('tm-' + id); if (c) c.classList.remove('end'); const s = $('tms-' + id); if (s) s.textContent = '' }
      tmPaint(); return
    }
  }
});
document.addEventListener('input', e => {
  const x = e.target, d = x.dataset; if (!R.mod) return; const ms = mst(R.view, R.mod);
  if (d.w) { ms.d[d.w] = x.value; save(); const c = $('c-' + d.w); if (c) { const n = cntOf(x.value, c.dataset.u), mx = +c.dataset.max; c.textContent = n + ' / ' + mx; c.className = n > mx ? 'over' : n ? 'fit' : '' } return }
  if (d.sb) { const s = ms.d[d.sb] || (ms.d[d.sb] = { n: 4, p: [], num: null }); (s.p[+d.i] || (s.p[+d.i] = ['', '']))[+d.j] = x.value; save(); return }
});
document.addEventListener('change', e => {
  const x = e.target, d = x.dataset; if (!R.mod || !d.c) return; const ms = mst(R.view, R.mod);
  (ms.d[d.c] || (ms.d[d.c] = []))[+d.i] = x.checked; save();
  const g = stepGate(R.view, R.mod), el = $('gate'), bt = document.querySelector('[data-a="mnext"]');
  if (el && bt) { const back = el.querySelector('button'); el.textContent = g; if (back) el.prepend(back, ' '); g ? bt.setAttribute('aria-disabled', 'true') : bt.removeAttribute('aria-disabled') }
});

/* ---------- 啟動 ---------- */
applyA11y();
{ const h = parse(); if (h.old) location.replace(CFG.links.legacy + location.hash); else { LANG = pickLang(); ls.set(LKEY, LANG); loadLang(LANG).then(c => { X = c; reroute() }).catch(() => { $('main').textContent = '內容未能載入，請重新整理頁面。' }) } }
if ('serviceWorker' in navigator && location.protocol === 'https:') { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { }) }) }
})();
