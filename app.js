const DEFAULT_COMPONENTS=[
{date:"2026-03-16",category:"Pilares",ref:"135.355",measure:"3.5 x 4 x 0.8",initial:2,current:2},
{date:"2026-03-16",category:"Pilares",ref:"135.356",measure:"3.5 x 4 x 1.5",initial:6,current:6},
{date:"2026-03-16",category:"Pilares",ref:"135.357",measure:"3.5 x 4 x 2.5",initial:3,current:3},
{date:"2026-03-16",category:"Pilares",ref:"135.358",measure:"3.5 x 4 x 3.5",initial:2,current:2},
{date:"2026-03-16",category:"Pilares",ref:"135.359",measure:"3.5 x 4 x 4.5",initial:1,current:1},
{date:"",category:"Pilares",ref:"135.399",measure:"3.5 x 0.8",initial:1,current:1},
{date:"",category:"Pilares",ref:"135.400",measure:"3.5 x 1.5",initial:3,current:2},
{date:"",category:"Pilares",ref:"135.401",measure:"3.5 x 2.5",initial:2,current:1},
{date:"",category:"Pilares",ref:"135.402",measure:"3.5 x 3.5",initial:0,current:0},
{date:"",category:"Pilares",ref:"135.403",measure:"3.5 x 4.5",initial:0,current:0}
];
const SHEET_ID="1aEU9yqGAEgcNhXUfWDStjqHI-4s5BwZa6Oyjlm2QN7M";
const DEFAULT_BACKEND_URL="https://script.google.com/macros/s/AKfycbyLlRpOmNISvrJSJkN62ot3mTOtbdaykA1CqJwmlSL1FDkmcVd8t6puYv_RxqOk724/exec";
const $=s=>document.querySelector(s);
const $$=s=>Array.from(document.querySelectorAll(s));
let state=loadState();
let photoData="";
let historyFilter="todos";

