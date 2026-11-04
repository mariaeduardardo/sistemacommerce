import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
const files=['server.js'];function visit(dir){for(const entry of readdirSync(dir,{withFileTypes:true})){const path=dir+'/'+entry.name;if(entry.isDirectory())visit(path);else if(path.endsWith('.js'))files.push(path);}}
for(const dir of ['src','public/js','scripts','tests'])visit(dir);
for(const file of files){const result=spawnSync(process.execPath,['--check',file],{stdio:'inherit'});if(result.status!==0)process.exit(result.status||1);}console.log(`${files.length} arquivos JavaScript verificados.`);
