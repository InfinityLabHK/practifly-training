/* Practifly AI 三賽道自學培訓網站 v3.0(2026-11-16)
   定位:服務已報名的參加者及家長,在家按自己的賽道和年級自學;校內培訓及正式評估以章程及大會通知為準。
   v3.0 最終優化(2026-11-16):第一頁機械貓歡迎、四步設定、機械貓「數字生命」最小版(本機時鐘 + 預寫狀態表,不接 AI)、
   便利貼(只存本機)、三步新手導覽、首頁重排、【待確認】只在審閱模式(?review)顯示。
   紅線:不接任何 LLM、不收集或上傳資料、不用帳號;進度只存本機 localStorage(try/catch);保留「清除進度」。
   只用已批示範題及現有模擬題;不自行新增比賽題目、數字、日期、金額、名額、獎項或服務。
   所有日期、連結、聯絡方法由 config.js 讀取;文字內容在 js/c-<語言>.js(繁體為正本,簡體由 tools/make_sc.py 產生)。
   提示只問不答;示範要先自己試才看。舊連結 #t1-tc、#t2-tc、#t3-tc、#ws-sc、#tpl-sc、#preview-lib-sc 照舊可用。 */
(() => {
'use strict';
const CFG = window.PF_CONFIG;
const LANGS = ['tc', 'sc', 'en'], HL = { tc: 'zh-Hant-HK', sc: 'zh-Hans-CN', en: 'en' }, TTSL = { tc: 'zh-HK', sc: 'zh-CN', en: 'en-US' };
const HAS = { tc: 1, sc: 1 };            // 已有新內容的語言;EN 稍後加入,之前先顯示繁體並說明
const KEY = 'pf-training-v3', LEG = 'pf-track2-demo-v1', LKEY = 'pf-track2-lang', TKEY = 'pf-track2-theme';
const VIEWS = ['home', 'setup', 't1', 't2', 't3', 'day', 'parents', 'teachers', 'passport'];
const GRADES = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'S1', 'S2', 'S3', 'S4', 'S5', 'S6', 'U'];
const TRK = ['t1', '2a', '2b', 't3'];
const $ = id => document.getElementById(id);
const esc = x => String(x == null ? '' : x).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
/* 審閱模式:網址加 ?review 才顯示【待確認】;一般網址不顯示 */
const REVIEW = (() => { try { if (/(^|[?&])review(=|&|$)/.test(location.search)) { sessionStorage.setItem('pf-review', '1'); return true } return sessionStorage.getItem('pf-review') === '1' } catch (e) { return false } })();
/* 時鐘:測試時可用 ?now=2026-11-17T16:00 注入本地時間;一般使用裝置的本地時間 */
function nowD() { try { const q = new URLSearchParams(location.search).get('now'); if (q) { const d = new Date(q); if (!isNaN(d)) return d } } catch (e) { } return new Date() }
const BOOT = Date.now();
const hsh = a => { let h = 2166136261; for (const c of String(a)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619) } return h >>> 0 };
const ls = { get(k) { try { return localStorage.getItem(k) } catch (e) { return null } }, set(k, v) { try { localStorage.setItem(k, v) } catch (e) { } }, del(k) { try { localStorage.removeItem(k) } catch (e) { } } };

/* ---------- 狀態(只存本機) ---------- */
const fresh = () => ({ v: 3, setup: null, a: { fs: 0, hc: 0, rm: 0 }, m: {}, done: {}, cat: null, seed: 0, notes: [], mine: null, tour: 0, seenAt: 0 });
let S = fresh();
try { const o = JSON.parse(ls.get(KEY) || 'null'); if (o && o.v === 3) S = Object.assign(fresh(), o) } catch (e) { }
/* R09:舊版便利貼曾引用同學寫過的句子;打開時刪去引用內容 */
try { if (Array.isArray(S.notes)) S.notes = S.notes.filter(n => n && n.k).map(n => ({ k: n.k, w: n.w || (n.q ? 1 : 0), at: n.at })) } catch (e) { S.notes = [] }
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
const pendTag = () => REVIEW ? `<span class="tag pend">${esc(T('pend'))}</span>` : '';
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
    mod: tk.find(x => /^(m[1-9]|make|talk|exam|timed)$/.test(x)) || null,
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
    const v = x === 'p13' ? /^P[1-3]$/.test(g) : x === 'pri' ? g[0] === 'P' : x === 'sec' ? g[0] === 'S' : x === 'par' ? su().role !== 's' : x === 'city' ? !!su().city
      : x === '2a' || x === '2b' || x === 't1' || x === 't3' ? has(x) : x === 'k12' ? g !== 'U' : x === 'sc' ? CL() === 'sc' : x === st;
    return neg ? !v : v;
  });
}
const showPar = () => cond('p13|par');
/* 每次練習多久:按賽道及年級顯示《學生需知》第 4 部分原句(R08) */
function paceHTML(trks) {
  const g = su().g, grp = !g || g === 'U' ? null : g[0] === 'P' ? (+g[1] <= 3 ? 'p13' : 'p46') : (+g[1] <= 3 ? 's13' : 's46');
  const L = S.setup && grp ? trks.filter(t => X.paceBy[t]).map(t => `<li>${esc(trkName(t))}（${esc(X.ui.grades[g])}）：${esc(X.paceBy[t][grp])}</li>`) : [];
  return `<div class="fine say pace">${L.length ? `<b>${esc(T('paceH'))}</b><ul class="ul">${L.join('')}</ul>` : ''}<p>${esc(T('paceTip'))}</p></div>`;
}

/* ---------- 機械貓夥伴、本機廣場及「數字生命」(最小版) ----------
   每位同學有一隻機械貓夥伴(隨機配對,可更換);每完成一個模組,廣場多一位機械貓同學。
   「一直在生活」:按裝置本地時間及預寫狀態表決定牠在做甚麼(不接 AI、不連線);沒有飢餓、生病、懲罰、衰減、打卡獎勵或推送。
   全部只存本機:沒有其他用戶的資料、沒有排名。 */