function loadState(){
  const saved=localStorage.getItem('gosmile-stock-state');
  if(saved){
    try{
      const parsed=JSON.parse(saved);
      if(Array.isArray(parsed.components)){
        parsed.config=parsed.config||{};
        parsed.config.scriptUrl=DEFAULT_BACKEND_URL;
        parsed.config.alertEmail=parsed.config.alertEmail||"gerencia@gosmile.pt";
        parsed.history=Array.isArray(parsed.history)?parsed.history:[];
        return parsed;
      }
    }catch{}
  }
  return{components:structuredClone(DEFAULT_COMPONENTS),history:[{ts:"2026-04-16T10:00:00",type:"saida",ref:"135.400 + 135.401",qty:2,patient:"M helena",location:"Desagno",notes:"Importado da folha original",stockAfter:""}],config:{scriptUrl:DEFAULT_BACKEND_URL,alertEmail:"gerencia@gosmile.pt"}};
}
function save(){localStorage.setItem('gosmile-stock-state',JSON.stringify(state))}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2600)}
function stockClass(n){return n<=0?'zero':n<2?'low':''}
function esc(v){return String(v??'').replace(/[&<>"]/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[m]))}
function isUndoable(m){return !m.undone && /^\d{3}\.\d{3}$/.test(String(m.ref||'')) && Number(m.qty)>0 && (m.type==='entrada'||m.type==='saida')}

function render(){renderStatus();renderComponents();renderSelect();renderHistory();$('#scriptUrl').value=state.config.scriptUrl||'';$('#alertEmail').value=state.config.alertEmail||'gerencia@gosmile.pt'}
function renderStatus(){const total=state.components.reduce((s,c)=>s+Number(c.current||0),0);const low=state.components.filter(c=>Number(c.current)<2).length;$('#totalUnits').textContent=total;$('#lowCount').textContent=low;$('#refCount').textContent=state.components.length;if(!$('#backendStatus').dataset.syncing)$('#backendStatus').textContent=state.config.scriptUrl?'Google Sheet':'Offline'}
function renderComponents(){const q=($('#search').value||'').toLowerCase();const rows=state.components.filter(c=>`${c.ref} ${c.measure} ${c.category}`.toLowerCase().includes(q));$('#stockList').innerHTML=rows.map(c=>`<article class="item"><div class="item-head"><div><div class="ref">${esc(c.ref)}</div><div class="measure">${esc(c.measure)}</div></div><span class="badge ${stockClass(Number(c.current))}">${Number(c.current)} un.</span></div><div class="meta"><span class="chip">${esc(c.category||'Componente')}</span><span class="chip">Inicial: ${Number(c.initial||0)}</span>${Number(c.current)<2?'<span class="chip">⚠ Repor stock</span>':''}</div></article>`).join('')||'<p class="hint">Sem resultados.</p>'}
function renderSelect(){const sel=$('#componentSelect');const val=sel.value;sel.innerHTML=state.components.map(c=>`<option value="${esc(c.ref)}">${esc(c.ref)} · ${esc(c.measure)} · stock ${Number(c.current)}</option>`).join('');if(val)sel.value=val}
function renderHistory(){
  const items=state.history.map((m,index)=>({...m,index})).filter(m=>historyFilter==='todos'||m.type===historyFilter).reverse();
  $('#historyList').innerHTML=items.map(m=>`<div class="movement ${m.type==='entrada'?'movement-in':'movement-out'} ${m.undone?'undone':''}"><div class="movement-main"><strong>${m.type==='entrada'?'Entrada':'Saída'} · ${esc(m.ref)} · ${m.qty} un.${m.undone?' · ANULADO':''}</strong><small>${new Date(m.ts).toLocaleString('pt-PT')} · ${esc(m.location||'')} ${m.patient?'· Paciente: '+esc(m.patient):''}</small>${m.notes?`<p>${esc(m.notes)}</p>`:''}${m.photo?'<small>📷 foto registada</small>':''}</div>${isUndoable(m)?`<button class="undo-btn" data-index="${m.index}" type="button">↶ Undo</button>`:''}</div>`).join('')||`<p class="hint">Sem ${historyFilter==='entrada'?'entradas':historyFilter==='saida'?'saídas':'movimentos'}.</p>`;
}

async function syncFromBackend({silent=false}={}){state.config.scriptUrl=DEFAULT_BACKEND_URL;const status=$('#backendStatus');status.dataset.syncing='1';status.textContent='A sincronizar…';try{const res=await fetch(state.config.scriptUrl+'?action=list&ts='+Date.now(),{cache:'no-store'});const data=await res.json();if(data.components){state.components=data.components;save();delete status.dataset.syncing;status.textContent='Google Sheet';render();if(!silent)toast('Stock sincronizado com a Google Sheet')}}catch(e){delete status.dataset.syncing;status.textContent='Erro ligação';toast('Falha ao sincronizar: '+e.message)}}
async function sendMovement(movement){if(!state.config.scriptUrl)return {local:true};const res=await fetch(state.config.scriptUrl,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({...movement,alertEmail:state.config.alertEmail})});const data=await res.json();if(!data.ok)throw new Error(data.error||'Erro no backend');if(data.components)state.components=data.components;return data}
function applyLocal(m){const comp=state.components.find(c=>c.ref===m.ref);if(!comp)throw new Error('Componente não encontrado');const q=Number(m.qty);if(m.type==='saida'){if(q>Number(comp.current))throw new Error('Stock insuficiente');comp.current=Number(comp.current)-q}else{comp.current=Number(comp.current)+q;comp.initial=Number(comp.initial||0)+q}m.stockAfter=comp.current;state.history.push(m);save()}

$('#movementForm').addEventListener('submit',async e=>{e.preventDefault();const type=$('#movementType').value;const m={id:crypto.randomUUID?.()||String(Date.now()),ts:new Date().toISOString(),type,ref:$('#componentSelect').value,qty:Number($('#quantity').value),patient:$('#patient').value.trim(),location:$('#location').value,notes:$('#notes').value.trim(),photo:photoData};if(type==='saida'&&!m.patient){toast('Indica o nome do paciente.');return}try{if(state.config.scriptUrl){await sendMovement(m);state.history.push(m);save()}else{applyLocal(m);const comp=state.components.find(c=>c.ref===m.ref);if(comp&&Number(comp.current)<2)toast('Stock abaixo de 2 — email activo só com backend.')}photoData='';$('#photoPreview').hidden=true;e.target.reset();$('#quantity').value=1;render();toast('Movimento registado')}catch(err){toast(err.message)}});
$('#movementType').addEventListener('change',()=>{$('#patientWrap').style.display=$('#movementType').value==='saida'?'block':'none'});
function handlePhotoInput(e){const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=()=>{photoData=r.result;$('#photoPreview').src=photoData;$('#photoPreview').hidden=false};r.readAsDataURL(file)}
$('#photoCamera').addEventListener('change',handlePhotoInput);

$('#historyList').addEventListener('click',async e=>{
  const btn=e.target.closest('.undo-btn');
  if(!btn)return;
  const index=Number(btn.dataset.index);
  const original=state.history[index];
  if(!original||!isUndoable(original))return;
  if(!confirm(`Anular ${original.type==='entrada'?'entrada':'saída'} de ${original.qty} un. da ref. ${original.ref}?`))return;
  const inverse={id:crypto.randomUUID?.()||String(Date.now()),ts:new Date().toISOString(),type:original.type==='entrada'?'saida':'entrada',ref:original.ref,qty:Number(original.qty),patient:original.patient||'Undo',location:original.location||'Desagno',notes:`UNDO de movimento ${new Date(original.ts).toLocaleString('pt-PT')}. ${original.notes||''}`.trim(),photo:''};
  try{
    await sendMovement(inverse);
    original.undone=true;
    original.undoTs=inverse.ts;
    state.history.push({...inverse,undoOf:original.id||original.ts});
    save();
    render();
    toast('Movimento anulado');
  }catch(err){toast('Undo falhou: '+err.message)}
});

$$('.tab').forEach(b=>b.addEventListener('click',()=>{$$('.tab').forEach(x=>x.classList.remove('active'));b.classList.add('active');$$('.view').forEach(v=>v.classList.remove('active'));$('#'+b.dataset.view+'View').classList.add('active')}));
$$('[data-history-filter]').forEach(b=>b.addEventListener('click',()=>{historyFilter=b.dataset.historyFilter;$$('[data-history-filter]').forEach(x=>x.classList.toggle('active',x===b));renderHistory()}));
$('#search').addEventListener('input',renderComponents);$('#syncBtn').addEventListener('click',()=>syncFromBackend());
$('#saveConfig').addEventListener('click',()=>{state.config.scriptUrl=DEFAULT_BACKEND_URL;state.config.alertEmail=$('#alertEmail').value.trim()||'gerencia@gosmile.pt';save();render();toast('Configuração guardada')});
$('#resetDemo').addEventListener('click',()=>{if(confirm('Limpar histórico local deste dispositivo? O stock continua vindo da Google Sheet.')){state.history=[];save();render();toast('Histórico local limpo')}});
$('#exportBtn').addEventListener('click',()=>{const header=['data','tipo','referencia','quantidade','paciente','local','notas','stock_apos','anulado'];const rows=state.history.map(m=>[m.ts,m.type,m.ref,m.qty,m.patient||'',m.location||'',m.notes||'',m.stockAfter||'',m.undone?'sim':'']);const csv=[header,...rows].map(r=>r.map(x=>'"'+String(x).replaceAll('"','""')+'"').join(',')).join('\n');const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([csv],{type:'text/csv'}));a.download='gosmile-stock-movimentos.csv';a.click()});
let lastAutoSync=0;
function autoSyncIfNeeded(){const now=Date.now();if(now-lastAutoSync<3000)return;lastAutoSync=now;syncFromBackend({silent:true})}
window.addEventListener('pageshow',autoSyncIfNeeded);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)autoSyncIfNeeded()});
window.addEventListener('focus',autoSyncIfNeeded);
if('serviceWorker'in navigator){navigator.serviceWorker.register('./sw.js').catch(()=>{})}render();autoSyncIfNeeded();
