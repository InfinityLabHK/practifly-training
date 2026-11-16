#!/usr/bin/env python3
"""v3.0:把 v2.5 單檔拆成「舊列車頁」play/train.html + img/*.webp。
用法:python3 tools/build_legacy.py <v2.5 index.html> <repo 根目錄>
只做機械式改動(圖片改外部檔、移除報名推廣區塊、聯絡方法改讀 config.js、返回培訓網站);題目、提示、示範一字不改。
v3.0 最終優化另加:頁頂「← 回到我的培訓」、不載 Google Fonts、題解的內部代號 (x)/(v)/E1–E6 於顯示時改為同學語言並預設收起(原始資料不改)。"""
import re,sys,base64,os,json
src,root=sys.argv[1],sys.argv[2]
s=open(src,encoding='utf-8').read()
os.makedirs(os.path.join(root,'img'),exist_ok=True);os.makedirs(os.path.join(root,'play'),exist_ok=True)
def must(old,new,n=1):
    global s
    c=s.count(old)
    assert c==n,(old[:60],c)
    s=s.replace(old,new)
# 1 圖片:base64 → img/*.webp
m=re.search(r"const IMG=\{(.*?)\};\n",s,re.S);assert m
pairs=re.findall(r"(\w+):'data:image/webp;base64,([A-Za-z0-9+/=]+)'",m.group(1));assert len(pairs)==20,len(pairs)
for k,b in pairs:
    open(os.path.join(root,'img',k+'.webp'),'wb').write(base64.b64decode(b))
s=s[:m.start()]+"const IMG={"+",".join("%s:'../img/%s.webp'"%(k,k) for k,_ in pairs)+"};\n"+s[m.end():]
# 2 短片及列印檔路徑(本頁在 play/ 之下)
must("const CLIP={wave:'media/cat_wave.webp',unlock:'media/cat_unlock.webp'}","const CLIP={wave:'../media/cat_wave.webp',unlock:'../media/cat_unlock.webp'}")
print('files/ refs',s.count('files/'))
s=s.replace('"files/','"../files/').replace("'files/","'../files/")
# 3 移除報名推廣區塊(報名表、WhatsApp、日期);日期及聯絡方法只放在 config.js
must("function ctaHTML(where,kid,trk){","function ctaHTML(where,kid,trk){return '';")
# 4 聯絡方法改讀 config.js(已報名者只用電郵)
must("$('org').textContent=t('ctaOrg')+' · '+t('ctaContact');","$('org').textContent=t('ctaOrg')+' · '+((window.PF_CONFIG&&PF_CONFIG.contact.email)||'');")
# 5 入口頁改為培訓網站首頁;「返回」回到來處
must("function draw(){\n","function draw(){\n if(S.view==='hub'){pfBack();return}\n")
must("const $=id=>document.getElementById(id);","const $=id=>document.getElementById(id);\nfunction pfBack(){let b='';try{b=sessionStorage.getItem('pf-back')||''}catch(e){}if(!/^#[\\w\\-\\/]*$/.test(b))b='#'+LANG;location.href='../index.html'+b}")
must("if(b.id==='home'){const w=S.view;","if(b.id==='home'){const w=S.view;if(w==='home'||w==='solo'||w==='team'||w==='tpl'||w==='t3'||(w==='t1'&&!S.t1.g)){save();pfBack();return}")
# 6 直達個人 / 小組挑戰:#solo-lib-tc、#team-pizza-sc
must("const v=tk.find(x=>['ws','tpl','preview','t1','t2','t3'].includes(x));","const v=tk.find(x=>['ws','tpl','preview','t1','t2','t3','solo','team'].includes(x));")
must("function routeTo(h){const nv=h.view||'hub';let ch=false;","function routeTo(h){const nv=h.view||'hub';let ch=false;\n if((nv==='solo'||nv==='team')&&h.q){if(S.view!==nv||S.q!==h.q){S.view=nv;S.q=h.q;ch=true}return ch}")
must('<title>','<link rel="icon" href="../img/f0.webp" type="image/webp"><title>')
# 7 載入設定檔;標題
must("<script>\n/* 三條賽道體驗 v2.5","<script src=\"../config.js\"></script>\n<script>\n/* v3.0(2026-11-16):本頁為「舊列車頁」,由 tools/build_legacy.py 從 v2.5 產生;入口、報名區塊已移到培訓網站首頁及設定檔。\n   三條賽道體驗 v2.5")
# 8 v3.0 最終優化:頁頂「← 回到我的培訓」;不載 Google Fonts(不作外部請求);題解改用同學語言並預設收起
must('<button class="homeb hide" id="home"></button>','<a class="pfhome" id="pfhome" href="../index.html" onclick="pfBack();return false">← 回到我的培訓</a><button class="homeb hide" id="home"></button>')
must("function draw(){\n if(S.view==='hub'){pfBack();return}\n","function draw(){\n if(S.view==='hub'){pfBack();return}\n {const ph=$('pfhome');if(ph)ph.textContent=({tc:'← 回到我的培訓',sc:'← 回到我的培训',en:'← My training'})[LANG]||'← 回到我的培訓'}\n")
i=s.find("if(LANG!=='sc'){try{const gf=document.createElement('link');");assert i>0
j=s.find("catch(e){}}",i)+len("catch(e){}}");s=s[:i]+"/* v3.0:不載 Google Fonts,全部語言用系統字體(不作任何外部請求) */"+s[j:]
assert 'fonts.googleapis' not in s
must("function t1Line(c,k){const i=c.l.indexOf(k);return i<0?'':c.x.split('\\n')[i]}",
 "const PFE={tc:['可能看錯了題目','可能算錯了','可能把概念弄混了','方法用得不對','推理有漏洞','可能看錯了圖表或符號'],sc:['可能看错了题目','可能算错了','可能把概念弄混了','方法用得不对','推理有漏洞','可能看错了图表或符号'],en:['You may have misread the question','A calculation slip','Two ideas got mixed up','The method does not fit','A gap in the reasoning','The diagram or notation was misread']};\n"
 "function pfClean(ln){const E=PFE[LANG]||PFE.tc,c=LANG==='en'?': ':'：';return String(ln).replace(/\\(x\\)\\s*E([1-6])\\s*[^：:]*[：:]\\s*/g,(m,n)=>E[n-1]+c).replace(/\\(x\\)\\s*/g,'').replace(/\\(v\\)\\s*/g,'✓ ').replace(/學生/g,'同學').replace(/学生/g,'同学')}\n"
 "function t1Line(c,k){const i=c.l.indexOf(k);return i<0?'':pfClean(c.x.split('\\n')[i])}")
