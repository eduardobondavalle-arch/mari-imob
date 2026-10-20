# Publicação da prévia

- Endereço público: https://adim-alugueis-preview.vercel.app
- Projeto: `adim-alugueis-preview`, na equipe `eduardo-0639` da Vercel.
- Painel: https://vercel.com/eduardo-0639/adim-alugueis-preview
- Identificador da publicação final verificada: `dpl_6A7rhNQeJSjPYLEf5oKJ9LvZxFqZ`.
- Estado informado pela Vercel: `READY`.

O usuário autorizou publicar uma prévia na Vercel. Foi criado um projeto separado dos demais projetos da conta, com endereço público próprio. O domínio oficial da Adim não foi alterado.

O alvo técnico da Vercel é `production` para disponibilizar o endereço estável do projeto. A aplicação permanece em **demonstração**, com `APP_MODE=demo` e `PROPERTY_DATA_SOURCE=local` definidos em `vercel.json` tanto para o build quanto para a execução. Todas as páginas entregam `noindex` e os imóveis são explicitamente fictícios.

O build remoto executa `npm ci` e `npm run build`. A configuração detecta Next.js e publica as páginas estáticas e as rotas de busca/detalhe com renderização no servidor. `.vercelignore` exclui arquivos de ambiente, testes, documentação, capturas, dependências e artefatos locais do envio.

## Atualizar a prévia

Na pasta do projeto, com a mesma conta da Vercel autenticada:

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd test
npm.cmd run build
npm.cmd exec --yes --package vercel -- vercel deploy --prod --yes --scope eduardo-0639
```

O vínculo local fica em `.vercel/`, excluído do controle de versão. Ao configurar outro computador, vincule explicitamente o projeto `adim-alugueis-preview` na equipe `eduardo-0639`. Credenciais e arquivos `.env` devem permanecer locais.

Os links absolutos usam `SITE_URL`, definido em `vercel.json` como `https://adim-alugueis-preview.vercel.app`. Isso mantém os metadados e os links de imóveis nas mensagens no endereço público estável, pois as URLs individuais de deployments exigem login nesta conta. A proteção das URLs individuais foi preservada. Para uma futura migração ao domínio oficial, atualizar `SITE_URL` faz parte da ativação.

As verificações realizadas estão em [verificação da entrega](verificacao.md). A preparação para o catálogo real está em [integração da API](integracao-api.md).
