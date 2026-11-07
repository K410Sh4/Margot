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

## Diagnóstico visual automatizado — prints e coordenadas por ação

O workflow `.github/workflows/layout-diagnostics.yml` executa um navegador Chromium em ambiente de teste. Para cada ação simulada, salva um PNG e as medidas X/Y, largura e altura de logo, cabeçalho, menu, banner, categorias, produtos e sacola. Em transições importantes, salva dois prints: durante o movimento e após estabilizar.

- **Ações cobertas:** rolagem para baixo e para cima, menu, filtros, busca, favorito, sacola, carrosséis horizontais, larguras 320/360/390/430/700/701/1024, rotação simulada, banner e recarregamento.
- **Arquivos:** `relatorio.html`, `medicoes.csv`, `medicoes.json`, `playwright-trace.zip`, PNGs da tela e capturas completas nos pontos principais.
- **Download:** GitHub → Actions → Margot — Rastreio de layout por ação → execução → Artifacts → `margot-rastreio-layout-*`. Extraia o ZIP e abra `relatorio.html`.
- **Manual:** `npm install`; `npx playwright install chromium`; `npm run test:trace`.
- **Privacidade:** não monitora visitantes nem registra dados pessoais. É uma simulação em navegador de teste, não uma captura silenciosa de celulares reais.
- **Limites:** efeitos de zoom por pinça em aparelhos físicos exigem validação complementar.

## V1.19 — Correção do overflow horizontal e barra inferior (05/11/2026)

- Os cards do carrossel de categorias já possuíam `aria-label`, mas incluíam também um `span.visually-hidden` com `position:absolute`, sem um ancestral posicionado.
- Durante as animações de entrada do GSAP, esses spans podiam escapar do carrossel horizontal e ampliar o scrollWidth do documento; no rastreamento, suas coordenadas chegaram a aproximadamente 770 px em uma tela de 390 px.
- Removidos os spans redundantes, sem perda dos nomes acessíveis, e aplicado `position:relative` nos cards como proteção adicional para futuros badges.
- Preservada a animação lateral original do painel da sacola — a hipótese de que ele seria a causa foi descartada pelos testes de isolamento.
- Testes com movimento ativado verificam rolagens 0→230→520→430→0, largura do documento e da barra inferior em 320/360/390/430/700 px, acessibilidade dos cards e abertura/fechamento da sacola.
- CSS e store.js recebem `v=1.19` para impedir mistura de arquivos antigos em cache.

## V1.20 — Estabilização da compactação desktop (05/11/2026)

- Cabeçalho desktop usa mudança de estado controlada: acumula 80 px reais de subida para expandir e 100 px de descida para compactar (após o limiar de 155 px).
- Janela de estabilização de 480 ms ignora pequenas mudanças de scroll causadas pelo redimensionamento do próprio header `sticky`.
- Redimensionamentos dentro do mesmo breakpoint não recalculam compulsoriamente o estado; mudança efetiva mobile/desktop e retorno do histórico continuam sincronizados.
- Removidas transições de `min-height`, `grid-template-columns` e `width` do cabeçalho desktop; permanecem efeitos suaves de fundo e vidro.
- Mobile mantém o limiar anterior de rolagem e suas dimensões fixas de 64/68 px.
- Dois testes regressivos verificam alternâncias sem piscar, largura da logo, altura e estabilidade ao redimensionar. Rastreio visual passou a incluir oscilação proposital de scroll desktop.
- Recursos atualizados para `v=1.20` para invalidar cache de scripts e estilos antigos.

## V1.21 — Fotografia premium na seção de presentes (05/11/2026)

- Substituída a imagem `assets/presentes-margot.webp` pela nova `assets/presentes-margot-premium.jpg` (1021×724), derivada da arte de alta definição aprovada, mantendo somente a fotografia da caixa rosé e joias.
- Título, descrição e botão `Conhecer kits` permanecem HTML acessível e clicável; não há textos ou botões duplicados dentro da imagem.
- No desktop, fotografia à esquerda e transição suave para o fundo rosé à direita; no mobile, enquadramento 8:5 para não cortar a caixa e o laço de forma agressiva.
- Foram adicionados dois testes Playwright que validam carregamento da imagem, dimensões, presença do texto e do botão e ausência de overflow horizontal.
- CSS atualizado para `?v=1.21` e nova imagem com versão para contornar cache.

