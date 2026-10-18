const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const load=(k,d)=>{try{return JSON.parse(localStorage.getItem(k))||d}catch{return d}};
const save=(k,v)=>{try{localStorage.setItem(k,JSON.stringify(v))}catch{toast('Could not save in this browser.',1)}};
let data=load('rtp_data',[]),rows=load('rtp_rows',[]),evid=load('rtp_ev',[]),acts=load('rtp_acts',[]),files=[],chart=null;
function toast(m,bad){const d=document.createElement('div');d.className='toast'+(bad?' bad':'');d.textContent=m;$('#toasts').append(d);setTimeout(()=>d.remove(),3200)}
function log(m){acts.unshift(new Date().toLocaleString()+' — '+m);acts=acts.slice(0,8);save('rtp_acts',acts)}

const CATS={revenue:'Revenue',profit:'Profit / profitability',rd:'R&D expenses',capex:'Capital expenditure / investment',geo:'Geographic revenue (disclosed)',segment:'Reported segment revenue'};
const DIST=['geo','segment'];
const NCATS=['Specialty Medicines','R&D','Geographic Exposure','Capital Allocation','India Formulations','US Generics','Acquisitions & Investments','Regulatory & Manufacturing','Product Launches & Pipeline','Management Emphasis'];
const fill=(sel,arr,isObj)=>$(sel).innerHTML=(isObj?Object.entries(arr).map(([k,v])=>`<option value="${k}">${v}</option>`):arr.map(v=>`<option>${esc(v)}</option>`)).join('');
fill('#cat',CATS,1);fill('#dCat',CATS,1);fill('#nCat',NCATS);

/* ---------- Login ---------- */
const ok=()=>sessionStorage.getItem('rtp_in')==='1';
$('#fillBtn').onclick=()=>{$('#user').value='sunpharma_demo';$('#pass').value='SunPivot@2026';$('#loginErr').textContent='';toast('Demo credentials filled')};
function doLogin(){if($('#user').value.trim()==='sunpharma_demo'&&$('#pass').value==='SunPivot@2026'){sessionStorage.setItem('rtp_in','1');$('#loginErr').textContent='';show();toast('Welcome to Reading the Pivot')}else $('#loginErr').textContent='Those details do not match the demo credentials. Click “Fill Demo Credentials” to try again.'}
$('#loginBtn').onclick=doLogin;$('#pass').onkeydown=e=>e.key==='Enter'&&doLogin();
$('#logout').onclick=e=>{e.preventDefault();sessionStorage.removeItem('rtp_in');files=[];location.hash='';show();toast('Logged out')};
function show(){$('#login').classList.toggle('hidden',ok());$('#app').classList.toggle('hidden',!ok());if(ok())route()}

/* ---------- Navigation ---------- */
function route(){const p=(location.hash.slice(1)||'overview');const page=$('#'+p)&&$('#'+p).classList.contains('page')?p:'overview';
 $$('.page').forEach(s=>s.classList.toggle('hidden',s.id!==page));$$('#nav a[data-p]').forEach(a=>a.classList.toggle('active',a.dataset.p===page));
 $('#title').textContent=$(`#nav a[data-p="${page}"] span`).textContent;$('#sidebar').classList.remove('open');render(page);scrollTo(0,0)}
addEventListener('hashchange',()=>ok()&&route());
$('#toggle').onclick=()=>innerWidth<800?$('#sidebar').classList.toggle('open'):$('#sidebar').classList.toggle('collapsed');
$('#period').value=localStorage.getItem('rtp_period')||$('#period').value;$('#period').onchange=e=>{localStorage.setItem('rtp_period',e.target.value);toast('Period set: '+e.target.value)};
function render(p){({overview,financial,reports:renderFiles,narrative:renderRows,signals:renderSignals,research:renderEv}[p]||(()=>{}))()}

