export const clients = [
 {id:1,name:'Marina Costa',company:'Aurora Studio',initials:'AS',color:'peach',email:'marina@example.com',phone:'(11) 90000-0001',service:'Site institucional',status:'Em andamento',origin:'Indicação',value:4800},
 {id:2,name:'Lucas Almeida',company:'Forma Arquitetura',initials:'FA',color:'blue',email:'lucas@example.com',phone:'(11) 90000-0002',service:'Landing page',status:'Proposta enviada',origin:'Instagram',value:2400},
 {id:3,name:'Beatriz Santos',company:'Botânica Natural',initials:'BN',color:'green',email:'bia@example.com',phone:'(21) 90000-0003',service:'Loja virtual',status:'Aguardando aprovação',origin:'Google',value:7200},
 {id:4,name:'Rafael Lima',company:'Nexo Consultoria',initials:'NC',color:'purple',email:'rafael@example.com',phone:'(31) 90000-0004',service:'Site institucional',status:'Novo lead',origin:'Site',value:3600}
];
export const projects = [
 {id:'CV-2026-0042',client:1,status:'Em andamento',progress:65,due:'12 nov',method:'Pix',paid:2400,value:4800,approved:false,owner:'Administradora'},
 {id:'CV-2026-0043',client:3,status:'Aguardando aprovação',progress:88,due:'09 nov',method:'Crédito',paid:7200,value:7200,approved:false,owner:'Equipe'}
];
export const tasks = [
 {id:1,title:'Solicitar os textos da página Sobre',client:1,project:'CV-2026-0042',type:'Materiais',when:'late',owner:'Equipe',done:false},
 {id:2,title:'Fazer follow-up da proposta',client:2,type:'Comercial',when:'today',owner:'Administradora',done:false},
 {id:3,title:'Conferir a versão mobile',client:1,project:'CV-2026-0042',type:'Testes',when:'today',owner:'Administradora',done:false},
 {id:4,title:'Registrar aprovação do layout',client:3,project:'CV-2026-0043',type:'Aprovação',when:'today',owner:'Equipe',done:false},
 {id:5,title:'Entrar em contato com novo lead',client:4,type:'Comercial',when:'today',owner:'Administradora',done:false},
 {id:6,title:'Preparar entrega técnica',client:3,project:'CV-2026-0043',type:'Entrega',when:'next',owner:'Equipe',done:false}
];
export const checklistLabels=['Escopo contratado conferido','Desktop testado','Mobile testado','Links e botões testados','Formulários testados','SSL e HTTPS verificados','Backups realizados','Acessos organizados'];
export const checks=Object.fromEntries(projects.map(p=>[p.id,checklistLabels.map((label,i)=>({label,done:i<3}))]));
export const history=[];
export const money=n=>new Intl.NumberFormat('pt-BR',{style:'currency',currency:'BRL'}).format(n);
