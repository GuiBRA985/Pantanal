# Mapa e recebimento de avistamentos VIP

## Estado desta entrega

Página `/guias/avistamentos/?slug=SLUG` ligada ao botão Avistamentos do perfil VIP. Usa a identidade e os contatos reais do perfil, com mapa Leaflet/OpenStreetMap semelhante ao Explorer. Cada consulta é filtrada pelo ID do guia. Nenhum avistamento de demonstração é criado.

As duas migrações `20261008032942_guide_sightings.sql` e `20261008033315_guide_sighting_publication_index.sql` já foram aplicadas ao projeto Bento-Pantanal em 08/10/2026. Não execute novamente nesse projeto. Elas permanecem no repositório para histórico e instalação em outro ambiente.

O APK v0.2 entregue anteriormente continua offline: **login e sincronização ainda precisam ser implementados no Android**. Esta entrega prepara o destino dos dados; não altera o APK.

## Contas e acesso

Mesmo APK e mesma configuração pública para todos os guias. A conta Supabase do guia deve estar vinculada em `guides.user_id`, com `vip=true`, `status='approved'` e `cadastur_verificado=true`. O servidor deriva `guide_id` e `user_id` da sessão, mesmo que um cliente envie outros IDs. Não usar e-mail, slug, telefone ou metadados editáveis do JWT como autorização.

Tchaco e Jhimy têm perfis VIP públicos, mas ainda estavam sem `user_id` em 08/10/2026. Eles precisam ter seu login vinculado pelo administrador antes de sincronizar. Não vincular por nome aproximado.

Visitantes consultam apenas `guide_sighting_publications`. O guia logado vê os próprios originais em `guide_sightings`; fotos e áudios são acessados por URLs assinadas de dez minutos. As URLs de mídia expiram após dez minutos; recarregue a página para gerar novos acessos. Uma troca de conta recarrega a página para limpar a visão privada. Nenhum dado bruto é publicado automaticamente.

## Contrato do futuro sincronizador Android

1. Coletar offline foto original, áudio opcional, espécie, observações, data ISO 8601 com fuso e coordenadas. Preservar os arquivos locais. Atribuir UUID estável a cada registro (`local_id`), incluindo registros importados de backup. Não gerar novo UUID a cada tentativa.
2. Ao sincronizar, autenticar a conta Supabase do guia no mesmo projeto usado pelo site. Utilizar URL/chave pública da configuração existente e JWT de usuário; nunca colocar chave administrativa no APK.
3. Enviar mídias pelo Storage API ao bucket privado `guide-sightings`, caminhos `<auth.uid()>/<local_id>/photo.<ext>` e, quando existente, `audio.<ext>`. Usar os MIME types corretos e `upsert:false`. Limite atual: 50 MiB por objeto, sujeito ao plano do projeto. A coleta offline não deve ser limitada por isso: manter arquivo local e erro pendente se o envio for rejeitado.
4. Só depois da confirmação das mídias, fazer upsert REST em `guide_sightings?on_conflict=user_id,local_id` com `Prefer: resolution=merge-duplicates,return=representation`. Corpo: `local_id`, `species`, `notes`, `observed_at`, `latitude`, `longitude`, `photo_path`, `audio_path` (null quando não houver). `guide_id`, `user_id`, `id`, `received_at` são definidos/preservados pelo servidor. Foto obrigatória; coordenadas podem ser ambas null se não houver GPS.
5. Confirmar o retorno com o UUID esperado e ler o registro de volta. O servidor verifica que foto e áudio declarado existem no bucket e na pasta daquele registro. A chave única impede duplicação em reenvios. Caminhos e identificador originais não podem ser substituídos após recebimento.
6. Se upload retornar conflito, baixar/verificar o objeto existente antes de considerá-lo confirmado. Não tratar qualquer erro HTTP como sucesso. Manter tamanho e hash local para essa verificação. Havendo divergência, manter pendente; não substituir o original.
7. Marcar como sincronizado no SQLite somente depois das confirmações de mídia e registro. Falha de rede, login, aprovação, quota ou UUID divergente mantém estado pendente e permite nova tentativa. Nunca apagar arquivos originais como consequência automática da sincronização.

O banco reconhece recebimento pela existência dos objetos; a integridade byte a byte deve ser conferida pelo cliente antes de ele marcar o registro como sincronizado. Não há processamento de IA nesta entrega.

## Publicação separada

Depois de uma decisão explícita do guia sobre quais dados/localizações podem ser divulgados, o cliente autenticado pode inserir/upsert em `guide_sighting_publications`:

- `sighting_id`, `guide_id`: do registro recebido pertencente àquela conta;
- `species`, `observed_at`, `public_notes`: texto deliberadamente escolhido para publicação;
- `public_latitude`, `public_longitude`: localização aprovada para exibição pública, que pode diferir do GPS original.

Não copiar automaticamente coordenadas precisas de animais para esta tabela. O mapa público fica vazio enquanto não houver publicações. O guia logado já pode ver os originais recebidos no mapa privado. A interface de publicação e a decisão de precisão pública são trabalho posterior. Remover uma publicação não apaga o original. Perder VIP/aprovação oculta as publicações e bloqueia novos envios, preservando o acervo privado.

## Validação

Sintaxe JavaScript; leitura com a configuração pública real; mapa/contatos em tela de celular e desktop; botão do perfil; slug indisponível. Teste transacional com rollback no Supabase: vínculo derivado da sessão, reenvio sem duplicação, mídia ausente rejeitada, outro guia sem acesso aos originais/mídias e sem edição da publicação, upload não VIP bloqueado, publicação pública e originais inacessíveis a anônimos. Nenhum registro ou metadado de teste permanece no banco.
