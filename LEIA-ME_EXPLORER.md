# Explorer do Pantanal — três expedições com escolha de guia VIP

Atualização preparada em 08/09/2026 para o repositório **GuiBRA985/Pantanal**,
com base na versão `9e4caa3` (menu da página inicial corrigido).
Este pacote atualiza o site existente. Não é necessário desarquivar o repositório antigo Bento-Pantanal.

## Como colocar no repositório

1. Extraia o ZIP no computador.
2. Abra o repositório **Pantanal**. Envie o conteúdo extraído para a **raiz** do repositório, onde estão `index.html` e `explorer.html`.
3. Mantenha as pastas `css` e `js` com seus nomes. Dentro de `js`, mantenha a subpasta `data`.
4. Substitua os arquivos de mesmo nome e acrescente os novos. Não exclua as outras pastas do site.
5. Confirme a atualização no GitHub. Quando o GitHub Pages terminar de publicar, abra https://pantanal.bento.host/explorer.html.

**Envie os arquivos e as pastas extraídos, não apenas o arquivo ZIP.**
Não crie uma pasta adicional chamada “Explorer” ou com o nome do ZIP dentro do repositório.
O pacote não altera domínio, CNAME, cadastro, autenticação, administração ou conteúdo dos perfis.

## Estrutura dos arquivos incluídos

| Caminho dentro do repositório | Ação | Função |
| --- | --- | --- |
| `explorer.html` | Substituir | Catálogo, mapas, escolha do VIP e resumo da cotação. |
| `index.html` | Substituir | Entrada para as três expedições e guias gratuitos aleatórios; mantém o menu atual. |
| `css/explorer-expedicoes.css` | Adicionar | Visual das novas telas e adaptação para celular. |
| `css/home-guide.css` | Adicionar | Cartões aleatórios de guias gratuitos na página inicial. |
| `js/explorer.js` | Substituir | Navegação entre as expedições, mapas regionais e pedido comercial. |
| `js/explorer-jaguar.js` | Adicionar | Lógica original do mapa de Porto Jofre e do montador de pousadas. |
| `js/explorer-guides.js` | Adicionar | Consulta, validação e escolha dos guias VIP. |
| `js/explorer-config.js` | Adicionar | Contato comercial que recebe a cotação. |
| `js/guide-profile.js` | Substituir | Botão do perfil VIP leva ao Explorer com o guia escolhido. |
| `js/home-guide.js` | Adicionar | Seleção aleatória de até três guias gratuitos para contato direto. |
| `js/data/expedicoes.js` | Adicionar | Trajetos e postos de Chapada e Jaciara. |
| `LEIA-ME_EXPLORER.md` | Consulta | Estas instruções. Pode ficar fora do site. |

Os arquivos já existentes `css/explorer.css`, `css/style.css`,
`js/guides-common.js`, `js/supabase-config.js` e `js/app.js` continuam sendo usados.
Preserve também `js/data/cidades.js`, `js/data/pousadas.js`,
`js/data/destinos.js`, `js/data/pontes.js`, as imagens, o vídeo e as pastas de guias.
Não há dependência nova para instalar nem etapa de compilação.

## Como o visitante escolhe o guia

1. Abre o Explorer e escolhe Porto Jofre, Chapada dos Guimarães ou Jaciara.
2. Usa **Escolher / trocar guia** e seleciona um dos VIPs.
3. Confirma em **Usar este guia**.
4. Em Porto Jofre, escolhe as duas pousadas no mapa, como no montador original.
5. Usa **Solicitar expedição**. O resumo inclui a expedição e o guia escolhido.
6. Confere o resumo e continua no aplicativo de e-mail ou WhatsApp para enviar a cotação ao Bento Pantanal.

O guia pode ser escolhido antes ou depois da expedição.
A escolha acompanha os links e permanece durante a navegação na mesma aba,
com possibilidade de troca. Um link do perfil VIP já traz o guia selecionado.
A preferência salva é sempre conferida contra o cadastro atual do site.

### Quem aparece na escolha

A lista é carregada de `public_guide_profiles` no Supabase já configurado no site.
A consulta usa os campos `vip`, `expedition_leader` e `cadastur_verificado` iguais a `true`.
A view pública existente também limita os resultados a cadastros aprovados.

Tchaco e Jhimy foram confirmados na consulta pública como habilitados.
Não há lista fixa dos dois no código: quando outro guia for aprovado, verificado,
marcado como VIP e habilitado para liderar na administração existente, também
aparecerá nas três expedições. Remover a habilitação o retira da seleção.

Guias gratuitos não aparecem no seletor. Até três são sorteados na página inicial
para abrir o perfil e cotar um passeio diretamente com o profissional.
Os perfis e a Rede de Guias existentes continuam disponíveis.

