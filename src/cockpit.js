
/* -------- cockpit comercial (segunda página) -------- */
const CK={data:null,tab:"new-sales",charts:{},chartP:null,timer:0,upSort:{col:"data",asc:false}};
let view="board";
const ck$=id=>document.getElementById(id);
const ckMES=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
const ckSum=a=>(a||[]).reduce((s,v)=>s+(v==null?0:+v||0),0);
const ckCount=a=>{let n=0;(a||[]).forEach((v,i)=>{if(v!=null&&v!==0)n=i+1});return n};
const ckR=v=>v==null?"—":Math.abs(v)>=1e6?"R$ "+(v/1e6).toFixed(1).replace(".",",")+"M":Math.abs(v)>=1e3?"R$ "+Math.round(v/1e3)+"k":"R$ "+Math.round(v);
const ckFull=v=>v==null?"—":"R$ "+Number(v).toLocaleString("pt-BR",{minimumFractionDigits:2,maximumFractionDigits:2});
const ckSet=(id,v)=>{const e=ck$(id);if(e)e.textContent=v};
const ckBar=(id,p,cls)=>{const e=ck$(id);if(!e)return;e.style.width=Math.max(0,Math.min(p,100))+"%";if(cls)e.className="kpi-bar-fill "+cls};
const ckBadge=(id,t,cls)=>{const e=ck$(id);if(!e)return;e.textContent=t;e.className="ck-badge "+cls};
const ckTag=(id,t,cls)=>{const e=ck$(id);if(!e)return;e.textContent=t;e.className="hero-tag "+cls};
const ckLvl=p=>p>=100?"up":p>=70?"neu":"down";
const ckDiff=(d,money)=>(d>=0?"↑ +":"↓ ")+(money?ckR(Math.abs(d)):Math.abs(d))+" vs 2025";
const ckSlice=(a,n)=>(a||[]).slice(0,n);
const ckColor=c=>getComputedStyle(document.documentElement).getPropertyValue("--c-"+(COLORS.includes(c)?c:"slate")).trim()||"#5f5957";

function ckLoadChart(){
  if(window.Chart)return Promise.resolve();
  if(!CK.chartP)CK.chartP=new Promise((res,rej)=>{const s=document.createElement("script");s.src="https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js";s.onload=()=>{ckRegister();res()};s.onerror=()=>{CK.chartP=null;rej(new Error("chart"))};document.head.appendChild(s)});
  return CK.chartP;
}
function ckRegister(){
  Chart.register({id:"ckLabels",afterDatasetsDraw(chart){
    const {ctx}=chart,isH=chart.options.indexAxis==="y";
    chart.data.datasets.forEach((ds,di)=>{
      if(ds.type==="line")return;const meta=chart.getDatasetMeta(di);if(meta.hidden)return;
      meta.data.forEach((b,j)=>{const raw=ds.data[j];if(raw==null||raw===0)return;
        const label=ds._cur?(Math.abs(raw)>=1e6?(raw/1e6).toFixed(1)+"M":Math.abs(raw)>=1e3?Math.round(raw/1e3)+"k":String(Math.round(raw))):String(raw);
        ctx.save();
        if(isH){ctx.font="bold 9px Montserrat,sans-serif";ctx.fillStyle="#555";ctx.textAlign="left";ctx.textBaseline="middle";ctx.fillText(label,b.x+4,b.y)}
        else{const h=Math.abs(b.base-b.y);ctx.font="bold 8px Montserrat,sans-serif";ctx.textAlign="center";
          if(h<16||(b.width||0)<12){ctx.fillStyle="#444";ctx.textBaseline="bottom";ctx.fillText(label,b.x,b.y-2)}
          else{ctx.fillStyle="rgba(255,255,255,.92)";ctx.textBaseline="middle";ctx.translate(b.x,b.y+h/2);ctx.rotate(-Math.PI/2);ctx.fillText(label,0,0)}}
        ctx.restore()})})}});
}
const ckBase=()=>({responsive:true,maintainAspectRatio:false,
  plugins:{legend:{display:false},tooltip:{backgroundColor:"#0f172a",cornerRadius:8,padding:10,titleFont:{family:"Montserrat",size:11,weight:"700"},bodyFont:{family:"Montserrat",size:11}}},
  layout:{padding:{top:18,right:6}},
  scales:{x:{grid:{display:false},ticks:{font:{family:"Montserrat",size:9,weight:"600"},color:"#94a3b8"}},y:{grid:{color:"#f1f5f9"},ticks:{font:{family:"Montserrat",size:9},color:"#94a3b8"}}}});
