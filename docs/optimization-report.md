# Relatório técnico de otimização — Mari Imob

**Data do relatório:** 22 de outubro de 2026

**Branch de trabalho:** `optimization/technical-hardening`

**Base auditada:** `a23c10025c02958e4823218772762d1da38572d4`
**Stack:** Next.js 16.4.2, React 19.2, TypeScript 5.9, Prisma 7.10, PostgreSQL, Sharp e armazenamento local/Supabase/S3

## 1. Resumo executivo

Esta etapa reforça segurança, desempenho, indexação e manutenção sem reconstruir o produto ou alterar suas URLs públicas. A mudança funcional deliberada é a retirada do SMS/OTP do cadastro convencional. O novo cadastro cria uma sessão opaca vinculada ao navegador; informar um telefone já existente não autentica o visitante nem libera dados ou favoritos de outra pessoa.

Os principais ganhos mensuráveis foram a redução de **67,5%** no conjunto de imagens estáticas auditado e uma redução indicativa de **30,2%** no tempo do build local. O JavaScript produzido no build final medido caiu para 882.576 bytes; essa medição é local e pode variar conforme a versão do compilador e o cache. As consultas independentes da busca passaram a executar em paralelo, a página inicial deixou de carregar todo o conjunto de facetas da busca e foram adicionados índices dirigidos aos filtros e ordenações reais.

Também foram corrigidos riscos de identificação de IP atrás de proxy, enumeração temporal no login administrativo, redefinição insegura de senha, sobrescrita de dados de leads por formulários anônimos, exposição de fotografias vinculadas à captação de proprietários e detecção incompleta do ambiente de produção na Vercel.

Não há medição de campo suficiente para afirmar que as metas de LCP, INP e CLS foram atingidas. Não foram realizados testes de carga ou benchmark controlado no Supabase/Vercel; esses itens permanecem no checklist de produção.

## 2. Auditoria e decisões

| Prioridade | Problema identificado | Impacto | Tratamento nesta branch |
| --- | --- | --- | --- |
| Crítica | A retirada ingênua do OTP poderia transformar o telefone em credencial e permitir tomada de conta | Exposição de seleção, solicitações e dados pessoais | Sessão opaca por navegador; telefone duplicado retorna recuperação assistida e nunca cria sessão |
| Alta | Fotografias de captação, rascunhos e uploads órfãos podiam receber cache público imutável | Exposição de material privado | Somente mídia ligada a imóvel publicado, notícia publicada ou configuração publicada é pública; demais objetos exigem sessão administrativa e recebem `private, no-store` |
| Alta | `requestIp()` podia confiar no cabeçalho errado ou agrupar usuários de forma imprevisível | Bypass ou bloqueio indevido do rate limit | Uso do cabeçalho específico da Vercel, validação IPv4/IPv6 e confiança em `X-Forwarded-For` somente com proxy explicitamente confiável |
| Alta | Script de redefinição administrativa possuía fallback para `Admin` e mantinha sessões existentes | Comprometimento administrativo | Senha explícita de 12+ caracteres, troca obrigatória e revogação transacional das sessões |
| Alta | Login administrativo tinha custo diferente para conta existente e inexistente | Enumeração por tempo de resposta | Uma verificação `scrypt` ocorre em ambos os caminhos usando hash fictício estático |
| Alta | Consultoria e captação podiam sobrescrever identidade/origem de um lead já existente | Corrupção silenciosa de CRM e consentimento | Consentimento obrigatório na consultoria; atualizações preservam nome, origem e consentimento anteriores |
| Alta | Produção dependia apenas de `APP_ENV`; uma implantação Vercel sem essa variável podia ficar com `noindex` | Site público fora do índice de busca | Na Vercel, `VERCEL_ENV` tem precedência e somente `production` indexa; fora dela, usa-se `APP_ENV=production` |
| Média | Página inicial usava a consulta completa de busca, inclusive contagem e facetas | Consultas e latência desnecessárias | Consulta dedicada aos seis destaques da home |
| Média | Consultas independentes do catálogo eram sequenciais | Maior tempo de resposta | Contagem, resultados, localidades, tags, cidades e taxonomias são iniciados em paralelo quando possível |
| Média | Conteúdo e anúncio podiam ser consultados mais de uma vez na mesma renderização | Trabalho repetido por requisição | Deduplicação por `React.cache` no conteúdo e no anúncio público |
| Média | Faltavam índices compostos para destaque, preço, atividade, sessão e contatos | Mais varreduras e ordenações no PostgreSQL | Migração aditiva com sete índices orientados aos acessos observados |
| Média | PNGs estáticos de demonstração eram muito maiores que o necessário | Banda, armazenamento e LCP | Conversão dos padrões para WebP e atualização das referências |
| Média | Imagens recebiam prioridades e `sizes` genéricos | Downloads maiores ou antecipados sem necessidade | `sizes` contextual, preload somente na imagem principal e lazy loading das regiões abaixo da dobra |
| Média | CSP de produção permitia `unsafe-eval` e não havia HSTS explícito | Superfície adicional para execução de script e downgrade | `unsafe-eval` restrito ao desenvolvimento; HSTS em produção |
| Baixa | Consultoria incorporada podia introduzir múltiplos `h1` | Semântica e acessibilidade | O componente incorporado usa `h2`; a página própria continua com `h1` |

