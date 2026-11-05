# Auditoria e correções — Margot V1.16

Data: 5 de novembro de 2026. Base: `34700ba45c51be1bae432bd93b7f04d338dd1ef8`, branch `main`. Alterações: PR #1.

## Escopo e método

Revisão dos HTML, CSS, JavaScript, persistência local, navegação, painéis, animações, autenticação cliente, dependências e workflows. Comparação com a auditoria V1.15; inspeção interativa da prévia; checagem de sintaxe, IDs, âncoras e recursos; testes de regressão nos três motores de navegador. A matriz usa movimento normal e reduzido e inclui larguras mobile de 320 a 700 px, paisagem e desktop.

O catálogo continua demonstrativo e o site não processa pagamentos nem confirma pedidos. Preservadas identidade visual, imagens, categorias e configuração pública do Firebase.

## Defeitos corrigidos

| Prioridade | Problema observado no código anterior | Correção | Validação correspondente |
|---|---|---|---|
| Alta | Adicionar além de 99 unidades fazia o item desaparecer na recarga | Limite único de 99 e recuperação de sacolas antigas acima do limite | Adição no limite, recarga, quantidade antiga 100 e subtotal |
| Alta | Deploy podia publicar commits com testes reprovados | Job de publicação depende da matriz de testes | Dependência explícita `needs: test` no workflow |
| Média | Exceção síncrona no fallback de cópia escapava do tratamento | `async/try/catch`, limpeza em `finally` e restauração do foco | Clipboard disponível, ausente, negado e fallback que lança erro |
| Média | Favoritar recriava o catálogo e perdia o foco | Atualização do botão existente e de `aria-pressed` | Teclado, foco e persistência após recarga |
| Média | Selecionar filtro recriava o próprio botão focado | Filtros estáveis com atualização de estado | Foco e histórico voltar/avançar |
| Média | Alterar quantidade ou remover item destruía o controle focado | Restauração para controle equivalente, próximo item ou botão de fechar | Incremento e remoção da última peça |
| Média | Fundo da sacola permanecia navegável apesar de `aria-modal` | Fundo inerte enquanto o painel está aberto, com restauração do estado anterior | Inércia, Escape e reabertura do menu |
| Média | Abertura pelo mobile dependia de foco indireto do botão oculto do desktop | Atalho de origem passado explicitamente ao painel | Retorno ao atalho da barra inferior |
| Média | Animação ocultava temporariamente o botão de fechar já focado | Animar apenas o texto do cabeçalho do painel | Verificação de foco com movimento normal |
| Média | Carrossel automático não oferecia pausa persistente explícita; setas podiam deixar foco no slide inerte | Controle Pausar/Reproduzir e foco nos controles ao mudar via teclado | Passagem simulada de tempo e navegação por setas |
| Baixa | Escape não fechava a busca mobile | Fechamento e retorno ao atalho | Pesquisa vazia e Escape |
| Baixa | Clique no espaço interno do diálogo de conta o fechava | Verificação dos limites reais do diálogo antes de fechar pelo fundo | Clique na área interna e Escape |
| Baixa | Painel em telas baixas podia comprimir os itens e dificultar alcançar controles | Rolagem do painel e altura mínima da área dos itens | Paisagem 667 × 320 |

## Robustez e manutenção

- GSAP e ScrollTrigger 3.15.0 são servidos pelo site a partir de arquivos originais do pacote npm, preservando cabeçalhos de licença. Os testes usam essas mesmas bibliotecas reais; também verificam o funcionamento sem elas.
- Lockfile incluído; CI usa `npm ci`.
- `scripts/build-static.cjs` publica uma lista explícita de arquivos em `dist/`; testes, dependências de desenvolvimento e documentação não são enviados ao Pages.
- Código SVG de produtos que não era mais utilizado foi removido. Documentação atualizada para fotos WebP e Firebase configurado.
- Checagem local automática de sintaxe, IDs duplicados, âncoras e recursos do HTML.
- Relatórios, screenshots e traces de falhas são preservados no Actions por sete dias.

## Evidência e limites

- `npm run check`, `npm run build` e `git diff --check`: aprovados localmente.
- Prévia interativa: adição de produto, incremento de quantidade, subtotal de R$ 29,80 para duas unidades de R$ 14,90, isolamento do painel e mensagem de cópia bem-sucedida observados.
- A execução e o resultado final da matriz estão vinculados ao PR: https://github.com/K410Sh4/Margot/pull/1. O resultado deve ser conferido no commit final, não em execuções intermediárias.
- Os testes de interface bloqueiam as importações externas do Firebase para tornar falhas e estados locais reproduzíveis. Não equivalem a um login Google real.
- Não foram acessados o console Firebase, regras remotas, usuários, quotas ou domínios autorizados. Compatibilidade real de login em Android/iOS e eventual alternativa por redirecionamento permanecem pendentes de validação específica.
- WebKit automatizado não equivale a testar um iPhone físico; teclado virtual e preferências de ampliação do sistema não estão certificados.
- SEO adicional, ajuste amplo de tipografia e preparação comercial não são defeitos funcionais corrigidos por este patch.

## Publicação e reversão

O workflow de `main` executa novamente os testes antes de publicar. Para reverter, reverta o PR pelo GitHub e aguarde o mesmo pipeline; não é necessário apagar histórico ou dados do navegador. A estrutura de armazenamento continua usando as chaves existentes `margot-cart` e `margot-favorites`.
