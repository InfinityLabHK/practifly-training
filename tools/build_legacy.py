#!/usr/bin/env python3
"""v3.0:把 v2.5 單檔拆成「舊列車頁」play/train.html + img/*.webp。
用法:python3 tools/build_legacy.py <v2.5 index.html> <repo 根目錄>
只做機械式改動(圖片改外部檔、移除報名推廣區塊、聯絡方法改讀 config.js、返回培訓網站);題目、提示、示範一字不改。"""
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
open(os.path.join(root,'play','train.html'),'w',encoding='utf-8').write(s)
print('train.html',len(s.encode()),'bytes; images',len(pairs))