/* ---------- Overview ---------- */
const SCEN=[
['Specialty Medicines','The company highlights specialty medicines as an important growth opportunity.','Relevant management commentary, disclosed financial figures, product updates, or investor presentation references.','Check whether the available evidence supports the stated strategic direction.'],
['Research & Development','Investment in innovation is important to the company\'s future growth.','Disclosed R&D expenses, annual report commentary, and comparable year-on-year figures.','Compare the narrative with the available financial evidence.'],
['Geographic Business Exposure','Different geographic markets contribute to the company\'s business performance.','Reported geographic revenue, where available, and relevant management commentary.','Compare disclosed geographic performance across comparable periods.'],
['Capital Allocation','The company is investing in future growth.','Disclosed capital expenditure, acquisitions, strategic investments, or other relevant financial information.','Determine whether the available evidence supports the statement.']];
function overview(){const live=rows.filter(r=>!r.demo).length;
 $('#stats').innerHTML=[['Documents (this session)',files.length,'var(--cyan)'],['Comparison rows',rows.length,'var(--purple)'],['Evidence excerpts',evid.length,'var(--green)'],['Signals with evidence',SIGS.filter(s=>sigState(s).n>0).length+' / 8','var(--orange)']].map(x=>`<div class="stat" style="border-color:${x[2]}"><b>${x[1]}</b>${x[0]}</div>`).join('');
 $('#scenarios').innerHTML=SCEN.map((s,i)=>`<article class="sc"><span class="badge orange">Demo Scenario — Requires Source Verification</span><h3>Example ${i+1} — ${s[0]}</h3><p><b>Management narrative:</b> “${s[1]}”</p><p><b>Evidence required:</b> ${s[2]}</p><p><b>Analysis:</b> ${s[3]}</p><button class="btn ghost" data-i="${i}"><i class="fa-solid fa-scale-balanced"></i> Analyse this</button></article>`).join('');
 $$('#scenarios button').forEach(b=>b.onclick=()=>{const s=SCEN[b.dataset.i];location.hash='narrative';setTimeout(()=>{$('#nStmt').value=s[1];$('#nCat').value=['Specialty Medicines','R&D','Geographic Exposure','Capital Allocation'][b.dataset.i];toast('Scenario loaded — add your source evidence')},50)});
 $('#activity').innerHTML=acts.length?acts.map(a=>`<li><i class="fa-solid fa-clock-rotate-left ok"></i>${esc(a)}</li>`).join(''):'<li class="empty" style="display:block">No activity yet. Add data, evidence or a comparison row to begin.</li>'}

/* ---------- Financial ---------- */
const ILL={years:['FY2021','FY2022','FY2023','FY2024','FY2025'],vals:{revenue:[60,68,75,83,92],profit:[10,12,13,16,19],rd:[5,6,6,7,8],capex:[4,5,7,6,8]},dist:['Region A','Region B','Region C','Region D'],dv:[40,30,20,10]};
const COL=['#06b6d4','#2563eb','#10b981','#f97316','#8b5cf6','#ec4899','#facc15'];
function yearsFor(c){return [...new Set(data.filter(d=>d.cat===c).map(d=>d.year))]}
function financial(){const c=$('#cat').value,ys=yearsFor(c),cur=$('#yrFilter').value;
 $('#yrFilter').innerHTML='<option value="all">All years</option>'+(ys.length?ys:ILL.years).map(y=>`<option>${esc(y)}</option>`).join('');$('#yrFilter').value=[...$('#yrFilter').options].some(o=>o.value===cur)?cur:'all';drawChart();dataTable()}
function drawChart(){const c=$('#cat').value,yr=$('#yrFilter').value,v=data.filter(d=>d.cat===c&&(yr==='all'||d.year===yr)),real=v.length>0,dist=DIST.includes(c);
 $('#chartLabel').className='banner'+(real?' ok':'');$('#chartLabel').textContent=real?'USER-ENTERED VALUES — each entry lists its own source below. Not independently verified by this app.':'ILLUSTRATIVE DEMO DATA — NOT VERIFIED COMPANY FINANCIALS';
 let labels,vals,unit;
 if(dist){labels=real?v.map(d=>d.label||d.year):ILL.dist;vals=real?v.map(d=>d.value):ILL.dv}
 else if(real){const m={};v.forEach(d=>m[d.year]=d.value);labels=Object.keys(m).sort();vals=labels.map(k=>m[k])}
 else{const i=yr==='all'?null:ILL.years.indexOf(yr);labels=i===null?ILL.years:[yr];vals=i===null?ILL.vals[c]||ILL.vals.revenue:[(ILL.vals[c]||ILL.vals.revenue)[i]]}
 unit=real?v[0].unit:'illustrative index units';
 if(typeof Chart==='undefined'){$('#chartFallback').classList.remove('hidden');return}
 chart&&chart.destroy();chart=new Chart($('#chart'),{type:dist?'doughnut':(real&&vals.length>2?'line':'bar'),data:{labels,datasets:[{label:CATS[c]+' ('+unit+')',data:vals,backgroundColor:dist?COL:COL[0]+'cc',borderColor:COL[1],borderWidth:2,tension:.3,borderRadius:8}]},options:{responsive:true,maintainAspectRatio:false,plugins:{title:{display:true,text:CATS[c]+(real?'':' — ILLUSTRATIVE')}}}})}
