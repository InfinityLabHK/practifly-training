// 內容一致性檢查:node tools/check.mjs <v2.5 index.html(可選)>
// 1 繁、簡結構及答案一致;2 每題答案在選項範圍內;3 提示必須是問句(只問不答);4 引用的示範題與 v2.5 已批原文一字不差。
import fs from 'node:fs'; import vm from 'node:vm';
const ctx = { window: {} }; vm.createContext(ctx);
for (const l of ['tc', 'sc']) vm.runInContext(fs.readFileSync(`js/c-${l}.js`, 'utf8'), ctx);
const C = ctx.window.PF_C; let err = 0; const bad = m => { console.log('✗', m); err++ };
const skel = o => typeof o === 'string' ? 's' : Array.isArray(o) ? o.map(skel) : o && typeof o === 'object' ? Object.fromEntries(Object.entries(o).map(([k, v]) => [k, skel(v)])) : o;
if (JSON.stringify(skel(C.tc)) !== JSON.stringify(skel(C.sc))) bad('繁、簡結構或答案不一致');
let nMod = 0, nMcq = 0, nCls = 0;
const walk = (bs, where) => bs.forEach(b => {
  if (b[0] === 'if') return walk(b[2], where);
  if (b[0] === 'mcq') { nMcq++; if (!(b[4] >= 0 && b[4] < b[3].length)) bad(where + ' mcq 答案超出範圍 ' + b[1]); if (!/[？?]$/.test(b[5].trim()) && !/^回想/.test(b[5])) bad(where + ' 提示不是問句：' + b[5]); if (!b[6]) bad(where + ' 缺說明') }
  if (b[0] === 'cls') { nCls++; b[3].forEach(it => { if (!(it[1] >= 0 && it[1] < b[2].length)) bad(where + ' cls 答案超出範圍') }) }
});
for (const l of ['tc', 'sc']) for (const t of ['t2', 't3']) { const ids = new Set(); C[l][t].mods.forEach(m => { nMod++; if (ids.has(m.id)) bad('重複模組 id ' + m.id); ids.add(m.id); for (const k of ['t', 'tag', 'mins', 'aim', 'par', 'take']) if (!m[k]) bad(`${l} ${t}.${m.id} 缺 ${k}`); m.steps.forEach((s, i) => walk(s.b, `${l} ${t}.${m.id}#${i}`)) }) }
const src = process.argv[2];
if (src) {
  const html = fs.readFileSync(src, 'utf8'), i = html.indexOf('const I18N=') + 11; let d = 0, j = i; do { const c = html[j]; if (c === '"') { j++; while (html[j] !== '"') { if (html[j] === '\\') j++; j++ } } else if (c === '{') d++; else if (c === '}') d--; j++ } while (d > 0);
  const I = JSON.parse(html.slice(i, j));
  for (const l of ['tc', 'sc']) { const file = fs.readFileSync(`js/c-${l}.js`, 'utf8'); for (const q of ['lib', 'pizza']) { const txt = I[l].q[q].chunks.join(''); if (!file.includes(txt)) bad(`${l} 題目 ${q} 與 v2.5 原文不一致`) }
    for (const k of ['a', 'b']) for (const c of I[l].u.t3Sb[k]) if (!file.includes(c[0].replace(/,/g, '，').replace(/:/g, '：'))) bad(`${l} 故事板示範卡與 v2.5 不一致：` + c[0].slice(0, 14)) }
}
console.log(`模組 ${nMod / 2} 個、選擇題 ${nMcq / 2} 題、判斷組 ${nCls / 2} 組；` + (err ? `${err} 項問題` : '全部通過 ✓')); process.exit(err ? 1 : 0);