const CATS = window.PF_CATS || [];
const catN = id => { const c = CATS.find(x => x.id === id); return c ? c.n[CL()] : '' };
const catSrc = id => 'img/cats/' + id + '.webp';
function ensureCat() { if (!CATS.length) return; if (!S.cat || !CATS.some(c => c.id === S.cat)) S.cat = CATS[Math.floor(Math.random() * CATS.length)].id; if (!S.seed) S.seed = 1 + Math.floor(Math.random() * 1e6) }
function friends() {
  const o = CATS.map(c => c.id).filter(x => x !== S.cat); let s = S.seed || 7;
  for (let i = o.length - 1; i > 0; i--) { s = (s * 16807) % 2147483647; const j = s % (i + 1);[o[i], o[j]] = [o[j], o[i]] }
  return o.slice(0, Math.min(Object.keys(S.done).length, o.length));
}
/* 機械貓的一天:平日 起床 / 上學 / 廣場 / 晚飯 / 做功課 / 睡覺;週六野餐、週日踢波,週末晚上看星星 */
function lifeAt(d) {
  const day = d.getDay(), we = day === 0 || day === 6, m = d.getHours() * 60 + d.getMinutes();
  if (m < 420 || m >= 1290) return 'sleep';                         // 21:30–07:00
  if (m < 510) return 'wake';                                       // 07:00–08:30
  if (m < 930) return we ? (day === 6 ? 'picnic' : 'ball') : 'school'; // 08:30–15:30
  if (m < 1110) return 'plaza';                                     // 15:30–18:30
  if (m < 1170) return 'dinner';                                    // 18:30–19:30
  return we ? 'free' : 'homework';                                  // 19:30–21:30
}
const lifeNow = () => lifeAt(nowD());
let SEEN0 = 0;   // 上次打開的時間(本次啟動時讀取)
function awayLine() {
  const now = nowD().getTime(); if (!SEEN0 || now - SEEN0 < 90 * 60e3) return '';
  const cur = lifeAt(new Date(now)), seq = []; let t = Math.max(SEEN0, now - 3 * 864e5);
  for (; t < now; t += 30 * 60e3) { const k = lifeAt(new Date(t)); if (k !== cur && seq[seq.length - 1] !== k) seq.push(k) }
  const u = [...new Set(seq.reverse())].slice(0, 3).reverse(); if (!u.length) return '';
  return T('lfAway', { s: u.map(k => T('lp_' + k)).join(T('lfAnd')) });
}
/* 小道具(CSS / SVG,不用生成圖像) */
const PROP = {
  sleep: '<span class="zz" aria-hidden="true"><i>z</i><i>Z</i><i>z</i></span>',
  wake: '<svg class="prop" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="8" fill="#FFC93C"/><g stroke="#FFB000" stroke-width="3" stroke-linecap="round"><path d="M20 3v5M20 32v5M3 20h5M32 20h5M8 8l3.5 3.5M28.5 28.5L32 32M8 32l3.5-3.5M28.5 11.5L32 8"/></g></svg>',
  school: '<svg class="prop" viewBox="0 0 40 40" aria-hidden="true"><rect x="8" y="12" width="24" height="24" rx="5" fill="#E85D5D"/><rect x="12" y="20" width="16" height="9" rx="2" fill="#FFD7D7"/><path d="M14 12a6 6 0 0112 0" fill="none" stroke="#B83A3A" stroke-width="3"/></svg>',
  plaza: '<svg class="prop" viewBox="0 0 40 40" aria-hidden="true"><path d="M4 12q8-4 16 0v20q-8-4-16 0z" fill="#5B8DEF"/><path d="M36 12q-8-4-16 0v20q8-4 16 0z" fill="#7FA7F5"/><path d="M8 17h8M8 21h8M24 17h8M24 21h8" stroke="#fff" stroke-width="1.6"/></svg>',
  dinner: '<svg class="prop" viewBox="0 0 40 40" aria-hidden="true"><path d="M5 20h30a15 13 0 01-30 0z" fill="#F2F2F2" stroke="#9AA3B5" stroke-width="2"/><path d="M14 8q3 3 0 7M20 6q3 3 0 8M26 8q3 3 0 7" fill="none" stroke="#9AA3B5" stroke-width="2" stroke-linecap="round"/></svg>',
  homework: '<svg class="prop" viewBox="0 0 40 40" aria-hidden="true"><rect x="6" y="8" width="22" height="28" rx="2" fill="#fff" stroke="#9AA3B5" stroke-width="2"/><path d="M10 15h14M10 20h14M10 25h9" stroke="#9AA3B5" stroke-width="2"/><path d="M27 31L36 12l3 1.5-9 19z" fill="#FFC93C"/></svg>',
  picnic: '<svg class="prop" viewBox="0 0 40 40" aria-hidden="true"><path d="M2 30l8-10h28l-8 10z" fill="#E85D5D"/><path d="M8 25h26M14 20l-6 10M24 20l-6 10" stroke="#fff" stroke-width="2"/><rect x="22" y="9" width="12" height="9" rx="2" fill="#C98B4E"/><path d="M24 9a4 4 0 018 0" fill="none" stroke="#8A5A2B" stroke-width="2"/></svg>',
  ball: '<svg class="prop bounce" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="14" fill="#fff" stroke="#1F1A2B" stroke-width="2"/><path d="M20 13l6 4-2 7h-8l-2-7z" fill="#1F1A2B"/></svg>',
  free: '<svg class="prop twinkle" viewBox="0 0 40 40" aria-hidden="true"><path d="M20 4l4 10 10 1-8 7 3 10-9-6-9 6 3-10-8-7 10-1z" fill="#FFD24A"/></svg>'
};
const FPROP = { book: PROP.plaza, ball: PROP.ball, note: '<span class="mus" aria-hidden="true">♪</span>', bag: PROP.school, zz: PROP.sleep, walk: '' };
/* 機械貓「現在正在做甚麼」的畫面 */
function scene(k, big) {
  ensureCat(); if (!S.cat) return '';
  return `<div class="scene s-${k}${big ? ' big' : ''}" role="img" aria-label="${esc(T('lfNow', { n: catN(S.cat), s: T('ls_' + k) }))}"><div class="pbub say">${esc(T('lf_' + k))}</div><img class="me" id="meimg" src="${catSrc(S.cat)}" alt="" width="199" height="240">${PROP[k] || ''}</div>`;
}
const PPOS = [[17, 31], [83, 31], [30, 20], [70, 20], [9, 14], [91, 14], [22, 4], [78, 4], [38, 3], [62, 3]];
function plaza() {
  ensureCat(); if (!S.cat) return ''; const fr = friends(), show = fr.slice(-10), k = lifeNow(), day = nowD().toDateString();
  /* 廣場同學也有生活:按 seed + 日期決定今天的位置及動作 */
  const pos = PPOS.slice().sort((a, b) => hsh(S.seed + day + a) - hsh(S.seed + day + b));
  const acts = ['book', 'ball', 'note', 'walk'];
  const act = i => k === 'sleep' ? 'zz' : k === 'school' ? 'bag' : acts[hsh(S.seed + '|' + day + '|' + show[i]) % acts.length];
  const n = fr.length, msg = !n ? T('plz0') : n >= 3 ? T('plzMany', { n }) : T('plzFew', { n });
  return `<section class="plaza s-${k}" id="tour-plz" aria-label="${esc(T('plzH'))}"><div class="pb say">${esc(msg)}</div>${show.map((id, i) => { const a = act(i); return `<span class="fr a-${a}" style="left:${pos[i][0]}%;bottom:${pos[i][1]}%"><img src="${catSrc(id)}" alt="${esc(catN(id))}" width="199" height="240">${FPROP[a] || ''}</span>` }).join('')}<img class="me" src="${catSrc(S.cat)}" alt="${esc(T('plzMe', { n: catN(S.cat) }))}" width="199" height="240"><button class="pbtn" data-a="catsheet" id="catbtn">${esc(T('plzChange'))}</button></section>
   <p class="fine say">${esc(T('plzN'))}</p><p class="sr" role="status" id="plzst"></p>`;
}
function catSheet() {
  const old = $('sheet'); if (old) { old.remove(); const b = $('catbtn') || $('suall'); if (b) b.focus(); return }
  const cur = R.view === 'setup' && W ? W.cat : S.cat;
  const el = document.createElement('div'); el.className = 'sheet'; el.id = 'sheet';
  el.innerHTML = `<div class="box" role="dialog" aria-modal="true" aria-label="${esc(T('plzPick'))}"><div class="row sb"><h2>${esc(T('plzPick'))}</h2><button class="btn s" data-a="catsheet" id="shx">${esc(T('close'))}</button></div><p class="fine">${esc(T('plzPickP'))}</p>
   <div class="catgrid">${CATS.map(c => `<button data-a="catpick" data-c="${c.id}" aria-pressed="${cur === c.id}"><img src="${catSrc(c.id)}" alt="" loading="lazy" width="199" height="240">${esc(c.n[CL()])}</button>`).join('')}</div></div>`;
  document.body.appendChild(el); $('shx').focus();
}
/* 便利貼(不是聊天):完成新模組時機械貓留一張預寫的便利貼;同學可貼一張給牠(≤30 字,只存本機)。牠只用動作回應,不生成回覆。 */
/* R09:不引用同學寫過的句子(共用裝置私隱),只記寫了幾格 */
function addNote(k) {
  let w = 0; const [trk, id] = k.split('.'); const M = X[trk] && X[trk].mods && mod(trk, id);
  if (M) { const ms = S.m[k] || { d: {} }; for (const st of M.steps) for (const b of blocks(st.b)) if (b[0] === 'write' && String(ms.d[b[1]] || '').trim()) w++ }
  S.notes = (S.notes || []).concat([{ k, w, at: Date.now() }]).slice(-12);
}
function noteText(n, i) {
  const [trk, id] = n.k.split('.'), M = X[trk] && X[trk].mods && mod(trk, id), t = M ? M.t : T('ntT1');
  return n.w ? T('ntC1', { t, n: n.w }) : T(i % 2 ? 'ntC2' : 'ntC0', { t });
}
function notesBoard() {
  const N = (S.notes || []).slice(-3).reverse(), me = S.mine, seen = me && me.at < BOOT;
  return `<section class="notes" aria-label="${esc(T('ntH'))}"><h2>${esc(T('ntH'))}</h2>
   ${N.length ? `<div class="ntw">${N.map((n, i) => `<div class="nt say"><img src="${catSrc(S.cat)}" alt="" width="199" height="240">${esc(noteText(n, (S.notes.length - 1 - i)))}</div>`).join('')}</div>` : ''}
   ${me ? `<div class="nt mine"><b>${esc(T('ntMine'))}</b>「${esc(me.t)}」<span class="seen">${esc(seen ? T('ntSeen') : T('ntNew'))}</span><button class="lnk" data-a="ntdel">${esc(T('ntDel'))}</button></div>`
      : `<div class="fld ntf"><label for="ntin">${esc(T('ntMineL'))}</label><div class="row"><input type="text" id="ntin" maxlength="30" autocomplete="off" aria-describedby="nth"><button class="btn s" data-a="ntpost">${esc(T('ntPost'))}</button></div><p class="fine" id="nth">${esc(T('ntMineHint'))}</p></div>`}</section>`;
}
function nod() { if (S.a.rm) return; document.querySelectorAll('.me').forEach(x => { x.classList.remove('nod'); void x.offsetWidth; x.classList.add('nod') }) }

