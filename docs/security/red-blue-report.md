# Operação Red Team × Blue Team — Mari Imob

**Execução:** 22–23 de outubro de 2026  
**Branch:** `security/red-blue-hardening`  
**Base:** `a40df76417bbac5bd4d316b01fbb290fa8173b56`  
**Ambiente:** aplicação e PostgreSQL locais, somente dados fictícios

## Escopo e limites

A operação usou exclusivamente o repositório local, a aplicação em `127.0.0.1:3000` e o PostgreSQL em `127.0.0.1:54329`. Produção, Supabase, Vercel e serviços de terceiros não foram acessados. Não houve teste destrutivo, negação de serviço, uso de dados de clientes, deploy ou alteração da branch `master`.

Foram preservadas as decisões funcionais de cadastro sem SMS obrigatório e formulário público de proprietários sem fotografias. Nenhuma mudança de identidade visual, layout, CSS ou navegação foi feita. O CRM passou apenas a informar quando uma consultoria pública tem identidade não verificada.

## Plano de testes

| Área | Teste controlado | Gate de aprovação |
| --- | --- | --- |
| Autenticação e sessão | Credencial válida/inválida, cookies, logout, troca de senha, enumeração e bloqueio dirigido | Erro genérico, custo equivalente, sessão opaca e senha correta não bloqueada por terceiros |
| Autorização e CRM | Rotas administrativas anônimas, IDs e mutações de leads | 401/403/404 e nenhum dado privado exposto |
| CSRF e origem | Mutações com origem válida e origem cruzada | Origem cruzada rejeitada antes do efeito colateral |
| Formulários públicos | Telefone de lead fictício existente, repetição segura e limites | Atributos confiáveis preservados, proveniência explícita e rate limit |
| Upload e mídia | Upload público fictício e upload administrativo | Rota pública ausente e fluxo administrativo autenticado preservado |
| URLs e XSS | `javascript:`, `data:`, `ftp:`, HTTP, URLs relativas e legado persistido | Somente caminho interno seguro ou HTTPS; legado neutralizado na leitura |
| Seed e segredos | Senha ausente, curta e conhecida | Falha antes da conexão; senha forte explícita; nenhum segredo versionado |
| Compartilhamento | Token inválido, DTO público e mutação sem proprietário | 404/401, sem PII e sem alteração indevida |
| Regressão | TypeScript, lint, unitários, Prisma, build e E2E desktop/mobile | Todos os gates funcionais aprovados |
| Dependências | Auditoria de runtime e completa | Runtime sem alerta alto; risco de desenvolvimento documentado |

## Linha de base

| Verificação | Resultado anterior às correções |
| --- | --- |
| Node.js / npm / Next.js | Node 24.19.0; npm 11.17.0; Next.js 16.4.2 |
| `npm run typecheck` | Aprovado |
| `npm run lint` | 0 erros; 3 avisos preexistentes em scripts |
| `npm test` | 81/81 em 7 arquivos |
| `npx prisma validate` | Aprovado |
| `npm run build` | Aprovado; compilação Next em 6,1 s e TypeScript em 18,6 s |
| `npm run test:e2e` | 6/6 em desktop e mobile |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades de produção |
| Git | Branch de segurança criada; `master` intacta |

## Rodada 1 — Red Team

### MARI-RT-001 — Upload público persistente e órfão

- **Arquivo/função:** `src/app/api/[...path]/route.ts`, roteamento `owner-upload`; `src/lib/mari/storage.ts`, `uploadMedia`; `src/components/mari/owner-form.tsx`.
- **Gravidade:** alta, por permitir consumo distribuído e persistente de processamento e armazenamento sem autenticação.
- **Condição:** acesso público, origem aceita e imagem raster válida.
- **Evidência:** um PNG fictício 1×1, sem cookie, recebeu HTTP 200 e criou objeto + registro `Media`. O artefato foi removido imediatamente no ambiente local.
- **Impacto:** arquivos órfãos, custo de storage e processamento e crescimento não controlado do banco.
- **Recomendação:** remover a rota, o campo público e `photoIds`; preservar upload administrativo e dados históricos.

### MARI-RT-002 — Manipulação anônima de lead existente

