import {spawn} from 'node:child_process';
let active=false;
export function scheduleBackup(){if(process.env.BACKUP_ENABLED!=='true')return;const run=()=>{if(active)return;active=true;const child=spawn(process.execPath,['scripts/backup.js'],{stdio:'inherit',env:process.env});child.on('exit',code=>{active=false;if(code)console.error('Backup agendado falhou. Verifique armazenamento e logs.');});child.on('error',()=>{active=false;console.error('Não foi possível iniciar o backup agendado.');});};setTimeout(run,60000).unref();setInterval(run,24*60*60*1000).unref();}