## 3. Cadastro sem SMS e sessões de clientes

O Twilio e as rotas públicas de envio/validação de OTP deixaram de participar do fluxo. As variáveis correspondentes não são mais exigidas no build, no setup local ou na demonstração. A tabela histórica `OtpChallenge` foi preservada para não destruir dados; desafios expirados continuam contemplados pela rotina de manutenção.

O fluxo atual funciona assim:

1. O visitante informa primeiro nome, telefone válido e consentimento.
2. Um telefone novo cria lead, seleção e item inicial em uma transação.
3. O servidor cria um token aleatório, persiste somente seu resumo criptográfico e envia o token em cookie `HttpOnly`, `SameSite=Lax`, `Secure` em HTTPS/produção e prioridade alta.
4. A sessão de cliente expira em 30 dias e a administrativa em 8 horas.
5. Um visitante que informe um telefone existente sem possuir a sessão original recebe indicação de recuperação assistida; nenhuma sessão é criada e nenhum dado privado é retornado.
6. Um cliente já autenticado pode continuar adicionando imóveis sem recriar sua identidade.
7. Logout, expiração e exclusão da conta invalidam o acesso correspondente.

A recuperação automática em outro dispositivo não foi implementada porque nome e telefone, sozinhos, não comprovam identidade. Até a definição de um segundo fator ou processo documental, a recuperação deve ser conduzida pela Mari.

## 4. Segurança e privacidade

### Controles implementados ou reforçados

- Sessões opacas com tokens imprevisíveis; o banco armazena somente o hash do token.
- Cookies com `HttpOnly`, `SameSite=Lax`, `Secure` em HTTPS/produção e escopo de caminho `/`.
- Telefone normalizado e único, sem uso como credencial.
- Rate limiting preservado no cadastro, formulários e login administrativo; o modo de demonstração não desativa a proteção administrativa.
- Resolução de IP com validação via `node:net`, sem confiar indiscriminadamente em cabeçalhos enviados pelo cliente.
- Mensagem de login administrativo uniforme e um único cálculo de senha para conta válida ou inválida.
- Senhas administrativas com `scrypt`; redefinição exige valor explícito forte, força alteração posterior e revoga sessões existentes.
- Consentimento explícito validado no servidor para consultoria.
- Formulários anônimos não substituem nome, origem ou consentimento de um lead que já existia.
- Mídia de captação, imóveis não publicados e uploads sem vínculo público retornam 404 sem sessão administrativa e não recebem cache compartilhado.
- Exclusão de mídia bloqueada enquanto houver vínculo com imóvel, captação ou configuração do site.
- Upload preserva limite de 8 MB, limite de 40 megapixels, formatos JPG/PNG/WebP/AVIF, rotação por metadados, redimensionamento e recodificação WebP com Sharp.
- CSP de produção sem `unsafe-eval`, `object-src 'none'`, restrições de frame/origem e cabeçalhos `nosniff`, referrer e permissions policy.
- HSTS é emitido somente em produção HTTPS.
- Previews e ambientes locais continuam com `noindex`.

### Pontos que ainda exigem atenção

