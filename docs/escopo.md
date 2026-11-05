# Alinhamento funcional

- Sistema exclusivamente interno: sem geração ou envio automático de documentos, decisões jurídicas ou mensagens WhatsApp.
- Dois usuários iniciais; administradora controla permissões por área e ação.
- Interface clara inspirada na referência fornecida: barra lateral, cartões arredondados, fundo suave e amarelo #FFDF00.
- Entrada principal: Hoje, com atrasadas, hoje e próximas; filtros de responsável.
- Cadastros começam do zero.
- Pix e débito: contrato confirmado e entrada de 50% antes de criar projeto. Saldo de 50% após aprovação do cliente e antes da finalização técnica.
- Crédito: contrato e valor integral confirmados antes de criar projeto. Sem controle das parcelas do cartão.
- Entrega definitiva: aprovação, pagamento integral e checklist técnico obrigatório concluído. Futura exceção só por administradora, com justificativa auditada.
- Garantia padrão de 90 dias a partir da entrega; configurável, com período aplicado preservado.
- Financeiro: vendido, recebido, saldo e manutenção; confirmações manuais.

## Implementação posterior ao protótipo

Next.js/TypeScript, PostgreSQL/Prisma, autenticação com hash e sessões revogáveis, permissões no servidor, uploads privados, auditoria persistente e rotinas de alertas. Implementar CRM e projetos, checklists versionados por serviço, aprovações, LGPD/acessos/incidentes, garantias, manutenção, suporte, indicadores e busca. Validar concorrência dos IDs CV-ANO-NÚMERO, gates de entrega e isolamento das permissões. Preparar HTTPS, backups e restauração antes de produção.

## Base funcional implementada

Login, sessões, criação de usuários pela administradora, autorização no servidor, contatos com edição, tarefas com datas reais e auditoria persistente estão disponíveis em `/`. Para esta etapa local foi escolhido SQLite nativo do Node 24, sem dependências externas. PostgreSQL e a arquitetura final continuam pendentes antes da produção. Não confundir a implementação local de contatos/tarefas com a conclusão do escopo total.

## Implementação integrada

A interface funcional em `/` agora inclui os módulos descritos no README, com regras de contrato/pagamento, projeto, aprovação, entrega e garantia no servidor. A arquitetura efetiva é Node.js 24 nativo + SQLite persistente + módulos JavaScript, em instância única. O pacote Docker/Render prepara publicação com endereço temporário, sem alterar o domínio. A publicação externa e a incorporação interativa no chat dependem de infraestrutura/acesso que não estão conectados nesta sessão. Backups externos e configuração final do provedor permanecem pendentes.
