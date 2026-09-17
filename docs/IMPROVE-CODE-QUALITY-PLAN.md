# Frontend — plano de qualidade

## Estado

| Fase | Status | Evidência |
|---|---|---|
| Safety net e TDD | done | 41 testes unitários incluindo regras, adapters e arquitetura |
| Separação de camadas | done | composition root e provider de serviços |
| SOLID / DIP / SRP | done | gateways injetáveis e componentes sem HTTP direto |
| Abstrações | done | um container de serviços; sem `ServiceImpl` artificial |
| CI/CD | done | push automático em `homolog`/`main`, lint, typecheck, testes e build |
| E2E completo | awaiting-evidence | exige backend, navegador e credenciais de CI |

## Critério de conclusão

O frontend pode ser alterado sem acoplar workspaces ao transporte HTTP; regras relevantes ficam em funções puras testadas, toda nova feature deve nascer com teste do comportamento, passar pelo serviço injetado e ser validada pelo pipeline.