- O fluxo assistido de recuperação precisa de procedimento operacional documentado para evitar engenharia social.
- Objetos públicos ainda são entregues pela rota Next.js `/media/[key]`, que consulta metadados antes de responder. URLs assinadas/públicas controladas pelo Supabase CDN podem reduzir invocações e consultas, mas exigem estratégia de privacidade, invalidação e migração de URLs antes de serem adotadas.
- Uploads temporários de proprietários ainda não usam uma sessão opaca exclusiva de upload. Rate limit, limpeza de órfãos e quotas devem ser acompanhados para impedir abuso de armazenamento.
- O rate limit persiste no PostgreSQL. Em alto volume, um armazenamento próprio para contadores poderá reduzir escrita no banco principal; não há justificativa para adicionar esse custo antes de observar tráfego real.
- A CSP ainda permite `unsafe-inline` porque o frontend atual depende desse comportamento. A migração para nonce/hash deve ser planejada e testada separadamente.
- A rotina de manutenção remove sessões, contadores e OTPs expirados, mas ainda não possui política automatizada completa para mídia órfã. Nenhum arquivo comercial deve ser excluído sem período de retenção e auditoria.

## 5. Banco de dados e catálogo

### Consultas

- `homeFeatured()` substitui a chamada da busca completa na página inicial e retorna somente os seis imóveis publicados e destacados necessários.
- `searchCatalog()` inicia operações independentes antes de aguardá-las, reduzindo o caminho serial sem modificar filtros, paginação ou ordenação.
- `getContent()` e `getListing()` usam cache por requisição do React para evitar repetição na mesma renderização.
- Consultas privadas, sessões, favoritos e dados administrativos não receberam cache público.

### Índices

A migração `prisma/migrations/202610210006_performance_indexes/migration.sql` é aditiva e não altera nem remove dados. Ela cria:

- `Lead(lastActivityAt DESC)` para listas por atividade;
- `Session(adminId)` e `Session(leadId)` para revogação e limpeza por titular;
- `Property(status, purpose, featured DESC, createdAt DESC, id)` para destaques e ordem padrão;
- `Property(status, purpose, superFeatured, updatedAt DESC)` para super destaques;
- `Property(status, purpose, price, id)` para catálogo ordenado por preço;
- `ContactRequest(status, createdAt DESC)` para fila administrativa de contatos.

O schema Prisma e a migration usam os mesmos nomes explícitos. A migration foi validada e aplicada no banco local de desenvolvimento. Ela não foi executada automaticamente em produção.

### Conexões

O adaptador PostgreSQL possui limite explícito de conexões e timeout de conexão de 10 segundos; ambientes locais/PGlite são serializados em uma conexão. O padrão remoto é duas conexões por instância e pode ser ajustado por `DATABASE_POOL_MAX`. Para a Vercel, o `DATABASE_URL` de runtime deve apontar para o pooler do Supabase e o orçamento total deve considerar a multiplicação por instâncias concorrentes. Migrações usam `MIGRATION_DATABASE_URL` para a conexão direta em execução controlada, nunca em paralelo por múltiplas funções.

## 6. Imagens e frontend

Os ativos padrão `coast`, `living`, `dining`, `bedroom`, `balcony` e o retrato da Mari passaram a preferir WebP. Quatro PNGs de ambientes obsoletos foram removidos. `coast.png` e `mari-portrait.png` foram mantidos temporariamente para compatibilidade com conteúdo já persistido que possa referenciar esses caminhos; novos defaults e seeds usam WebP.

No frontend:

- a imagem principal da galeria recebe preload; as demais carregam conforme necessidade;
- `sizes` passou a refletir cards, miniaturas, galeria, notícias, destaques e seção institucional;
- a imagem da seção de proprietários, abaixo da dobra, não é mais carregada com eager;
- dimensões continuam controladas pelo componente `next/image`, preservando proporção e layout;
- a estrutura, o conteúdo e a tipografia do catálogo público foram preservados; a cor do texto auxiliar dos destaques recebeu um pequeno ajuste para atender contraste AA.

O pipeline de upload já gera um WebP de até 2400 × 2400 e qualidade 85. Variantes físicas separadas para thumbnail/intermediária/original não foram introduzidas nesta etapa: o `next/image` continua responsável pelas variantes de entrega. Criar três objetos por foto aumentaria complexidade de lifecycle e armazenamento e deve ser comparado com os custos reais da otimização da Vercel antes de uma migração.

## 7. SEO e ambientes

A aplicação agora usa `VERCEL_ENV` como fonte de verdade quando executada na Vercel e considera produção somente quando o valor é `production`; fora da plataforma, usa `APP_ENV=production`. Isso corrige metadados, `robots.txt`, sitemap, cookies e regras de segurança, além de impedir que um preview herdando `APP_ENV=production` seja indexado.

- Produção pública: indexação e sitemap habilitados; imóveis publicados entram no sitemap.
- Preview, demonstração e desenvolvimento: `noindex`, `nofollow` e `robots.txt` bloqueando rastreamento.
- `/admin`, `/api`, `/minha-selecao`, links privados de seleção e preview do editor permanecem fora da indexação.
- URLs públicas, slugs, títulos, Open Graph e páginas existentes foram preservados.

