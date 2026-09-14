# CLINI — Design system

## Princípio

O design system traduz a marca CLINI para uma interface de trabalho rápida, clara e confortável no smartphone. A identidade usa o azul-marinho e o ciano presentes nos arquivos oficiais de `src/assets/brand/clini`.

## Tokens iniciais

- `brand-navy`: identidade e títulos de maior destaque.
- `brand-cyan`: detalhes e estados de apoio.
- `primary`: ação principal e foco da interface.
- `surface`: cartões, formulários e áreas de leitura.
- `surface-muted`: estados de hover, áreas auxiliares e separação visual.
- `border`: separação discreta entre áreas.
- `foreground` e `muted-foreground`: hierarquia de texto.
- `title-weight`: peso 800 para títulos de página e seção.
- `section-title-weight`: peso 700 para títulos menores de conteúdo.
- `subtitle-weight`: peso 600 para o parágrafo imediatamente posterior ao título, usado como subtítulo/contexto.

Os tokens vivem em `src/app/globals.css` e são expostos ao Tailwind. Componentes não devem criar novas cores diretamente sem atualizar esta fonte.

## Componentes-base

- `BrandLogo`: utiliza os arquivos oficiais de marca.
- `Button`: ações com alvo mínimo de 44px e variantes `primary`, `outline` e `ghost`.
- `Card`: superfície padrão para conteúdo agrupado.
- `Badge`: status curto e não interativo.
- `UserAvatar`: wrapper do pacote oficial `boring-avatars`, com variante global `beam`, seed determinística (`id`, e-mail ou nome) e paleta hex derivada dos tokens CLINI. Todo usuário exibido visualmente deve usar este componente; não usar fotos, iniciais soltas ou ícones genéricos como fallback.

### Hierarquia tipográfica

Títulos `h1` e `h2` usam peso 800 e line-height compacto; títulos `h3` usam peso 700. O primeiro parágrafo após qualquer título recebe peso 600 como subtítulo/contexto, salvo quando o componente declara explicitamente outro peso. O corpo de texto continua regular para preservar leitura e contraste de hierarquia.

Novos componentes devem ser adicionados em `src/components/ui` somente quando forem reutilizados por mais de um módulo. Componentes específicos de um domínio ficam no módulo correspondente.

## Responsividade

- Base: uma coluna, espaçamento confortável e navegação inferior quando aplicável.
- `sm`: agrupamento de informações e aumento controlado de áreas de conteúdo.
- `lg`: largura máxima de leitura e uso de colunas para comparação ou produtividade.
- Não esconder ações críticas apenas no hover; toque e teclado devem ter equivalência.

## Marca

Os assets oficiais ficam em `src/assets/brand/clini`. Para uso em páginas, preferimos o arquivo `logo-principal.png`; para espaços estreitos, usar `logo-compacto.png` ou `icon.png`.