## V1.22 — Assinatura editorial Margot (05/11/2026)

- Seção final antes do rodapé aprimorada com painel delicado de fundo rosé, círculos ornamentais, pérola central, linhas finas e brilhos discretos.
- Logo oficial preservada, porém reduzida para 136 px no desktop e 118 px no mobile, evitando excesso de repetição visual.
- Destaque editorial para `Seu brilho está nos detalhes.`, texto complementar e link `Explorar acessórios` ao catálogo, mantendo a navegação funcional.
- Entrada animada via GSAP/ScrollTrigger com deslocamentos mínimos; apenas ornamentos brilham suavemente em CSS, com desativação quando o usuário prefere movimento reduzido.
- Conteúdo permanece visível mesmo sem JavaScript/CDN. Nenhum elemento animado altera largura ou altura do documento.
- Novos testes Playwright cobrem desktop, mobile 320/390/700 px e redução de movimento; rastreador visual inclui capturas específicas da assinatura em ambos os modos.

## V1.23 — Fotografia humana na assinatura editorial (05/11/2026)

- Substituída a logo da seção final por fotografia aprovada: duas mulheres em um café, com atmosfera de amizade e tons verde-sálvia.
- Imagem otimizada em JPEG de 2016×1152 (~378 KB), sem texto incorporado, preservando a qualidade e a composição originais.
- Removidos ornamentos de pérola, círculos e brilhos que repetiam a identidade de outras seções.
- Desktop: imagem ocupando o painel com contraste suave para posicionar o texto real do lado direito; mobile e telas médias (até 900 px): imagem em cima e texto abaixo, sem sobreposição nas pessoas.
- Mantidos o título, a descrição e o link para #produtos, com ajuste local da paleta para verde e creme.
- Animação GSAP discreta, sem ocultar conteúdo se CDN falhar e respeitando `prefers-reduced-motion`.
- Testes em 320/390/700/900/1280 px, controle de overflow, carregamento da foto, ausência de logos duplicadas e navegação do CTA.

## V1.24 — Harmonização cromática da assinatura com o rodapé (05/11/2026)

- Mantém a fotografia de duas amigas no café e a composição mobile/desktop da V1.23, sem alterar os demais componentes da loja.
- Marfim levemente rosado na área de texto e no gradiente sobre a foto; título e link em vinho Margot; descrição em taupe; verde-sálvia restrito a um detalhe de apoio.
- Na entrada do rodapé, gradiente estático de creme para rosé, dispensando mudança de cores por JavaScript durante a rolagem.
- Mantém animações e acessibilidade existentes; sem novos observadores de scroll e sem larguras em `100vw`.
- Dois testes novos validam cores CSS, imagem, responsividade e ausência de overflow. Rastreio visual captura também a passagem para o rodapé no desktop e mobile.

## V1.25 — Identidade minimalista no rodapé (05/11/2026)

- A versão compacta e transparente da logo Margot substitui somente a imagem dentro de `.footer-brand` no rodapé.
- PNG original enviado pelo usuário recortado de 1448×1086 para 753×440, preservando a transparência; arquivo otimizado em `assets/margot-logo-minimal-footer.png`.
- Removida do rodapé a frase `Delicadeza em cada detalhe.`, conforme solicitação.
- Eliminado o bloco branco de fundo da marca no rodapé, logo limitada a 154 px no desktop e 140 px no mobile.
- Identidade do cabeçalho e demais componentes intactos.
- Quatro testes Playwright adicionais: carregamento da nova imagem, remoção do texto, contraste da caixa transparente e geometria em 320/390/1280 px.

## V1.26 — Página individual de produto V3 (05/11/2026)