## 8. Comparativo antes e depois

As medições abaixo foram feitas localmente na mesma árvore de trabalho. O tempo de build não foi coletado em uma sequência controlada de builds frios e, portanto, é indicativo. Valores de Core Web Vitals reais dependem de uma implantação estável e dados de usuários no percentil 75.

| Métrica | Antes | Depois | Variação | Observação |
| --- | ---: | ---: | ---: | --- |
| Imagens estáticas auditadas | 14.056.079 bytes | 4.566.227 bytes | **−9.489.852 bytes (−67,5%)** | Soma dos ativos raster em `public`; inclui os dois PNGs legados mantidos por compatibilidade |
| Arquivos JavaScript em `.next/static` | 18 | 21 | +3 | A contagem de chunks não representa, isoladamente, piora ou melhora |
| JavaScript em `.next/static` | 1.165.941 bytes | 882.576 bytes | **−283.365 bytes (−24,3%)** | Medição bruta do build local após atualização para Next.js 16.4.2; a composição dos chunks mudou |
| Maior chunk JavaScript | 418.842 bytes | 229.597 bytes | −189.245 bytes | Medição bruta do artefato local |
| Build de produção local | 69,76 s | 48,71 s | **−21,05 s (−30,2%)** | Resultado indicativo; cache, antivírus e I/O local podem influenciar |
| Compilação Next.js no build final medido | não isolado | 1,9 s | — | Parte da medição posterior com cache local aquecido |
| Verificação TypeScript no build final medido | não isolado | 17,6 s | — | Parte da medição posterior |

Não foram registrados com instrumentação comparável antes/depois:

- quantidade total de requisições no navegador;
- payload de uma navegação completa;
- número de queries por rota sob carga;
- TTFB, FCP, LCP, INP e CLS no percentil 75;
- uso de CPU/memória das funções;
- conexões simultâneas e custo do Supabase;
- consumo de Image Optimization e transferência na Vercel.

No código, é possível afirmar somente que a home deixou de executar a busca completa e suas facetas, que consultas independentes do catálogo foram paralelizadas e que leituras repetidas de conteúdo/anúncio na mesma renderização são deduplicadas. Ganhos de latência e custo precisam ser observados em produção.

## 9. Validação e compatibilidade

### Verificações executadas

| Verificação | Resultado registrado |
| --- | --- |
| `npm run typecheck` | Aprovado |
| `npm run lint` | Aprovado, sem erros; 3 avisos preexistentes em scripts de seed/sincronização |
| `npm test` | Aprovado: 81 testes em 7 arquivos |
| `prisma validate` | Aprovado |
| Migration aditiva no banco local | Aplicada com sucesso |
| `npm run build` | Aprovado |
| Playwright completo | Aprovado: 6 testes em desktop/mobile, 1,6 min |
| `npm audit --omit=dev --audit-level=high` | Aprovado: 0 vulnerabilidades de produção |

A primeira rodada completa expôs contraste insuficiente em texto auxiliar e expectativas antigas nos cenários de seleção e agenda. O contraste e os testes foram corrigidos; a repetição integral terminou com **6/6 cenários aprovados**, cobrindo desktop, mobile, acessibilidade, navegação pública, cadastro sem SMS, painel, CRM, Kanban, agenda e seleção compartilhada.

O audit completo ainda informa cinco vulnerabilidades altas em dependências exclusivas da cadeia de lint (`braces`, `micromatch`, `fast-glob` e plugins ESLint). A correção automática disponível exige `--force` e rebaixa `eslint-config-next` para a linha 14, incompatível com a aplicação. Elas não entram no bundle/runtime de produção; devem ser acompanhadas até existir atualização compatível sem downgrade.

### Compatibilidade preservada

- Rotas e slugs públicos não foram alterados.
- Busca, filtros, ordenação, paginação, cards e detalhes mantêm seus contratos.
- Seleções existentes continuam vinculadas ao mesmo lead e token público de compartilhamento.
- A remoção do OTP não apaga a tabela nem o histórico correspondente.
- Configurações persistidas com os caminhos legados de hero/retrato continuam aceitas.
- A migração adiciona índices, sem alterar colunas ou registros.
- Painel, CRM, Kanban, agenda, notícias, editor de imóveis, editor visual e captação de proprietários não foram removidos.
- A única mudança funcional intencional é o cadastro sem SMS e a recuperação assistida em navegador novo.