function dataTable(){$('#dataList').innerHTML=data.length?`<table><tr><th>Category</th><th>Year</th><th>Label</th><th>Value</th><th>Source</th><th>Page</th><th></th></tr>${data.map((d,i)=>`<tr><td>${CATS[d.cat]}</td><td>${esc(d.year)}</td><td>${esc(d.label)}</td><td>${d.value} ${esc(d.unit)}</td><td>${esc(d.src)}</td><td>${esc(d.page)}</td><td><button class="btn del" data-i="${i}" aria-label="Delete"><i class="fa-solid fa-trash"></i></button></td></tr>`).join('')}</table>`:'<p class="empty">No entered values yet — charts show illustrative demo data.</p>';
 $$('#dataList .del').forEach(b=>b.onclick=()=>{data.splice(b.dataset.i,1);save('rtp_data',data);financial();toast('Entry removed')})}
$('#cat').onchange=financial;$('#yrFilter').onchange=drawChart;
$('#dataForm').onsubmit=e=>{e.preventDefault();data.push({cat:$('#dCat').value,year:$('#dYear').value.trim(),label:$('#dLabel').value.trim(),value:+$('#dVal').value,unit:$('#dUnit').value.trim(),src:$('#dSrc').value.trim(),page:$('#dPage').value.trim()});save('rtp_data',data);log(`Added ${CATS[$('#dCat').value]} value for ${$('#dYear').value}`);$('#cat').value=$('#dCat').value;e.target.reset();financial();toast('Value added with source')};

/* ---------- Uploads & evidence ---------- */
$$('.drop').forEach(z=>{const inp=z.querySelector('input'),add=fl=>[...fl].forEach(f=>{if(f.type!=='application/pdf'&&!/\.pdf$/i.test(f.name))return toast(f.name+' is not a PDF.',1);files.push({name:f.name,type:z.dataset.type,size:(f.size/1048576).toFixed(2)+' MB'});log('Uploaded '+f.name+' ('+z.dataset.type+')');toast('Uploaded '+f.name)}),done=()=>{renderFiles();inp.value=''};
 z.onclick=()=>inp.click();z.onkeydown=e=>(e.key==='Enter'||e.key===' ')&&(e.preventDefault(),inp.click());inp.onchange=()=>{add(inp.files);done()};
 z.ondragover=e=>{e.preventDefault();z.classList.add('over')};z.ondragleave=()=>z.classList.remove('over');z.ondrop=e=>{e.preventDefault();z.classList.remove('over');add(e.dataTransfer.files);done()}});
function renderFiles(){$('#files').innerHTML=files.length?files.map((f,i)=>`<li><i class="fa-solid fa-file-pdf" style="color:#ef4444"></i><b>${esc(f.name)}</b><span class="badge blue">${f.type}</span><span class="badge gray">PDF · ${f.size}</span><span class="badge orange">Held in browser — not analyzed</span><button class="btn del" data-i="${i}">Remove</button></li>`).join(''):'<li class="empty" style="display:block">No files uploaded in this session.</li>';
 $$('#files .del').forEach(b=>b.onclick=()=>{files.splice(b.dataset.i,1);renderFiles();toast('File removed')})}
$('#evForm').onsubmit=e=>{e.preventDefault();evid.unshift({year:$('#eYear').value,title:$('#eTitle').value,page:$('#ePage').value,text:$('#eText').value});save('rtp_ev',evid);log('Saved evidence from '+$('#eTitle').value);e.target.reset();toast('Evidence saved — see Research & Evidence')};
function renderEv(){$('#evList').innerHTML=evid.length?evid.map((v,i)=>`<div class="rowc"><span class="badge green">Reported fact (as copied by you)</span> <b>${esc(v.title)}</b> · ${esc(v.year)} · p.${esc(v.page)}<p>“${esc(v.text)}”</p><button class="btn del" data-i="${i}">Delete</button></div>`).join(''):'<p class="empty">No evidence saved yet. Add excerpts on the Annual Reports page.</p>';
 $$('#evList .del').forEach(b=>b.onclick=()=>{evid.splice(b.dataset.i,1);save('rtp_ev',evid);renderEv()})}