/* ---------- 模組 ---------- */
const mods = trk => X[trk].mods.filter(m => !m.for || !S.setup || !(has('2a') || has('2b')) || m.for.some(has));
const mod = (trk, id) => X[trk].mods.find(m => m.id === id);
const mkey = (trk, id) => trk + '.' + id;
function mst(trk, id) { const k = mkey(trk, id); return S.m[k] || (S.m[k] = { step: 0, d: {} }) }
const isDone = (trk, id) => !!S.done[mkey(trk, id)];
function nextMod(trk) { return mods(trk).find(m => !m.opt && !isDone(trk, m.id)) || null }   // 可選模組(例如 2B 計時練習)不自動推薦
function progress(trk) { const a = mods(trk).filter(m => !m.opt); return { n: a.filter(m => isDone(trk, m.id)).length, all: a.length } }
function blocks(bs, out) { out = out || []; bs.forEach(b => { if (b[0] === 'if') { if (cond(b[1])) blocks(b[2], out) } else out.push(b) }); return out }

let CURM = null;   // 目前模組(賽道二五個準則模組由對應的思維英雄做教練)
function guide(txt) { const h = CURM && CURM.hero; return `<div class="guide"><img src="img/f${h || 0}.webp" alt="" width="52" height="52"><div class="bub say"><b>${esc(h ? X.ui.heroN[h - 1] : T('cat'))}</b>${fx(txt)}</div></div>` }
const t3sub = () => { const d = (S.m['t3.m1'] || { d: {} }).d.sub; return d === 1 ? 'b' : 'a' };
const cntOf = (s, unit) => unit === 'w' ? (s.trim() ? s.trim().split(/\s+/).length : 0) : s.replace(/\s/g, '').length;