## 10. Arquivos alterados

Os arquivos foram agrupados por finalidade. O diff Git continua sendo a fonte autoritativa da lista completa.

| Área | Arquivos principais |
| --- | --- |
| Ambiente e segurança HTTP | `next.config.ts`, `src/config/deployment.ts`, `src/app/layout.tsx`, `src/app/robots.ts`, `src/app/sitemap.ts` |
| Autenticação e sessão | `src/lib/mari/auth.ts`, `src/lib/mari/client-service.ts`, `src/lib/mari/crypto.ts`, `src/app/api/[...path]/route.ts`, `src/components/mari/provider.tsx`, `src/lib/mari/types.ts` |
| Validação, leads e privacidade | `src/lib/mari/validation.ts`, `src/lib/mari/consultation.ts`, `src/lib/mari/owner-service.ts`, `src/components/mari/consultation-wizard.tsx`, `src/app/privacidade/page.tsx` |
| Catálogo e home | `src/lib/mari/catalog.ts`, `src/app/page.tsx`, `src/components/mari/site.tsx`, `src/components/mari/selection.tsx` |
| Mídia | `src/lib/mari/storage.ts`, `src/app/media/[key]/route.ts`, `src/components/gallery.tsx`, `src/components/mari/ui.tsx`, editores administrativos |
| Banco | `prisma/schema.prisma`, `prisma/migrations/202610210006_performance_indexes/migration.sql`, `prisma/seed.ts` |
| Scripts | `scripts/set-admin-password.ts`, `scripts/setup-env.mjs`, `scripts/full-demo-runtime.mjs`, `scripts/seed-mock-properties.ts` |
| Ativos | novos WebPs em `public/images/`, `public/mari-portrait.webp`; remoção dos PNGs de ambientes substituídos |
| Testes | `tests/e2e/mari.spec.ts`, `tests/unit/deployment.test.ts`, `tests/unit/http-security.test.ts` |
| Dependências e ambiente | `package.json`, `package-lock.json`, `.env.example`, `.gitignore`, remoção do `next-env.d.ts` versionado |
| Documentação | `README.md`, `docs/arquitetura-mari.md`, `docs/assets.md` e este relatório |

## 11. Checklist de produção — Supabase e Vercel

### Antes da implantação

- [ ] Criar snapshot/backup verificável do PostgreSQL e confirmar o procedimento de restauração.
- [ ] Confirmar que o deploy usa a branch/revisão aprovada e que a suíte final está verde.
- [ ] Revisar o diff da migration; ela deve conter somente `CREATE INDEX` desta etapa.
- [ ] Garantir que nenhuma credencial, `.env.local`, dump ou mídia privada foi versionada.
- [ ] Confirmar Node.js 22 ou superior no projeto Vercel.

### Variáveis de runtime

