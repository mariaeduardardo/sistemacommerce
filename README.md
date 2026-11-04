# Commerce Visual — sistema interno

Aplicação modular para organizar a operação da Commerce Visual, com interface clara aprovada, usuários, CRM, projetos, checklists, financeiro, segurança/LGPD, suporte e pós-venda. Os documentos destinados ao cliente permanecem externos.

## Executar localmente

Requer Node.js 24 (validado em 24.22.1). Sem pacotes externos:

```sh
npm run check
npm test
npm run dev
```

Configure `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` com segurança no ambiente do processo e rode `npm run create-admin` para cadastrar a primeira administradora. Senha entre 12 e 128 caracteres. Não há senha padrão, conta de exemplo ou inscrição pública. Não coloque credenciais no código ou no chat. A administradora cadastra o segundo usuário e define permissões por área.

Servidor na porta 3000 (ou `PORT`). Banco em `.data/commerce.sqlite` ou `DATABASE_PATH`, sempre fora do Git. Contatos e projetos começam vazios; planos e modelos de checklist recebem os padrões alinhados com a usuária.

## Módulos

- Hoje: ações atrasadas, de hoje e próximas, filtro pessoal/equipe e atualização a cada 30 segundos; alertas derivados dos registros, sem duplicação.
- CRM: clientes, oportunidades, origem, contato, CPF/CNPJ opcional, valores, motivo de perda e interações de follow-up.
- Projetos: código CV-ANO-NÚMERO único, responsáveis, datas, próxima ação e checklist específico por serviço, preservado a partir do modelo vigente.
- Aprovações: escopo, design, layout, funcionalidades, revisão e versão final; data, canal e evidência.
- Checklist: pendente/concluído/não aplicável, responsável, data, observação e link de evidência. Não aplicável exige justificativa.
- Financeiro: valores vendidos/recebidos/saldo, confirmação manual e histórico de recebimentos.
- Segurança/LGPD: controle de acessos/2FA, tratamentos de dados e incidentes; sem campo para senhas de clientes ou decisões jurídicas automáticas.
- Garantias e manutenção: garantia na entrega, planos editáveis, valor contratado preservado e alertas de término/cobrança.
- Suporte: categorias, prioridade, responsável, solução e anexos relacionados.
- Arquivos: links e upload privado de PDF, PNG, JPEG ou TXT, até 5 MB; vínculo com projeto, aprovação ou chamado.
- Indicadores: leads, propostas, vendas, conversão, ticket, valores, origens, serviços, perdas e situação operacional; períodos predefinidos e personalizados.
- Administração: permissões por área/ação, configuração de garantia e alertas, etapas adicionais e modelos por serviço.
- Busca global, arquivamento justificado e histórico antes/depois com autoria. Registros entregues/financeiros possuem proteções adicionais.

## Regras implementadas

Pix e débito: contrato confirmado, 50% antes da criação do projeto, 50% após aprovação final. Crédito: pagamento integral antes da criação. O servidor verifica essas condições, registra valores em centavos e preserva o preço/forma após contrato ou recebimento.

Entrega exige aprovação final, valor integral recebido e itens técnicos obrigatórios concluídos ou não aplicáveis com justificativa. Administradora pode liberar exceção justificada, registrada em auditoria. Garantia padrão de 90 dias configurável; o prazo aplicado fica preservado no projeto. Duas requisições não criam o mesmo projeto: transação, sequência e índices únicos protegem a operação.

Alterações concorrentes são rejeitadas por versão do registro. Mudança de modelo não modifica checklists de projetos existentes. Mudança de preço de plano não modifica contratos de manutenção existentes. Nenhuma integração envia WhatsApp, gera contratos ou confirma pagamento bancário automaticamente.

## Segurança

Hash scrypt com salt individual, sessão aleatória com somente hash no banco, cookies HttpOnly/SameSite=Strict, validade de oito horas, logout e revogação de sessões ao mudar senha/permissões. Origem validada nas mutações; limite de corpo, entradas e tentativas de login; statements parametrizados; autorização no servidor; anexos privados servidos como download com nosniff. CPF/CNPJ e demais dados de negócio ficam no banco, que requer disco e backups protegidos pelo provedor.

Produção exige `NODE_ENV=production` e `APP_ORIGIN` HTTPS; o inicializador também reconhece `RENDER_EXTERNAL_URL`. Cookies são Secure em produção. A demonstração antiga é bloqueada em produção. A versão atual tem recuperação de senha pelo operador da hospedagem; recuperação por e-mail e MFA de login ainda não estão implementados. Os registros de 2FA dos projetos não são MFA do próprio sistema.

## Publicação e backups

Ver [docs/publicacao.md](docs/publicacao.md). Dockerfile, Compose e Blueprint Render estão incluídos. GitHub Pages sozinho não hospeda o backend. O Blueprint usa plano e disco pagos; nada é provisionado sem uma conta conectada e a confirmação da contratação no provedor.

SQLite com volume persistente atende esta versão de instância única. PostgreSQL/Prisma e Next.js da proposta inicial não foram adotados nesta implementação; o sistema usa Node.js nativo e módulos JavaScript com validação explícita. Escalar horizontalmente exige evolução do banco e da arquitetura.

`npm run backup` cria cópia consistente com anexos; `npm run restore:check -- arquivo.sqlite` verifica restauração em área temporária. Agendamento diário opcional via `BACKUP_ENABLED=true`, retenção padrão de sete cópias. Cópia externa criptografada e monitoramento do provedor ainda precisam ser configurados antes de dados reais.

## Organização

- `src/auth.js`, `src/api.js`, `src/database.js`: contas, API base e banco.
- `src/domain/catalog.js`: campos e configurações dos módulos.
- `src/domain/storage.js`: persistência, índices, modelos e auditoria detalhada.
- `src/domain/service.js`: validações e regras de negócio transacionais.
- `src/domain/queries.js`, `routes.js`: indicadores, alertas e endpoints autorizados.
- `public/js/modules/`: interface por responsabilidades; `workspace.js`: navegação.
- `scripts/`: verificação, cadastro/recuperação da conta e backups.
- `tests/`: autorização, persistência, ciclo comercial, entrega, garantia, anexos e vínculos.

Os testes usam bancos descartáveis. `/demo.html` preserva o protótipo antigo somente em desenvolvimento; ele usa dados fictícios e não deve ser confundido com a aplicação funcional em `/`.
