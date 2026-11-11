/* SYNC-CORE: transforma a aba PIPELINE 2026 em cartões e entradas. Mesmo código na página e no seed. */
function sheetBuild(XLSX, wb, year) {
  const SHEET = "PIPELINE 2026";
  const ws = wb.Sheets[SHEET];
  if (!ws) throw new Error('Aba "' + SHEET + '" não encontrada na planilha');
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1, raw: true, defval: null });
  const N = s => String(s == null ? "" : s).normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  let hi = rows.findIndex(r => r && r.some(v => N(v) === "EMPRESA"));
  if (hi < 0) throw new Error("Cabeçalho EMPRESA não encontrado");
  const hdr = rows[hi].map(h => String(h == null ? "" : h).replace(/\s+/g, " ").trim());
  const col = name => hdr.findIndex(h => N(h) === name);
  const cData = col("DATA"), cEmp = col("EMPRESA"), cSt = col("STATUS"), cJE = col("JAMES ELLIS");
  const cTot = hdr.findIndex(h => N(h).startsWith("TOTAL")), cF26 = hdr.findIndex(h => N(h).includes("FATURAD") && h.includes("2026")),
        cF27 = hdr.findIndex(h => N(h).includes("FATURAD") && h.includes("2027")), cCom = hdr.findIndex(h => N(h).startsWith("COMISSAO"));
  const svcCols = []; for (let i = cSt + 1; i < (cTot < 0 ? hdr.length : cTot); i++) if (hdr[i]) svcCols.push(i);
  const MES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const MESN = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
  const num = v => { if (typeof v === "number") return isFinite(v) ? Math.round(v * 100) / 100 : 0; let s = String(v == null ? "" : v).replace(/[^\d,.-]/g, ""); if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isFinite(n) ? Math.round(n * 100) / 100 : 0; };
  const brl = n => "R$ " + n.toFixed(2).replace(".", ",").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const pad = n => String(n).padStart(2, "0");
  const stageFor = st => { st = N(st); if (st.includes("FECHAD")) return "fechado"; if (st.includes("CANCEL") || st.includes("PERDID") || st.includes("RECUPER")) return "recuperar"; if (st.includes("NEGOCIA")) return "negociacao"; return "enviada"; };
  const cards = {}, entries = {}, seq = {};
  let rowNo = 0;
  for (let r = hi + 1; r < rows.length; r++) {
    const row = rows[r] || [], name = String(row[cEmp] == null ? "" : row[cEmp]).replace(/\s+/g, " ").trim();
    if (!name) continue;
    rowNo++;
    const key = N(name), id = "sh-" + key.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
    let m = -1, d = 1; const dv = row[cData];
    if (dv instanceof Date) { m = dv.getMonth(); d = dv.getDate(); }
    else if (typeof dv === "number" && dv > 20000) { const dt = new Date(Math.round((dv - 25569) * 864e5)); m = dt.getUTCMonth(); d = dt.getUTCDate(); }
    else { const p = N(dv).slice(0, 3); m = MES.indexOf(p); }
    const date = m >= 0 ? `${year}-${pad(m + 1)}-${pad(d)}` : `${year}-01-01`;
    const status = String(row[cSt] == null ? "" : row[cSt]).replace(/\s+/g, " ").trim();
    const services = svcCols.map(i => ({ name: hdr[i], value: num(row[i]) })).filter(s => s.value);
    const total = cTot >= 0 ? num(row[cTot]) : 0, sum = services.reduce((a, s) => a + s.value, 0);
    if (!services.length && total) services.push({ name: "Total (forecasting)", value: total });
    const je = cJE >= 0 && N(row[cJE]).startsWith("S");
    const notes = ["Status na planilha: " + (status || "—")];
    if (services.length && total && Math.abs(total - sum) > 0.009 && sum) notes.push("Total na planilha (forecasting): " + brl(total));
    if (cF26 >= 0 && num(row[cF26])) notes.push("Valor faturado em 2026: " + brl(num(row[cF26])));
    if (cF27 >= 0 && num(row[cF27])) notes.push("Valor faturado em 2027: " + brl(num(row[cF27])));
    if (je) notes.push("James Ellis: sim" + (cCom >= 0 && num(row[cCom]) ? " (comissão " + brl(num(row[cCom])) + ")" : ""));
    const sk = id + "|" + date; seq[sk] = (seq[sk] || 0) + 1;
    const eid = "sh-" + date.replace(/-/g, "") + "-" + seq[sk];
    (entries[id] = entries[id] || {})[eid] = { date, type: "proposta", title: "Proposta enviada — " + (m >= 0 ? MESN[m] : "sem mês"), notes: notes.join("\n"), services, links: [], won: stageFor(status) === "fechado", created: 0, src: "sheet" };
    const c = cards[id] || (cards[id] = { name, months: [], sheetStatus: "", sheetDate: "", jamesEllis: false, order: rowNo * 1000, sheetForecast: 0, sheetWon: 0, fat2026: 0, fat2027: 0 });
    const rowVal = total || sum;
    c.sheetForecast = Math.round((c.sheetForecast + rowVal) * 100) / 100;
    if (stageFor(status) === "fechado") c.sheetWon = Math.round((c.sheetWon + rowVal) * 100) / 100;
    if (cF26 >= 0) c.fat2026 = Math.round((c.fat2026 + num(row[cF26])) * 100) / 100;
    if (cF27 >= 0) c.fat2027 = Math.round((c.fat2027 + num(row[cF27])) * 100) / 100;
    const ab = m >= 0 ? MES[m].toLowerCase() : null;
    if (ab && !c.months.includes(ab)) c.months.push(ab);
    if (date >= c.sheetDate) { c.sheetDate = date; c.sheetStatus = status; c.stage = stageFor(status); }
    if (je) c.jamesEllis = true;
  }
  for (const id in cards) cards[id].months.sort((a, b) => MES.indexOf(a.toUpperCase()) - MES.indexOf(b.toUpperCase()));
  return { cards, entries, rows: rowNo };
}