const ckMoney=o=>{o.scales.y.ticks.callback=v=>Math.abs(v)>=1e6?(v/1e6).toFixed(1)+"M":Math.abs(v)>=1e3?Math.round(v/1e3)+"k":v;return o};
const ckBarDs=(label,data,color,cur)=>({label,data,backgroundColor:color,borderRadius:4,borderSkipped:false,_cur:!!cur});
const ckMeta=data=>({label:"Meta",data,type:"line",borderColor:"#0f172a",borderWidth:2,borderDash:[6,3],pointRadius:0,fill:false});
const ckLine=(label,data,color,w)=>({label,data,_cur:true,borderColor:color,backgroundColor:color+"1a",fill:true,tension:.4,borderWidth:w,pointRadius:w+1,pointBackgroundColor:color,spanGaps:false});
function ckChart(id,cfg){
  if(CK.charts[id]){CK.charts[id].destroy();delete CK.charts[id]}
  const el=ck$(id);if(!el||!window.Chart)return;
  CK.charts[id]=new Chart(el.getContext("2d"),cfg);
}

/* dados do quadro, ao vivo */
function ckBoard(){
  const list=[...cards].map(([id,c])=>({id,...c,stage:stageOf(c.stage).id,valor:+c.valor||0}));
  const closed=new Set(STAGES.filter(s=>s.id==="fechado"||/fechad|ganh/i.test(s.name)).map(s=>s.id));
  const isClosed=c=>closed.has(c.stage);
  const open=list.filter(c=>!isClosed(c)),won=list.filter(isClosed);
  const per=STAGES.map(s=>{const it=list.filter(c=>c.stage===s.id);return{s,n:it.length,valor:it.reduce((a,c)=>a+c.valor,0)}});
  const svc={};list.forEach(c=>(c.svc||[]).forEach(n=>{const k=n.trim().toUpperCase();svc[k]=svc[k]||{name:n,n:0};svc[k].n++}));
  const limit=new Date(Date.now()-45*864e5).toISOString().slice(0,10);
  const stale=open.filter(c=>c.lastEntry&&c.lastEntry<limit).sort((a,b)=>b.valor-a.valor);
  return{list,open,won,per,svc:Object.values(svc).sort((a,b)=>b.n-a.n),stale,
    fcOpen:open.reduce((a,c)=>a+c.valor,0),fat2027:list.reduce((a,c)=>a+(+c.fat2027||0),0),fat2026:list.reduce((a,c)=>a+(+c.fat2026||0),0)};
}