old="function t1Sol(q,c,picks){const Ls=c.x.split('\\n');return `<div class=\"t1x vb cmp\" data-vb=\"x\">${Ls.map((ln,i)=>{const k=c.l[i],o='ABCD'.includes(k),mine=o&&picks.includes(k);return `<span class=\"sl ${o?'sl-o':'sl-'+k}${o&&k===q.ans?' key':''}${mine?' mine':''}\"${mine?` data-tag=\"${esc(t('t1Mine'))}\"`:''}>${esc(ln)}${i<Ls.length-1?'\\n':''}</span>`}).join('')}</div><button class=\"hbtn\" data-a=\"t1allopt\">${esc(t('t1AllOpt'))}</button>`}"
new="function t1Sol(q,c,picks){const Ls=c.x.split('\\n').map(pfClean),ki=c.l.indexOf('k'),kp=ki>=0?Ls[ki]:'',op=window.__t1o===q.id;return `${kp?`<p class=\"pfkey\"><b>${esc(kp)}</b></p>`:''}<details class=\"pfsol\" ${op?'open':''} ontoggle=\"window.__t1o=this.open?this.dataset.q:null\" data-q=\"${esc(q.id)}\"><summary>${esc(({tc:'看完整題解',sc:'看完整题解',en:'Show the full worked solution'})[LANG]||'看完整題解')}</summary><div class=\"t1x vb cmp\" data-vb=\"x\">${Ls.map((ln,i)=>{const k=c.l[i],o='ABCD'.includes(k),mine=o&&picks.includes(k);return `<span class=\"sl ${o?'sl-o':'sl-'+k}${o&&k===q.ans?' key':''}${mine?' mine':''}\"${mine?` data-tag=\"${esc(t('t1Mine'))}\"`:''}>${esc(ln)}${i<Ls.length-1?'\\n':''}</span>`}).join('')}</div><button class=\"hbtn\" data-a=\"t1allopt\">${esc(t('t1AllOpt'))}</button></details>`}"
must(old,new)
must("<style>body{margin:0}</style>","<style>body{margin:0}.pfhome{flex:none;min-height:44px;display:inline-flex;align-items:center;padding:6px 10px;border-radius:12px;border:1.5px solid rgba(255,255,255,.45);color:#F3EEFF;text-decoration:none;font-weight:800;font-size:.8rem;white-space:nowrap}.pfsol{margin:8px 0}.pfsol>summary{cursor:pointer;min-height:44px;display:flex;align-items:center;font-weight:800;text-decoration:underline;text-underline-offset:3px}.pfkey{margin:8px 0}@media (max-width:380px){#pfm{display:none}}</style>")
# 9 獨立覆核(2026-11-16)
# R12a 跟隨培訓網站的顯示設定(字體三級、高對比、減少動畫;只讀本機 localStorage,不上傳)
must('<link rel="icon" href="../img/f0.webp" type="image/webp">','<link rel="icon" href="../img/f0.webp" type="image/webp"><script>try{var a=(JSON.parse(localStorage.getItem(\'pf-training-v3\')||\'{}\').a)||{},r=document.documentElement;if(a.fs)r.setAttribute(\'data-fs\',a.fs);if(a.hc){r.setAttribute(\'data-hc\',\'\');r.setAttribute(\'data-theme\',\'light\')}if(a.rm)r.setAttribute(\'data-rm\',\'\')}catch(e){}</script>')
must("@media (max-width:380px){#pfm{display:none}}</style>","@media (max-width:380px){#pfm{display:none}}"
 ":root[data-fs=\"1\"] body{zoom:1.15}:root[data-fs=\"2\"] body{zoom:1.3}"
 ":root[data-hc] *{text-shadow:none!important}:root[data-hc] small,:root[data-hc] .fine{opacity:1!important}"
 ":root[data-rm] *,:root[data-rm] *::before,:root[data-rm] *::after{animation:none!important;transition:none!important;scroll-behavior:auto!important}"
 ".startb small,.lvseg button small,button[data-wsq] small{opacity:1!important}.pfdisc{display:block;font-weight:800;margin:0 0 6px}</style>")
