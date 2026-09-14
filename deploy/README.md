# Deploy do frontend Clini

O workflow publica `ghcr.io/heinrick7/clini-app` e, após os testes, atualiza
somente o serviço `frontend` do Compose no ambiente correspondente.

- Push em `homolog`: deploy de homologação com preenchimento de acesso de teste.
- Push em `main`: deploy de produção sem credenciais de teste.

O Compose inclui o backend e as dependências para que a primeira publicação do
frontend possa iniciar o stack. O backend deve ser publicado primeiro na VPS.

Crie `/opt/clini/homolog/.env` e `/opt/clini/main/.env` na VPS conforme a
documentação de `backend/deploy/README.md`. Use portas diferentes quando os
dois ambientes estiverem no mesmo servidor.

Cadastre nos dois repositórios os secrets `VPS_HOST`, `VPS_USER`,
`VPS_PORT` (opcional), `VPS_SSH_PRIVATE_KEY`, `VPS_KNOWN_HOSTS`,
`VPS_DEPLOY_PATH_HOMOLOG` e `VPS_DEPLOY_PATH_MAIN`.

O workflow usa o `GITHUB_TOKEN` temporário para autenticar no GHCR, sem token
permanente na VPS.

O frontend usa o proxy same-origin `/api/v1`, então o navegador não precisa
conhecer a porta interna do backend. Para o endereço público da API, use o
host `api` no Caddy; para o app, use o host `app`.
