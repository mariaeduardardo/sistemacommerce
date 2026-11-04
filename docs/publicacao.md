# Publicação da Commerce Visual

## Onde o sistema pode rodar

GitHub guarda o código. GitHub Pages não executa Node.js, sessões ou banco de dados; não serve como hospedagem desta aplicação completa. O domínio da Hostinger pode permanecer sem alterações.

A aplicação pode rodar em uma única instância Node.js 24 com disco persistente ou no contêiner Docker incluído. Ela usa SQLite transacional; não provisionar múltiplas instâncias com arquivos de banco independentes. PostgreSQL é a evolução recomendada se houver necessidade de múltiplas instâncias, não está implementado nesta versão.

## Opção com endereço temporário: Render

O arquivo `render.yaml` descreve um Web Service Docker com disco persistente. O plano `starter` e o disco são pagos; confira os valores atuais no provedor antes de confirmar a criação. Nenhum serviço externo foi contratado automaticamente.

1. Na conta Render, conectar este repositório GitHub e criar um Blueprint a partir de `render.yaml` (ou Web Service Docker equivalente).
2. Preencher `ADMIN_NAME`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` no formulário seguro do provedor. Senha de 12 a 128 caracteres, sem compartilhá-la pelo chat.
3. O serviço usa o endereço HTTPS temporário fornecido pela Render (`RENDER_EXTERNAL_URL`) como origem. Não é necessário configurar o domínio da Hostinger.
4. Confirmar disco persistente montado em `/var/data`, instância única e variável `DATABASE_PATH=/var/data/commerce.sqlite`.
5. Após o deploy, abrir o endereço mostrado pelo provedor, entrar com a administradora e criar o segundo usuário. Remover as três variáveis de bootstrap após validar o acesso; a conta já estará persistida.
6. Conferir login/logout, permissões do segundo usuário, cadastro persistente após reinício do serviço, anexos e backup/restauração.

O bootstrap não substitui contas já existentes. Sem as variáveis e sem uma administradora cadastrada, o serviço pode iniciar, mas ninguém consegue entrar.

## VPS existente

`deploy/compose.yaml` mantém a porta 3000 acessível apenas no loopback da VPS. Configure um proxy reverso com TLS válido e informe `APP_ORIGIN` com a origem HTTPS exata. Mantenha o volume `commerce-data` e execute apenas uma instância. Não altere o domínio principal sem autorização.

## Backups e recuperação

`npm run backup` usa a API nativa de backup do SQLite, inclui os anexos privados no banco e verifica integridade. Por padrão salva em `backups` ao lado do banco e conserva sete cópias. `BACKUP_DIR` e `BACKUP_RETENTION` são configuráveis.

Com `BACKUP_ENABLED=true`, o processo de produção cria um backup após um minuto e a cada 24 horas enquanto estiver rodando. Falhas são registradas em stderr. Configure monitoramento desses logs no provedor.

Backups no mesmo disco protegem contra erros de dados, mas não contra perda do volume. Antes de dados reais, configurar cópia externa criptografada/snapshot do disco no provedor, retenção e teste periódico. O sistema não tem acesso a uma conta externa de armazenamento nesta sessão.

Verificar um backup sem alterar dados ativos:

```sh
npm run restore:check -- /caminho/do/backup.sqlite
```

Para restaurar de verdade: parar a aplicação, preservar o banco atual e seus arquivos WAL/SHM, restaurar uma cópia validada no caminho de `DATABASE_PATH` com permissões restritas e reiniciar. Não sobrescrever um banco em uso. Solicitar apoio técnico para esse procedimento.

Se necessário, `scripts/reset-password.js` recupera uma conta a partir de `RESET_EMAIL` e `RESET_PASSWORD` definidos com segurança no console da hospedagem, revoga sessões e registra a operação. Não há recuperação automática por e-mail nem MFA de login nesta versão.

## Limites da publicação nesta sessão

Há Git por HTTPS disponível. A chamada à API `api.github.com` foi bloqueada pelo proxy com HTTP 403. Não há conta/credencial Render conectada nem ferramenta para criar serviço de hospedagem ou prévia interativa no chat. Uma compilação Docker local não equivale a site publicado.
