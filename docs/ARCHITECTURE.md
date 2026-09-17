# Frontend — arquitetura e dependências

## Regra de dependência

O App Router e os componentes de apresentação dependem de serviços de aplicação; eles não importam adapters HTTP, `fetch` ou `ApiError` diretamente.

```text
UI / App Router
       ↓
CliniServicesProvider + contratos de aplicação
       ↓
adapters HTTP e gateways
       ↓
backend REST
```

O composition root fica em `src/app/services.ts`. A infraestrutura é montada uma vez e injetada por `src/app/service-container.tsx`, permitindo substituir serviços por fakes em testes sem alterar os workspaces.

## Responsabilidades

| Camada | Responsabilidade | Regra |
|---|---|---|
| `src/modules/*/application` | regras de navegação, calendário, autenticação e contratos | não conhece React nem HTTP |
| `src/modules/*/components` | estado visual, interação e apresentação | não importa adapters HTTP |
| `src/modules/*/api.ts` e `*-api.ts` | schemas Zod e chamadas REST | detalhe substituível |
| `src/lib/api` | transporte, CSRF, cookies e Problem Details | detalhe de infraestrutura |
| `src/app/services.ts` | composição das implementações | único ponto de montagem |

## Decisões

- A criação de um container único foi preferida a dezenas de classes `ServiceImpl`: existe variação real para testes e a composição fica explícita.
- As regras de aplicação existentes continuam em funções puras testáveis, como autenticação, calendário, dinheiro, parcelas, preços de catálogo e composição da evolução clínica.
- Um teste arquitetural impede que componentes voltem a importar `@/lib/api/client` ou módulos `api` diretamente.

## Pendências controladas

- Extrair os schemas de resposta para contratos próprios só será feito quando houver necessidade de compartilhar o mesmo contrato fora do adapter HTTP; hoje o container já evita o acoplamento da UI.
- Cobertura E2E depende de um backend disponível no ambiente de CI e permanece separada dos testes unitários.
