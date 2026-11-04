import {db,audit,transaction} from '../src/database.js';
import {hashPassword} from '../src/auth.js';
const email=process.env.RESET_EMAIL,password=process.env.RESET_PASSWORD;
if(!email||typeof password!=='string'||password.length<12||password.length>128)throw Error('Configure RESET_EMAIL e RESET_PASSWORD com segurança no ambiente deste processo.');
const user=db.prepare('SELECT id FROM users WHERE email=?').get(email.toLowerCase());if(!user)throw Error('Conta não encontrada.');
const hash=await hashPassword(password);transaction(()=>{db.prepare('UPDATE users SET password=? WHERE id=?').run(hash,user.id);db.prepare('DELETE FROM sessions WHERE user_id=?').run(user.id);audit(user.id,'Senha recuperada pelo operador da hospedagem; sessões revogadas');});db.close();console.log('Senha recuperada. Sessões revogadas.');
