# Frontend — estratégia de testes

## Pirâmide atual

1. Regras puras e casos de uso: autenticação, redefinição, calendário e apresentação do dashboard.
2. Adapters críticos: cliente HTTP, schemas e tratamento de erros.
3. Arquitetura: teste de dependências entre apresentação e infraestrutura.
4. E2E: fluxo de login até dashboard em `tests/auth-dashboard.spec.ts`, executado quando o ambiente disponibiliza navegador e API.

## Comandos obrigatórios

```bash
pnpm lint
pnpm typecheck
pnpm test
pnpm build
```

O CI executa os quatro comandos antes de publicar a imagem. Nenhuma regra visual deve ser considerada coberta apenas por snapshot; fluxos de negócio devem ser testados pelo comportamento observável.

## Gaps conhecidos

- A cobertura de componentes React ainda é menor que a cobertura de regras e adapters.
- O E2E depende de credenciais e backend do ambiente, por isso não é executado no job unitário sem configuração explícita.
