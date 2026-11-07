# Migração de segurança do catálogo Margot

Este processo preserva a vitrine enquanto a coleção administrativa `products` migra para `publicProducts`. **Não pule etapas.** Os commits de código no GitHub Pages **não implantam** automaticamente as regras do Firestore.

## Fase 1 — autorização da coleção pública

1. Atualize o repositório local: `git pull origin main`.
2. Faça backup dos dados no Firebase Console, se possível.
3. Confirme que `firebase.json` aponta para `firestore.rules`.
4. No PowerShell, execute:

```powershell
firebase.cmd deploy --only "firestore:rules" --project "margot-acessorios-865987"
```

A regra inicial **mantém a leitura pública em `products` temporariamente**, pois os produtos ainda não foram migrados.

## Fase 2 — cópia de conteúdo público

1. Acesse `https://k410sh4.github.io/Margot/admin.html` com a conta administradora.
2. Clique em **Sincronizar vitrine segura**.
3. Confira no Firebase Console se `publicProducts` contém somente os produtos ativos. Arquivados devem estar ausentes; cada documento público não deve conter `deleted` nem `updatedAt`.
4. Teste a vitrine e a página individual de um produto real em aba anônima. Teste também uma peça arquivada, que não deve ser exibida. Verifique fotos, promoções e carrinho.
5. Cadastre/edite um produto no painel e confirme que a coleção pública acompanha a mudança. Teste arquivar/restaurar.

A opção de sincronização é repetível. Se uma publicação falhar, o painel conserva o cadastro privado e avisa que a vitrine precisa ser sincronizada. Não avance se a coleção pública estiver vazia quando deveria ter produtos.

## Fase 3 — bloqueio definitivo da coleção administrativa

Após confirmar a vitrine, copie a regra restritiva e implante:

```powershell
Copy-Item .\firestore.lockdown.rules .\firestore.rules -Force
firebase.cmd deploy --only "firestore:rules" --project "margot-acessorios-865987"
```

Depois, verifique em aba anônima que `publicProducts` continua acessível e `products` não pode ser consultada sem a conta administradora. Registre a regra definitiva no GitHub:

```powershell
git add firestore.rules
git commit -m "security: lock down private products collection"
git push origin main
```

**Atenção:** a versão de transição de `firestore.rules` não constitui a proteção final. Nunca reimplante a versão de transição depois do bloqueio. Caso o site pare de ler dados, corrija a sincronização pública em vez de reabrir `products` para acesso anônimo.

## Firebase App Check — ativação opcional

O código reconhece `window.MARGOT_APP_CHECK_SITE_KEY`, definida vazia em `firebase-config.js`. Para ativar:

1. Crie uma chave reCAPTCHA **Enterprise** para o domínio `k410sh4.github.io` no Google Cloud; registre o app no **Firebase Console > App Check**.
2. Coloque a chave pública de site em `MARGOT_APP_CHECK_SITE_KEY` e publique a mudança. Não coloque chaves privadas no GitHub.
3. Monitore as requisições legítimas e os indicadores do App Check antes de ativar **Enforcement** em Firestore/Storage. Ativar enforcement antes disso pode bloquear seus clientes.

## Fora do GitHub Pages

- O endereço comercial do WhatsApp é público por desenho; spam originado fora do site precisa de configurações de atendimento/WhatsApp Business, não de JavaScript.
- O identificador da conta autorizada permanece nas regras. Para isolá-lo do contato público, crie uma conta administrativa dedicada e altere as regras e o código **coordenadamente**, mantendo acesso à conta antiga até confirmar a migração.
- App Check reduz abuso, mas não substitui regras de segurança nem limites de custo/alertas de consumo.
