import {db,audit,transaction} from '../src/database.js';
import {hashPassword} from '../src/auth.js';
const {ADMIN_NAME:name,ADMIN_EMAIL:email,ADMIN_PASSWORD:password}=process.env;
if(!name?.trim()||name.length>100||!email||email.length>254||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||!password||password.length<12||password.length>128)throw Error('Defina ADMIN_NAME, ADMIN_EMAIL e ADMIN_PASSWORD (12–128 caracteres) no ambiente do processo. Não inclua credenciais no código.');
if(db.prepare('SELECT id FROM users WHERE admin=1').get())throw Error('Administradora já cadastrada. Nenhuma conta foi alterada.');
const hash=await hashPassword(password);
transaction(()=>{const id=Number(db.prepare('INSERT INTO users(name,email,password,admin) VALUES (?,?,?,1)').run(name.trim(),email.toLowerCase(),hash).lastInsertRowid);audit(id,'Conta administrativa criada');});
console.log('Conta administrativa criada.');db.close();
