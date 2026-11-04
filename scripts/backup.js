import {DatabaseSync,backup} from 'node:sqlite';
import {mkdir,chmod,readdir,unlink} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
const source=resolve(process.env.DATABASE_PATH||'.data/commerce.sqlite');
const target=resolve(process.env.BACKUP_DIR||join(dirname(source),'backups'));
await mkdir(target,{recursive:true,mode:0o700});
const name='commerce-'+new Date().toISOString().replace(/[:.]/g,'-')+'.sqlite';
const db=new DatabaseSync(source,{readOnly:true});
await backup(db,join(target,name));db.close();await chmod(join(target,name),0o600);
const verified=new DatabaseSync(join(target,name),{readOnly:true});
if(verified.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Backup falhou na verificação de integridade.');
verified.close();console.log('Backup verificado:',name);

const keep=Number(process.env.BACKUP_RETENTION||7);if(!Number.isInteger(keep)||keep<1||keep>365)throw Error('Retenção inválida (1–365).');const files=(await readdir(target)).filter(n=>/^commerce-\d{4}-.*\.sqlite$/.test(n)).sort().reverse();for(const old of files.slice(keep))await unlink(join(target,old));