- **Arquivo/função:** `src/lib/mari/consultation.ts`, `saveConsultation`; `src/app/api/[...path]/route.ts`, rota `consultation`.
- **Gravidade:** média, por alterar a confiança e a atividade de um lead a partir do conhecimento do telefone.
- **Condição:** conhecer ou adivinhar o telefone de um lead.
- **Evidência:** uma submissão fictícia mudou `qualified=false` para `true` e anexou respostas ao lead preexistente.
- **Impacto:** adulteração da qualificação e do histórico do CRM, sem leitura dos dados privados.
- **Recomendação:** não alterar atributos confiáveis, marcar a identidade como não verificada e limitar por IP e telefone normalizado.

### MARI-RT-003 — Seed com senha administrativa conhecida

- **Arquivo/função:** `prisma/seed.ts`, inicialização do administrador.
- **Gravidade:** alta, pois uma execução sem flags corretas podia criar acesso administrativo previsível.
- **Condição:** executar seed sem `INITIAL_ADMIN_PASSWORD` e sem indicadores reconhecidos de produção.
- **Evidência:** o código usava fallback `Admin`; a credencial foi confirmada apenas no banco local isolado.
- **Impacto:** comprometimento integral do painel em ambiente inicializado incorretamente.
- **Recomendação:** exigir senha explícita com 12+ caracteres antes de qualquer conexão e gerar senha aleatória somente no setup local.

### MARI-RT-004 — Protocolos inseguros em URLs editáveis

- **Arquivo/função:** `src/lib/mari/validation.ts`, `contentSchema`; `src/lib/mari/news-service.ts`, schema e leituras públicas; `src/lib/mari/catalog.ts`, `getContent`.
- **Gravidade:** baixa. React 19 bloqueou `javascript:` na renderização, portanto XSS executável não foi confirmado; outros protocolos ainda permitiam navegação imprópria.
- **Condição:** administrador comprometido ou erro de configuração de conteúdo.
- **Evidência:** schemas aceitaram `javascript:`, `data:` e `ftp:` antes da correção.
- **Impacto:** redirecionamento para conteúdo enganoso ou protocolo inadequado.
- **Recomendação:** caminho interno seguro para links institucionais, HTTPS para destinos externos e sanitização de registros legados.

### MARI-RT-005 — Bloqueio dirigido do login administrativo

- **Arquivo/função:** `src/lib/mari/auth.ts`, `adminLogin`.
- **Gravidade:** média, pela indisponibilidade temporária e repetível da conta conhecida.
- **Condição:** conhecer o e-mail administrativo e realizar oito tentativas inválidas em volume pequeno.
- **Evidência:** o contador por e-mail era consultado antes da verificação; depois de excedido, a senha correta também era rejeitada.
- **Impacto:** bloqueio administrativo por até 15 minutos, repetível.
- **Recomendação:** manter limite de custo por IP antes do `scrypt`, contabilizar o bucket da conta somente após falha e sempre permitir a verificação de uma credencial correta.

Verificações negativas da primeira rodada: rota administrativa anônima 401, mutação cross-site 403, token compartilhado inválido 404, sessões opacas com hash, verificação de propriedade da seleção, mídia privada, Prisma parametrizado e nenhum segredo real encontrado no histórico pesquisado.

## Rodada 1 — Blue Team e reteste

| Vulnerabilidade | Gravidade | Status | Correção | Teste executado | Resultado do reteste | Risco residual |
| --- | --- | --- | --- | --- | --- | --- |
| MARI-RT-001 | Alta | Corrigida | Rota pública, campo de fotos e `photoIds` removidos; upload administrativo preservado | Teste de rota e schema + HTTP local | `/api/owner-upload` 404; upload admin anônimo 401 | Objetos órfãos anteriores exigem inventário e retenção |
| MARI-RT-002 | Média | Corrigida | Lead existente usa `update: {}`; `identityVerified=false`; CRM mostra identidade não verificada; limite por IP + telefone | Unitário de persistência e reteste HTTP/DB fictício | Lead integralmente inalterado; consultoria marcada não verificada | Uma pessoa ainda pode enviar resposta não verificada para um telefone; transparência e limites reduzem o risco sem exigir SMS |
| MARI-RT-003 | Alta | Corrigida no código | Seed exige senha explícita de 12+ antes do Prisma; setup local gera valor aleatório; scripts/E2E removem fallback | Ausência, `Admin`, senha curta e válida; reinício completo de `npm run dev` | Entradas fracas falham; migrations e seed locais iniciam com configuração forte | Ambientes já inicializados precisam de rotação manual |
| MARI-RT-004 | Baixa | Corrigida | Schemas restringidos; conteúdo e notícias legados neutralizados na leitura | Testes de `javascript:`, `data:`, `ftp:`, HTTP, `//host`, HTTPS e leitura legada | Payloads inseguros rejeitados ou transformados em vazio/fallback | HTTPS administrativo pode apontar a qualquer domínio |
| MARI-RT-005 | Média | Corrigida | Bucket da conta somente após credencial inválida; limite por IP e erro genérico preservados | Conta válida, inválida e inexistente com mocks determinísticos | Senha correta ignora contador de falhas da conta; falhas continuam limitadas | Bucket por IP pode afetar usuários que compartilham a mesma origem |

