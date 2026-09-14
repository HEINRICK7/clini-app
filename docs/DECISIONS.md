# CLINI V2 Frontend — Decisões técnicas iniciais

Status: fundação, sessão com contexto persistido, shell operacional por rotas e telas de `Tenant/Unit`, `Patient/MPI`, `Agenda`, dashboard operacional, núcleo de `Clinical Record`, `Treatment`, `Odontogram`, documentos clínicos textuais, prescrições, anexos binários, exportação e solicitações de privacidade, notificações internas, catálogo de procedimentos, vínculo opcional catálogo→Treatment e financeiro implementadas; assinatura digital está fora do escopo atual.

## Direção arquitetural

- Next.js com App Router e TypeScript.
- Frontend e backend são projetos separados e se comunicam por REST.
- Organização inicial por domínio dentro de `src/modules`, sem criar um módulo de negócio antes do contrato correspondente.
- Componentes visuais compartilhados ficam em `src/components`; regras de cada módulo ficam no próprio módulo.
- O frontend nunca decide autorização: ele consome o estado autenticado e as capabilities retornadas pelo backend.
- O contexto inicial da sessão usa Units/status/timezone e capabilities retornados pelo backend; nenhuma capability é criada localmente.
- Uploads usam `FormData`, limites de tamanho e MIME permitidos; downloads passam pela API autenticada e não usam URLs públicas ou storage direto no navegador.
- Exportação de dados usa download autenticado e dispara pelo cartão do paciente; o frontend não interpreta nem altera o pacote JSON retornado pelo backend.
- Catálogo usa valores monetários em centavos no contrato e converte somente para apresentação em R$ no formulário mobile; o frontend não decide status nem autorização.
- O planejamento de Treatment oferece o catálogo ativo da Unit selecionada, mas mantém entrada livre opcional; o nome enviado pelo catálogo é preservado como snapshot clínico.
- O financeiro apresenta resumo consolidado do Tenant e permite filtrar a listagem por status, Unit e Patient; valores são digitados em R$ e enviados ao backend em centavos.
- O formulário separa o vínculo opcional do novo lançamento dos filtros da listagem, evitando alterações de consulta por efeito colateral.
- Orçamentos são apresentados como fluxo opcional do financeiro: o formulário envia valores em centavos, permite procedimento do catálogo ou item livre, exige justificativa para desconto e mostra o total capturado sem recalcular histórico.
- A liquidação envia forma de pagamento, referência opcional e `Idempotency-Key` gerada por operação para que retries de rede não criem outro pagamento.
- O parcelamento é opt-in: a tela gera valores em centavos com distribuição do resto e vencimentos mensais, mostra status/histórico e só oferece liquidação de parcela em orçamento aprovado.
- A área de privacidade registra pedidos para revisão do OWNER, apresenta resolução e status preservados e não oferece exclusão direta de dados clínicos.
- A área de notificações apresenta pendências internas do OWNER, filtra não lidas e marca cada item como lido sem duplicar efeitos.
- Assinatura digital não é oferecida no fluxo operacional atual; integridade de documentos continua sendo tratada por versionamento e checksum, sem apresentar isso como assinatura.
- O dashboard inicia consolidado para o dentista e oferece filtro explícito de Unit; a Unit selecionada fica visível e não altera a autoridade da sessão.
- A área operacional é renderizada dentro de um `AuthGate` que valida `/auth/me`, redireciona sessões inválidas para `/login` e exibe o dentista autenticado; isso melhora o fluxo e não substitui a autorização do backend.
- Mobile first: smartphone é o cenário principal; tablet e desktop recebem progressão de layout.
- A shell operacional separa `dashboard`, `agenda`, `patients` e `more` em rotas reais; cada rota carrega somente seus workspaces, mantendo `AuthGate`, sessão e navegação compartilhados.

## Stack adotada

- Next.js 16.
- React 19.
- TypeScript em modo strict.
- Tailwind CSS v4 para tokens e composição visual.
- Design system próprio, com tokens CSS e componentes locais; não usaremos Ant Design.
- TanStack Query para estado remoto e cache.
- Zod para validação de payloads nas bordas da aplicação.
- `clsx` + `tailwind-merge` para composição segura de classes.

## Regras de experiência

- Alvos de toque com pelo menos 44px de altura.
- Navegação principal acessível por polegar em telas pequenas.
- Formulários com uma coluna por padrão e agrupamento progressivo em telas maiores.
- Estados de carregamento, vazio, erro e sucesso fazem parte de cada módulo.
- Conteúdo clínico não será persistido no navegador além do necessário para a interação atual.
- Mensagens de erro para o usuário não expõem detalhes internos da API.

## Contrato com o backend

- Base da API: `/api/v1`.
- Erros seguem Problem Details.
- O frontend envia `X-Request-Id` quando houver rastreamento de uma operação e respeita o contexto de Tenant/Unit devolvido pelo backend.
- Paginação, filtros e enums serão consumidos conforme o contrato OpenAPI versionado.
- `NEXT_PUBLIC_API_BASE_URL` controla a URL pública da API; o valor padrão local é `http://localhost:8080/api/v1`.

## Estrutura para módulos

```text
src/
├── app/                  # rotas e composição do App Router
├── components/           # componentes visuais compartilhados
├── lib/                  # infraestrutura do frontend (API, utilitários)
└── modules/              # agenda, pacientes, autenticação, unidades etc.
```

O módulo de login foi o primeiro módulo funcional. `Tenant/Unit`, `Patient/MPI`, `Agenda`, evolução clínica versionada, Treatment, Odontogram, documentos clínicos textuais e prescrições foram entregues em ciclos verticais dentro do mesmo contexto clínico.
