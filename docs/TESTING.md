# Frontend — estratégia de testes

## Pirâmide atual

1. Regras puras e casos de uso: autenticação, redefinição, calendário e apresentação do dashboard.
2. Adapters críticos: cliente HTTP, schemas e tratamento de erros.
3. Arquitetura: teste de dependências entre apresentação e infraestrutura.
4. E2E real: fluxos dourados, falhas adversas, crawler, acessibilidade e visual em `tests/`, sempre com login e dados criados pela API real.

O Playwright roda nos viewports `1440x900`, `768x1024`, `375x812` e `390x844`. A fixture falha o teste quando encontra erro de console, `pageerror` ou resposta HTTP 5xx não explicitamente esperada pelo cenário adverso.

## Comandos obrigatórios

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
CLINI_FRONTEND_URL=http://localhost:4173 CLINI_E2E_EMAIL=... CLINI_E2E_PASSWORD=... pnpm exec playwright test --workers=1
```

O CI executa lint, typecheck, testes unitários e build antes de publicar a imagem. Depois do deploy em `homolog`, o job `E2E real homologation` executa a suíte contra o ambiente publicado e anexa traces, screenshots, vídeo e JUnit quando houver falha. Os cenários de rede offline/500 usam fault injection explícito apenas para validar recuperação da interface; os fluxos de negócio usam PostgreSQL e APIs reais.

Nenhuma regra visual é considerada coberta apenas por snapshot: o visual é acompanhado por `tests/visual-regression.spec.ts`, enquanto os fluxos de negócio validam persistência, histórico e contrato observável.

## Dados de execução

- O usuário usado nos E2E é informado por `CLINI_E2E_EMAIL` e `CLINI_E2E_PASSWORD`; credenciais não são versionadas.
- Cada cenário cria sua unidade, paciente e procedimento de catálogo com identificadores únicos e não depende de nomes pré-existentes.
- O job de homologação exige essas credenciais como secrets do environment `homolog`; ausência delas falha o job explicitamente.
