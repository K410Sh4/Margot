# Margot Acessórios — Vitrine V1

Template responsivo inspirado no layout delicado escolhido para a Margot: tons rosados, dourado e pérola. Publicação estática pelo **GitHub Pages**; sem servidor, API paga, biblioteca ou build obrigatório.

## Abrir e publicar

- Abra `index.html` no navegador para conferir o layout.
- GitHub: **Settings → Pages → Build and deployment → Source: GitHub Actions** (configuração única). O workflow `.github/workflows/pages.yml` publica a branch `main` quando atualizado.
- Endereço previsto depois do deploy: `https://k410sh4.github.io/Margot/`.

## Como trocar os produtos

Em `store.js`, edite a lista `STORE.products`. Cada item possui `id` (único e estável), `name`, `category`, `price` e `art`. Os artigos são **fictícios, com preços ilustrativos**; confirme todos antes de permitir pedidos comerciais.

Para adicionar fotos reais numa próxima versão, acrescente `image: './assets/products/arquivo.webp'` aos produtos e adapte `renderProducts()` e a miniatura da sacola para usar `<img>` com `alt` apropriado e fallback para `jewelrySvg(...)`. Guarde arquivos dentro de `assets/products/`, preferindo WebP/AVIF, proporção quadrada, boa resolução e tamanho otimizado.

## Comportamento atual

- Busca, filtros, favoritos e sacola funcionam em navegador; favoritos e sacola usam `localStorage`.
- Botão **Copiar lista de interesse** prepara uma mensagem, mas **não envia WhatsApp, confirma pedido, cobra pagamento nem sincroniza estoque**. Esses recursos serão conectados somente com dados reais de atendimento.
- Ilustrações vetoriais são provisórias; o banner é uma composição CSS, não uma foto real.
- Sem promessas de frete grátis, parcelamento ou políticas que ainda não foram definidas.

## Próximos passos antes de abrir as vendas

1. Substituir itens demonstrativos por produtos reais, estoque, valores e fotos.
2. Definir contato oficial, endereço comercial/identificação da loja, frete, atendimento, trocas, devoluções e privacidade.
3. Testar dispositivos móveis, acessibilidade e fluxos com produtos reais.
4. Implementar pedidos via WhatsApp ou checkout e regras de estoque, se desejado.

A página é um **template em pré-lançamento**, não uma loja operacional. Não armazena dados de pagamento.


## Atualização V1.1 — imagens de produtos e presentes

- `assets/foto-em-breve.webp`: imagem provisória padrão utilizada em **todos os cards de produtos** e nas miniaturas da sacola e favoritos. Categorias continuam com ícones vetoriais próprios.
- `assets/presentes-margot.webp`: foto fornecida para a faixa **Presenteie com Elegância**. O layout adapta a imagem horizontal em celulares.
- Quando uma foto real estiver disponível, adicione ao produto em `STORE.products` o campo `image: './assets/products/nome-da-foto.webp'`. O site passará a mostrar a foto real nesse produto e manterá a imagem provisória nos demais.
- Arquivos de imagem com caminho inválido voltam automaticamente para o placeholder.
- Os dados do catálogo ainda são ilustrativos, e o site não processa pagamentos.


## Carrossel V1.2

As três imagens `assets/hero-1.webp`, `hero-2.webp`, `hero-3.webp` são os banners fornecidos. O carrossel tem controles, indicadores, pausa por interação e respeita movimento reduzido. Para publicar, envie todos os arquivos à raiz do repositório preservando os caminhos.

## Identidade da marca V1.3

- `assets/margot-logo.webp`: logo oficial fornecida, exibida no cabeçalho, na assinatura da página e no rodapé.
- `assets/favicon-32.png`: ícone com pérola para a aba do navegador.
- O SVG antigo `pearl-mark.svg` foi descontinuado. O carrossel, o catálogo e a seção de presentes permanecem iguais.


## Atualização V1.4 — categorias com fotografias ilustrativas

As cinco categorias agora usam imagens próprias em `assets/categories/` (brincos, colares, pulseiras, anéis e kits), recortadas da arte aprovada. Os cards continuam clicáveis e filtram os produtos. Textos já estão nas imagens; o botão também possui rótulo acessível. Em celulares a faixa pode rolar horizontalmente.

## V1.5 — animações GSAP e transições

- Scripts versionados do **GSAP 3.15.0** e **ScrollTrigger** carregados com `defer` por CDN jsDelivr. `motion.js` coordena a animação.
- Entrada suave da logo, navegação e textos do carrossel; revelação por rolagem dos benefícios, categorias, produtos, presentes e rodapé.
- Microinteração nos cards e no botão de adicionar à sacola; animações leves no menu móvel e cabeçalho da sacola.
- Animações progressivas: se CDN estiver indisponível, imagens, textos, filtros, botões e carrinho continuam visíveis e funcionais.
- Respeita `prefers-reduced-motion: reduce`; nada de animação forçada, fixação no scroll ou bloqueio de interação.
- Quando produtos são filtrados ou pesquisados, os novos cards recebem animações sem acumular gatilhos antigos.

**Nota:** a vitrine continua demonstrativa. Nenhum recurso de pagamento, estoque real ou entrega foi adicionado.