- [ ] `DATABASE_URL`: URL de runtime do pooler Supabase, com TLS e limite compatível com Vercel serverless.
- [ ] `DATABASE_POOL_MAX=2`: limite inicial por instância; ajustar somente com base no plano, concorrência e métricas do Supabase.
- [ ] `MIGRATION_DATABASE_URL`: conexão direta do Supabase, disponível somente ao processo controlado de migration.
- [ ] `APP_ENV=production`: recomendado de forma explícita; `VERCEL_ENV=production` também é reconhecido automaticamente.
- [ ] `SITE_URL=https://dominio-publico`: deve corresponder à origem canônica sem caminho adicional.
- [ ] `AUTH_SECRET`: segredo aleatório exclusivo de produção com pelo menos 32 caracteres; não reutilizar o valor local/demo.
- [ ] `PRESENTATION_MODE=false` e `DEMO_MODE=false` no ambiente público.
- [ ] `STORAGE_PROVIDER=supabase`.
- [ ] `SUPABASE_URL`: URL do projeto correto.
- [ ] `SUPABASE_SERVICE_ROLE_KEY`: somente variável secreta do servidor; nunca prefixar com `NEXT_PUBLIC_` nem expor ao navegador.
- [ ] `SUPABASE_STORAGE_BUCKET=property-media` ou o nome real do bucket privado.
- [ ] `TRUST_PROXY`: deixar ausente/`false` na Vercel; a aplicação usa o cabeçalho específico da plataforma. Habilitar somente atrás de proxy próprio que sobrescreva `X-Forwarded-For`.
- [ ] Remover/ignorar `OTP_PROVIDER`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN` e `TWILIO_FROM`; não são necessários para o cadastro atual.

### Inicialização administrativa

- [ ] Usar `INITIAL_ADMIN_EMAIL` e `INITIAL_ADMIN_PASSWORD` somente se o seed precisar criar o primeiro administrador.
- [ ] A senha inicial de produção deve ter pelo menos 12 caracteres e não pode ser `Admin`.
- [ ] Executar o seed uma única vez, verificar `mustChangePassword=true` e trocar a senha no primeiro acesso.
- [ ] Para redefinição posterior, informar `TARGET_DATABASE_URL`, `ADMIN_EMAIL` e `ADMIN_PASSWORD` explicitamente ao script; o script revoga as sessões existentes.

### Migration

- [ ] Usar uma conexão direta do Supabase em `MIGRATION_DATABASE_URL` num terminal/CI controlado para `npm run db:migrate`; manter `DATABASE_URL` apontando para o pooler de runtime.
- [ ] Não executar migrations concorrentes em várias funções/deploys.
- [ ] Registrar horário, operador e saída da execução.
- [ ] Após a migration, conferir os sete índices no PostgreSQL e observar tempo/espaço de criação.

### Storage

- [ ] Criar o bucket esperado e manter a service role somente no servidor.
- [ ] Confirmar upload, leitura pública de foto de imóvel publicado e bloqueio de foto de proprietário sem login administrativo.
- [ ] Confirmar CORS e limites no Supabase sem tornar o bucket inteiro público por conveniência.
- [ ] Monitorar armazenamento órfão e definir retenção antes de automatizar exclusões.

### Build e smoke test

- [ ] Executar `npm run build` com as mesmas variáveis do ambiente de produção.
- [ ] Validar home, busca, filtros, paginação, detalhes, galeria e notícias.
- [ ] Criar e publicar um imóvel de teste controlado, enviar uma foto e removê-lo ao final.
- [ ] Criar uma seleção em navegador limpo, recarregar e confirmar persistência.
- [ ] Em outro navegador, informar o mesmo telefone e confirmar que nenhum favorito/dado é revelado.
- [ ] Testar solicitação de contato, consultoria e captação de proprietário.
- [ ] Testar login, troca de senha, CRM, Kanban, agenda e editores administrativos.
- [ ] Confirmar que `/robots.txt` e `/sitemap.xml` indexam somente a produção e que previews continuam bloqueados.
- [ ] Conferir CSP, HSTS, cookies `Secure`/`HttpOnly`/`SameSite` e respostas de mídia privada.

### Operação contínua

- [ ] Agendar `npm run maintenance` em processo único e observar sessões, rate limits e OTPs históricos removidos.
- [ ] Ativar backups/PITR conforme o plano Supabase e testar restauração periodicamente.
- [ ] Monitorar conexões, queries lentas, erros 5xx, latência das funções, egress de Storage e uso de Image Optimization.
- [ ] Coletar Web Vitals reais e avaliar p75 mobile antes de declarar LCP ≤ 2,5 s, INP ≤ 200 ms e CLS ≤ 0,1.
- [ ] Configurar alertas de orçamento na Vercel e no Supabase.

## 12. Riscos e próximos passos recomendados

1. **Medir produção.** Instrumentar Web Vitals, TTFB, queries e egress por pelo menos um ciclo representativo; não otimizar por estimativa.
2. **Avaliar entrega direta de mídia.** Comparar o custo atual da rota Next.js com CDN/URLs assinadas do Supabase, preservando mídia privada e invalidação.
3. **Criar sessão de upload para proprietários.** Vincular uploads temporários a um token curto, impor quota e remover órfãos somente após retenção segura.
4. **Reduzir overfetch do DTO público.** Medir antes de criar seleções Prisma menores para cards; a mudança deve preservar modal e detalhes.
5. **Planejar cache compartilhado com invalidação.** O cache atual deduplica dentro da requisição. Qualquer cache entre requisições deve ser invalidado na publicação, despublicação e edição de imóvel/conteúdo.
6. **Endurecer CSP.** Migrar scripts e estilos inline para nonce/hash somente em uma etapa com regressão visual completa.
7. **Documentar recuperação de acesso.** Definir quem pode validar o cliente, quais evidências são aceitas e como sessões anteriores são revogadas.

Esta branch não executa alterações destrutivas nem modifica automaticamente variáveis ou dados de produção. A rodada final de testes está verde; o deploy deve ocorrer somente após a execução controlada da migration e a revisão do checklist acima.
