# Verificação da entrega

Ambiente local: Windows, Node.js 24.19.0, npm 11.17.0 e Chrome. Aplicação testada também com `next start`, após build de produção. O build remoto da Vercel terminou com sucesso.

## Código e regras

- ESLint: aprovado.
- TypeScript: aprovado, incluindo a verificação do build final.
- Vitest: 23 testes aprovados em dois arquivos, cobrindo as regras locais e o mapeador disponível no projeto.
- Build Next.js: aprovado localmente e na Vercel.

O mapeador de Imoview disponível no projeto ainda não está conectado ao repositório ativo. O catálogo servido continua sendo exclusivamente demonstrativo.

## Navegação e comportamento

Na execução funcional final em desktop e mobile: 11 testes aprovados e um ignorado intencionalmente, pois o caso de menu mobile não se aplica ao desktop. Os dois casos de navegação e capturas haviam passado na execução anterior; após os ajustes visuais, todas as páginas foram novamente visitadas pelo script de verificação visual.

Cobertura dos fluxos: combinação de filtros, URL e recarga, ordenação e voltar, busca por código, resultado vazio, paginação, HTTP 404, galeria por teclado, retorno do foco, composição dos custos, mensagem contextual, validação do contato, preparação de mensagem, menu e cancelamento de filtros mobile, diretivas de indexação, sitemap e encaminhamento da política de privacidade.

Nenhuma mensagem real foi enviada pelos testes.

## Layout, imagens e acessibilidade

`node scripts/verify-visual.mjs` verificou início, busca, detalhe, contato, sobre e proprietários nas larguras de 1440, 390, 360 e 768 pixels: 24 combinações, sem excesso de largura horizontal ou imagens visíveis quebradas.

O Axe verificou as seis páginas em desktop de 1440 pixels e mobile de 390 pixels, com os conjuntos WCAG 2 A/AA e 2.1 AA: nenhuma violação automática detectada nas 12 combinações. Essa análise automática não equivale a uma auditoria completa de acessibilidade.

Evidências: [relatório JSON](verificacao-visual.json) e capturas em `docs/capturas/`. As imagens carregadas sob demanda foram ativadas com rolagem antes da captura. Houve inspeção visual das capturas de início e busca, além dos fluxos de teclado exercitados nos testes.

## Prévia pública

Endereço: https://adim-alugueis-preview.vercel.app

Requisições sem autenticação confirmaram HTTP 200 no início, busca por código, sobre, proprietários, contato, `robots.txt` e `sitemap.xml`. As páginas HTML verificadas incluem `noindex`.

O Chrome também abriu o início publicado em desktop e mobile: imagem principal carregada, sem excesso de largura e sem erros JavaScript observados. Capturas: `docs/capturas/publicado-1440.png` e `docs/capturas/publicado-390.png`.

Seis testes E2E executados diretamente na URL pública passaram: busca combinada com URL/recarga/ordenação/voltar, galeria por teclado com custos e CTA contextual, e indexação/sitemap/privacidade, nos dois tamanhos de tela. A inspeção adicional identificou que as URLs individuais de deployments exigem login; `SITE_URL` foi então fixado no endereço público estável em `vercel.json`, para uso nos metadados e nos links de imóveis das mensagens.

Após a atualização final, o Chrome confirmou a URL canônica pública no início e no detalhe. A mensagem contextual contém o mesmo endereço público do imóvel, e uma requisição sem autenticação para esse endereço retornou HTTP 200 sem redirecionar para login. A publicação final está em estado `READY` na Vercel.

## Limites da entrega

O catálogo é fictício, as fotos são ilustrações e o formulário apenas prepara uma mensagem para o visitante concluir o envio. Integração com API, CRM, recebimento de leads, conteúdo definitivo e migração do domínio oficial permanecem fora da prévia publicada. Veja [integração da API](integracao-api.md) e [publicação](publicacao.md).