/* Resumo do cartão: soma o que veio da planilha com as entradas feitas à mão no quadro. */
function cardSummary(es, c) {
  const tot = e => (e.services || []).reduce((a, s) => a + (+s.value || 0), 0), r2 = n => Math.round(n * 100) / 100;
  const man = es.filter(e => e.src !== "sheet"), svc = new Set();
  es.forEach(e => (e.services || []).forEach(s => { if (s.name && s.name !== "Total (forecasting)") svc.add(String(s.name).trim()); }));
  return { nEntries: es.length, lastEntry: es.reduce((a, e) => e.date > a ? e.date : a, ""), won: es.some(e => e.won),
    valor: r2((c.sheetForecast || 0) + man.filter(e => e.type === "proposta").reduce((a, e) => a + tot(e), 0)),
    valorFechado: r2((c.sheetWon || 0) + man.filter(e => e.won).reduce((a, e) => a + tot(e), 0)),
    svc: [...svc].sort((a, b) => a.localeCompare(b, "pt")) };
}

/* COCKPIT: lê DADOS GERAIS, DADOS GERAIS UPSELL e Upsell para o painel. */
function cockpitBuild(XLSX, wb) {
  const N = s => String(s == null ? "" : s).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim().toUpperCase();
  const MES = ["JAN", "FEV", "MAR", "ABR", "MAI", "JUN", "JUL", "AGO", "SET", "OUT", "NOV", "DEZ"];
  const num = v => { if (v == null || v === "") return null; if (typeof v === "number") return isFinite(v) ? Math.round(v * 100) / 100 : null; let s = String(v).replace(/[^\d,.-]/g, ""); if (!s) return null; if (s.includes(",")) s = s.replace(/\./g, "").replace(",", "."); const n = parseFloat(s); return isFinite(n) ? Math.round(n * 100) / 100 : null; };
  const rowsOf = n => wb.Sheets[n] ? XLSX.utils.sheet_to_json(wb.Sheets[n], { header: 1, raw: true, defval: null }) : null;
  const monthRows = (rows, col) => { const out = new Array(12).fill(-1); rows.forEach((r, i) => { const k = MES.indexOf(N(r && r[col]).slice(0, 3)); if (k >= 0 && out[k] < 0) out[k] = i; }); return out; };
  const groups = rows => { for (let g = 0; g < 4; g++) { const r = rows[g] || []; const labs = r.map((v, i) => [N(v), i]).filter(x => x[0] && isNaN(+x[0])); if (labs.length >= 2) return { g, labs }; } return null; };
  const colOf = (rows, G, label, sub) => {
    const i = G.labs.findIndex(x => x[0].startsWith(label)); if (i < 0) return -1;
    const a = G.labs[i][1], b = i + 1 < G.labs.length ? G.labs[i + 1][1] : (rows[G.g + 1] || []).length;
    const sr = rows[G.g + 1] || [];
    for (let c = a; c < b; c++) if (N(sr[c]) === N(sub)) return c;
    return -1;
  };
  const series = (rows, mr, c) => mr.map(r => c < 0 || r < 0 ? null : num(rows[r][c]));
  const totalRow = rows => rows.findIndex(r => r && N(r[0]) === "TOTAL");
  const out = { at: 0 };
  const dg = rowsOf("DADOS GERAIS");
  if (dg) {
    const G = groups(dg), mr = monthRows(dg, 0), tr = totalRow(dg), S = (l, s) => series(dg, mr, colOf(dg, G, l, s));
    out.pitchs = { 2024: S("PITCHS", "2024"), 2025: S("PITCHS", "2025"), 2026: S("PITCHS", "2026"), meta: S("PITCHS", "META") };
    out.propostas = { 2023: S("PROPOSTAS ENVIADAS", "2023"), 2024: S("PROPOSTAS ENVIADAS", "2024"), 2025: S("PROPOSTAS ENVIADAS", "2025"), 2026: S("PROPOSTAS ENVIADAS", "2026"), meta: S("PROPOSTAS ENVIADAS", "META") };
    out.forecast = { 2025: S("FORECAST NEW SALES", "2025"), 2026: S("FORECAST NEW SALES", "2026") };
    out.fechados = { 2025: S("NEGOCIOS FECHADOS", "2025"), 2026: S("NEGOCIOS FECHADOS", "2026"), faturamento2026: S("NEGOCIOS FECHADOS", "FATURAMENTO 2026"), meta: S("NEGOCIOS FECHADOS", "META") };
    const cm = colOf(dg, G, "NEGOCIOS FECHADOS", "META"), cf = colOf(dg, G, "NEGOCIOS FECHADOS", "FATURAMENTO 2026");
    out.fechados.metaAnual = tr >= 0 && cm >= 0 ? num(dg[tr][cm]) : null;
    out.fat2026 = tr >= 0 && cf >= 0 ? num(dg[tr][cf]) : null;
    out.outbound = { meta: S("ABORDAGENS OUTBOUND", "META"), 2026: S("ABORDAGENS OUTBOUND", "2026") };
  }
  const du = rowsOf("DADOS GERAIS UPSELL");
  if (du) {
    const G = groups(du), mr = monthRows(du, 0), S = (l, s) => series(du, mr, colOf(du, G, l, s));
    out.upsell = { props25: S("PROPOSTAS ENVIADAS", "2025"), props26: S("PROPOSTAS ENVIADAS", "2026"), propsMeta: S("PROPOSTAS ENVIADAS", "META"),
      forecast25: S("FORECAST UPSELL", "2025"), forecast26: S("FORECAST UPSELL", "2026"),
      fechados25: S("NEGOCIOS FECHADOS UPSELL", "2025"), fechados26: S("NEGOCIOS FECHADOS UPSELL", "2026"), fechadosMeta: S("NEGOCIOS FECHADOS UPSELL", "META") };
    const tr = du.findIndex((r, i) => i > 2 && r && r[0] == null && typeof r[1] === "number" && typeof r[2] === "number");
    const cm = colOf(du, G, "NEGOCIOS FECHADOS UPSELL", "META");
    out.upsell.metaAnual = tr >= 0 && cm >= 0 ? num(du[tr][cm]) : null;
  }
  const up = rowsOf("Upsell");
  if (up) {
    const hi = up.findIndex(r => r && r.some(v => N(v) === "EMPRESA"));
    const hdr = (up[hi] || []).map(h => String(h == null ? "" : h).replace(/\s+/g, " ").trim());
    const col = n => hdr.findIndex(h => N(h).startsWith(n));
    const cD = col("DATA"), cE = col("EMPRESA"), cS = col("STATUS"), cT = col("TOTAL"), cL = col("LINK");
    const svcCols = []; for (let i = cS + 1; i < (cT < 0 ? hdr.length : cT); i++) if (hdr[i]) svcCols.push(i);
    const pad = n => String(n).padStart(2, "0");
    out.upsellRows = [];
    if (hi >= 0) for (let r = hi + 1; r < up.length; r++) {
      const row = up[r] || [], emp = String(row[cE] == null ? "" : row[cE]).replace(/\s+/g, " ").trim(); if (!emp) continue;
      const dv = row[cD]; let data = "";
      if (dv instanceof Date) data = dv.getFullYear() + "-" + pad(dv.getMonth() + 1) + "-" + pad(dv.getDate());
      else if (typeof dv === "number" && dv > 20000) { const d = new Date(Math.round((dv - 25569) * 864e5)); data = d.getUTCFullYear() + "-" + pad(d.getUTCMonth() + 1) + "-" + pad(d.getUTCDate()); }
      else { const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(String(dv || "")); if (m) data = m[3] + "-" + pad(m[2]) + "-" + pad(m[1]); }
      const svc = svcCols.map(i => ({ name: hdr[i], value: num(row[i]) || 0 })).filter(s => s.value);
      const val = num(row[cT]) || svc.reduce((a, s) => a + s.value, 0);
      out.upsellRows.push({ data, emp, status: String(row[cS] == null ? "" : row[cS]).replace(/\s+/g, " ").trim().toUpperCase(), val, svc, link: cL >= 0 && /^https?:\/\//.test(String(row[cL] || "")) ? String(row[cL]).trim() : "" });
    }
  }
  return out;
}
if (typeof module !== "undefined") module.exports = { sheetBuild, cardSummary, cockpitBuild };
