export const state={me:null,catalog:{},data:{},team:[],view:'today',scope:'all',query:'',filters:{},archived:false,selected:null,alerts:[]};
export const $=s=>document.querySelector(s);
export const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format((n||0)/100);
export const today=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'America/Sao_Paulo',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
export const day=s=>s?String(s).slice(0,10).split('-').reverse().join('/'):'—';
export const can=(area,action='read')=>!!state.me?.admin||state.me?.permissions[area]?.includes(action);
export async function api(path,method='GET',data){const r=await fetch('/api'+path,{method,headers:method==='GET'?{}:{'Content-Type':'application/json'},body:data!==undefined?JSON.stringify(data):undefined});const value=await r.json();if(!r.ok){if(r.status===401&&path!=='/login')window.dispatchEvent(new Event('session-ended'));throw Error(value.error||'Falha na operação.');}return value;}
export function toast(message){$('#toast').textContent=message;$('#toast').classList.add('show');setTimeout(()=>$('#toast').classList.remove('show'),5000);}
export function dialog(html){const el=$('#modal');$('#dialog-body').innerHTML=html;if(!el.open)el.showModal();}
export function closeDialog(){$('#modal').close();$('#dialog-body').replaceChildren();}
export function error(e){const box=$('#modal[open] .error')||$('#login .error');if(box)box.textContent=e.message;else toast(e.message);}
export function heading(title,subtitle,button=''){return `<section class="page-heading"><div><p class="eyebrow">COMMERCE VISUAL / OPERAÇÃO</p><h1>${esc(title)}</h1><p class="subheading">${esc(subtitle)}</p></div>${button}</section>`;}
export const recordLabel=r=>r?.code?`${r.code} · ${r.title}`:r?.company||r?.title||r?.name||r?.description?.slice(0,80)||`Registro #${r?.id}`;
export function referenceLabel(target,id){if(!id)return '—';const list=target==='team'?state.team:state.data[target]||[];const item=list.find(r=>r.id===id);return item?recordLabel(item):`#${id}`;}
export const badge=s=>`<span class="badge ${['Perdido','Urgente','Atrasado'].includes(s)?'orange':'blue-bg'}">${esc(s||'Pendente')}</span>`;
export function actionButton(label,kind,id,verb,disabled=false){return `<button class="secondary" data-action="${verb}" data-kind="${kind}" data-id="${id}" ${disabled?'disabled':''}>${esc(label)}</button>`;}
export async function refreshData(){const catalog=await api('/work/catalog');state.catalog=catalog.modules;const entries=await Promise.all(Object.keys(state.catalog).map(async kind=>[kind,await api('/work/'+kind)]));state.data=Object.fromEntries(entries);state.team=await api('/team');state.alerts=await api('/work/alerts');if(!state.catalog.plans&&can('maintenance'))state.data.plans=await api('/work/plans');}
export function openButton(kind,r){return `<button class="link" data-open="${kind}" data-id="${r.id}">${esc(recordLabel(r))}</button>`;}