function ckNewSales(){
  const d=CK.data,B=ckBoard(),M=ckMES;
  const P=d.pitchs||{},PR=d.propostas||{},FC=d.forecast||{},FE=d.fechados||{},OUT=d.outbound||{},U=d.upsell||{};
  const n=Math.max(ckCount(P[2026]),1),nr=Math.max(ckCount(PR[2026]),1),nf=Math.max(ckCount(FC[2026]),1);
  const ps26=ckSum(P[2026]),ps25=ckSum(ckSlice(P[2025],n)),pMeta=ckSum(ckSlice(P.meta,n));
  ckSet("k-pitch-val",ps26);ckSet("k-pitch-sub","Acumulado "+M[0]+"–"+M[n-1]+" 2026");ckSet("k-pitch-meta",ckSum(P.meta));
  ckBar("k-pitch-bar",pMeta?ps26/pMeta*100:0,"blue");ckBadge("k-pitch-badge",ckDiff(ps26-ps25),ps26>=ps25?"bu":"bd");
  const pr26=ckSum(PR[2026]),pr25=ckSum(ckSlice(PR[2025],nr)),prMeta=ckSum(ckSlice(PR.meta,nr));
  ckSet("k-prop-val",pr26);ckSet("k-prop-sub","Acumulado "+M[0]+"–"+M[nr-1]+" 2026");ckSet("k-prop-meta",ckSum(PR.meta));
  ckBar("k-prop-bar",prMeta?pr26/prMeta*100:0,"blue");ckBadge("k-prop-badge",ckDiff(pr26-pr25),pr26>=pr25?"bu":"bd");
  const fc26=ckSum(FC[2026]),fc25=ckSum(ckSlice(FC[2025],nf));
  ckSet("k-fc-val",ckR(fc26));ckSet("k-fc-sub","Pipeline "+M[0]+"–"+M[nf-1]+" 2026");ckBadge("k-fc-badge",ckDiff(fc26-fc25,true),fc26>=fc25?"bu":"bd");
  const metaAnual=FE.metaAnual||2100000,fe26=ckSum(FE[2026]),fat=ckSum(FE.faturamento2026),pct=Math.round(fat/metaAnual*100),feP=Math.round(fe26/metaAnual*100);
  ckSet("k-fe-val",ckFull(fe26));ckBar("k-fe-bar",feP,"green");ckBadge("k-fe-badge",feP+"% da meta anual",feP>=100?"bu":feP>=70?"bn":"bd");
  ckSet("k-pct-val",pct+"%");ckSet("k-pct-sub",ckFull(fat)+" faturado de "+ckFull(metaAnual));
  ckBar("k-pct-bar",pct,pct>=100?"green":pct>=70?"yellow":"red");ckBadge("k-pct-badge",pct>=100?"✓ Meta atingida":pct>=70?"↗ Em progresso":"↓ Abaixo da meta",pct>=100?"bu":pct>=70?"bn":"bd");
  ckSet("h-receita",ckFull(fat));ckTag("h-receita-tag",pct+"% da meta",ckLvl(pct));
  ckSet("h-fat2026",ckFull(fat+ckSum(U.fechados26)));
  ckSet("h-fat2027",ckFull(B.fat2027));
  ckSet("h-fc",ckR(B.fcOpen));ckSet("h-fc-sub",B.open.length+" empresas em aberto no quadro");
  const no=Math.max(ckCount(OUT[2026]),1),out=ckSum(OUT[2026]),outMeta=ckSum(ckSlice(OUT.meta,no)),op=outMeta?Math.round(out/outMeta*100):0;
  ckSet("h-out",out.toLocaleString("pt-BR"));ckSet("h-out-sub","Abordagens "+M[0]+"–"+M[no-1]);ckTag("h-out-tag",op+"% da meta",ckLvl(op));
  ckSet("h-pipe",B.list.length);ckSet("h-pipe-sub",B.won.length+" fechadas · "+B.open.length+" em aberto");
  ckChart("c-pitch",{type:"bar",data:{labels:M,datasets:[ckBarDs("2024",P[2024],"#B0B8C1"),ckBarDs("2025",P[2025],"#f97316"),ckBarDs("2026",P[2026],"#D93B42"),ckMeta(P.meta)]},options:ckBase()});
  ckChart("c-prop",{type:"bar",data:{labels:M,datasets:[ckBarDs("2023",PR[2023],"#6C8EAD"),ckBarDs("2024",PR[2024],"#B0B8C1"),ckBarDs("2025",PR[2025],"#f97316"),ckBarDs("2026",PR[2026],"#D93B42"),ckMeta(PR.meta)]},options:ckBase()});
  ckChart("c-fc",{type:"line",data:{labels:M,datasets:[ckLine("2025",FC[2025],"#f97316",2),ckLine("2026",FC[2026],"#D93B42",3)]},options:ckMoney(ckBase())});
  ckSet("c-fe-sub","2025 · 2026 vs meta mensal "+ckR((FE.meta||[])[0]||175000));
  ckChart("c-fe",{type:"bar",data:{labels:M,datasets:[ckBarDs("2025",FE[2025],"#f97316",1),ckBarDs("2026",FE[2026],"#D93B42",1),ckMeta(FE.meta)]},options:ckMoney(ckBase())});
  const fun=[{l:"Pitchs",n:ps26,c:"#3b82f6"},{l:"Propostas",n:pr26,c:"#7c3aed"},{l:"No quadro",n:B.list.length,c:"#d97706"},{l:"Fechadas",n:B.won.length,c:"#059669"}];
  const mx=Math.max(...fun.map(f=>f.n),1);
  ck$("funnel-wrap").innerHTML=fun.map((f,i)=>{const w=Math.round(f.n/mx*100),cv=i===0?"100%":fun[i-1].n?Math.round(f.n/fun[i-1].n*100)+"%":"0%";
    return `<div class="funnel-row"><div class="funnel-meta"><div class="funnel-num">${f.n}</div><div class="funnel-lbl">${f.l}</div></div><div class="funnel-bar-wrap"><div class="funnel-bar" style="width:${w}%;background:${f.c}">${w>18?cv:""}</div></div><div class="funnel-pct" style="color:${f.c}">${cv}</div></div>`}).join("");
  const o=ckBase();o.scales.y.min=0;o.scales.y.ticks.callback=v=>v+"%";
  ckChart("c-funnel",{type:"bar",data:{labels:["Pitchs→Propostas","Propostas→Quadro","Quadro→Fechadas"],datasets:[{label:"% conversão",data:fun.slice(1).map((f,i)=>fun[i].n?Math.round(f.n/fun[i].n*100):0),backgroundColor:["#7c3aed","#d97706","#059669"],borderRadius:6,borderSkipped:false}]},options:o});
}

