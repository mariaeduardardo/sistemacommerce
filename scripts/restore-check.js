import {DatabaseSync} from 'node:sqlite';
import {mkdtemp,copyFile,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
const source=process.argv[2];if(!source)throw Error('Informe o caminho de um backup.');
const dir=await mkdtemp(join(tmpdir(),'cv-restore-'));
try{await copyFile(source,join(dir,'restored.sqlite'));const db=new DatabaseSync(join(dir,'restored.sqlite'));if(db.prepare('PRAGMA integrity_check').get().integrity_check!=='ok')throw Error('Integridade inválida.');const required=['users','records','clients','tasks','private_files','detailed_audit'];for(const table of required)db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get();db.close();console.log('Restauração em cópia temporária verificada.');}finally{await rm(dir,{recursive:true,force:true});}
