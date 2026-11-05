import { randomBytes, scrypt as derive, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import {db} from './database.js';
const scrypt=promisify(derive);
export async function hashPassword(password){const salt=randomBytes(16).toString('hex');const hash=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});return `${salt}:${hash.toString('hex')}`;}
export async function verify(password,encoded){if(typeof password!=='string'||typeof encoded!=='string')return false;const [salt,hex,...rest]=encoded.split(':');if(rest.length||!/^[a-f0-9]{32}$/i.test(salt)||!/^[a-f0-9]{128}$/i.test(hex))return false;const hash=await scrypt(password,salt,64,{N:32768,r:8,p:1,maxmem:64*1024*1024});const expected=Buffer.from(hex,'hex');return expected.length===hash.length&&timingSafeEqual(hash,expected);}
const digest=s=>createHash('sha256').update(s).digest('hex');
export function session(req){const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cv_session='))?.slice(11);if(!token)return null;return db.prepare('SELECT users.* FROM sessions JOIN users ON users.id=sessions.user_id WHERE token=? AND expires>?').get(digest(token),Date.now());}
export function loginCookie(user){db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());const token=randomBytes(32).toString('hex');db.prepare('INSERT INTO sessions VALUES (?,?,?)').run(digest(token),user.id,Date.now()+8*60*60*1000);return `cv_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800${process.env.NODE_ENV==='production'?'; Secure':''}`;}
export function logout(req){const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('cv_session='))?.slice(11);if(token)db.prepare('DELETE FROM sessions WHERE token=?').run(digest(token));}
export function publicUser(u){return {id:u.id,name:u.name,email:u.email,admin:!!u.admin,permissions:JSON.parse(u.permissions)};}
export function allowed(u,area,action){return !!u.admin||JSON.parse(u.permissions)[area]?.includes(action);}
