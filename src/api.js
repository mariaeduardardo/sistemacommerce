import {workApi} from './domain/routes.js';
import {areas} from './domain/catalog.js';
import {db,audit,transaction} from './database.js';
import {hashPassword,verify,session,loginCookie,logout,publicUser} from './auth.js';
import {isIP} from 'node:net';
const fail=(status,message)=>{throw Object.assign(new Error(message),{status});};
const text=(v,max=200)=>{if(typeof v!=='string'||v.length>max)fail(400,'Campo inválido.');return v.trim();};
const required=(v,max)=>{v=text(v,max);if(!v)fail(400,'Preencha os campos obrigatórios.');return v;};
const email=v=>{v=required(v,254).toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v))fail(400,'E-mail inválido.');return v;};
const password=v=>{if(typeof v!=='string'||v.length<12||v.length>128)fail(400,'Use uma senha com 12 a 128 caracteres.');return v;};
const securityHeaders={'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'same-origin','Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=(), usb=()','Cross-Origin-Opener-Policy':'same-origin','Cross-Origin-Resource-Policy':'same-origin','X-Robots-Tag':'noindex, nofollow'};
const trustedOrigins=()=>new Set(String(process.env.APP_ORIGINS||process.env.APP_ORIGIN||'').split(',').map(origin=>origin.trim()).filter(Boolean));
const requestIp=req=>{const forwarded=process.env.TRUST_PROXY==='true'&&req.headers['x-forwarded-for'];if(typeof forwarded==='string'){const ip=forwarded.split(',').map(value=>value.trim()).find(value=>isIP(value));if(ip)return ip;}return isIP(req.socket.remoteAddress||'')?req.socket.remoteAddress:'unknown';};
function permissions(input){const output={};if(!input||typeof input!=='object'||Array.isArray(input))fail(400,'Permissões inválidas.');for(const area of areas){const items=input[area]||[];if(!Array.isArray(items)||items.some(a=>!['read','create','edit','archive'].includes(a)))fail(400,'Permissões inválidas.');output[area]=[...new Set(items)];if(items.some(x=>x!=='read')&&!items.includes('read'))fail(400,'Habilite visualizar antes de cadastrar ou editar.');}return output;}
async function body(req){const chunks=[];let size=0;for await(const chunk of req){const buffer=Buffer.isBuffer(chunk)?chunk:Buffer.from(chunk);size+=buffer.length;if(size>8*1024*1024)fail(413,'Solicitação muito grande.');chunks.push(buffer);}let value;try{value=JSON.parse(Buffer.concat(chunks).toString('utf8')||'{}');}catch{fail(400,'JSON inválido.');}if(!value||typeof value!=='object'||Array.isArray(value))fail(400,'Envie um objeto JSON.');return value;}
export async function api(req,res,path){const send=(status,data,headers={})=>{res.writeHead(status,{'Content-Type':'application/json','Cache-Control':'no-store',...securityHeaders,...headers});res.end(JSON.stringify(data));};try{
 if(req.method!=='GET'){const origins=trustedOrigins(),fallback=`http://${req.headers.host}`;if(!(origins.size?origins.has(req.headers.origin):req.headers.origin===fallback))fail(403,'Origem da solicitação inválida.');if(!req.headers['content-type']?.startsWith('application/json'))fail(415,'Envie JSON.');}
 if(path==='/api/login'&&req.method==='POST'){
 const b=await body(req),address=email(b.email),pass=b.password,now=Date.now();
 if(typeof pass!=='string'||pass.length>128)fail(400,'Senha inválida.');
 db.prepare('DELETE FROM attempts WHERE expires<=?').run(now);
 const keys=[`login:${requestIp(req)}:${address}`];
 for(const key of keys){const a=db.prepare('SELECT * FROM attempts WHERE key=?').get(key);if(a?.count>=10)fail(429,'Muitas tentativas. Aguarde 15 minutos.');db.prepare('INSERT INTO attempts VALUES (?,1,?) ON CONFLICT(key) DO UPDATE SET count=count+1').run(key,now+900000);}
 const user=db.prepare('SELECT * FROM users WHERE email=?').get(address);
 const dummy='00000000000000000000000000000000:'+ '00'.repeat(64);
 const valid=await verify(pass,user?.password||dummy);
 if(!user||!valid)fail(401,'E-mail ou senha incorretos.');
 for(const key of keys)db.prepare('DELETE FROM attempts WHERE key=?').run(key);
 return send(200,publicUser(user),{'Set-Cookie':loginCookie(user)});
 }
 const user=session(req);if(!user)fail(401,'Entre para acessar a operação.');
 if(await workApi(req,res,path,user,send,body))return;
 if(path==='/api/me'&&req.method==='GET')return send(200,publicUser(user));
 if(path==='/api/change-password'&&req.method==='POST'){const b=await body(req);if(typeof b.current!=='string'||b.current.length>128||!await verify(b.current,user.password))fail(400,'Senha atual incorreta.');const hash=await hashPassword(password(b.password));transaction(()=>{db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);audit(user.id,'Senha alterada e sessões encerradas');});return send(200,{ok:true});}
 if(path==='/api/logout'&&req.method==='POST'){logout(req);return send(200,{ok:true},{'Set-Cookie':'cv_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'});}
 if(path==='/api/team'&&req.method==='GET')return send(200,db.prepare('SELECT id,name FROM users ORDER BY id').all());
 if(path.startsWith('/api/users')||path==='/api/audit'){if(!user.admin)fail(403,'Acesso exclusivo da administradora.');
 if(path==='/api/audit'&&req.method==='GET')return send(200,db.prepare('SELECT audit.*,users.name AS actor_name FROM audit JOIN users ON users.id=audit.actor ORDER BY audit.id DESC LIMIT 200').all());
 if(path==='/api/users'&&req.method==='GET')return send(200,db.prepare('SELECT * FROM users').all().map(publicUser));
 if(path==='/api/users'&&req.method==='POST'){const b=await body(req),name=required(b.name,100),address=email(b.email),hash=await hashPassword(password(b.password)),perms=permissions(b.permissions);try{const id=transaction(()=>{const id=Number(db.prepare('INSERT INTO users(name,email,password,permissions) VALUES (?,?,?,?)').run(name,address,hash,JSON.stringify(perms)).lastInsertRowid);audit(user.id,`Usuário ${id} cadastrado`);return id;});return send(201,{id});}catch(e){if(e.message.includes('UNIQUE'))fail(409,'Este e-mail já está cadastrado.');throw e;}}
 if(/^\/api\/users\/\d+$/.test(path)&&req.method==='PATCH'){const id=Number(path.split('/').pop()),target=db.prepare('SELECT * FROM users WHERE id=?').get(id);if(!target)fail(404,'Usuário não encontrado.');if(target.admin)fail(400,'O acesso administrativo não pode ser alterado por esta tela.');const b=await body(req),perms=permissions(b.permissions);transaction(()=>{db.prepare('UPDATE users SET permissions=? WHERE id=?').run(JSON.stringify(perms),id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);audit(user.id,`Permissões do usuário ${id} alteradas; sessões encerradas`);});return send(200,{ok:true});}
 }
 fail(404,'Operação não encontrada.');
 }catch(e){send(e.status||500,{error:e.status?e.message:'Não foi possível concluir a operação.'});}}
