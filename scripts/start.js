// Production entry point. Bootstrap credentials are read only from secure environment bindings.
if(!process.env.APP_ORIGIN&&process.env.RENDER_EXTERNAL_URL)process.env.APP_ORIGIN=process.env.RENDER_EXTERNAL_URL;
const {db}=await import('../src/database.js');
if(!db.prepare('SELECT id FROM users WHERE admin=1').get()&&process.env.ADMIN_NAME&&process.env.ADMIN_EMAIL&&process.env.ADMIN_PASSWORD){
 const {spawnSync}=await import('node:child_process');const created=spawnSync(process.execPath,['scripts/create-admin.js'],{stdio:'inherit',env:process.env});if(created.status!==0)process.exit(created.status||1);
}
for(const key of ['ADMIN_PASSWORD','ADMIN_EMAIL','ADMIN_NAME'])delete process.env[key];
await import('../server.js');

const {scheduleBackup}=await import('./backup-schedule.js');scheduleBackup();
