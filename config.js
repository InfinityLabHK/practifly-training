/* Practifly AI 三賽道自學培訓網站 · 設定檔
   所有日期、連結、聯絡方法集中在這裏,頁面文案由這裏讀取;改日期只改這一個檔。
   pending:true  = 未確認,畫面顯示【待確認】。
   was:'…'       = 與章程第 1 版(2026-10-26 生效)不同,畫面顯示「已由 … 延至 …」;src 記錄依據。
   日期一律香港時間;「或之前」包括當日。 */
window.PF_CONFIG = {
  version: '3.0.1',
  build: '2026-11-16',
  charter: { ver: 1, effective: '2026-10-26' },

  /* 已報名者的唯一聯絡入口(《學生需知》第 7 部分) */
  contact: {
    email: 'info@infinitylab.hk',
    idFormat: 'PF-xxxxx',
    sampleId: 'PF-00000',
    sampleName: { tc: '陳小明', sc: '陈小明', en: 'Chan Siu Ming' },
    replyTime: { pending: true }
  },

  links: {
    /* 三份《學生需知》(每份有繁、簡、英分頁) */
    notes: {
      t1: 'https://claude.ai/artifact/NYhcHYu4FNtVXnYzvmZ5G7',
      t2: 'https://claude.ai/artifact/TyHwbsqffcRStMP9D3Ueot',
      t3: 'https://claude.ai/artifact/LuEaScb21EKbZRM86YVCA8'
    },
    /* 《學生需知》PDF(2026-11-16 由三份文件匯出;內地可開)。{l} = tc / sc;EN 用繁體版 */
    notesPdf: 'files/notes-{t}-{l}.pdf',
    /* 網上版(claude.ai)設為公開連結後改為 true,網站才會在 PDF 旁顯示「網上版」;未公開前只顯示 PDF */
    notesOnline: false,
    platformT1: 'https://www.practiflyai.com',
    /* 未報名者的報名資訊(只作小連結,不在主路徑) */
    register: {
      tc: 'https://yuyue.wjx.com/vm/wpOAMBP.aspx',
      sc: 'https://yuyue.wjx.com/vm/hGM46yE.aspx',
      en: 'https://yuyue.wjx.com/vm/wpOAMBP.aspx'
    },
    submitForm: { pending: true },   /* 大會作品提交表:連結及提交後的確認方式未公布 */
    legacy: 'play/train.html'        /* 舊列車頁(賽道二個人 / 小組挑戰、全班熱身、五格模板) */
  },

  /* 日期:d = 當日或截止日;d2 = 期間的最後一日 */
  dates: {
    t1PrelimLast: { d: '2026-12-04' },                    /* 首輪校內初賽評估最後一日(章程 3.1) */
    t1Makeup:     { d: '2026-12-05', d2: '2026-12-06' },  /* 線上初賽場:補考一次 */
    t1Assess2:    { d: '2026-11-23', d2: '2026-12-06' },  /* 賽道一第二次評估 */
    regFinal:     { d: '2026-12-11' },                    /* 首輪總決賽註冊及繳費截止 */
    round2:       { d: '2026-12-18' },                    /* 第二輪報名截止(賽道一、2B) */
    /* 2A 及賽道三:Scarlett 2026-11-09 決定、2026-11-12 確認,適用於所有學校 */
    worksReg:     { d: '2026-12-04', was: '2026-12-01', src: '決策紀錄 2026-11-12' },
    worksDue:     { d: '2026-12-11', was: '2026-12-01', src: '決策紀錄 2026-11-12' },
    shortlist:    { d: '2026-12-22' },                    /* 2A 及賽道三入圍名單;候補結果 */
    shortAppeal:  { d: '2026-12-24' },
    video:        { d: '2026-12-28' },                    /* 入圍但未能出席:提交匯報錄影 */
    noticeBy:     { d: '2026-12-28' },                    /* 應已收到總決賽通知 */
    waitlistPay:  { d: '2026-12-29' },
    final:        { d: '2027-01-02' },                    /* 全國總決賽 · 香港大學 */
    results:      { d: '2027-01-09' },
    appeal:       { d: '2027-01-16' },
    /* 大學組(第 14 章補充條款;此處只按《學生需知》的一句) */
    uniWorksReg:  { d: '2026-12-04' },
    uniWorksDue:  { d: '2026-12-11' },
    uniReg:       { d: '2026-12-18' }
  },

  /* 公眾假期(機械貓「數字生命」用:假期日間不上學)。
     香港:教育局《2026/27 學年公眾假期》(https://www.gov.hk/tc/about/abouthk/holiday/2026.htm、2027.htm);
     簡體(內地)只放元旦。學校假期(例如聖誕假)各校不同,不列入。 */
  holidays: {
    hk: ['2026-09-26', '2026-10-01', '2026-10-19', '2026-12-25', '2026-12-26', '2027-01-01', '2027-02-06', '2027-02-08', '2027-02-09', '2027-03-26', '2027-03-27', '2027-03-29', '2027-04-05', '2027-05-01', '2027-05-13', '2027-06-09', '2027-07-01'],
    cn: ['2027-01-01']
  },

  /* 網站內仍未確認的事項:頁面會在相應位置顯示【待確認】 */
  pending: {
    venue: true,          /* 總決賽場館、時段、入場時間 */
    calcModels: true,     /* 澳門及內地中學生可用的計算機型號 */
    scratchT1: true,      /* 賽道一可否用草稿紙 */
    t2SecondaryDemo: true /* 初中、高中、大學組的賽道二示範題:待大會提供 */
  }
};