**Esta atualização não exige SQL novo. Não é necessário executar novamente as migrações antigas.**

## Para onde vai o pedido

O contato comercial está em `js/explorer-config.js`:

```js
window.EXPLORER_CONFIG = Object.freeze({
  email: "gui@bento.host",
  whatsapp: ""
});
```

O padrão abre o aplicativo de e-mail com o destinatário `gui@bento.host`, o assunto
preenchido e o resumo da expedição. O visitante confirma o envio no aplicativo.
Também há **Copiar pedido** para usar a mensagem por outro canal.

Se desejar usar o WhatsApp comercial, preencha `whatsapp` com seu número completo,
incluindo 55, DDD e número, somente dígitos. O WhatsApp passa a ter prioridade.
Use o contato do **organizador Bento Pantanal**, pois você conduz a venda e a logística.
O pedido da expedição não é encaminhado automaticamente ao WhatsApp pessoal do guia.

Não há cobrança, cálculo de comissão, envio automático, gravação de reserva no
banco ou confirmação de disponibilidade. O pacote prepara uma solicitação de
cotação: o visitante a envia no aplicativo escolhido e o Bento confirma datas,
valor, guia e logística. Os percentuais comerciais ainda não foram definidos.

## O que foi preservado em Porto Jofre

- Expedição de 10 dias e 9 noites.
- Porto Jofre permanece fixo, com três noites.
- Duas pousadas à escolha, com três noites em cada uma.
- Marcadores, filtros, dados e ordem do montador original.
- Acesso antigo `explorer.html?montar=1`.

A lógica original foi preservada em `js/explorer-jaguar.js`. A mudança funcional
nesse arquivo conecta o botão de solicitação ao pedido com guia selecionado.
Os quatro arquivos originais de dados da Transpantaneira não foram alterados.

## Chapada e Jaciara

Cada uma tem mapa próprio, partindo do Aeroporto Internacional Marechal Rondon,
em Várzea Grande, até a cidade escolhida. Os marcadores adicionados são somente
partida, destino e postos de combustível; as duas rotas não carregam os dados de pousadas.

O pacote traz 21 pontos de abastecimento próximos ao trajeto de Chapada e 24 no
de Jaciara. São dados consultados no OpenStreetMap em 08/09/2026, não um inventário
garantidamente completo. O critério foi proximidade de até 350 metros em linha
reta do traçado rodoviário; esse critério não garante acesso pela mesma pista.
Quando o cadastro do mapa não informa nome, aparece “Posto de combustível — nome não informado”.
Não foram inventados nomes, preços, horários ou coordenadas.

O traçado acompanha as estradas calculadas pelo OSRM. Os dados ficam incluídos no
arquivo `js/data/expedicoes.js`; o site não precisa consultar o Overpass ou recalcular
a rota a cada abertura. Os mapas de fundo, a consulta aos guias e os links externos
precisam de conexão com a internet. Confirme condições de acesso e funcionamento
antes da viagem.

### Fontes e atribuição dos mapas

- Dados de postos e localidades: © OpenStreetMap contributors — ODbL 1.0.
  https://www.openstreetmap.org/copyright
- Consulta geográfica: https://overpass-api.de/api/interpreter
- Geometria de estradas: https://router.project-osrm.org
- Aeroporto: https://www.openstreetmap.org/way/446960418
- Chapada: https://www.openstreetmap.org/node/415522190
- Jaciara: https://www.openstreetmap.org/node/318926448

Cada posto guarda seu link de origem. O arquivo de dados registra a consulta e
a URL da rota usada em cada destino. As rotas são snapshots de consulta, sem
promessa de trânsito em tempo real.

## Verificação realizada

Foram conferidos a consulta pública real dos VIPs, os caminhos locais de scripts
e estilos, a sintaxe de JavaScript e CSS e os fluxos com simulação de DOM:

- Escolher Tchaco ou Jhimy, trocar o guia e incluir a escolha na cotação, nas três expedições.
- Bloquear guia gratuito informado pela URL e retirar um guia cuja habilitação seja removida.
- Tratar falta de conexão, lista vazia e nomes com caracteres especiais.
- Preservar o link antigo, impedir terceira pousada e impedir remoção de Porto Jofre.
- Exibir até três guias gratuitos sem repetição e manter o menu da página inicial.
- Comparar cada coordenada de posto e a geometria das rotas com os dados obtidos das fontes.

Não houve publicação neste envio nem teste visual em navegador. Após a atualização,
abra os três destinos no celular e no computador e confira o aplicativo de envio
configurado no seu dispositivo.
