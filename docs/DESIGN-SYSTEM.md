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

Os tokens vivem em `src/app/globals.css` e são expostos ao Tailwind. Componentes não devem criar novas cores diretamente sem atualizar esta fonte.

## Componentes-base

- `BrandLogo`: utiliza os arquivos oficiais de marca.
- `Button`: ações com alvo mínimo de 44px e variantes `primary`, `outline` e `ghost`.
- `Card`: superfície padrão para conteúdo agrupado.
- `Badge`: status curto e não interativo.
- `UserAvatar`: avatar circular determinístico no estilo Boring Avatars, variante `beam`, com seed estável e paleta derivada dos tokens Clini. Todo usuário exibido visualmente deve usar este componente; não usar fotos, iniciais soltas ou ícones genéricos como fallback.

Novos componentes devem ser adicionados em `src/components/ui` somente quando forem reutilizados por mais de um módulo. Componentes específicos de um domínio ficam no módulo correspondente.

## Responsividade

- Base: uma coluna, espaçamento confortável e navegação inferior quando aplicável.
- `sm`: agrupamento de informações e aumento controlado de áreas de conteúdo.
- `lg`: largura máxima de leitura e uso de colunas para comparação ou produtividade.
- Não esconder ações críticas apenas no hover; toque e teclado devem ter equivalência.

## Marca

Os assets oficiais ficam em `src/assets/brand/clini`. Para uso em páginas, preferimos o arquivo `logo-principal.png`; para espaços estreitos, usar `logo-compacto.png` ou `icon.png`.
