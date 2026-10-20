# Integração futura de imóveis

Estado: **não integrada**. A demonstração usa `PropertyRepository` local, composto em `src/data/repository.ts`. O adaptador remoto deverá implementar a mesma interface assíncrona e normalizar a resposta antes de chegar aos componentes.

## Contrato interno

| Método | Resultado |
| --- | --- |
| `search(params)` | `items`, `total`, `page`, `pageSize` e facetas do catálogo elegível |
| `getBySlug(slug)` | Registro ou `null`; erros de serviço são propagados separadamente |
| `getFeatured()` | Até quatro registros publicados, disponíveis e destacados |
| `getSimilar(id)` | Até três registros elegíveis com critérios explícitos |

## Campos a mapear

| Interno | Confirmar na API |
| --- | --- |
| `id`, `code`, `slug` | Identificador imutável, formato/capitalização do código, URLs anteriores |
| `purpose` | Enum que identifica locação anual; excluir venda/temporada |
| `publication`, `available` | Publicado versus reservado/alugado/retirado; retenção de detalhes |
| `title`, `description`, `type` | Texto, saneamento de HTML, vocabulário de tipos |
| `location` | IDs e nomes de cidade/bairro, UF, granularidade permitida |
| `costs.rent` | Valor do aluguel separado de pacotes; converter para centavos BRL |
| `costs.condominium`, `costs.iptu` | Valor, periodicidade, isenção real versus ausência; anual não é mensal |
| `bedrooms`, `suites`, `parking`, `area` | Contagem, unidades, área útil versus total; preservar desconhecidos |
| `amenities`, `building.amenities` | Dicionário consistente por imóvel/condomínio |
| `media` | Ordenação, tipo, tamanho, alt, origem e licença; validar URLs e tipos MIME |
| `building` | Identificador e nome do edifício, comodidades; vínculo opcional |
| `publishedAt`, `featured`, `badge` | Datas reais, ordenação e critérios editoriais |
| `isDemo` | `false` apenas para registros realmente vindos da fonte oficial |

Se a API oferecer somente um pacote de despesas, ampliar o contrato explicitamente para esse caso. Não distribuir artificialmente o pacote entre aluguel, condomínio e IPTU.

## Filtros e URL

`q`, `city`, `neighborhood`, `type`, `amenities`, `buildingAmenities`, `bedrooms`, `suites`, `parking`, `minRent`, `maxRent`, `minArea`, `maxArea`, `sort`, `page`.

Listas usam parâmetros repetidos; a leitura também aceita listas separadas por vírgula. Categorias se combinam com AND; cidades/bairros/tipos com OR interno; todas as comodidades selecionadas são exigidas. Contagens são mínimos, áreas são m² e faixas de aluguel na URL são reais por mês (o domínio usa centavos). Texto ignora acentos/caixa. Código exato tem prioridade na relevância, seguido de título e destaque; desempate por código.

`sort`: `relevance`, `price-asc`, `price-desc`, `recent`. Preço ausente fica ao final em ambas as ordenações. O total corresponde ao catálogo filtrado inteiro; não aplicar filtros locais a apenas uma página da API. Confirmar se a API fornece busca, ordenação, total e facetas suficientes; caso contrário, projetar indexação/cache antes de anunciar equivalência.

## Configuração e operação

- `PROPERTY_API_URL` e `PROPERTY_API_TOKEN`: somente servidor; nunca `NEXT_PUBLIC_*`, HTML, logs ou props serializadas.
- `PROPERTY_DATA_SOURCE=api` atualmente falha com mensagem explícita. Implementar a seleção do adaptador quando houver contrato confirmado.
- `APP_MODE=live` atualmente rejeita o catálogo local. Atualizar essa guarda apenas quando registros reais e regras de publicação estiverem preparados.
- `SITE_URL`: origem pública correta para canonical, compartilhamento e mensagens.
- Confirmar autenticação, endpoints, limites, paginação, SLA, timeout, cache e renovação de credenciais. Não há valores presumidos neste projeto.
- Definir atualização/invalidação de disponibilidade e preço. Uma indisponibilidade remota nunca deve retornar fixtures como fallback silencioso.
- Manter diferenciação entre registro inexistente (404), conhecido indisponível (informativo) e falha operacional (erro com recuperação).
- Slugs atuais carregam o código. Um título antigo com o mesmo código redireciona ao canônico; mapear os códigos reais antes de migrar o site existente.

## Checklist de ativação

- [ ] Receber documentação e acesso autorizado da API.
- [ ] Mapear e validar todos os campos, incluindo desconhecidos e periodicidade.
- [ ] Implementar adaptador e rodar a suíte de contrato com respostas de teste reais/sanitizadas.
- [ ] Confirmar filtros, facetas, contagem global, paginação e ordenação.
- [ ] Verificar atualizações de disponibilidade e custos, timeouts e falhas.
- [ ] Trocar mídia e retirar exemplos do catálogo publicável.
- [ ] Revisar canais, privacidade e exposição de localização.
- [ ] Atualizar metadados/noindex/sitemap e marcação de oferta somente para páginas reais elegíveis.
- [ ] Confirmar política de indexação das buscas filtradas e dos imóveis indisponíveis.
- [ ] Mapear URLs antigas e serviços externos antes de mudar o domínio.
- [ ] Executar build, testes de domínio, E2E e comparação visual.

CRM é uma integração separada. O fluxo atual prepara mensagens; um adaptador de leads deverá retornar sucesso real ou erro de entrega, com validação no servidor e política apropriada, sem reaproveitar a abertura de WhatsApp como confirmação de recebimento.
