# Margot V1.28 — Painel administrativo em tempo real

## Funcionalidades

A página admin.html oferece login Google, gestão de produtos, estoque, preços,
promoções, selos de destaque e envio ou retirada de fotografias. Até 8 imagens
JPEG/PNG/WebP de 5 MB por produto podem ser enviadas ao Firebase Storage.
Retirar produto da vitrine é um arquivamento reversível; imagens são preservadas
para permitir restauração.

O arquivo site-live.js conecta a vitrine e a página individual V3 ao Firestore.
Ao salvar, o banco envia alterações ao navegador do público em tempo real.
Sem conexão, a vitrine continua exibindo o catálogo demonstrativo local.

O acesso é limitado, nas regras de segurança do SERVIDOR, à conta Google
verificada do e-mail administrativo previamente cadastrado pela loja.
Esconder botões ou páginas não constitui uma medida de segurança suficiente.

## ATIVAÇÃO NECESSÁRIA NO FIREBASE

Projeto: margot-acessorios-865987

O deploy no GitHub Pages NÃO implanta automaticamente Firestore e Storage.

1. No Firebase Console, abra Authentication -> Sign-in method.
   Ative o provedor Google e inclua k410sh4.github.io entre os domínios
   autorizados.
2. Em Firestore Database, crie o banco padrão, se ele não existir.
   Não escolha regras de teste que aceitam gravações públicas.
3. Em Storage, ative o bucket padrão referido em firebase-config.js.
   ATENÇÃO: em 2026 o Cloud Storage for Firebase requer o plano Blaze,
   com faturamento conforme uso e eventuais cotas gratuitas. Verifique
   custos antes de ativar.
4. Antes de implantar, faça backup das regras de Firestore/Storage que
   eventualmente já existam no Firebase Console. A CLI sobrescreve
   as regras de produção dos serviços selecionados; preserve
   permissões necessárias de outros sistemas do mesmo projeto.
5. No terminal do Windows, dentro de um clone atualizado do repositório:

   npm install -g firebase-tools
   firebase login
   firebase use margot-acessorios-865987
   firebase deploy --only firestore:rules,storage --project margot-acessorios-865987

   Faça isto apenas após revisar e aprovar as regras.

6. Abra https://k410sh4.github.io/Margot/admin.html e entre com a conta
   administradora. O indicador deve mostrar Sincronizado.
7. Abra a vitrine em outra aba ou navegador e salve uma alteração no painel.
   Confirme a atualização sem recarregar.
8. Teste login de outra conta Google: a edição deve ser recusada.
   Para comprovar segurança do backend, teste também gravações rejeitadas
   diretamente no emulador Firebase Security Rules.

## Como editar

- Produtos: adicionar, editar informações ou retirar e restaurar peças.
- Estoque: deixe vazio para desconhecido. Ao mudar a contagem, a data é
  atualizada. Caso a contagem continue igual, marque Confirmar contagem
  nesta atualização para renovar a conferência. De 1 a 10 unidades o site
  alerta; 0 indica indisponibilidade.
- Promoção: informe preço de referência verdadeiro, preço menor e datas de
  início e fim. O desconto é calculado e expira ao terminar a vigência.
- Peça favorita: seleção editorial manual, sem confundir com favoritos
  pessoais de visitantes.
- Mais vendida do mês: só marque após consultar vendas reais da loja.
  A etiqueta deixa de aparecer quando muda o mês.
- Fotos: a primeira fotografia é a capa. Remover da lista e salvar
  atualiza o produto antes de tentar excluir o arquivo antigo do Storage.
  Se a exclusão falhar, o painel avisa para fazer a limpeza manual.

## Segurança e limitações

- O acesso ao painel exige Google Auth e regras Firebase apropriadas;
  site estático sozinho não impede chamadas diretas à API.
- As regras exigem e-mail verificado e provedor Google. A conta administradora
  é explícita nos arquivos de regras, mas isso NÃO é uma credencial.
- Outros proprietários do PROJETO Firebase ou contas IAM privilegiadas
  podem editar dados pelo Console ou CLI. Para restringir a administração
  da infraestrutura inteira, revise também as permissões IAM.
- Não armazene contas de serviço, senhas ou tokens no GitHub ou no navegador.
- As fotos são públicas para visitantes: não envie imagens confidenciais.
- O estoque mostrado é uma contagem informada, não uma reserva em tempo real
  entre compradores. A loja ainda não oferece checkout.
- O Cloud Firestore e o Storage têm limites de operação e custos.
- Alterações simultâneas em abas administrativas distintas podem sobrescrever
  valores; revise os campos antes de salvar.
- Os 8 itens demonstrativos permanecem no catálogo de fallback até receberem
  suas primeiras edições. Arquivar um deles salva um registro com deleted=true
  que o remove da vitrine, sem alterar o arquivo estático original.

Fontes oficiais:
- https://firebase.google.com/docs/firestore/security/rules-structure
- https://firebase.google.com/docs/storage/security
- https://firebase.google.com/docs/rules/manage-deploy
- https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024

## V1.29 — Upload suspenso enquanto Storage não estiver ativo

O projeto está no plano Spark e, após a implantação apenas de Firestore, o
Firebase Storage ainda não foi configurado. Para evitar que o envio de imagens
fique aguardando repetidas tentativas, o administrador agora apresenta um aviso
explícito e desativa o campo de fotografias até a infraestrutura ser ativada.
Os produtos continuam podendo ser cadastrados, alterados e arquivados sem fotos.

O indicador público `window.MARGOT_STORAGE_UPLOADS_ENABLED = false`, em
`firebase-config.js`, é uma **chave operacional de interface**, não uma regra
de segurança. Para voltar a enviar fotos, configure o bucket e o faturamento
correspondente, implante `storage.rules`, valide as permissões com a conta
administradora e **somente então** mude a chave para `true` e publique o
frontend. Nunca ative apenas a interface sem ter configurado as regras.

Quando essa chave estiver ligada, o SDK limitará as tentativas de upload a
15 segundos e de outras operações a 10 segundos. Os arquivos não são
silenciosamente descartados: operações de upload com erro não confirmam a
criação/alteração do produto.