function ckCoRow(c,extra){
  const st=stageOf(c.stage);
  return `<button type="button" class="top-op ck-co" data-open="${esc(c.id)}"><span class="pipe-mes" style="background:${ckColor(st.color)}22;color:${ckColor(st.color)}">${esc((c.months||[]).slice(-1)[0]||"—")}</span><span class="top-op-emp">${esc(c.name)}</span>${extra||""}<span class="pipe-st" style="background:${ckColor(st.color)}1f;color:${ckColor(st.color)}">${esc(st.name)}</span><span class="top-op-val">${c.valor?ckR(c.valor):"—"}</span></button>`;
}
function ckPipeline(){
  const B=ckBoard();
  ck$("pl-stages").innerHTML=B.per.map(p=>`<button type="button" class="kpi ck-stage" data-stage="${esc(p.s.id)}" style="--sc:${ckColor(p.s.color)}"><div class="kpi-lbl">${esc(p.s.name)}</div><div class="kpi-val">${p.n}</div><div class="kpi-sub">${ckFull(p.valor)}</div><div class="kpi-sub ck-go">Abrir no quadro →</div></button>`).join("")
    +`<div class="kpi t"><div class="kpi-lbl">Forecast em aberto</div><div class="kpi-val sm">${ckFull(B.fcOpen)}</div><div class="kpi-sub">${B.open.length} empresas fora de “fechado”</div></div>`;
  ckChart("c-pl-stage",{type:"bar",data:{labels:B.per.map(p=>p.s.name),datasets:[{label:"Valor",data:B.per.map(p=>p.valor),_cur:true,backgroundColor:B.per.map(p=>ckColor(p.s.color)),borderRadius:6,borderSkipped:false}]},options:ckMoney(ckBase())});
  const sv=B.svc.slice(0,12),o=ckBase();o.indexAxis="y";o.layout={padding:{top:4,right:30}};o.scales={x:{grid:{color:"#f1f5f9"},ticks:{font:{family:"Montserrat",size:9},color:"#94a3b8",precision:0}},y:{grid:{display:false},ticks:{font:{family:"Montserrat",size:9,weight:"600"},color:"#334155"}}};
  ckChart("c-pl-svc",{type:"bar",data:{labels:sv.map(s=>s.name.length>32?s.name.slice(0,30)+"…":s.name),datasets:[{label:"Empresas",data:sv.map(s=>s.n),backgroundColor:sv.map((_,i)=>i===0?"#D93B42":i<3?"#7c3aed":i<7?"#f97316":"#B0B8C1"),borderRadius:4,borderSkipped:false}]},options:o});
  const top=B.open.slice().sort((a,b)=>b.valor-a.valor).slice(0,10);
  ck$("pl-top").innerHTML=top.map(c=>ckCoRow(c)).join("")||`<div class="ck-none">Nenhuma oportunidade em aberto.</div>`;
  ck$("pl-stale").innerHTML=B.stale.slice(0,10).map(c=>ckCoRow(c,`<span class="ck-days">${Math.floor((Date.now()-new Date(c.lastEntry+"T12:00:00"))/864e5)} dias</span>`)).join("")||`<div class="ck-none">Tudo em dia: nenhuma empresa em aberto parada há mais de 45 dias.</div>`;
  ck$("pl-won").innerHTML=B.won.slice().sort((a,b)=>(+b.valorFechado||b.valor)-(+a.valorFechado||a.valor)).map(c=>ckCoRow(c,c.fat2026||c.fat2027?`<span class="ck-days">2026 ${ckR(+c.fat2026||0)} · 2027 ${ckR(+c.fat2027||0)}</span>`:"")).join("")||`<div class="ck-none">Nenhuma empresa na etapa de negócio fechado.</div>`;
}

