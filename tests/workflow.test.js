import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const dir=mkdtempSync(join(tmpdir(),'cv-workflow-'));process.env.DATABASE_PATH=join(dir,'test.sqlite');
const {db}=await import('../src/database.js');
const {save,action,archive,all,saveSettings}=await import('../src/domain/service.js');
const {get,list,settings,today,searchWork}=await import('../src/domain/storage.js');
const {alerts,finance,reports}=await import('../src/domain/queries.js');
db.prepare('INSERT INTO users(name,email,password,admin) VALUES (?,?,?,1)').run('Admin','admin@example.com','test-only');
const admin={id:1,admin:1,permissions:'{}'},member={id:1,admin:0,permissions:JSON.stringify({projects:['read','edit']})};
let client,opp,project;
const rejects=(fn,status)=>assert.throws(fn,e=>e.status===status);
function opportunity(method='Pix'){return save(admin,'opportunities',{client_id:client.id,title:'Projeto de teste',service:'Site institucional',status:'Fechado',potential:10001,value:10001,payment_method:method,owner_id:1});}
function act(kind,id,verb,data={}){return action(admin,kind,id,verb,{version:get(kind,id).version,...data});}
test('fluxo real: contrato, 50%, aprovação, saldo, checklist, entrega e garantia',()=>{
 client=save(admin,'clients',{name:'Pessoa',company:'Empresa'});assert.equal(list('opportunities').filter(item=>item.client_id===client.id&&item.status==='Novo lead').length,1);assert.equal(list('tasks').filter(item=>item.client_id===client.id&&item.title==='Primeiro contato: Empresa').length,1);
 opp=opportunity();rejects(()=>act('opportunities',opp.id,'project'),400);
 act('opportunities',opp.id,'contract');rejects(()=>act('opportunities',opp.id,'payment',{amount:5000}),400);
 act('opportunities',opp.id,'payment',{amount:5001});opp=act('opportunities',opp.id,'project');project=get('projects',opp.project_id);assert.match(project.code,/^CV-\d{4}-0001$/);
 rejects(()=>act('opportunities',opp.id,'project'),409);
 rejects(()=>act('opportunities',opp.id,'payment',{amount:5000}),400);
 rejects(()=>act('projects',project.id,'deliver'),400);
 save(admin,'approvals',{project_id:project.id,item:'Versão final',date:today(),channel:'E-mail',notes:'Cliente aprovou'});
 act('opportunities',opp.id,'payment',{amount:5000});assert.equal(finance().sales[0].balance,0);
 rejects(()=>act('opportunities',opp.id,'payment',{amount:5000}),400);
 for(const item of project.checklist.filter(c=>c.group==='technical'&&c.required))act('projects',project.id,'check',{item_id:item.id,state:'done',note:'Verificado'});
 const delivered=act('projects',project.id,'deliver');assert.equal(delivered.status,'Entregue');assert.equal((Date.parse(delivered.guarantee_end)-Date.parse(delivered.delivered_at))/86400000,90);
 rejects(()=>act('projects',project.id,'deliver'),409);
});
test('crédito integral, numeração única e proteção contra atualização concorrente',()=>{
 const credit=opportunity('Crédito');act('opportunities',credit.id,'contract');rejects(()=>act('opportunities',credit.id,'payment',{amount:5001}),400);act('opportunities',credit.id,'payment',{amount:10001});const result=act('opportunities',credit.id,'project');assert.notEqual(get('projects',result.project_id).code,project.code);
 const current=get('clients',client.id);save(admin,'clients',{...current,name:'Novo nome'},client.id);rejects(()=>save(admin,'clients',current,client.id),409);
 const before=get('opportunities',credit.id);rejects(()=>save(admin,'opportunities',{...before,value:1},credit.id),400);
});
test('permissões e exceção de entrega restrita à administradora',()=>{
 rejects(()=>all(member,'clients'),403);
 const p=list('projects').find(p=>!p.delivered_at);
 rejects(()=>action(member,'projects',p.id,'deliver',{version:p.version,exception_reason:'Teste'}),400);
 const delivered=act('projects',p.id,'deliver',{exception_reason:'Liberação administrativa documentada'});assert.equal(delivered.delivery_exception,'Liberação administrativa documentada');
 assert.ok(db.prepare("SELECT id FROM detailed_audit WHERE reason<>''").all().length);
});
test('modelos preservados, configuração validada, anexos privados e alertas sem duplicação',()=>{
 const initial=get('projects',project.id).checklist.length;const cfg=settings();cfg.templates['Site institucional'].push({label:'Item novo',required:true,group:'technical'});saveSettings(admin,{...cfg,guarantee_days:120});assert.equal(get('projects',project.id).checklist.length,initial);assert.equal(get('projects',project.id).guarantee_days,90);
 const file=save(admin,'files',{project_id:project.id,title:'Orientações',category:'Entrega',file:{name:'guia.txt',type:'text/plain',base64:Buffer.from('Orientações técnicas').toString('base64')}});assert.ok(file.attachment.id);assert.equal(db.prepare('SELECT content FROM private_files WHERE id=?').get(file.attachment.id).content.length,Buffer.byteLength('Orientações técnicas'));
 rejects(()=>save(admin,'files',{project_id:project.id,title:'Inválido',category:'Entrega',file:{name:'bad.pdf',type:'application/pdf',base64:Buffer.from('<html>bad</html>').toString('base64')}}),400);
 const task=save(admin,'tasks',{title:'Revisar',owner_id:1,due:today(),status:'Pendente'});const a=alerts(admin);assert.equal(a.filter(x=>x.key==='task:'+task.id).length,1);save(admin,'tasks',{...task,status:'Concluída'},task.id);assert.equal(alerts(admin).filter(x=>x.key==='task:'+task.id).length,0);
 const before=get('clients',client.id);archive(admin,'clients',client.id,{version:before.version,reason:'Arquivamento para teste'});assert.equal(all(admin,'clients').length,0);const archived=get('clients',client.id);archive(admin,'clients',client.id,{version:archived.version,reason:'Restauração para teste'});assert.equal(all(admin,'clients').length,1);assert.equal(reports(admin,'','').sales,2);
});
test('atalhos comerciais movem etapa, responsável e follow-up sem edição completa',()=>{
 const lead=save(admin,'clients',{name:'Atalho',company:'Empresa Atalho'}),generated=list('opportunities').find(item=>item.client_id===lead.id);assert.equal(generated.status,'Novo lead');
 assert.equal(act('opportunities',generated.id,'stage',{status:'Em contato'}).status,'Em contato');assert.equal(act('opportunities',generated.id,'assign',{owner_id:1}).owner_id,1);
 assert.equal(act('opportunities',generated.id,'followup',{next_contact:today()}).next_contact,today());assert.equal(act('opportunities',generated.id,'contact',{next_contact:today()}).last_contact,today());assert.equal(list('interactions').filter(item=>item.opportunity_id===generated.id).length,1);
});
test('áudio enviado transforma o lead em acompanhamento e cria retornos',()=>{
 const lead=save(admin,'clients',{name:'Áudio',company:'Empresa do áudio'}),generated=list('opportunities').find(item=>item.client_id===lead.id),saved=act('opportunities',generated.id,'approach');
 assert.equal(saved.status,'Em contato');assert.equal(saved.approach_status,'Áudio enviado');assert.equal(saved.last_contact,today());
 assert.equal(list('tasks').filter(item=>item.client_id===lead.id&&/^Follow-up [237]d:/.test(item.title)).length,3);
});
test('busca não mantém cliente arquivado',()=>{const found=save(admin,'clients',{name:'Busca',company:'Cliente exclusivo de busca'});assert.ok(searchWork('exclusivo').some(row=>row.id===found.id));archive(admin,'clients',found.id,{version:found.version,reason:'Teste de índice'});assert.equal(searchWork('exclusivo').some(row=>row.id===found.id),false);});
after(()=>{db.close();rmSync(dir,{recursive:true,force:true});});
