# CLINI V2 — Telas prontas

**Atualizado em:** 14/09/2026  
**Produto:** centrado no dentista proprietário  
**Status:** inventário do frontend disponível no workspace atual

## Regra de produto

O ator central do CLINI é o dentista. O sistema organiza pacientes, agenda, registros clínicos, finanças e os locais onde o dentista atende. `Tenant` representa o espaço de dados do dentista e `Unit` representa um local de atendimento; nenhuma clínica é o centro do domínio.

Todas as telas operacionais exigem sessão `OWNER`. A navegação foi construída mobile-first e usa o mesmo cabeçalho, contexto autenticado e navegação principal.

## Rotas prontas

| Tela | Rota | O que o dentista consegue fazer |
|---|---|---|
| Login | `/login` | Entrar com e-mail e senha; no ambiente local, preencher automaticamente o acesso de teste quando `NEXT_PUBLIC_ENABLE_TEST_LOGIN=true`. |
| Início / Dashboard | `/` | Ver pacientes ativos, atendimentos do dia, receitas liquidadas, saldo financeiro e próximos atendimentos; filtrar a visão por `Unit` ou consultar todas. |
| Agenda | `/agenda` | Criar atendimentos, criar bloqueios com ou sem `Unit`, configurar horários semanais, consultar compromissos do dia, cancelar atendimentos e autorizar encaixes quando houver conflito. |
| Pacientes | `/patients` | Cadastrar paciente, buscar, navegar por páginas, receber alerta de possível duplicidade, transferir entre `Units`, arquivar e exportar os dados. |
| Mais | `/more` | Acessar os módulos secundários listados abaixo. |

## Módulos prontos dentro de “Mais”

“Mais” é uma rota única que reúne os módulos abaixo em workspaces independentes. Eles não possuem rotas públicas separadas neste momento.

### Locais de atendimento

- Listar locais do dentista.
- Cadastrar um local com dados operacionais.
- Definir o local principal.
- Desativar sem apagar o histórico.

### Prontuário clínico — evoluções

- Selecionar paciente e local de atendimento.
- Criar evolução como rascunho.
- Fechar evolução para protegê-la contra edição silenciosa.
- Registrar retificação com nova versão e motivo obrigatório.
- Consultar histórico paginado.

### Tratamentos e procedimentos

- Criar tratamento longitudinal por paciente.
- Alterar o ciclo entre planejado, ativo e pausado.
- Planejar procedimentos livres ou vindos do catálogo.
- Registrar procedimento realizado como rascunho.
- Fechar ou retificar procedimento realizado.

### Odontograma

- Criar odontograma por paciente.
- Registrar dentes, dentição, condição, superfícies, achados e observações.
- Salvar novas versões imutáveis.
- Arquivar sem apagar o histórico.

### Documentos clínicos

- Criar documentos textuais por paciente.
- Salvar e atualizar rascunhos.
- Fechar documentos e preservar checksum SHA-256.
- Registrar retificação com motivo.
- Arquivar sem exclusão.

### Prescrições

- Criar prescrição com itens estruturados.
- Atualizar rascunhos.
- Fechar prescrição.
- Retificar com nova versão e motivo.
- Arquivar sem exclusão.

### Anexos clínicos

- Enviar PDF, JPG, JPEG, PNG ou WEBP.
- Vincular opcionalmente o arquivo a um documento.
- Consultar checksum e metadados.
- Baixar com sessão autenticada.
- Arquivar sem apagar o conteúdo armazenado.

### Catálogo de procedimentos

- Criar e editar procedimentos reutilizáveis.
- Buscar procedimentos e visualizar arquivados.
- Configurar preço e duração por local de atendimento.
- Arquivar sem exclusão.

### Financeiro operacional

- Registrar receitas e despesas.
- Vincular opcionalmente lançamento a paciente e local.
- Filtrar por status, paciente e local.
- Liquidar com forma e referência de pagamento.
- Cancelar com motivo preservado.
- Consultar resumo consolidado do espaço do dentista.

### Orçamentos e parcelas

- Criar orçamento por paciente e local.
- Usar procedimento do catálogo ou item personalizado.
- Congelar preço, quantidade e desconto no momento da criação.
- Criar parcelas opcionais.
- Aprovar, rejeitar ou cancelar preservando histórico.
- Liquidar parcelas e consultar eventos de pagamento.

### Privacidade

- Registrar solicitação de acesso, correção, avaliação de anonimização ou avaliação de eliminação legal.
- Mover solicitação para revisão.
- Concluir ou rejeitar com resolução/motivo.
- Preservar a solicitação e a auditoria.
- Exportar dados do paciente pela tela de pacientes.

### Notificações internas

- Consultar avisos direcionados ao dentista.
- Visualizar o estado não lido/lido de cada aviso.
- Marcar uma notificação como lida sem duplicar efeito.
- Receber aviso quando uma solicitação de privacidade é criada.

### Auditoria

- Consultar a trilha de ações sensíveis do espaço do dentista.
- Navegar pelos eventos paginados.
- Preservar o histórico sem edição ou exclusão operacional.

## Fora das telas prontas neste momento

- **Assinatura digital:** fora do escopo atual. Qualquer fundação técnica existente não é apresentada como funcionalidade operacional.
- **Emissão fiscal:** fora do escopo atual; não existe tela de emissão fiscal.
- **Integrações externas:** não há dependência de e-mail, WhatsApp, gateway de pagamento, contador ou ERP para os fluxos atuais.
- **Perfis de equipe:** o fluxo operacional atual é exclusivo do dentista `OWNER`.

## Evidência técnica

- Rotas: `frontend/src/app/login/page.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/agenda/page.tsx`, `frontend/src/app/patients/page.tsx` e `frontend/src/app/more/page.tsx`.
- Composição de “Mais”: `frontend/src/app/more/page.tsx`.
- Navegação e autenticação: `frontend/src/app/operational-shell.tsx` e `frontend/src/modules/auth/components/auth-gate.tsx`.
- Validação atual: build Docker, smoke test autenticado e E2E do login até o dashboard.