# R12b 每屏保留「模擬練習,不是正式比賽題目」(放在頁腳,所有畫面都見到)
must('<footer class="ft gut"><div class="in">','<footer class="ft gut"><div class="in"><span class="pfdisc" id="pfdisc"></span>')
must("{const ph=$('pfhome');if(ph)ph.textContent=","{const pd=$('pfdisc');if(pd)pd.textContent=({tc:'模擬練習，不是正式比賽題目；一切以章程及大會公布為準。',sc:'模拟练习，不是正式比赛题目；一切以章程及大会公布为准。',en:'Practice only, not official competition questions. The Competition Rules and the organiser\u2019s notices prevail.'})[LANG]||''}\n {const ph=$('pfhome');if(ph)ph.textContent=")
# R12c 開發字眼:「老師預覽」改「老師試看」;刪去指向已移除「下一步」區塊的一句
# 高對比:固定用淺色主題(舊頁本身的淺色配色已達 AA),不跟深色設定
must("try{const th=localStorage.getItem(TKEY);if(th==='dark'||th==='light')document.documentElement.setAttribute('data-theme',th)}catch(e){}","try{const th=localStorage.getItem(TKEY);if(document.documentElement.hasAttribute('data-hc'))document.documentElement.setAttribute('data-theme','light');else if(th==='dark'||th==='light')document.documentElement.setAttribute('data-theme',th)}catch(e){}")
s=s.replace('老師預覽','老師試看').replace('老师预览','老师试看')
must(";今屆日期見下方「下一步」。",";日期以《學生需知》為準。")
must(";今届日期见下方“下一步”。",";日期以《学生需知》为准。")
must(" This year’s dates are under “Next step” below."," See the Student Notes for dates.")
# R20 刪去不顯示但仍在公開檔內的個人聯絡資料(WhatsApp 號碼、微信號)
s=re.sub(r'"ctaContact": "[^"]*"','"ctaContact": ""',s)
s=s.replace("'https://wa.me/85257953263'","''")
assert 'Scarlett' not in s and '5795' not in s and 'wa.me' not in s
open(os.path.join(root,'play','train.html'),'w',encoding='utf-8').write(s)
print('train.html',len(s.encode()),'bytes; images',len(pairs))