- Nova página `produto.html?id=<id>`, com layout moderno e completo para cada um dos oito itens do catálogo atual. Fotos e títulos no catálogo principal passam a abrir a página individual; o botão de adicionar à sacola continua funcionando sem navegação.
- `catalog-data.js` centraliza o catálogo utilizado por `store.js` e por `product-detail.js`, eliminando o risco de os produtos divergirem entre páginas.
- Página individual inclui: galeria preparada para fotos reais (miniaturas e zoom quando houver fotos), preço de referência, quantidade de 1 a 99, favoritos, sacola compartilhada, especificações, cuidados, avaliações sem dados fabricados, recomendações e link para informações da loja.
- O catálogo atual continua demonstrativo: **não há estoque confirmado, avaliações verificadas, condições de parcelamento, checkout real ou fotos individuais dos produtos**. A interface deixa isso explícito.
- A página individual usa o mesmo armazenamento local `margot-cart` e `margot-favorites`; link `index.html?sacola=1#produtos` abre a sacola existente e limpa o parâmetro de URL.
- `product-detail.css` mantém a linguagem rosé/bordô Margot e se adapta de 320 a 1280 px, sem alterar a lógica de compactação do cabeçalho da vitrine.
- Playwright inclui testes de cada produto, links entre páginas, quantidade máxima, integração real com sacola e favoritos, conteúdos verificáveis, acessibilidade, ausência de overflow e capturas desktop/mobile.
- O workflow de screenshots também documenta a experiência V3; novos CSS/JS/HTML estão registrados nas condições de execução dos workflows.


## V1.27 — Painéis de promoções, estoque baixo e classificações

