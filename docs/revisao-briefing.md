# Revisão do briefing Adim

Data: 18/09/2026. Escopo solicitado: revisar o documento antes de implementar.

Original: `C:\Users\eduar\Downloads\Prompt_Codex_Site_Adim_Referencia_CRI.md`.

Proposta completa: [Prompt_Codex_Site_Adim_Revisado.md](../Prompt_Codex_Site_Adim_Revisado.md). O original foi preservado. Foram criados somente documentos; a implementação do site não foi iniciada.

## Avaliação

O briefing original define bem a direção: proximidade visual com a CRI, marca oficial da Adim, locação anual, catálogo demonstrativo e separação da API. A revisão preserva essa direção e torna verificáveis os pontos que ainda permitiam implementações divergentes.

As regras detalhadas abaixo são propostas da revisão. Não representam novas decisões de negócio já aprovadas pelo usuário.

## Ajustes principais

| Ponto do original | Problema ou lacuna | Ajuste proposto |
| --- | --- | --- |
| “Não invente preços” e catálogo fictício obrigatório | Pode impedir os próprios dados de demonstração | Autorizar valores fictícios apenas em registros explicitamente demonstrativos |
| Indexação bloqueada nas páginas dos imóveis fictícios | Home e busca também exibem esses imóveis | `noindex` em toda a prévia, sem ofertas estruturadas ou URLs fictícias no sitemap |
| Logo oficial fornecida no projeto | A pasta está vazia; não há arquivo de marca | Tornar a origem/versão do arquivo uma dependência explícita, sem redesenho |
| Filtros combináveis | Não define mínimos, múltipla seleção, desempates ou campos ausentes | Documentar AND/OR, comodidades cumulativas, limites, paginação e normalização |
| Aluguel, condomínio e IPTU separados | Não define periodicidade, pacote ou total incompleto | Centavos de BRL, periodicidade por despesa e distinção entre subtotal e estimativa |
| WhatsApp contextual em imóveis fictícios | Pode gerar solicitação comercial sobre uma oferta inexistente | Identificação de demonstração também na mensagem e no compartilhamento |
| Formulário sem backend | Abrir email/WhatsApp não comprova envio | Rótulos de encaminhamento, alternativa de cópia e ausência de confirmação falsa |
| API depois | Não define falha de configuração nem fallback | Contrato assíncrono; demo explícita; rejeitar modo live com fixtures; não mascarar falha com mocks |
| Rotas novas | Não trata URLs e serviços do site atual | Acrescentar inventário de migração para a futura publicação |
| “Visual muito próximo” | Aceite subjetivo e risco de confundir extração textual com inspeção visual | Evidências por viewport, comparação de telas e registro de limitações |
| Rodadas de perguntas | Pode repetir decisões ou bloquear trabalho independente | Preservar confirmação inicial, limitar perguntas ao que falta e explicitar dependências |

O tratamento de `noindex` segue a [documentação do Google](https://developers.google.com/search/docs/crawling-indexing/block-indexing): bloquear o rastreamento em `robots.txt` pode impedir a leitura da diretiva. A revisão não apresenta `noindex` como controle de acesso.

## Informações localizadas no site oficial

A [página institucional da Adim](https://www.adimalugueis.com.br/sobre) informa início em abril de 2010, foco em locação anual e união com o Grupo CRI em 2024. Esses fatos permitem preparar conteúdo institucional sem inventar uma história.

Na [página de contato](https://www.adimalugueis.com.br/contato), foram encontrados:

| Campo | Informação publicada |
| --- | --- |
| WhatsApp | (47) 9 3505-0560 |
| Comercial Balneário Camboriú | (47) 3367-0202 |
| Comercial Itapema | (47) 2033-4629 |
| Administrativo | (47) 3515-0359 |
| Email | sac@adimalugueis.com.br |
| Endereço | Avenida Brasil, 2016, Centro, Balneário Camboriú, CEP 88330-050 |
| CRECI publicado | 3235J |

São informações publicadas pela empresa, não confirmação do destino desejado para cada novo formulário. Recomenda-se usar o WhatsApp comercial como proposta para a próxima decisão de atendimento.

Também existem páginas oficiais de [carreira](https://www.adimalugueis.com.br/trabalhe-conosco), [documentos](https://www.adimalugueis.com.br/documentos) e [privacidade](https://www.adimalugueis.com.br/politica-privacidade). A navegação institucional aponta para [blog](https://www.adimalugueis.com.br/blog), área do cliente e ouvidoria. A existência desses links não valida sua operação nem exige reconstruir esses serviços no novo site.

## O que ainda precisa de decisão ou inspeção

1. **Marca e imagens:** obter o arquivo oficial correto e definir a origem das imagens ilustrativas. Recomendação: logo fornecida pela Adim e imagens com licença documentada.
2. **Atendimento:** definir o destino comercial do novo fluxo. Recomendação: WhatsApp para locação e email como alternativa.
3. **Serviços existentes:** decidir quais acessos permanecem na navegação. Recomendação: preservar os serviços úteis com destinos válidos, prevendo sua continuidade ao trocar o domínio.
4. **Visual:** inspecionar de fato desktop/mobile e estados interativos. A revisão atual consultou texto, sem capturas nem medição de cores/fontes; isso não permite aprovar fidelidade visual.
5. **Publicação:** hospedagem, migração e ativação da API entram em etapa posterior. Não bloqueiam a prévia local.

Esses itens estão registrados para a próxima etapa; nenhuma pergunta adicional é necessária para concluir esta revisão documental.

## Verificação realizada

Leitura integral do original; inspeção da pasta e das instruções locais disponíveis; consulta às páginas públicas citadas; revisão de consistência entre escopo, rotas, dados, contato e aceite; conferência dos arquivos gerados. Não houve alteração de aplicativo, envio de formulários, integração ou publicação.
