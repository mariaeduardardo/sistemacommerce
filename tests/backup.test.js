import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync,readdirSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
const dir=mkdtempSync(join(tmpdir(),'cv-backup-')),database=join(dir,'commerce.sqlite'),backups=join(dir,'backups');
const run=(args,env={})=>spawnSync(process.execPath,args,{cwd:process.cwd(),env:{...process.env,DATABASE_PATH:database,BACKUP_DIR:backups,BACKUP_RETENTION:'2',...env},encoding:'utf8'});
test('backup SQLite é criado e passa pela restauração de verificação',()=>{
 const seed=run(['--input-type=module','-e',"await import('./src/database.js');await import('./src/domain/storage.js');"]);assert.equal(seed.status,0,seed.stderr);
 const backup=run(['scripts/backup.js']);assert.equal(backup.status,0,backup.stderr);const file=readdirSync(backups).find(name=>name.endsWith('.sqlite'));assert.ok(file);
 const restore=run(['scripts/restore-check.js',join(backups,file)]);assert.equal(restore.status,0,restore.stderr);
});
after(()=>rmSync(dir,{recursive:true,force:true}));