/* 《學生需知》:PDF(files/,內地可開)為主;claude.ai 網上版設為公開後(config.js notesOnline)才另外顯示 */
function notesLink(t) {
  const l = CL() === 'sc' ? 'sc' : 'tc', pdf = CFG.links.notesPdf.replace('{t}', t).replace('{l}', l);
  return `<a class="lnk" href="${esc(pdf)}" target="_blank" rel="noopener">${esc(T('notes_' + t) + T('notesPdf'))}</a>` + (CFG.links.notesOnline ? ` · <a class="lnk" href="${esc(CFG.links.notes[t])}" target="_blank" rel="noopener">${esc(T('notesOnline'))} ↗</a>` : '');
}
/* 初小版:每步只顯示主要內容及互動;「評審看甚麼」及較長的說明收入「給家長讀」 */
const INTER = new Set(['mcq', 'cls', 'pick', 'sort', 'prompt', 'write', 'check', 'sb', 'timer', 'flip', 'go', 'leg', 'date']);
/* 內容塊類型後加「!」(例如 'box!')= 初小必看:初小版不收起(底線清單、可以/不可以、小測會引用的句子) */
const btype = b => String(b[0]).replace(/!$/, '');
function stepHTML(bs, d) {
  const L = blocks(bs), H = b => BL[btype(b)] ? BL[btype(b)](b, d) : '';
  if (stage() !== 'p12') return L.map(H).join('');
  let vis = '', fold = '', judge = '';
  L.forEach((b, i) => {
    const h = H(b); if (!h) return;
    if (/!$/.test(b[0])) { vis += h; return }
    if (b[0] === 'box' && b[1] === X.ui.judgeBox) { judge += h; return }
    const nx = L[i + 1], keep = INTER.has(b[0]) || ['tip', 'warn', 'ok', 'par'].includes(b[0]) || (b[0] === 'box' && /^題目|^题目/.test(b[1]))
      || ((b[0] === 'p' || b[0] === 'h') && (i === 0 || (nx && INTER.has(nx[0]))));
    keep ? vis += h : fold += h;
  });
  if (judge) vis += `<details class="pinfo"><summary>${esc(T('pInfo'))}</summary>${judge}</details>`;
  if (fold) vis += `<details class="pinfo"><summary>${esc(T('pMore'))}</summary>${fold}</details>`;
  return vis;
}
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
  notes: b => `<p>${notesLink(b[1])}</p>`,
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
const t1Key = () => 't1.quick-' + su().g;
/* 由舊列車頁做完賽道一 5 題:計入進度及廣場,機械貓留一張便利貼 */
function syncLegacy() { if (!S.setup || !has('t1')) return; const k = t1Key(); if (legT1Done() && !S.done[k]) { S.done[k] = Date.now(); addNote(k); save() } }
/* 第一頁:機械貓正在做的事、一句歡迎、開始按鈕、老師／校長入口 */
function vWelcome() {
  ensureCat(); save(); const k = lifeNow();
  return `<section class="wel">${scene(k, true)}</section>
   <h1 class="say">${esc(T('wlH'))}</h1><p class="lead say">${esc(T('wlP'))}</p>
   <a class="btn w" href="${href('setup')}" data-fk="wlstart">${esc(T('wlStart'))} →</a>
   <p class="fine wlf">${esc(T('wlFine'))}</p>
   <div class="row wl2"><a class="btn s" href="${href('teachers')}">${esc(T('wlTeach'))} →</a><a class="lnk" href="${esc(CFG.links.register[LANG])}" target="_blank" rel="noopener">${esc(T('notReg'))}</a></div>`;
}
function vHome() {
  if (!S.setup) return vWelcome();
  syncLegacy();
  const s = su(), it = todayItem(), dls = deadlines(), near = dls[0], k = lifeNow(), sleep = k === 'sleep';
  const onlyT1 = myTrks().length === 1 && has('t1');
  let eb = esc(T('todayEb')), body;
  if (sleep) {
    const go = it ? it.trk : myTrks()[0];
    body = `<h2>${esc(T('lfSleepH'))}</h2><p class="say">${esc(T('lf_sleep'))}</p><a class="lnk on" href="${href(go)}">${esc(T('lfSleepGo'))} →</a>`;
  } else if (!it) {
    body = `<h2>${esc(T('allDoneH'))}</h2><p class="say">${esc(T(onlyT1 ? 't1DoneP' : 'allDoneP'))}</p>${onlyT1 ? `<button class="btn" data-a="leg" data-h="t1-${s.g.toLowerCase()}">${esc(T('t1Again'))} →</button>` : ''}`;
  } else if (it.t1) {
    eb += ' · ' + esc(trkName('t1'));
    body = `<h2>${esc(T('t1TodayH', { g: X.ui.grades[s.g] }))}</h2><p class="say">${esc(T('t1TodayP'))}</p><button class="btn" data-a="leg" data-h="t1-${s.g.toLowerCase()}" data-fk="todaygo">${esc(T('start'))} →</button>`;
  } else {
    eb += ' · ' + esc(trkName(it.trk)); const ms = S.m[mkey(it.trk, it.m.id)];
    body = `<h2>${esc(it.m.t)}</h2><p class="say">${esc(T('mins', { n: it.m.mins }))} · ${esc(it.m.aim)}</p><a class="btn" href="${href(it.trk, it.m.id)}" data-fk="todaygo">${esc(T(ms && ms.step ? 'cont' : 'start'))} →</a>`;
  }
  ensureCat(); save();
  const aw = awayLine();
  const today = `<section class="today hascat s-${k}" id="tour-today"><span class="eb">${eb}</span>
    <p class="tstate say"><b>${esc(T('lfNow', { n: catN(S.cat), s: T('ls_' + k) }))}</b>${sleep ? '' : '「' + esc(T('lf_' + k)) + '」'}${aw ? `<br><small>${esc(aw)}</small>` : ''}</p>
    ${body}<div class="tlife" aria-hidden="true"><img class="tcat me" src="${catSrc(S.cat)}" alt="" width="199" height="240">${PROP[k] || ''}</div></section>`;
  /* 這一週:每條賽道下一件事,按截止日排列(只用設定檔已有的日期) */
  const wk = su().tr.map(t => { const trk = trkOf(t), dl = firstDl(t); if (trk === 't1') return legT1Done() ? null : { t, x: T('t1TodayH', { g: X.ui.grades[s.g] }), dl }; const m = nextMod(trk); return m ? { t, x: m.t, dl, h: href(trk, m.id) } : null })
    .filter(Boolean).filter((x, i, A) => A.findIndex(y => y.x === x.x) === i).sort((a, b) => (a.dl ? a.dl.d : '9') < (b.dl ? b.dl.d : '9') ? -1 : 1).slice(0, 3);
  const week = wk.length >= 2 ? `<section class="card week"><h2>${esc(T('weekH'))}</h2><ol class="ul">${wk.map(w => `<li><b>${esc(X.ui['c_' + w.t])}</b>：${w.h ? `<a href="${w.h}">${esc(w.x)}</a>` : esc(w.x)}${w.dl ? `<br><small>${esc(T(w.dl.lab))} ${dateHTML(w.dl.k)}</small>` : ''}</li>`).join('')}</ol></section>` : '';
  /* 我的路線:每條賽道一排小印 */
  const route = myTrks().map(trk => {
    if (trk === 't1') { const d = !!S.done[t1Key()]; return `<a class="rt" href="${href('t1')}"><b>${esc(trkName('t1'))}</b><span class="stamps" aria-hidden="true"><i class="${d ? 'on' : ''}"></i></span><small>${esc(d ? T('stDone') : T('t1Soon'))}</small></a>` }
    const L = mods(trk).filter(m => !m.opt), p = progress(trk);
    return `<a class="rt" href="${href(trk)}"><b>${esc(trkName(trk))}</b><span class="stamps" aria-hidden="true">${L.map(m => `<i class="${isDone(trk, m.id) ? 'on' : ''}"></i>`).join('')}</span><small>${esc(T('progN', p))}</small></a>`;
  }).join('');
  return `<span class="eb">${esc(T('homeEb'))}</span><h1>${esc(T(s.role !== 's' ? 'homeHP' : 'homeH'))}</h1>
   ${today}
   ${it && it.m && !sleep && showPar() && it.m.par ? `<div class="par say"><b>${esc(T('parH'))}</b>${fx(it.m.par)}</div>` : ''}
   ${near ? `<p class="lead say" id="tour-dl"><b>${esc(T('nearH'))}：</b>${esc(X.ui['c_' + near.t])} · ${esc(T(near.lab))} ${dateHTML(near.k)} <span class="fine">${esc(daysTo(near.d) === 0 ? T('dToday') : T('dLeft', { n: daysTo(near.d) }))}</span></p>` : ''}
   ${s.city && has('t1') ? `<div class="okbox say">${fx(T('cityNote'))}</div>` : ''}
   ${week}
   <h2>${esc(T('routeH'))}</h2><div class="route">${route}</div>
   ${plaza()}
   ${notesBoard()}
   <p class="tags"><span class="tag">${esc(X.ui.grades[s.g])}</span>${s.tr.map(t => `<span class="tag ${trkOf(t)}">${esc(X.ui['c_' + t])}</span>`).join('')}${s.city ? `<span class="tag">${esc(T('cityTag'))}</span>` : ''}<a class="lnk" href="${href('setup')}">${esc(T('change'))}</a></p>
   ${paceHTML(myTrks())}
   <nav class="nav2" aria-label="${esc(T('moreH'))}"><a href="${href('setup')}">${esc(T('nav_setup'))}<small>${esc(T('nav_setupS'))}</small></a><a href="${href('teachers')}">${esc(T('nav_teachers'))}<small>${esc(T('teachEb'))}</small></a></nav>
   <div class="card soft"><b>${esc(T('notesH'))}</b><p class="fine">${esc(T('notesP'))}</p>${myTrks().map(notesLink).join('<br>')}</div>`;
}
function dlLine(t) { const d = firstDl(t); return d ? `${esc(X.ui['c_' + t])}：${esc(T(d.lab))} ${dateHTML(d.k)}` : `${esc(X.ui['c_' + t])}：${esc(T('dlNone'))}` }

