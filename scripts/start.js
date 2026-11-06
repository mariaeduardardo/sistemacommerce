// Production entry point. Bootstrap credentials are read only from secure environment bindings.
if(!process.env.APP_ORIGINS&&!process.env.APP_ORIGIN&&process.env.RENDER_EXTERNAL_URL)process.env.APP_ORIGINS=process.env.RENDER_EXTERNAL_URL;
const {db}=await import('../src/database.js');
if(!db.prepare('SELECT id FROM users WHERE admin=1').get()&&process.env.ADMIN_NAME&&process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){
 const {spawnSync}=await import('node:child_process');const created=spawnSync(process.execPath,['scripts/create-admin.js'],{stdio:'inherit',env:process.env});if(created.status!==0)process.exit(created.status||1);
}
if(process.env.RESET_EMAIL||process.env.RESET_PASSWORD){
 if(!process.env.RESET_EMAIL||!process.env.RESET_PASSWORD)throw Error('Defina RESET_EMAIL e RESET_PASSWORD juntos para redefinir a senha.');
 const {spawnSync}=await import('node:child_process');const reset=spawnSync(process.execPath,['scripts/reset-password.js'],{stdio:'inherit',env:process.env});if(reset.status!==0)process.exit(reset.status||1);
}
for(const key of ['ADMIN_PASSWORD','ADMIN_EMAIL','ADMIN_NAME','RESET_PASSWORD','RESET_EMAIL'])delete process.env[key];
await import('../server.js');

const {scheduleBackup}=await import('./backup-schedule.js');scheduleBackup();