- Painel de promoções na página inicial e seção promocional condicional na V3, com integração real à mesma lista de produtos e aos preços da sacola.
- Etiquetas condicionais: **Peça favorita**, **Mais vendida do mês**, **Oferta −X%**. Não são inferidas de cliques ou favoritos locais; requerem metadados comerciais confirmados.
- Estoque verificado de **1 a 10** mostra "Restam X unidades"; **0** identifica indisponibilidade e bloqueia o botão. Sem dados confirmados, não exibe números.
- Metadados ficam em \`merchandising-data.js\`, inicialmente vazio. O motor \`merchandising.js\` exige confirmação explícita, descrição da fonte e datas atuais, rejeita dados obsoletos ou inconsistentes e respeita o mês das classificações.
- Descontos atualizam os preços apresentados na vitrine, V3 e subtotal demonstrativo da sacola, sem checkout ou reserva de estoque.
- Limite adicional de quantidade respeita a contagem informada (no navegador), com comunicação transparente sobre confirmação pela loja.
- Testes específicos incluem valores 0, 1, 7, 10 e 11, promoções válidas/expiradas, melhor venda mensal, rótulos, preços e responsividade.
- Documentação de operação: [Promoções e Estoque](docs/PROMOCOES-ESTOQUE.md).


## V1.28 — Painel privado de produtos em tempo real (05/11/2026)

- Página administrativa: admin.html (Google Login, editor de produtos, estoque, promoções, selos e fotografias).
- Acesso à edição vinculado ao Google e-mail verificado definido em firestore.rules e storage.rules (autorização no servidor).
- Catálogo da vitrine e página V3 inscritos no Cloud Firestore via site-live.js, com fallback para o catálogo demonstrativo se o banco estiver indisponível.
- Fotos de até 5 MB por arquivo no Firebase Storage, JPEG/PNG/WebP, até 8 por produto; remoção e arquivamento reversível.
- Limites e avisos de estoque de 1 a 10 unidades, promoções com datas e melhores vendidos do mês.
- Os dados no Firebase não foram acessados nem publicados nesta execução: a ativação requer implantação das regras pela conta proprietária.
- **Guia de ativação:** docs/PAINEL-ADMIN-FIREBASE.md. O GitHub Pages publica o frontend; as regras exigem deploy separado no Firebase.
- Testes Playwright: autenticação de usuário autorizado/não autorizado com SDK simulado, cadastro, arquivamento, edição, fotos, vitrine em tempo real e mobile.

## V1.29 — Correção de salvamento de imagens

- Após ativar somente o Firestore, o painel não tenta mais enviar imagens
  para um Storage não configurado: o seletor fica inativo com aviso.
- O salvamento de nome, estoque, preço e promoções continua operacional sem
  fotografia; o usuário recebe mensagens por etapa.
- Futuras tentativas de upload, após ativação do serviço, terão duração máxima
  de novas tentativas configurada no SDK.
- Para habilitar fotografias, seguir `docs/PAINEL-ADMIN-FIREBASE.md` e
  ligar a chave operacional `MARGOT_STORAGE_UPLOADS_ENABLED` após
  implantação das regras de segurança.

## V1.30 — Fotos grátis no Firestore Spark

- Nova opção gratuita de fotografias comprimidas sem Firebase Storage e sem Blaze.
- WebP: até 160 KiB e 1000px para imagem maior; miniatura de até 18 KiB.
- Documentos productMedia separados, regras somente para proprietário Google verificado.
- Galeria V3 carrega a versão maior sob demanda, preservando miniaturas na vitrine.
- Painel libera envio automaticamente após implantar as regras Firestore da V1.30.
- Leia docs/FOTOS-GRATIS-FIRESTORE.md para ativação e limitações.

## V1.31 — Cards premium Margot

- Novo card editorial inspirado na referência aprovada: fotografia ampla,
  assinatura discreta, favoritos, etiquetas verificadas sobrepostas,
  preço em destaque, valor anterior riscado, economia calculada,
  estoque informado e ação de sacola em toda a largura.
- Variante bordô com botão dourado para peças com etiqueta **Mais vendida do mês**,
  somente quando a informação estiver confirmada no catálogo.
- Nenhuma avaliação, alegação de material ou desconto é inventada.
  O card continua usando exclusivamente os produtos, imagens, preços,
  promoções e estoque sincronizados via Firestore.
- Estilos isolados em `product-cards.css`, reutilizados pela coleção e
  pelo painel de promoções. Grid: três colunas em desktop, duas em tablets,
  uma em telefones estreitos para manter a leitura dos preços e CTA.
- Fotos ausentes continuam exibindo o placeholder e ocultam a assinatura
  sobre a imagem; o botão mantém os limites de estoque do catálogo.
- Testes Playwright verificam links, sacola, favoritos, preço anterior,
  economia real, etiquetas, estados sem estoque, fotos e overflow em
  larguras 320/390/640/768/1024/1280. Capturas vão para os artefatos
  GitHub Actions `margot-cards-premium-v131`.


## V1.32 — Compactação dos cards (reversão da escala excessiva)

- Restaura a densidade da coleção: quatro colunas no desktop, três em telas intermediárias, duas nos demais dispositivos e uma somente abaixo de 360 px.
- Reduz imagem, tipografia, espaços internos e CTA; mantém valores, descontos, badges, favoritos e sacola da V1.31.
- Mantém o componente compartilhado por coleção e promoções; ajustes responsivos cobertos pelos testes Playwright 320/390/640/768/1024/1280.


## V1.33 — Vitrine responsiva de alta densidade

- 6 cards em telas acima de 1150 px; 5 de 921 a 1150 px; 4 de 601 a 920 px; 3 em 600 px ou menos.
- Fotografia, preço, desconto, favorito e ação de sacola preservados; conteúdo reorganizado e reduzido no mobile para evitar rolagem horizontal.
- Suítes Playwright verificam faixas 320/390/600/640/768/920/1024/1150/1280 e elementos contidos nos cards.


## V1.34 — Cards premium próximos aos modelos aprovados

- Fotografia mais protagonista com degradê sutil, assinatura Margot em painel translúcido apenas quando a peça tem foto real e selo de favoritos.
- Bloco de informações parcialmente sobreposto à foto, com preços, economia validada e ação de sacola mais destacada.
- Card especial bordô/dourado reservado a produtos com selo confirmado de mais vendido no mês.
- Preservadas as faixas de 6/5/4/3 colunas, catálogo Firestore, fotos existentes, sacola e favoritos.
- Sem avaliações, números de reviews nem alegações comerciais inventadas.


## V1.38 — Três colunas de produtos no mobile

- Corrige a regra da V1.36 que forçava uma coluna abaixo de 560px; agora `#product-grid` e `#promotion-grid` exibem três colunas até 700px, incluindo celulares de 320px.
- Cards compactos com fotos quadradas, títulos e preços menores, descontos e botão de 44px; cartões não ultrapassam o contêiner.
- Preserva catálogo, ações de sacola/favoritos, confirmação de estoque e a grade desktop anterior.
- Testes responsivos ampliados, inclusive alinhamento da primeira linha e ausência de overflow.
