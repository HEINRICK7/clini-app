# CLINI V2 Frontend

Frontend mobile-first da CLINI, construído para a rotina do dentista e suas unidades de atendimento.

## Stack

- Next.js 16 + App Router
- React 19 + TypeScript strict
- Tailwind CSS v4 + design system próprio
- TanStack Query para estado remoto
- Zod para validação nas bordas

Ant Design não faz parte da stack. Os componentes visuais serão construídos localmente sobre os tokens da CLINI.

## Desenvolvimento

```bash
pnpm install
pnpm dev
```

Abra http://localhost:3000.

Para apontar para outra API:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1 pnpm dev
```

## Comandos

- `pnpm dev` — desenvolvimento
- `pnpm lint` — lint
- `pnpm test` — testes automatizados do boundary REST
- `pnpm test:e2e` — fluxo browser contra o Docker em execução
- `pnpm build` — build de produção
- `pnpm start` — execução do build