Evidência consolidada do reteste local:

```json
{
  "ownerUpload": 404,
  "consultation": 200,
  "leadUnchanged": true,
  "identityVerified": false,
  "unauthenticatedAdmin": 401,
  "crossSiteMutation": 403,
  "invalidSharedToken": 404
}
```

Todos os registros fictícios criados no reteste foram removidos.

## Rodada 2 — revisão das áreas alteradas

O novo exame encontrou três regressões/lacunas antes da aprovação:

1. a primeira correção de MARI-RT-002 ainda atualizava `lastActivityAt` e não registrava a proveniência não verificada;
2. `scripts/dev.mjs` havia perdido uma importação ainda utilizada;
3. documentação, diagnósticos e E2E ainda presumiam a senha `Admin`, e faltava teste direto do serviço de notícias.

Todas foram corrigidas. O reteste final não encontrou vulnerabilidade crítica ou alta nova e reproduzível dentro do escopo local. A auditoria independente aprovou as cinco correções para pull request e revisão humana.

## Validação final

| Verificação | Resultado final |
| --- | --- |
| Testes focados de segurança | 17/17 aprovados |
| `npm test` | 93/93 aprovados em 11 arquivos |
| `npm run typecheck` | Aprovado |
| `npm run lint` | 0 erros; 3 avisos preexistentes |
| `npx prisma validate` | Aprovado |
| `npx prisma migrate deploy` | Migração `202610230007_consultation_identity_verification` aplicada localmente |
| `npm run build` | Aprovado; compilação Next em 2,4 s e TypeScript em 10,3 s |
| `npm run test:e2e` | 6/6 aprovados em desktop e mobile, 1,5 min |
| Acessibilidade automatizada | Sem violações WCAG A/AA na jornada pública testada |
| `npm audit --omit=dev --audit-level=high` | 0 vulnerabilidades de produção |
| `git diff --check` | Aprovado |

Uma execução intermediária do Playwright perdeu um arquivo temporário de trace (`ENOENT`) após a jornada móvel; o caso isolado passou e a execução agregada final passou 6/6. O fato permanece registrado como instabilidade ocasional do runner.

## Riscos residuais e ações externas

- **Rotação obrigatória:** ambientes já inicializados podem conservar a senha antiga porque o seed não redefine administradores existentes. Antes de qualquer deploy, um operador deve executar `scripts/set-admin-password.ts`, usar senha forte e confirmar a revogação das sessões. Esta operação não tocou produção por restrição expressa.
- **Mídia histórica:** objetos órfãos criados antes da correção devem ser inventariados e removidos de acordo com uma política de retenção.
- **Abuso distribuído:** formulários públicos ainda podem receber conteúdo não verificado dentro dos limites configurados. Proteção de borda pode ser adicionada quando houver métricas reais.
- **URLs HTTPS:** o painel não usa lista fechada de domínios; um administrador continua responsável pelo destino configurado.
- **Toolchain:** `npm audit` completo informa cinco alertas altos na cadeia de desenvolvimento do ESLint (`braces`/`micromatch`/`fast-glob`). Não afetam o runtime; a correção automática disponível exige downgrade incompatível para Next 14 e não foi aplicada.

Este relatório registra os testes executados e seus limites. Ele não declara o sistema invulnerável.
