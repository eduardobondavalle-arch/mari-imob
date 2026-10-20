# Briefing revisado — site Adim com referência visual e funcional da CRI

Versão proposta em 18/09/2026. Este documento será usado para implementação somente quando o usuário solicitar essa etapa. A revisão do briefing não inicia desenvolvimento nem publicação.

## 1. Objetivo e decisões preservadas

Implementar o novo site público da **Adim Aluguéis**, especializado em **locação anual na região de Balneário Camboriú**. Usar a [CRI](https://www.imobiliariacri.com.br/) como referência próxima de composição, hierarquia, navegação e refinamento visual; consultar a [Adim](https://www.adimalugueis.com.br/) como fonte institucional.

Manter estas decisões do briefing original:

- Produto, conteúdo e marca da Adim; jornadas de alugar, anunciar imóvel para locação e falar com um especialista.
- Linguagem de cores da CRI permitida pelo briefing. Essa decisão não autoriza reutilizar código, fotos, vídeos, textos ou identidade da CRI.
- Uso exclusivo da logomarca oficial da Adim, preservando proporções, cores e desenho. Não recriar a marca com texto, IA ou um novo símbolo.
- Primeira entrega com dados demonstrativos locais. A API de imóveis entra em uma etapa posterior.
- Site completo e navegável na primeira entrega, com busca, filtros, detalhes, galerias, páginas institucionais e contato conforme o canal configurado.

Não incluir venda, financiamento, permuta, lançamentos, favoritos, contas próprias, alertas de preço, newsletter, CRM ou pagamentos nesta etapa. Não construir um blog ou portal do cliente novo; os serviços oficiais existentes podem ser mantidos como links configuráveis após verificar seus destinos.

## 2. Fluxo de trabalho e decisões pendentes

1. Inspecionar repositório, instruções locais, scripts, dependências e assets. Preservar uma aplicação existente quando adequada. Na revisão de 18/09/2026, a pasta estava vazia e não continha logo.
2. Inspecionar a referência em navegador, em desktop e mobile, antes da composição visual. Registrar evidências conforme a seção 3.
3. Apresentar uma árvore curta de dependências e uma rodada numerada das decisões que a inspeção não resolver. Para cada pergunta, informar recomendação e o que depende da resposta. Não perguntar fatos verificáveis nos sites ou decisões já fechadas neste briefing.
4. Confirmar o entendimento compartilhado do escopo e das respostas antes de iniciar implementação. Depois dessa confirmação, executar as etapas autorizadas sem reabrir as mesmas decisões; continuar trabalho independente quando houver uma pendência localizada.
5. Apresentar plano de rotas, componentes, dados e testes; implementar em etapas pequenas; executar e verificar o site localmente.
6. Entregar a prévia funcional, documentação e pendências. Publicação e substituição do site atual ficam para uma etapa solicitada pelo usuário.

Decisões a resolver após a inspeção, apenas se ainda pendentes:

| Decisão | Recomendação | Dependência |
| --- | --- | --- |
| Arquivo oficial de marca | Usar o arquivo fornecido pelo usuário; se ausente, propor o ativo identificado no site oficial e confirmar sua versão/uso | Acabamento de cabeçalho, rodapé, favicon e compartilhamento |
| Fotos de demonstração | Usar imagens com licença compatível e origem registrada, claramente ilustrativas | Hero, cards e galeria |
| Atendimento comercial | Propor WhatsApp oficial para locação, com email como alternativa; confirmar o destino pretendido | CTAs e encaminhamento de contato |
| Serviços atuais | Propor preservar acesso ao cliente, documentos, ouvidoria, blog e carreira quando os destinos estiverem disponíveis | Navegação e eventual migração |
| Publicação futura | Definir hospedagem e substituição do domínio quando a publicação entrar no escopo | Deploy, redirecionamentos e indexação pública |

São propostas para decisão, não aprovações já concedidas. A API futura não bloqueia a implementação do repositório local. Sem logo, pode-se avançar na estrutura; não considerar a identidade visual concluída. Sem canal de contato configurado, não simular atendimento funcional.

## 3. Inspeção da referência e direção visual

Examinar início, menus, busca, filtros, listagem, detalhe, institucional, contato, estados de carregamento/vazio/erro e interações acessíveis sem enviar formulários. Usar pelo menos 1440 px e 390 px de largura para a comparação principal e verificar o novo site também a 360 px e 768 px.

Criar `docs/inventario-referencia.md` com URL, data, viewport e evidência; separar:

- **Observado:** comportamento ou aparência efetivamente inspecionado.
- **Inferido:** hipótese ainda não validada.
- **Adaptado:** decisão própria para a jornada de locação da Adim.
- **Inacessível:** página ou estado que não pôde ser verificado, com motivo.

Extração textual não comprova aparência, responsividade, comportamento de menus ou filtros. Se o navegador não estiver disponível ou a referência falhar, registrar a limitação, prosseguir na investigação possível e resolver a evidência visual antes de afirmar fidelidade à referência. Não presumir testes que não foram executados.

Extrair cores, família e pesos tipográficos, espaçamentos, largura de conteúdo, bordas, raios e quebras responsivas por inspeção visual e estilos computados. Centralizar tokens. Documentar substituições de fontes sem licença disponível e ajustes necessários para legibilidade e contraste.

Manter proximidade com o ritmo, grid, hero, cards, navegação, galerias e rodapé da CRI. Adaptar textos e imagens à Adim. Não reutilizar mascote, marca, contatos, CRECI, imóveis, fotos ou código da CRI. Registrar origem e condições de uso das imagens em `docs/assets.md`; não usar fotos de imóveis reais de terceiros para representar ofertas fictícias.

## 4. Marca e conteúdo institucional

Centralizar marca, contatos, unidades, redes, links externos e informações legais em `src/config/site.ts` ou equivalente. Registrar a fonte e a data de conferência em documentação. Diferenciar dado observado no site oficial de decisão operacional confirmada para o novo site.

- Usar linguagem própria da Adim e chamadas pertinentes à locação anual.
- Publicar história, serviços e diferenciais apenas com base verificável. Não inventar estatísticas, depoimentos, horários, garantias ou condições comerciais.
- Omitir campos institucionais ausentes na interface; registrar a pendência na configuração/documentação. Evitar expor placeholders como se fossem dados reais.
- Usar a logo oficial no cabeçalho e rodapé. Para favicon e imagem de compartilhamento, usar versões oficiais adequadas; não recortar ou recolorir a marca para improvisar um símbolo.
- Links de blog, carreira, documentos e portal do cliente podem apontar para serviços existentes. Verificar o destino; se o domínio atual for substituído, preservar a rota/serviço ou planejar sua migração para não criar links quebrados ou circulares.
- Não criar uma política de privacidade fictícia. A rota de privacidade deve apresentar conteúdo fornecido/aprovado pela Adim ou direcionar para uma política oficial aplicável ao fluxo implementado; registrar alterações necessárias antes de coleta real.

## 5. Rotas e comportamento

| Rota | Entrega |
| --- | --- |
| `/` | Hero editorial, busca, atalhos válidos, destaques, proprietários, apresentação institucional e rodapé |
| `/buscar` | Busca combinável, filtros persistidos na URL, ordenação, contagem e paginação |
| `/imovel/[slug]` | Detalhe com código estável, galeria, custos, comodidades, similares e contato contextual |
| `/sobre` | Conteúdo institucional verificado em composição editorial |
| `/proprietarios` | Serviços e benefícios verificáveis, etapas de atendimento e CTA de captação |
| `/contato` | Canais oficiais, unidades conhecidas e formulário de encaminhamento |
| `/privacidade` | Conteúdo aprovado ou encaminhamento para política oficial aplicável |

**Cabeçalho e início.** Busca por código, bairro, cidade, edifício ou termo; menus de imóveis, proprietários e conteúdos; atendimento; menu mobile funcional. Atalhos de cidade, bairro e tipo gerados com base no catálogo. Destaques usam o mesmo repositório da busca. Omitir blocos sem conteúdo válido. Rodapé reúne navegação, canais, unidades e redes disponíveis.

**Busca.** Oferecer texto/código, cidade, bairro, tipo, quartos, suítes, vagas, aluguel mínimo/máximo, área mínima/máxima, atributos do imóvel e do condomínio. Usar parâmetros documentados, validação e uma única função de normalização compartilhada entre interface e repositório.

- Categorias diferentes combinam com AND. Múltiplas cidades, bairros ou tipos combinam com OR dentro da categoria. Comodidades selecionadas são cumulativas: o imóvel deve possuir todas. Quartos/suítes/vagas são mínimos, com rótulos como “2 ou mais”.
- Valores mínimo/máximo são inclusivos. Campos desconhecidos não satisfazem um filtro numérico ativo. Faixas invertidas recebem mensagem de validação. Parâmetros malformados não provocam erro de servidor; informar o ajuste ou rejeição de forma consistente.
- Texto ignora acentos e diferenças entre maiúsculas/minúsculas. Código exato tem prioridade. Documentar os campos pesquisáveis e o cálculo simples de relevância.
- Oferecer relevância, aluguel crescente/decrescente e mais recentes; usar desempate estável por código/id. Imóveis sem aluguel informado ficam ao final das ordenações por preço.
- Começar com paginação de 6 registros. Trocar filtro ou ordenação retorna à primeira página. Contagem corresponde ao total filtrado, e a ordenação acontece antes de paginar.
- URL é a fonte de estado confirmado: filtros, ordenação e página sobrevivem a recarga, compartilhamento e voltar/avançar. No mobile, alterações no painel são rascunho até “Aplicar”; cancelar preserva a busca anterior.
- Exibir apenas opções presentes no catálogo elegível, restringindo bairros às cidades selecionadas. Quando a cidade muda, remover bairros incompatíveis. Uma combinação válida pode resultar em zero imóveis; manter os filtros selecionados para permitir correção.
- Incluir breadcrumbs, limpar filtros e estados de carregamento, vazio e erro com recuperação. Um erro do repositório não deve aparecer como “nenhum imóvel encontrado”.

**Cards.** Foto principal, localização pública, título, código, quartos/suítes/vagas/área conhecidos, aluguel em BRL e CTA de detalhe. Identificar dados demonstrativos no próprio card. Setas navegam por fotos realmente distintas; com uma foto, omitir setas. Botões da galeria não acionam o link do imóvel; evitar elementos interativos aninhados. Prever imagem ausente ou com falha, sem mostrar fatos desconhecidos como zero.

**Detalhe.** Slug com código estável; galeria com lightbox, miniaturas, contagem, teclado, fechamento por Escape, contenção e retorno de foco. Incluir descrição expansível, características, custos discriminados, comodidades separadas entre imóvel/condomínio e edifício quando houver dados. Renderizar tour/vídeo somente com mídia válida.

Exibir bairro/cidade por padrão. Endereço exato e coordenadas dependem da configuração de exposição e de dados autorizados; não inventar coordenadas de demonstração. Mapa só com condições e configuração adequadas. Incluir compartilhar com alternativa de copiar link e feedback de sucesso/falha. CTA persistente não pode cobrir conteúdo ou controles no mobile.

Registro inexistente: HTTP 404 real. Código conhecido com slug antigo: redirecionar para o canônico quando houver mapeamento. Imóvel conhecido e indisponível: informar indisponibilidade, retirar CTA de locação daquele imóvel e oferecer similares; não aparecer em busca/destaques. Regras de retenção e indexação desses registros serão confirmadas na integração.

**Sobre e proprietários.** Texto próprio e fatos documentados. Timeline apenas com marcos verificados. Não prometer aprovação de cadastro, aluguel garantido ou prazos não confirmados. Captação pode usar contato contextual; não adicionar upload de documentos nem backend nesta entrega.

**Contato.** Nome, email, telefone e mensagem com labels, validação e erros acessíveis. Exigir nome, mensagem e o canal de retorno necessário ao encaminhamento; não exigir simultaneamente email e telefone sem necessidade definida. Explicar o destino e o funcionamento do encaminhamento.

Links de cidade/bairro usam `/buscar` e query string, com títulos específicos. Não criar páginas artificiais ou vazias para SEO. Páginas próprias de edifícios ficam fora da primeira entrega, salvo existência de dados e propósito confirmado.

## 6. Dados e custos

Criar tipos `Property`, `PropertyMedia`, `PropertyCosts`, `PropertyLocation`, `Building` e `PropertySearchParams`.

| Informação | Regra |
| --- | --- |
| Identidade | id e código únicos, slug estável com código, `isDemo` explícito |
| Elegibilidade | Finalidade `annual-rent`, status de publicação separado da disponibilidade |
| Conteúdo | Título, descrição, tipo, cidade e bairro normalizados; aliases apenas para pesquisa |
| Características | Quartos, suítes, vagas e área útil em m² quando conhecidos; desconhecido é `null`/ausente, nunca zero por padrão |
| Valores | Inteiros em centavos de BRL; aluguel, condomínio, IPTU e outras despesas separados |
| Periodicidade | Mensal/anual/outra ou desconhecida por despesa; não presumir periodicidade do IPTU |
| Mídia | id, tipo, URL, alt, dimensões quando disponíveis, ordem e origem/licença |
| Localização | Cidade/bairro obrigatórios; rua, número e coordenadas opcionais, com regra explícita de exposição |
| Edifício | Vínculo opcional com características próprias; não duplicar prédio a partir de strings inconsistentes |
| Datas e seleção | Datas reais de publicação/atualização para ordenação; destaque e selo configuráveis |

Valor zero explicitamente informado é diferente de valor desconhecido. Se a fonte informar somente um pacote total, identificá-lo como tal e não inventar sua decomposição.

O filtro de preço e a ordenação usam **aluguel mensal**, não a soma de despesas. Apresentar cada despesa com sua periodicidade. Mostrar um total mensal estimado apenas quando os componentes estiverem definidos e a conversão fizer sentido; IPTU anual dividido por 12 é estimativa, não promessa de parcela. Sem todos os componentes, apresentar subtotal dos valores conhecidos e identificar o que falta. Informar que valores e disponibilidade precisam de confirmação.

Criar ao menos 12 registros fictícios variados para exercitar duas páginas, combinações, similares e mídias diferentes. Usar códigos como `DEMO001` e nomes de edifícios explicitamente fictícios. Cobrir campos opcionais ausentes, custo zero, IPTU anual, uma única foto e foto ausente. Preços fictícios são permitidos **somente nesse conjunto identificado**. Não atribuir disponibilidade real, endereço exato ou propriedade das fotos à Adim.

## 7. Repositório e integração futura

Usar uma interface assíncrona `PropertyRepository`, consumida no servidor, com:

- `search(params)`: itens, total, página, tamanho de página e opções/facetas conforme a regra documentada.
- `getBySlug(slug)`: registro ou ausência; falha de integração deve ser distinguível de registro inexistente.
- `getFeatured()`: registros elegíveis com ordenação explícita.
- `getSimilar(id)`: mesma finalidade, publicado, disponível e diferente do atual; priorizar mesma cidade/tipo, proximidade de quartos e aluguel, com desempate estável. Retornar até 3 e omitir a seção se não houver correspondência suficiente.

Compartilhar validação, elegibilidade e normalização entre os métodos. Componentes não importam o array local diretamente. Manter um conjunto de testes do contrato para reutilizar no futuro adaptador.

Configuração proposta, ajustável à stack escolhida:

- `APP_MODE=demo|live` e `PROPERTY_DATA_SOURCE=local|api`.
- `SITE_URL` para URLs absolutas; não apontar canonicals locais para o site oficial por padrão.
- `PROPERTY_API_URL` e `PROPERTY_API_TOKEN`, acessíveis somente no servidor e sem prefixo de exposição ao cliente.

Entregar `.env.example` sem segredos. A primeira entrega implementa o modo demo/local. Selecionar API ainda não implementada deve produzir erro de configuração claro; não retornar mocks silenciosamente. Modo live com dados demonstrativos deve ser rejeitado. Não confundir `NODE_ENV=production` com modo live: o build de produção da demonstração precisa funcionar.

Documentar em `docs/integracao-api.md`: mapeamento e tipos; autenticação e endpoints ainda desconhecidos; disponibilidade; periodicidade de custos; fotos; localização pública; paginação; filtros; ordenação; atualização/cache; timeouts; erros; limites; identificadores e migração de slugs. Não inventar contrato externo nem chamar interfaces privadas dos sites de referência.

Ao integrar, não carregar apenas uma página da API para depois fingir busca/ordenação sobre o catálogo inteiro. Confirmar suporte remoto ou uma estratégia de indexação adequada. Não usar dados demonstrativos como fallback de falhas reais.

## 8. Demonstração, atendimento e privacidade

No modo demo, apresentar aviso global visível: “Ambiente de demonstração. Imóveis, fotos e valores ilustrativos; não representam ofertas disponíveis.” Repetir a identificação nos cards e detalhes e incluí-la ao compartilhar um imóvel fictício.

O contato contextual inclui código, título e link. Para imóveis fictícios, identificar a demonstração na mensagem e convidar a consultar opções reais; não enviar pedido de visita a uma oferta inexistente como se fosse real.

Enquanto não houver backend, o formulário prepara uma mensagem para **WhatsApp ou email configurado**, aberta por ação explícita do visitante. Usar botão como “Continuar no WhatsApp” ou “Abrir no aplicativo de email”. Abrir o aplicativo não comprova envio: não mostrar “recebemos sua mensagem”, número de protocolo ou confirmação de entrega.

Oferecer alternativa de copiar a mensagem se o aplicativo não abrir e informar o destino. Tratar caracteres especiais, acentos e limites razoáveis de tamanho. Campos do formulário não devem virar parâmetros das URLs internas, logs ou armazenamento persistente do site. O encaminhamento externo deve ser explicado ao visitante.

Sem canal configurado, informar indisponibilidade e não oferecer um envio fictício. Testes usam dados sintéticos e validam o link/mensagem preparados, sem enviar mensagens reais. A integração futura de CRM terá contrato próprio de envio, sucesso e erro. Não adicionar rastreadores, captura de leads ou consentimentos de marketing sem definição dessa funcionalidade.

## 9. SEO, acessibilidade e desempenho

Usar renderização no servidor ou geração estática para conteúdo indexável. Se o repositório continuar vazio, Next.js, TypeScript e Tailwind CSS são uma recomendação de stack; escolher versões estáveis e compatíveis no início da implementação e registrar a versão de Node e o lockfile.

Definir títulos, descriptions, canonical e Open Graph por rota, `lang=pt-BR`, moeda BRL e fuso `America/Sao_Paulo` quando necessário. JSON-LD institucional e breadcrumbs devem refletir fatos e conteúdo renderizado. Ofertas estruturadas só entram com imóveis reais elegíveis.

**Modo demo:** aplicar `noindex` a todas as páginas da prévia, inclusive início e busca, pois também exibem fixtures; não incluir URLs demonstrativas em sitemap nem gerar marcação de oferta. `robots.txt` sozinho não garante desindexação; não bloquear o acesso do crawler a páginas cujo `noindex` precisa ser lido. A regra deve ser verificável no HTML/header entregue. [Referência técnica: Google Search Central](https://developers.google.com/search/docs/crawling-indexing/block-indexing).

**Modo live futuro:** sitemap apenas com URLs canônicas publicáveis e reais. Buscas arbitrárias, filtros e ordenações não geram automaticamente páginas indexáveis; inicialmente usar `noindex` para buscas filtradas. Landing pages por cidade/bairro exigem conteúdo útil e política explícita posterior. Canonical não deve transformar toda busca distinta em cópia da home.

Reutilizar `Header`, `MegaMenu`, `MobileMenu`, `SearchBar`, `FilterPanel`, `PropertyCard`, `PropertyGallery`, `ContactCTA`, `Breadcrumbs`, `Footer` e feedbacks. Usar landmarks, hierarquia de títulos, labels, foco visível, teclado, anúncio de estados, contraste e movimento reduzido. Painéis e modais devem restaurar foco e não prender o visitante indevidamente. Nenhum botão decorativo ou link `#` sem destino.

Otimizar imagens com tamanhos responsivos, dimensões reservadas e carregamento tardio fora da dobra. Não carregar todas as fotos de todos os cards na primeira renderização. Evitar bibliotecas grandes para interações simples e verificar deslocamentos de layout.

## 10. Verificação e critérios de aceite

Executar lint, typecheck e build com comandos registrados no README. Testes de maior risco devem verificar:

1. Busca por código, texto com/sem acento, combinações AND/OR e comodidades cumulativas.
2. Limites de valores, faixas inválidas, campos desconhecidos e dependência cidade/bairro.
3. Serialização da URL, recarga, voltar/avançar, aplicar/cancelar no mobile e reinício da paginação.
4. Ordenação antes da paginação, contagem, empate estável e estado vazio.
5. Detalhe existente, HTTP 404, imóvel indisponível, destaques e similares coerentes.
6. Centavos/BRL, aluguel versus despesas, IPTU anual, zero versus desconhecido e subtotal incompleto.
7. Galeria por teclado, foco, foto ausente e navegação dos cards sem disparos indevidos.
8. Mensagem contextual de demonstração, validação do formulário e ausência de confirmação falsa de envio.
9. Falha controlada e recuperável do repositório, separada do estado vazio; induzir falha no teste, sem expor um interruptor público de erro.
10. `noindex` da prévia, ausência de URLs fictícias no sitemap/ofertas e bloqueio de modo live com fixtures.

Verificar manualmente navegação desktop/mobile e por teclado. Capturar início, busca com filtros, detalhe e menu/painel mobile nas larguras de comparação. Registrar diferenças observadas em relação à CRI e adaptações à Adim. Descrição textual não substitui uma inspeção visual que não foi realizada.

A primeira entrega estará concluída quando todas as rotas e fluxos previstos funcionarem localmente, com identidade oficial aplicada, fixtures identificadas, canais configurados, verificações aprovadas e documentação reproduzível. Pendências externas devem ser explicitadas; não declarar concluída a parte que depende delas.

## 11. Entrega e publicação posterior

Entregar README com instalação, configuração e execução; rotas; arquivos principais; decisões; limitações; comparação visual; resultados dos testes e documentos de referência, assets e API. A demonstração deve poder rodar em desenvolvimento e após build.

Antes de substituir o site atual, em etapa futura, revisar: dados reais; contatos e assets finais; política aplicável; indexação; disponibilidade/preços; hospedagem; domínio; serviços existentes; URLs antigas e redirecionamentos individuais. Inventariar padrões atuais como `/aluguel/...` e `/imovel/<slug>/<id>`; preservar identificadores e não redirecionar indiscriminadamente todos os imóveis antigos para a home.

## 12. Referências e limites desta revisão

- [CRI — início](https://www.imobiliariacri.com.br/)
- [CRI — busca](https://www.imobiliariacri.com.br/buscar?city=balneario-camboriu)
- [CRI — exemplo de detalhe indicado no original](https://www.imobiliariacri.com.br/imovel/apartamento-a-venda-com-3-suites-no-shard-tower-em-itapema-IM02038)
- [CRI — empreendimento, apenas referência estrutural](https://www.imobiliariacri.com.br/empreendimento/mirage-residence-EMP00070)
- [CRI — institucional](https://www.imobiliariacri.com.br/sobre-nos)
- [CRI — contato](https://www.imobiliariacri.com.br/contato)
- [Adim — início](https://www.adimalugueis.com.br/)
- [Adim — institucional](https://www.adimalugueis.com.br/sobre)
- [Adim — contato](https://www.adimalugueis.com.br/contato)
- [Adim — documentos](https://www.adimalugueis.com.br/documentos)
- [Adim — carreira](https://www.adimalugueis.com.br/trabalhe-conosco)
- [Adim — política atual](https://www.adimalugueis.com.br/politica-privacidade)

Na revisão de 18/09/2026, as páginas institucionais e de contato foram consultadas por extração textual. A home da Adim apresentou timeout no acesso direto, embora conteúdo indexado estivesse disponível; a busca da CRI retornou “Carregando...” e o detalhe indicado não pôde ser acessado pela ferramenta. O link de blog foi identificado no site oficial, mas seu conteúdo não foi recuperado. Esses resultados não comprovam indisponibilidade para visitantes. Não houve inspeção visual desktop/mobile, medição de tokens ou validação de filtros nesta revisão; essa etapa permanece prevista antes da implementação visual.
