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

## V1.6 — loja exclusivamente online

- Barra superior e aviso próximo às categorias informam que **não há loja física aberta ao público**.
- Rodapé reforça a operação pela internet e o status de pré-lançamento.
- A definição correta é **loja online**; marketplace, em sentido estrito, é uma plataforma que reúne vários vendedores.
- Não foram ativadas compras, checkout ou atendimento que ainda não estejam operacionais.


## V1.7 — Cadastro e login com Google (integração preparada)

A navegação e sacola continuam acessíveis sem cadastro. Há um botão de conta no cabeçalho, janela de entrada/cadastro Google, visualização do perfil e logout. O primeiro acesso via Google cria a conta no Firebase; os demais restauram a sessão.

IMPORTANTE: firebase-config.js contém configuração pública de um projeto Firebase Web. Para o login funcionar, o provedor Google e o domínio precisam estar autorizados no Firebase Console; valide a autenticação no navegador.

### Ativação pelo responsável da loja

1. Acesse https://console.firebase.google.com e crie um projeto para a Margot. Adicione um aplicativo Web e copie a configuração Web pública.
2. No Firebase Console, em Authentication > Sign-in method, habilite Google, escolha o e-mail de suporte solicitado e salve.
3. Em Authentication > Settings > Authorized domains, adicione k410sh4.github.io (sem https:// e sem o caminho /Margot). Adicione também qualquer domínio próprio, caso mude futuramente.
4. Em firebase-config.js, substitua null pelo objeto firebaseConfig do projeto, com apiKey, authDomain, projectId, appId e demais campos opcionais fornecidos pelo console.
5. Antes de ativar para clientes, finalize privacidade.html com contato oficial para solicitações sobre dados, e revise as informações de privacidade e consentimento.
6. Publique na branch main. Teste criação de conta, login, persistência de sessão e logout em computador e celular.

Não publique service-account JSON, chaves privadas, Google OAuth client_secret, tokens ou senhas. A configuração Firebase Web é pública, não confere acesso administrativo. Caso seja acrescentado backend/Firestore, ele exigirá verificação de tokens e regras de acesso independentes.

Tecnologia: Firebase JavaScript SDK 13.2.0, carregado da origem oficial gstatic somente quando o Firebase estiver configurado. Autenticação por janela Google aberta por clique, sem exigir cadastro para ver o catálogo. O site não sincroniza sacola, favoritos ou pedidos e não processa pagamento.


## Logo oficial — atualização

A antiga imagem de logo (169 × 102 px e letras pretas) foi substituída pela versão oficial fornecida pela marca, com letras douradas, pérola e ornamentos. O arquivo assets/margot-logo.webp foi produzido por recorte e transparência da arte original (sem redesenhar símbolo ou texto). Ele aparece no cabeçalho, rodapé, assinatura e janela de login. O favicon foi recortado da arte original do emblema.


## V1.10 — cabeçalho compacto com vidro fosco

Quando a página é rolada, o cabeçalho reduz a logo e recolhe a navegação completa. O menu de categorias e a busca passam a ser abertos por ícones; conta Google, favoritos e sacola continuam acessíveis. O fundo utiliza transparência e backdrop-filter com opção opaca para navegadores incompatíveis. Em celulares a barra fica ainda menor. Sem GSAP, a lógica continua funcionando, e a preferência por movimento reduzido desativa transições.


## V1.11 — Navegação mobile

Até 700 px: barra inferior de cinco atalhos (Início, Coleções, Buscar, Favoritos, Sacola), com indicadores de seção e contadores sincronizados com o catálogo existente. O cabeçalho mostra logo oficial, menu e conta Google, sem duplicar ícones. O menu de coleções funciona como painel acessível com fundo escurecido, fechamento por toque externo, Escape, botão fechar e gerenciamento de foco. A busca reutiliza o controle existente, e os atalhos acionam a mesma lógica dos favoritos e da sacola. Compatível com cabeçalho compacto, áreas seguras de celulares com notch e preferência por movimento reduzido. Desktop não é alterado.


## V1.12 — Auditoria e correções mobile

- O menu de categorias é um diálogo modal apenas no mobile, com semântica acessível e foco isolado. Os elementos atrás do menu ficam temporariamente inertes, e seus estados anteriores são restaurados ao fechar.
- A barra inferior é bloqueada e coberta pelo fundo escurecido enquanto o menu estiver aberto. O cabeçalho e o painel ficam acima desse fundo.
- O botão Buscar espelha o estado real do cabeçalho, inclusive quando outras ações fecham a pesquisa. O campo também fecha ao tocar fora.
- Início/Coleções só são destacados no trecho correspondente da página; produtos e rodapé não deixam Coleções permanentemente ativo.
- Adicionado viewport-fit=cover para suportar safe-area-inset em iOS. Transições continuam respeitando movimento reduzido.
- Nenhuma mudança em Firebase, dados de pedidos ou lógica de carrinho/favoritos.


## V1.13 — correção de atualização de seção e filtro

- A categoria selecionada passa a fazer parte da URL pública, por exemplo: ?categoria=Brincos#produtos.
- Ao atualizar, compartilhar a URL ou usar Voltar/Avançar, os filtros do catálogo são restaurados.
- Início, Coleções, Kits e Destaques recebem destaque dinâmico no menu superior conforme a seção visível. No catálogo, a categoria filtrada é destacada; "Destaques" redefine para Todos.
- A barra inferior acompanha a mesma navegação. Pesquisa de texto não altera a URL nem cria entradas desnecessárias no histórico.
- A correção não modifica os dados, o checkout ou a autenticação Google.


## V1.14 — estabilidade visual mobile

- Cabeçalho mobile mantém largura, altura e posição de logo, menu e perfil durante toda a rolagem. Somente o fundo translúcido do estado compacto muda.
- Barra inferior e conteúdo limitados à largura disponível, com colunas que podem encolher sem recortar os atalhos.
- Rodapé e assinatura da marca não dependem mais do ScrollTrigger para se tornarem visíveis após atualização da página, salto por âncora ou rolagem rápida.
- CSS e scripts locais recebem um identificador de versão para evitar misturas de arquivos antigos em cache no navegador.
- Zoom do usuário continua habilitado; não são impostas restrições de escala ou viewport.


## V1.15 — CSS responsivo isolado

O menu e a barra mobile foram consolidados no arquivo mobile-navigation.css. O novo componente preserva o cabeçalho estável, os atalhos, a área segura do aparelho, a pesquisa em fonte 16px e a acessibilidade por toque. O arquivo styles.css mantém o tema geral sem os blocos mobile duplicados das versões 1.11–1.14.

## V1.16 — Estabilidade visual e catálogo (05/11/2026)

- Conteúdo da página e cards sempre visíveis durante rolagem, recarregamento e trocas de filtro.
- Títulos de banners anteriores ocultados imediatamente, evitando sobreposição no crossfade.
- Sacola limitada a 99 unidades por item, coerente com a persistência local.
- Etiquetas de fotografia provisória aparecem apenas sem imagem real ou em caso de erro de carregamento.
- Contraste de textos e botões reforçado; setas do carrossel maiores no mobile.
- Novos testes de regressão Playwright para os cenários anteriores.
- Zoom e gesto de pinça permanecem acessíveis, sem bloqueio de escala.

## V1.17 — Restauração responsiva sem estados residuais (05/11/2026)

- Cabeçalho expande novamente ao subir 18 px; continua compacto ao descer após o limiar de 155 px.
- Reconciliado o estado no carregamento, rotação, redimensionamento e retorno pelo cache do navegador.
- Removidas regras de cabeçalho conflitantes do styles.css; controle visual unificado em mobile-navigation.css.
- Menu mobile ancorado com margens do cabeçalho, sem 100vw nem translateX.
- Busca, menu, fundo modal, foco e inert são restaurados ao cruzar o breakpoint 700/701 px.
- Versão 1.17 nos recursos CSS e JS para invalidar caches anteriores.
- Testes de ida e volta, de geometria e de alternância de breakpoint.