/* 四步設定:賽道 → 年級 → 誰在用 → 揀機械貓 */
let W = null;
function vSetup() {
  ensureCat();
  if (!W) { W = Object.assign({ step: 0, cat: S.cat }, JSON.parse(JSON.stringify(su()))); if (!S.setup) W.role = null }
  const k = W.step, bar = `<div class="steps3" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i <= k ? 'on' : ''}"></i>`).join('')}</div>`;
  let body, ok;
  if (k === 0) {
    ok = W.tr.length > 0;
    body = `<h1>${esc(T('su1H'))}</h1><p class="lead">${esc(T('su1P'))}</p><div class="choices">${TRK.map(t => `<button class="opt" role="checkbox" data-a="sutr" data-t="${t}" data-fk="su:${t}" aria-checked="${W.tr.includes(t)}"><span class="mk" aria-hidden="true">${W.tr.includes(t) ? '✓' : ''}</span><span>${esc(X.ui['c_' + t])}<small>${esc(X.ui['cs_' + t])}</small></span></button>`).join('')}</div>
     ${W.tr.includes('t1') ? `<button class="opt" role="checkbox" data-a="sucity" data-fk="su:city" aria-checked="${!!W.city}"><span class="mk" aria-hidden="true">${W.city ? '✓' : ''}</span><span>${esc(T('suCity'))}<small>${esc(T('suCityS'))}</small></span></button>` : ''}`;
  } else if (k === 1) {
    ok = !!W.g;
    const row = (lab, gs) => `<p class="q">${esc(lab)}</p><div class="choices g3">${gs.map(g => `<button class="opt c" data-a="sug" data-g="${g}" data-fk="su:${g}" aria-pressed="${W.g === g}">${esc(X.ui.grades[g])}</button>`).join('')}</div>`;
    body = `<h1>${esc(T('su2H'))}</h1><p class="lead">${esc(T('su2P'))}</p>${row(T('pri'), GRADES.slice(0, 6))}${row(T('sec'), GRADES.slice(6, 12))}${row(T('uni'), ['U'])}`;
  } else if (k === 2) {
    ok = !!W.role;
    body = `<h1>${esc(T('su3H'))}</h1><p class="lead">${esc(T('su3P'))}</p><div class="choices">${[['s', 'roleS', 'roleSS'], ['pc', 'roleC', 'roleCS'], ['p', 'roleP', 'rolePS']].map(r => `<button class="opt" data-a="surole" data-r="${r[0]}" data-fk="su:${r[0]}" aria-pressed="${W.role === r[0]}"><span class="mk" aria-hidden="true">${W.role === r[0] ? '✓' : ''}</span><span>${esc(T(r[1]))}<small>${esc(T(r[2]))}</small></span></button>`).join('')}</div><p class="fine">${esc(T('suPriv'))}</p>`;
  } else {
    ok = !!W.cat;
    const o = CATS.map(c => c.id).filter(x => x !== W.cat).sort((a, b) => hsh(S.seed + a) - hsh(S.seed + b)), rec = [W.cat, o[0], o[1]].filter(Boolean);
    body = `<h1>${esc(T('su4H'))}</h1><p class="lead">${esc(T('su4P'))}</p><div class="catgrid c3" role="group" aria-label="${esc(T('su4H'))}">${rec.map(id => `<button data-a="sucat" data-c="${id}" data-fk="su:c${id}" aria-pressed="${W.cat === id}"><img src="${catSrc(id)}" alt="" width="199" height="240">${esc(catN(id))}</button>`).join('')}</div>
     <button class="lnk" data-a="catsheet" id="suall">${esc(T('su4All'))} →</button>`;
  }
  return `<span class="eb">${esc(T('suEb', { n: k + 1 }))}</span>${bar}${body}
   ${S.setup && k === 0 ? `<p><button class="lnk" data-a="tour">${esc(T('trAgain'))}</button></p>` : ''}
   <div class="nextbar"><span class="g">${k ? `<button class="lnk" data-a="suback">← ${esc(T('prev'))}</button>` : ''}</span><button class="btn" data-a="sunext" data-fk="su:next" ${ok ? '' : 'aria-disabled="true"'}>${esc(T(k < 3 ? 'next' : 'suDone'))} →</button></div>`;
}

/* 培訓地圖 */
function vMap(trk) {
  const D = X[trk], list = mods(trk), nx = nextMod(trk), who = trk === 't2' ? ['2a', '2b'].filter(has) : [trk];
  const item = (m, i) => { const done = isDone(trk, m.id), ms = S.m[mkey(trk, m.id)]; return `<li><a href="${href(trk, m.id)}" class="${done ? 'done' : nx && nx.id === m.id ? 'cur' : ''}">${m.hero ? `<img class="hf" src="img/f${m.hero}.webp" alt="" width="48" height="48">` : `<span class="no" aria-hidden="true">${done ? '✓' : m.opt ? '+' : i + 1}</span>`}<span class="tx"><b>${esc(m.t)}</b><small>${m.hero ? esc(X.ui.heroN[m.hero - 1]) + ' · ' : ''}${esc(m.tag)} · ${esc(T('mins', { n: m.mins }))}</small></span>${!done && nx && nx.id === m.id && S.cat ? `<img class="here" src="${catSrc(S.cat)}" alt="${esc(T('here'))}" width="199" height="240">` : `<span class="st">${esc(done ? T('stDone') : ms && ms.step ? T('stGo') : m.opt ? T('optTag') : '')}</span>`}</a></li>` };
  let h = `<span class="eb">${esc(T('mapEb'))}</span><h1>${esc(D.name)}</h1><p class="lead say">${fx(D.lead)}</p>`;
  if (D.see) h += `<div class="okbox say">${fx(D.see)}</div>`;
  if (!S.setup) h += `<div class="warnbox say">${esc(T('needSetup'))} <a class="lnk" href="${href('setup')}">${esc(T('nav_setup'))} →</a></div>`;
  if (S.setup) h += who.filter(has).map(w => `<p class="dl say">${dlLine(w)}</p>`).join('');
  if (D.tier && S.setup) h += `<div class="card soft say"><b>${esc(T('tierH', { s: X.ui.stages[stage()], g: X.ui.grades[su().g] }))}</b><p>${fx(D.tier[stage()])}</p></div>`;
  const secs = D.secs || [[null, list.map(m => m.id)]];
  let n = 0;
  secs.forEach(sec => { const ms = list.filter(m => sec[1].includes(m.id)); if (!ms.length) return; if (sec[0]) h += `<h2>${esc(sec[0])}</h2>`; h += `<ol class="map">${ms.map(m => item(m, m.opt ? n : n++)).join('')}</ol>` });
  h += `${paceHTML([trk])}<p>${notesLink(trk)}</p>`;
  return h;
}
function vT1() {
  const g = R.g || su().g;
  return `<span class="eb">${esc(T('mapEb'))}</span><h1>${esc(X.t1.name)}</h1><p class="lead say">${fx(X.t1.lead)}</p>
   ${S.setup && has('t1') ? `<p class="dl say">${dlLine('t1')}</p>` : ''}${su().city ? `<div class="okbox say">${fx(T('cityNote'))}</div>` : ''}
   <div class="okbox say">${fx(X.t1.soon)}</div>
   <button class="btn w" data-a="leg" data-h="t1${g ? '-' + g.toLowerCase() : ''}">${esc(g ? T('t1TodayH', { g: X.ui.grades[g] }) : T('t1Open'))} →</button>
   ${paceHTML(['t1'])}
   <div class="card soft say"><b>${esc(X.t1.rulesH)}</b><ul class="ul">${X.t1.rules.map(x => `<li>${fx(x)}</li>`).join('')}</ul></div>
   <p>${notesLink('t1')}</p>`;
}
/* 寫字欄:寫了幾格 */
function wrote(trk, id) { const M = mod(trk, id), ms = mst(trk, id); let n = 0, all = 0, first = -1; M.steps.forEach((st, i) => blocks(st.b).forEach(b => { if (b[0] === 'write') { all++; if (String(ms.d[b[1]] || '').trim()) n++; else if (first < 0) first = i } })); return { n, all, first } }
/* 模組頁 */
function vMod(trk, id) {
  const M = mod(trk, id); if (!M) return vMap(trk); CURM = M;
  const ms = mst(trk, id), n = M.steps.length, list = mods(trk).filter(m => !m.opt), idx = list.findIndex(m => m.id === id);
  if (ms.step >= n) {
    ensureCat(); const nx = nextMod(trk), d = new Date(S.done[mkey(trk, id)] || Date.now()), FR = friends(), NF = FR[FR.length - 1], w = wrote(trk, id);
    return `<span class="eb">${esc(X[trk].name)}</span><h1>${esc(T('modDoneH'))}</h1><div class="celebr">${S.cat ? `<img src="${catSrc(S.cat)}" alt="" width="199" height="240">` : ''}<div class="stampbig" role="img" aria-label="${esc(T('stDone'))}"><span>${esc(T('stDone'))}<br><small>${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}</small></span></div>${NF ? `<img class="nf" src="${catSrc(NF)}" alt="" width="199" height="240">` : ''}</div>${NF ? `<p class="okbox say" style="text-align:center">${esc(T('plzNew', { n: catN(NF), all: FR.length }))}</p>` : ''}
     <p class="lead say" style="text-align:center"><b>${esc(M.t)}</b><br>${fx(M.take || '')}</p>
     ${w.all ? `<p class="fine" style="text-align:center">${esc(T('wroteN', { n: w.n, all: w.all }))}${w.first >= 0 ? ` <button class="lnk" data-a="fillgap" data-s="${w.first}">${esc(T('wroteGo'))}</button>` : ''}</p>` : ''}
     <div class="row" style="justify-content:center">${nx ? `<a class="btn" href="${href(trk, nx.id)}">${esc(T('nextMod'))}：${esc(nx.t)} →</a>` : `<a class="btn" href="${href('home')}">${esc(T('backHome'))} →</a>`}<a class="btn s" href="${href(trk)}">${esc(T('backMap'))}</a><button class="btn s" data-a="redo">${esc(T('redo'))}</button></div><p class="fine" style="text-align:center">${esc(T('rest'))}</p>`;
  }
  const st = M.steps[ms.step], g = stepGate(trk, id);
  return `<span class="eb">${esc(X[trk].name)} · ${esc(M.opt ? T('optTag') : T('modN', { n: idx + 1, all: list.length }))}</span><div class="row sb mh"><h1 class="say">${esc(M.t)}</h1>${ttsBtn()}</div>
   <div class="dots" aria-hidden="true">${M.steps.map((s, i) => `<i class="${i === ms.step ? 'on' : i < ms.step ? 'done' : ''}">${esc(s.n)}</i>`).join('')}</div>
   <p class="sr" role="status">${esc(T('stepSr', { n: ms.step + 1, all: n, s: st.n }))}</p>
   ${ms.step === 0 ? `<p class="lead say"><b>${esc(T('aimH'))}：</b>${fx(M.aim)}</p>${M.par && showPar() ? `<div class="par say"><b>${esc(T('parH'))}</b>${fx(M.par)}</div>` : ''}` : ''}
   <h2 class="say">${esc(st.n)}${st.h ? '：' + esc(st.h) : ''}</h2>
   ${stepHTML(st.b, ms.d)}
   <div class="nextbar"><span class="g" id="gate" role="status">${ms.step ? `<button class="lnk" data-a="mprev">← ${esc(T('prev'))}</button> ` : ''}${esc(g)}</span><button class="btn" data-a="mnext" data-fk="mnext" ${g ? 'aria-disabled="true"' : ''}>${esc(ms.step < n - 1 ? T('next') : T('finish'))} →</button></div>`;
}
/* 給老師及校長:校長一頁紙、課程對應(只引用章程 12.1、13.1 及附錄一)、模組清單、課堂工具、列印檔 */
/* 網站網址(給一頁紙及轉發文字;按目前打開的網址顯示,綁定正式網址後自動正確) */
const siteUrl = () => location.origin + location.pathname.replace(/index\.html$/, '');
function vTeachers() {
  const P = X.teach, f = (CL() === 'sc' ? 'sc' : 'tc');
  const rows = trk => X[trk].mods.map(m => `<tr><td>${esc(m.t)}</td><td>${esc(m.tag)}</td><td>${esc(T('mins', { n: m.mins }))}</td><td>${fx(m.aim)}</td></tr>`).join('');
  const tbl = trk => `<h3>${esc(X[trk].name)}</h3><div class="tblw" tabindex="0" role="region" aria-label="${esc(X[trk].name)}"><table class="tbl"><thead><tr>${P.modsCols.map(c => `<th scope="col">${esc(c)}</th>`).join('')}</tr></thead><tbody>${rows(trk)}</tbody></table></div>`;
  return `<span class="eb">${esc(T('teachEb'))}</span><h1>${esc(P.h)}</h1><p class="lead say">${fx(P.p)}</p>
   <section class="card one" id="one"><div class="row sb"><h2>${esc(P.oneH)}</h2><button class="btn s noprint" data-a="print">${esc(P.printBtn)}</button></div>
    ${P.one.map(x => `<h3>${esc(x[0])}</h3><p class="say">${fx(x[1])}</p>`).join('')}
    <h3>${esc(P.fwdH)}</h3><blockquote class="fwd say">${esc(P.fwd)}<br>${esc(T('siteUrl'))}${esc(siteUrl())}</blockquote><p class="fine">${esc(T('disc'))}</p></section>
   <h2>${esc(P.curH)}</h2><p class="fine">${esc(P.curP)}</p>${P.cur.map(c => `<div class="card soft"><b>${esc(c[0])}</b><ul class="ul">${c[1].map(x => `<li class="say">${fx(x)}</li>`).join('')}</ul></div>`).join('')}
   <h2>${esc(P.modsH)}</h2><p class="fine">${esc(P.modsP)}</p><h3>${esc(X.t1.name)}</h3><p class="fine">${esc(P.t1Mods)}</p>${tbl('t2')}${tbl('t3')}
   <h2>${esc(P.toolsH)}</h2><div class="choices">${P.tools.map(x => `<button class="opt" data-a="leg" data-h="${esc(x[2])}"><span>${esc(x[0])}<small>${esc(x[1])}</small></span></button>`).join('')}</div>
   <h2>${esc(P.pdfH)}</h2><ul class="ul pdfs">${P.pdfs.map(x => `<li><a href="files/${esc(x[1].replace('{l}', f))}" target="_blank" rel="noopener">${esc(x[0])}</a></li>`).join('')}</ul><p class="fine say">${fx(P.note)}</p>`;
}
const vSoon = k => { const o = X.soon[k]; return `<span class="eb">${esc(T('soonEb'))}</span><h1>${esc(T('nav_' + k))}</h1><p class="lead say">${fx(o.p)}</p><div class="card soft"><b>${esc(T('soonNow'))}</b><ul class="ul">${o.now.map(x => `<li class="say">${fx(x)}</li>`).join('')}</ul>${(S.setup ? myTrks() : ['t1', 't2', 't3']).map(notesLink).join('<br>')}</div><p><a class="btn" href="${href('home')}">${esc(T('backHome'))} →</a></p>` };

/* ---------- 三步新手導覽(由機械貓帶;可略過;只自動出現一次;「我的設定」可重看) ---------- */
let TOUR = null;
const TOURT = ['tour-today', 'tour-plz', 'tour-dl'];
function tourPaint() {
  document.querySelectorAll('.tourhl').forEach(x => x.classList.remove('tourhl')); const old = $('tour'); if (old) old.remove();
  if (TOUR == null) return;
  const tg = $(TOURT[TOUR]); if (tg) { tg.classList.add('tourhl'); tg.scrollIntoView({ block: 'center', behavior: S.a.rm ? 'auto' : 'smooth' }) }
  const txt = T('tr' + (TOUR + 1)) + (TOUR === 2 && su().role !== 's' ? ' ' + T('tr3P') : ''), last = TOUR === 2;
  const el = document.createElement('div'); el.id = 'tour'; el.className = 'tour'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'false'); el.setAttribute('aria-labelledby', 'tourt');
  el.innerHTML = `<img src="${catSrc(S.cat)}" alt="" width="199" height="240"><div><b id="tourt">${esc(T('trN', { n: TOUR + 1 }))} · ${esc(T('trAria'))}</b><p>${esc(txt)}</p><div class="row"><button class="btn" data-a="trnext" id="trnext">${esc(T(last ? 'trDone' : 'trNext'))}</button>${last ? '' : `<button class="btn s" data-a="trskip">${esc(T('trSkip'))}</button>`}</div></div>`;
  document.body.appendChild(el); $('trnext').focus({ preventScroll: true });
}
function tourEnd() { TOUR = null; S.tour = 1; save(); tourPaint(); const m = $('main'); if (m) m.focus({ preventScroll: true }) }

function title() {
  const v = R.view;
  if (R.mod && X[v] && mod(v, R.mod)) return mod(v, R.mod).t;
  return v === 'home' ? T(S.setup ? (su().role !== 's' ? 'homeHP' : 'homeH') : 'ttlWelcome') : v === 'setup' ? T('ttlSetup') : X[v] ? X[v].name : v === 'teachers' ? X.teach.h : T('nav_' + v);
}
/* 頁頂標題:用短名,避免在手機上截斷(完整名稱放在 <title> 及頁內標題) */
function headTitle() { const v = R.view; return ['t1', 't2', 't3'].includes(v) ? T('sh_' + v) : title() }
let lastRoute = '';
function render(focusKey) {
  const v = R.view; sayStop(); if (!R.mod) tmStop();
  document.documentElement.lang = HL[CL()];
  document.title = title() + ' · ' + T('site');
  $('ev').textContent = T('event'); $('ttl').textContent = headTitle(); $('skip').textContent = T('skip');
  document.querySelectorAll('[data-lang]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.lang === LANG)));
  $('lang').setAttribute('aria-label', T('langAria')); $('disp').setAttribute('aria-label', T('dispH')); $('disp').title = T('dispH');
  const up = R.mod ? href(v) : href('home'), bk = $('back');
  bk.classList.toggle('hide', v === 'home' && !R.mod); $('mark').classList.toggle('hide', !(v === 'home' && !R.mod)); bk.href = up; bk.textContent = '←'; bk.setAttribute('aria-label', R.mod ? T('backMap') : T('backHome'));
  let h;
  if (v === 'home') h = vHome(); else if (v === 'setup') h = vSetup(); else if (v === 't1') h = vT1();
  else if (v === 't2' || v === 't3') h = R.mod ? vMod(v, R.mod) : vMap(v);
  else if (v === 'teachers') h = vTeachers(); else h = vSoon(v);
  if (!HAS[LANG]) h = `<div class="warnbox" lang="en">The English version of the new training modules is coming soon. Traditional Chinese is shown for now.</div>` + h;
  if (REVIEW) h = `<div class="warnbox">${esc(T('rvBanner'))}</div>` + h;
  $('main').innerHTML = h + `<p class="disc say">${esc(T('disc'))}</p>`;
  if (v === 'home' && !R.mod && S.setup && !S.tour && TOUR == null) { TOUR = 0; setTimeout(tourPaint, 60) } else if (TOUR != null && v === 'home') setTimeout(tourPaint, 0); else if (TOUR != null) { TOUR = null; tourPaint() }
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
window.addEventListener('afterprint', () => document.documentElement.classList.remove('pr-one'));
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') { if ($('sheet')) { document.querySelector('#sheet .catgrid') ? catSheet() : sheet() } else if (TOUR != null) tourEnd(); return }
  if (e.key === 'Enter' && e.target.id === 'ntin') { e.preventDefault(); const b = document.querySelector('[data-a="ntpost"]'); if (b) b.click() }
});
document.addEventListener('click', e => {
  if (e.target.id === 'sheet') { document.querySelector('#sheet .catgrid') ? catSheet() : sheet(); return }
  const b = e.target.closest('button,[data-a]'); if (!b || b.disabled) return; const d = b.dataset, fk = d.fk;
  if (d.lang) { setLang(d.lang); return }
  if (b.id === 'disp' || d.a === 'sheet') { sheet(); return }
  if (d.a === 'fs') { S.a.fs = +d.i; save(); applyA11y(); sheet(); sheet(); return }
  if (d.a === 'a11y') { if (d.k === 'dark') { const on = ls.get(TKEY) === 'dark'; on ? ls.set(TKEY, 'light') : ls.set(TKEY, 'dark') } else S.a[d.k] = S.a[d.k] ? 0 : 1; save(); applyA11y(); sheet(); sheet(); return }
  if (d.a === 'clr') { if (!d.sure) { d.sure = '1'; b.textContent = T('clrSure'); setTimeout(() => { if (b.isConnected) { delete b.dataset.sure; b.textContent = T('clr') } }, 4000); return } ls.del(KEY); ls.del(LEG); S = fresh(); W = null; TOUR = null; tourPaint(); applyA11y(); location.hash = '#' + LANG; lastRoute = ''; reroute(); toast(T('cleared')); return }
  if (d.a === 'leg') { toLegacy(d.h); return }
  if (d.a === 'catsheet') { catSheet(); return }
  if (d.a === 'catpick') {
    if (R.view === 'setup' && W) { W.cat = d.c; $('sheet').remove(); render('su:c' + d.c); const x = document.querySelector(`[data-fk="su:c${d.c}"]`) || $('suall'); if (x) x.focus(); return }
    S.cat = d.c; save(); $('sheet').remove(); render(false); const cb = $('catbtn'); if (cb) cb.focus(); const st = $('plzst'); if (st) st.textContent = T('plzNow', { n: catN(S.cat) }); nod(); return
  }
  if (d.a === 'ntpost') { const x = $('ntin'), v = x ? x.value.trim().slice(0, 30) : ''; if (!v) { if (x) x.focus(); return } S.mine = { t: v, at: Date.now() }; save(); render(false); nod(); const m = document.querySelector('.nt.mine'); if (m) { m.setAttribute('tabindex', '-1'); m.focus({ preventScroll: true }) } return }
  if (d.a === 'ntdel') { S.mine = null; save(); render(false); const x = $('ntin'); if (x) x.focus({ preventScroll: true }); return }
  if (d.a === 'tour') { S.tour = 0; save(); W = null; TOUR = null; location.hash = '#' + LANG; return }
  if (d.a === 'trnext') { if (TOUR >= 2) tourEnd(); else { TOUR++; tourPaint() } return }
  if (d.a === 'trskip') { tourEnd(); return }
  if (d.a === 'print') { document.documentElement.classList.add('pr-one'); window.print(); return }
  if (d.a === 'tts') { sayPage(); return }
  /* 設定 */
  if (d.a === 'sutr') { const i = W.tr.indexOf(d.t); i < 0 ? W.tr.push(d.t) : W.tr.splice(i, 1); W.tr.sort((a, b) => TRK.indexOf(a) - TRK.indexOf(b)); if (!W.tr.includes('t1')) W.city = false; render(fk); return }
  if (d.a === 'sucity') { W.city = !W.city; render(fk); return }
  /* 單選步驟(年級、誰在用):選了即自動到下一步,減少按鍵;可按「上一步」返回 */
  if (d.a === 'sug') { W.g = d.g; render(fk); setTimeout(() => { if (W && W.step === 1 && W.g === d.g) { W.step++; render() } }, 220); return }
  if (d.a === 'surole') { W.role = d.r; render(fk); setTimeout(() => { if (W && W.step === 2 && W.role === d.r) { W.step++; render() } }, 220); return }
  if (d.a === 'sucat') { W.cat = d.c; render(fk); return }
  if (d.a === 'suback') { W.step--; render(); return }
  if (d.a === 'sunext') {
    if (b.getAttribute('aria-disabled')) { toast(T(['suG1', 'suG2', 'suG3', 'suG4'][W.step])); return }
    if (W.step < 3) { W.step++; render(); return }
    S.setup = { tr: W.tr, g: W.g, role: W.role, city: !!W.city }; if (W.cat) S.cat = W.cat; ensureCat(); save(); W = null; location.hash = '#' + LANG; lastRoute = ''; reroute(); return
  }
  /* 模組 */
  if (!R.mod) return; const trk = R.view, ms = mst(trk, R.mod), D = ms.d, id = d.id, re = () => { save(); render(fk) };
  const blk = () => blocks(mod(trk, R.mod).steps[ms.step].b).find(x => x[1] === id);
  switch (d.a) {
    case 'mnext': { const g = stepGate(trk, R.mod); if (g) { toast(g); return } ms.step++; if (ms.step >= mod(trk, R.mod).steps.length && !S.done[mkey(trk, R.mod)]) { S.done[mkey(trk, R.mod)] = Date.now(); addNote(mkey(trk, R.mod)) } save(); render(); return }
    case 'fillgap': ms.step = Math.max(0, +d.s || 0); save(); render(); return;
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
SEEN0 = S.seenAt || 0; S.seenAt = Date.now(); save();
/* 機械貓一直在生活:時段轉換時更新首頁(正在輸入時不更新) */
let LIFE0 = lifeNow();
setInterval(() => { const k = lifeNow(); if (k === LIFE0) return; LIFE0 = k; const a = document.activeElement; if (X && R.view === 'home' && !R.mod && !$('sheet') && TOUR == null && !(a && /INPUT|TEXTAREA/.test(a.tagName))) render(false) }, 60e3);
{ const h = parse(); if (h.old) location.replace(CFG.links.legacy + location.hash); else { LANG = pickLang(); ls.set(LKEY, LANG); loadLang(LANG).then(c => { X = c; reroute() }).catch(e => { console.error(e); $('main').textContent = '內容未能載入，請重新整理頁面。' }) } }
if ('serviceWorker' in navigator && location.protocol === 'https:') { window.addEventListener('load', () => { navigator.serviceWorker.register('sw.js').catch(() => { }) }) }
})();