const ckStLabel=s=>/FECHAD/.test(s)?"✓ Fechado":/CANCEL/.test(s)?"✕ Cancelado":/ENVIAD/.test(s)?"Enviada":s||"—";
const ckStCls=s=>/FECHAD/.test(s)?"st-fe":/CANCEL/.test(s)?"st-neg":"st-env";
const ckStColor=s=>/FECHAD/.test(s)?"#059669":/CANCEL/.test(s)?"#94a3b8":"#3b82f6";
function ckUpsell(){
  const U=CK.data.upsell||{},R=CK.data.upsellRows||[],M=ckMES;
  const n=Math.max(ckCount(U.props26),1),nf=Math.max(ckCount(U.forecast26),1),ne=Math.max(ckCount(U.fechados26),1);
  const pr26=ckSum(U.props26),pr25=ckSum(ckSlice(U.props25,n)),prMeta=ckSum(ckSlice(U.propsMeta,n));
  const fc26=ckSum(U.forecast26),fc25=ckSum(ckSlice(U.forecast25,nf));
  const fe26=ckSum(U.fechados26),meta=U.metaAnual||ckSum(U.fechadosMeta)||2100000,p=Math.round(fe26/meta*100);
  const feMonths=(U.fechados26||[]).filter(v=>v>0);
  ckSet("h-up-receita",ckFull(fe26));ckSet("h-up-receita-sub","Fechado "+M[0]+"–"+M[ne-1]+" 2026");ckTag("h-up-receita-tag",p+"% da meta",ckLvl(p));
  ckSet("h-up-fc",ckFull(fc26));ckSet("h-up-fc-sub","Forecast "+M[0]+"–"+M[nf-1]+" 2026");
  ckSet("h-up-pct",p+"%");ckSet("h-up-pct-sub",ckFull(fe26)+" de "+ckFull(meta));ckTag("h-up-pct-tag",p>=100?"✓ Meta!":p>=70?"↗ Progresso":"↓ Abaixo",ckLvl(p));
  ckSet("h-up-props",pr26);ckSet("h-up-props-sub","Acumulado "+M[0]+"–"+M[n-1]+" 2026");ckTag("h-up-props-tag",ckDiff(pr26-pr25),pr26>=pr25?"up":"down");
  ckSet("h-up-ops",R.length);ckSet("h-up-ops-sub",new Set(R.map(r=>r.emp.toUpperCase())).size+" empresas únicas");
  ckSet("k-up-prop-val",pr26);ckSet("k-up-prop-sub","Meta acumulada: "+Math.round(prMeta)+" · anual "+Math.round(ckSum(U.propsMeta)));
  ckBar("k-up-prop-bar",prMeta?pr26/prMeta*100:0,"blue");ckBadge("k-up-prop-badge",ckDiff(pr26-pr25),pr26>=pr25?"bu":"bd");
  ckSet("k-up-fc-val",ckFull(fc26));ckSet("k-up-fc-sub","Forecast "+M[0]+"–"+M[nf-1]+" 2026");ckBadge("k-up-fc-badge",ckDiff(fc26-fc25,true),fc26>=fc25?"bu":"bd");
  ckSet("k-up-fe-val",ckFull(fe26));ckBar("k-up-fe-bar",p,"green");ckBadge("k-up-fe-badge",p+"% da meta",p>=100?"bu":p>=70?"bn":"bd");
  ckSet("k-up-ticket",ckFull(feMonths.length?fe26/feMonths.length:0));
  ckChart("c-up-prop",{type:"bar",data:{labels:M,datasets:[ckBarDs("2025",U.props25,"#f97316"),ckBarDs("2026",U.props26,"#D93B42"),ckMeta(U.propsMeta)]},options:ckBase()});
  ckChart("c-up-fc",{type:"line",data:{labels:M,datasets:[ckLine("2025",U.forecast25,"#f97316",2),ckLine("2026",U.forecast26,"#D93B42",3)]},options:ckMoney(ckBase())});
  ckChart("c-up-fe",{type:"bar",data:{labels:M,datasets:[ckBarDs("2025",U.fechados25,"#f97316",1),ckBarDs("2026",U.fechados26,"#D93B42",1),ckMeta(U.fechadosMeta)]},options:ckMoney(ckBase())});
  const sv={};R.forEach(r=>(r.svc||[]).forEach(s=>{sv[s.name]=(sv[s.name]||0)+(+s.value||0)}));
  const se=Object.entries(sv).sort((a,b)=>b[1]-a[1]).slice(0,10),o=ckMoney(ckBase());o.indexAxis="y";o.layout={padding:{top:4,right:40}};
  o.scales={x:{grid:{color:"#f1f5f9"},ticks:{font:{family:"Montserrat",size:9},color:"#94a3b8",callback:v=>v>=1e6?(v/1e6).toFixed(1)+"M":v>=1e3?Math.round(v/1e3)+"k":v}},y:{grid:{display:false},ticks:{font:{family:"Montserrat",size:9,weight:"600"},color:"#334155"}}};
  ckChart("c-up-svc",{type:"bar",data:{labels:se.map(e=>e[0].length>32?e[0].slice(0,30)+"…":e[0]),datasets:[{label:"Valor",data:se.map(e=>e[1]),_cur:true,backgroundColor:se.map((_,i)=>i===0?"#D93B42":i<3?"#7c3aed":"#3b82f6"),borderRadius:4,borderSkipped:false}]},options:o});
  const rk=R.slice().sort((a,b)=>b.val-a.val).slice(0,8),mx=rk[0]?rk[0].val:1,rc=["#fbbf24","#9ca3af","#b45309"];
  ck$("up-ranking").innerHTML=rk.map((r,i)=>`<div class="top-op"><div class="top-op-rank" style="background:${rc[i]||"#3b82f6"};color:${i<3?"#000":"#fff"}">${i+1}</div><div class="top-op-emp">${esc(r.emp)}</div><span class="top-op-mes" style="background:${ckStColor(r.status)}22;color:${ckStColor(r.status)}">${ckStLabel(r.status)}</span><div class="top-op-bar-wrap"><div class="top-op-bar" style="width:${Math.round(r.val/mx*100)}%;background:${ckStColor(r.status)}"></div></div><div class="top-op-val">${ckR(r.val)}</div></div>`).join("")||`<div class="ck-none">Sem registros na aba Upsell.</div>`;
  const sel=ck$("up-filter-status"),cur=sel.value,sts=[...new Set(R.map(r=>r.status).filter(Boolean))].sort();
  sel.innerHTML=`<option value="">Todos os status</option>`+sts.map(s=>`<option value="${esc(s)}" ${s===cur?"selected":""}>${esc(ckStLabel(s))}</option>`).join("");
  ckUpTable();
}
function ckUpTable(){
  const R=(CK.data&&CK.data.upsellRows)||[],f=ck$("up-filter-status").value,q=norm(ck$("up-search").value.trim()),S=CK.upSort;
  const rows=R.filter(r=>(!f||r.status===f)&&(!q||norm(r.emp+" "+(r.svc||[]).map(s=>s.name).join(" ")).includes(q)))
    .sort((a,b)=>{const va=S.col==="svc"?(a.svc||[]).length:a[S.col],vb=S.col==="svc"?(b.svc||[]).length:b[S.col];const c=typeof va==="number"?va-vb:String(va).localeCompare(String(vb),"pt");return S.asc?c:-c});
  ck$("up-tbody").innerHTML=rows.map(r=>{const ch=(r.svc||[]).slice(0,4).map(s=>`<span class="svc-chip">${esc(s.name)} · ${ckR(s.value)}</span>`).join("")+((r.svc||[]).length>4?`<span class="svc-chip">+${r.svc.length-4}</span>`:"");
    const u=safeUrl(r.link);
    return `<tr class="cp-tr"><td class="cp-td">${esc(fmtDate(r.data)||"—")}</td><td class="cp-td cp-emp">${esc(r.emp)}${u?` <a class="ck-pdf" href="${esc(u)}" target="_blank" rel="noopener">proposta ↗</a>`:""}</td><td class="cp-td"><span class="pipe-st ${ckStCls(r.status)}">${esc(ckStLabel(r.status))}</span></td><td class="cp-td ck-num">${ckR(r.val)}</td><td class="cp-td"><div class="ck-chips">${ch||"—"}</div></td></tr>`}).join("")
    ||`<tr><td class="cp-td" colspan="5">Nenhum registro.</td></tr>`;
  ckSet("up-count",rows.length+" de "+R.length);
  document.querySelectorAll("#ck-upsell .cp-th").forEach(th=>{th.classList.toggle("asc",th.dataset.col===S.col&&S.asc);th.classList.toggle("desc",th.dataset.col===S.col&&!S.asc)});
}

