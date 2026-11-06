# Margot V1.30 — Fotografias grátis no Firestore Spark

## Ativação (sem Blaze, sem cartão de crédito)

O Firebase Storage exige Blaze. Este modo usa somente o Firestore já configurado.
É uma alternativa provisória para um catálogo pequeno, não uma solução de CDN.

1. Faça cópia das regras atuais no Firebase Console antes de alterá-las.
2. Atualize o repositório local e publique apenas firestore.rules:

    cd "$HOME\Margot"
    git pull --ff-only origin main
    firebase.cmd deploy --only "firestore:rules" --project "margot-acessorios-865987"

3. Confirme compilação aprovada e Deploy complete! no terminal.
4. Abra https://k410sh4.github.io/Margot/admin.html e atualize com Ctrl+Shift+R.
5. Entre com o Google autorizado. O editor deve mostrar Fotos grátis ativadas no Firestore.
6. Selecione uma foto, clique em Salvar e confira a vitrine em outra aba.

Sem as novas regras, o editor detecta a falta de autorização e mantém o envio desativado.
Não precisa de outro deploy web após publicar as regras: a detecção é automática.

## Limites, qualidade e funcionamento

- Original selecionado: JPEG, PNG ou WebP, até 5 MB; não é armazenado.
- Versão maior comprimida: WebP, até 1000 pixels e 160 KiB.
- Miniatura: WebP, até 260 pixels e 18 KiB.
- Máximo de 8 imagens por produto. Qualidade e resolução podem ser reduzidas.
- Cada imagem maior fica em um documento productMedia/{uuid}; o produto guarda somente
  as miniaturas e as referências para recuperação sob demanda na página V3.
- A primeira fotografia é a capa. A remoção apaga o documento após salvar o produto.
- Somente o Google proprietário verificado pode criar/excluir documentos de fotos.
- Visitantes podem ler uma foto por ID; não podem listar a coleção.

## Limitações do plano gratuito

O Firestore é um banco, não um serviço de arquivos. Os documentos têm limite de 1 MiB.
A cota gratuita inclui 1 GiB armazenado, 50.000 leituras/dia,
20.000 gravações/dia e 10 GiB/mês de transferência de saída.
Ultrapassar a cota Spark pode impedir operações; não oferece uso ilimitado.
Para uma loja com muito tráfego, migrar para um armazenamento próprio com CDN.

Fontes:
https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024
https://firebase.google.com/docs/firestore/pricing
https://firebase.google.com/docs/firestore/quotas