/* ---------- Narrative vs Reality ---------- */
const VC={'Supported by Available Evidence':'v-s','Partly Supported':'v-p','Not Supported by Available Evidence':'v-n','Insufficient Evidence':'v-i'};
$('#nForm').onsubmit=e=>{e.preventDefault();rows.unshift({stmt:$('#nStmt').value,cat:$('#nCat').value,year:$('#nYear').value,src:$('#nSrc').value,pg:$('#nPg').value,met:$('#nMet').value,prev:$('#nPrev').value,cur:$('#nCur').value,ex:$('#nEx').value,epg:$('#nEPg').value,note:$('#nNote').value,ver:$('#nVer').value,why:$('#nWhy').value});save('rtp_rows',rows);log('Added comparison: '+$('#nCat').value);e.target.reset();renderRows();toast('Comparison row added')};
$('#demoRun').onclick=()=>{rows=rows.filter(r=>!r.demo);SCEN.slice().reverse().forEach((s,i)=>rows.unshift({demo:1,stmt:s[1],cat:['Capital Allocation','Geographic Exposure','R&D','Specialty Medicines'][i],year:'—',src:'(no document attached)',pg:'',met:'(none entered)',prev:'',cur:'',ex:'',epg:'',note:'Demo Scenario — Requires Source Verification. '+s[2],ver:'Insufficient Evidence',why:'Illustrative scenario only; no supporting document has been checked.'}));save('rtp_rows',rows);log('Ran demo analysis');renderRows();toast('Demo analysis loaded (illustrative)')};
function renderRows(){$('#rows').innerHTML=rows.length?rows.map((r,i)=>{const calc=r.prev!==''&&r.cur!==''&&+r.prev!==0?(((r.cur-r.prev)/Math.abs(r.prev))*100).toFixed(1)+'%':null;
 return `<article class="rowc ${VC[r.ver]}">${r.demo?'<span class="badge orange">ILLUSTRATIVE DEMO — Requires Source Verification</span>':''}<div class="cols"><div><h4>Narrative · ${esc(r.cat)}</h4><p>“${esc(r.stmt)}”</p><small>${esc(r.src)} · ${esc(r.year)}${r.pg?' · p.'+esc(r.pg):''}</small></div><div><h4>Evidence · ${esc(r.met)}</h4><p>Previous: <b>${esc(r.prev)||'missing'}</b> → Current: <b>${esc(r.cur)||'missing'}</b> ${calc?`<span class="badge blue">Calculated change ${calc}</span>`:'<span class="badge gray">Missing information</span>'}</p>${r.ex?`<p>“${esc(r.ex)}”${r.epg?' (p.'+esc(r.epg)+')':''}</p>`:''}${r.note?`<small>Notes: ${esc(r.note)}</small>`:''}</div></div><p><span class="badge ${{'v-s':'green','v-p':'yellow','v-n':'pink','v-i':'gray'}[VC[r.ver]]}">${esc(r.ver)}</span> ${esc(r.why)}</p><button class="btn del" data-i="${i}">Delete row</button></article>`}).join(''):'<p class="empty">No comparison rows yet. Add one above or click “Run Demo Analysis”.</p>';
 $$('#rows .del').forEach(b=>b.onclick=()=>{rows.splice(b.dataset.i,1);save('rtp_rows',rows);renderRows();toast('Row deleted')})}

/* ---------- Pivot signals ---------- */
const SIGS=[['Increasing investment in specialty medicines',['Specialty Medicines','Product Launches & Pipeline']],['Changes in R&D spending',['R&D']],['Changes in geographic revenue contribution',['Geographic Exposure','US Generics','India Formulations']],['Major acquisitions or divestments',['Acquisitions & Investments']],['Shifts in disclosed business-segment revenue',['India Formulations','US Generics','Specialty Medicines']],['Manufacturing expansion or capital investment',['Capital Allocation']],['Regulatory developments',['Regulatory & Manufacturing']],['Changes in management\'s strategic emphasis',['Management Emphasis']]];
function sigState(s){const r=rows.filter(x=>!x.demo&&s[1].includes(x.cat)),full=r.filter(x=>x.src&&x.epg&&x.ex&&x.prev!==''&&x.cur!=='').length;
 let st='Insufficient';if(r.some(x=>x.ver==='Supported by Available Evidence'))st='Positive';if(r.some(x=>/^(Partly|Not)/.test(x.ver)))st=st==='Positive'&&!r.some(x=>/^(Partly|Not)/.test(x.ver))?st:'Watch';if(r.length&&r.every(x=>x.ver==='Insufficient Evidence'))st='Insufficient';
 return{r,n:r.length,full,st,conf:full>=2?'High completeness':full===1?'Moderate completeness':r.length?'Low completeness':'No evidence entered'}}
function renderSignals(){$('#sigGrid').innerHTML=SIGS.map(s=>{const x=sigState(s),b={Positive:'green',Watch:'orange',Insufficient:'gray'}[x.st],yrs=[...new Set(x.r.map(r=>r.year))].join(', ')||'—',srcs=[...new Set(x.r.map(r=>r.src))].join('; ')||'—';
 return `<article class="sig ${x.st}"><span class="badge ${b}">${x.st==='Insufficient'?'Insufficient Evidence':x.st}</span> <span class="badge purple">${esc(s[1][0])}</span><h3>${esc(s[0])}</h3><p><b>Evidence source:</b> ${esc(srcs)}<br><b>Years compared:</b> ${esc(yrs)}<br><b>Confidence label:</b> ${x.conf} (${x.full} of ${x.n} rows fully documented)</p><p>${x.n?`Based on ${x.n} comparison row(s) you entered. This is an observation to investigate further, not a forecast.`:'No evidence entered for this signal yet. Add a comparison row in Narrative vs Reality.'}</p></article>`}).join('')}

/* ---------- Init ---------- */
financial();show();
