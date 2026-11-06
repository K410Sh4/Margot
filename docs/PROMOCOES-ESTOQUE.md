# Margot — promoções, estoque e classificações (V1.27)

## Onde editar
O arquivo **merchandising-data.js** é a fonte de cadastro de condições comerciais confirmadas.
Ele começa vazio de propósito. Não invente estoques, contagens de vendas, preços anteriores ou avaliações.
Os oito produtos atuais continuam sendo uma vitrine demonstrativa.

Só adicione dados com aprovação da loja e uma fonte de referência verificável. A publicação do
arquivo em GitHub Pages é pública; **não coloque dados pessoais, contatos privados, códigos,
planilhas sigilosas nem evidências internas completas nele.** O campo \`source\` deve ser
uma descrição genérica do documento interno, nunca uma URL privada ou dado sensível.

## Exemplo de preenchimento (somente documentação — não publicado)

\`\`\`js
window.MargotCommercialData = Object.freeze({
  products: Object.freeze({
    'brinco-coracao': {
      inventory: {
        confirmed: true,
        quantity: 7,
        checkedAt: 'AAAA-MM-DD',
        source: 'Conferência física do estoque'
      },
      promotion: {
        confirmed: true,
        originalPrice: 29.90,
        salePrice: 23.90,
        checkedAt: 'AAAA-MM-DD',
        startsAt: 'AAAA-MM-DD',
        endsAt: 'AAAA-MM-DD',
        source: 'Tabela de preço aprovada pela loja'
      },
      tags: {
        confirmed: true,
        checkedAt: 'AAAA-MM-DD',
        source: 'Relatório da loja',
        favorite: true,
        bestSellerMonth: 'AAAA-MM'
      }
    }
  })
});
\`\`\`

O exemplo não será aceito literalmente pelo site porque os campos de data são ilustrativos.
Use datas ISO reais, atualize a fonte e valide no site após publicar.

## Regras de ativação e validade

- **Estoque:** só apresenta valores inteiros entre 0 e 1.000.000, com \`confirmed:true\`,
  fonte e \`checkedAt\` dentro dos últimos 7 dias. Valores negativos, inválidos, futuros
  ou antigos não aparecem. Valores de 1 a 10 exibem **"Restam X unidades"**;
  0 exibe **indisponível** e bloqueia o botão de adicionar;
  acima de 10 não mostra contagem. Os dados não são reservas nem estoque em tempo real.
- **Promoção:** exige \`originalPrice\` e \`salePrice\` em BRL,
  valores positivos com no máximo 2 casas decimais, \`originalPrice > salePrice\`,
  \`confirmed:true\`, fonte, conferência nos últimos 30 dias e datas de início e fim
  abrangendo a data atual. Sem essas condições, o preço de referência do catálogo é preservado.
  O desconto é calculado, não digitado em uma etiqueta separada.
- **Peça favorita:** etiqueta editorial validada por \`tags.favorite:true\`, com
  fonte, aprovação e data de conferência de no máximo 35 dias. Não equivale ao
  favorito pessoal salvo no navegador da cliente.
- **Mais vendida do mês:** só aparece quando \`bestSellerMonth\` corresponde ao
  mês atual (formato \`AAAA-MM\`), com aprovação, data e fonte de relatório de vendas.
  Não é uma contagem calculada por visitas, cliques ou favoritos.
- **Limite de quantidade:** a vitrine e a página V3 permitem até 99 unidades
  por peça, respeitando adicionalmente o total informado do estoque quando válido.
  Isso impede ultrapassar a contagem **no mesmo navegador**, mas não substitui um
  sistema de vendas com reserva concorrente entre clientes.

## Painéis e comportamento

- Vitrine: o painel **"Promoções da Margot"** mostra apenas promoções ativas.
  Sem ofertas confirmadas, mostra um estado informativo sem preços ou descontos inventados.
- Cards: selos de favorito, mais vendida, desconto e baixo estoque são condicionais.
- Página V3: preço anterior, economia, condição especial, disponibilidade e classificações.
  O painel inferior de ofertas só aparece quando alguma promoção estiver ativa.
- O carrinho e os favoritos locais compartilham os mesmos dados entre a vitrine e a V3.

## Validação antes de publicar

1. Confirme fisicamente o inventário e a data da conferência.
2. Confirme o preço anterior praticado e a promoção aprovada.
3. Verifique a evidência de preferência editorial e o relatório mensal de vendas,
   conforme as etiquetas escolhidas.
4. Atualize \`merchandising-data.js\` e abra PR.
5. Execute \`npm run test:mobile\` e o rastreador de screenshots em GitHub Actions.
6. Revise no desktop e no mobile, incluindo preços antigos, validade e comportamento dos botões.
7. Atualize ou remova o registro assim que as informações mudarem.

**Limitação:** o site usa arquivos estáticos no GitHub Pages. Sem uma integração de
inventário em tempo real, uma cliente pode ver uma contagem conferida dias antes.
O aviso sempre indica estoque informado e orienta confirmar com a loja.