function ckHeader(){
  const st=ck$("ck-src"),dot=ck$("ck-dot");if(!st)return;
  const at=(syncInfo&&syncInfo.at)||(CK.data&&CK.data.at);
  st.textContent=syncing?"Lendo a planilha…":syncMsg&&syncMsg.err?syncMsg.text:at?"Planilha lida "+ago(at):"Planilha ainda não lida";
  dot.style.background=syncing?"var(--yellow)":syncMsg&&syncMsg.err?"var(--red)":at?"var(--green)":"var(--muted)";
  ck$("ck-sync").disabled=syncing||!db;
}
async function ckRender(){
  ckHeader();
  if(view!=="cockpit")return;
  const empty=ck$("ck-empty");
  if(!db){empty.hidden=false;empty.textContent="O cockpit não conseguiu se conectar ao armazenamento. Abra a página pelo Claude, com sua conta.";return}
  if(!CK.data||!CK.data.pitchs){empty.hidden=false;empty.innerHTML="Os números da planilha ainda não foram carregados. Clique em <b>↻ Atualizar da planilha</b>.";if(CK.tab!=="pipeline")return}
  else empty.hidden=true;
  try{await ckLoadChart()}catch(_){empty.hidden=false;empty.textContent="Não foi possível carregar a biblioteca de gráficos. Recarregue a página.";return}
  if(CK.tab==="new-sales")ckNewSales();else if(CK.tab==="pipeline")ckPipeline();else if(CK.data&&CK.data.pitchs)ckUpsell();
}
function ckSchedule(){clearTimeout(CK.timer);CK.timer=setTimeout(ckRender,180)}
function ckTab(t){
  CK.tab=t;
  document.querySelectorAll("#cockpit .tab").forEach(b=>{const on=b.dataset.ck===t;b.classList.toggle("active",on);b.setAttribute("aria-selected",on)});
  document.querySelectorAll("#cockpit .page").forEach(p=>p.classList.toggle("active",p.id==="ck-"+t));
  try{localStorage.setItem("ilmj-ck-tab",t)}catch(_){}
  ckRender();
}
function showView(v){
  view=v==="cockpit"?"cockpit":"board";
  $("#boardview").hidden=view!=="board";ck$("cockpit").hidden=view!=="cockpit";
  document.querySelectorAll(".appnav [data-view]").forEach(b=>b.setAttribute("aria-current",b.dataset.view===view?"page":"false"));
  try{localStorage.setItem("ilmj-view",view)}catch(_){}
  scrollTo(0,0);
  if(view==="cockpit")ckRender();
}
document.querySelectorAll(".appnav [data-view]").forEach(b=>b.addEventListener("click",()=>showView(b.dataset.view)));
document.querySelectorAll("#cockpit .tab").forEach(b=>b.addEventListener("click",()=>ckTab(b.dataset.ck)));
ck$("cockpit").addEventListener("click",e=>{
  const o=e.target.closest("[data-open]");if(o){showView("board");openSheet(o.dataset.open);return}
  const s=e.target.closest("[data-stage]");if(s){showView("board");focus=s.dataset.stage;render();return}
  const g=e.target.closest("[data-go]");if(g){ckTab(g.dataset.go);return}
  if(e.target.closest("[data-board]"))showView("board");
});
ck$("cockpit").addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.matches(".ck-link")){e.preventDefault();e.target.click()}});
ck$("ck-sync").addEventListener("click",()=>syncSheet(true));
ck$("up-filter-status").addEventListener("change",ckUpTable);
ck$("up-search").addEventListener("input",ckUpTable);
document.querySelectorAll("#ck-upsell .cp-th").forEach(th=>th.addEventListener("click",()=>{const S=CK.upSort;if(S.col===th.dataset.col)S.asc=!S.asc;else{S.col=th.dataset.col;S.asc=th.dataset.col==="emp"}ckUpTable()}));
ck$("ck-pdf").addEventListener("click",async()=>{
  if(!CK.data||!CK.data.pitchs)return;
  const prev=CK.tab;document.body.classList.add("ck-printing");
  try{await ckLoadChart()}catch(_){}
  for(const t of ["new-sales","pipeline","upsell"]){CK.tab=t;if(t==="new-sales")ckNewSales();else if(t==="pipeline")ckPipeline();else ckUpsell()}
  await new Promise(r=>setTimeout(r,350));Object.values(CK.charts).forEach(c=>{try{c.resize()}catch(_){}});
  await new Promise(r=>setTimeout(r,250));
  try{print()}catch(_){}
  document.body.classList.remove("ck-printing");CK.tab=prev;ckTab(prev);
});
try{const t=localStorage.getItem("ilmj-ck-tab");if(t&&["new-sales","pipeline","upsell"].includes(t))ckTab(t)}catch(_){}
try{if(localStorage.getItem("ilmj-view")==="cockpit")showView("cockpit")}catch(_){}
