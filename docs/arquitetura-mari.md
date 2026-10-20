# Arquitetura — Mari Corretora de Imóveis

O projeto anterior era um catálogo demonstrativo de locação. A implementação da Mari mantém Next.js App Router, React, TypeScript, CSS, fontes locais, Lucide, a galeria de imagens, utilitários e a infraestrutura Vitest/Playwright. Os arquivos antigos de dados e seus testes permanecem isolados para consulta; não alimentam as rotas da Mari. As capturas e documentos anteriores em `docs/` são históricos.

## Módulos

- `src/app`: páginas renderizadas no servidor, metadados, sitemap, rotas HTTP.
- `src/components/mari`: site público, seleção, identificação por telefone, painel e editor.
- `src/lib/mari`: persistência, DTOs, validação, autenticação, catálogo, CRM, upload.
- `prisma`: modelo PostgreSQL, migrations versionadas e seed idempotente.
- `.data/postgres`: banco PGlite de desenvolvimento persistente; nunca versionado.
- `.data/uploads`: arquivos WebP persistentes no modo local; nunca versionados.

## Decisões

**PostgreSQL / Prisma 7.** Produção usa PostgreSQL externo. O desenvolvimento pode executar PGlite em processo separado, com dados no disco, escutando somente em `127.0.0.1:54329`. O protocolo é PostgreSQL e a aplicação usa o mesmo adapter `pg`. PGlite tem limitações de concorrência e não é a recomendação para produção. A aplicação não guarda catálogo ou interessados em arrays/localStorage.

**CSS nativo.** Mantido para preservar a arquitetura existente e evitar migração cosmética para Tailwind. Os estilos da Mari estão em `src/app/mari.css` e `src/styles/mari-admin.css`. O CSS antigo não é importado pelas páginas atuais.

**Sessões opacas.** Tokens aleatórios de 256 bits em cookies HttpOnly/SameSite; somente SHA-256 dos tokens no banco. Secure em produção. Administração: 8 horas; cliente: 30 dias. Senhas com scrypt, salt individual e comparação em tempo constante. Troca de senha revoga as sessões administrativas. Recuperação por OTP revoga as sessões anteriores do cliente.

**Primeira seleção.** Nome, telefone normalizado e consentimento criam um interessado novo e sua seleção em uma operação. Um telefone existente exige OTP; não autoriza leitura nem alterações com o telefone isoladamente. O simulador só funciona fora de produção. Códigos com cinco minutos, uso único, cinco tentativas e HMAC com segredo do ambiente.

**Contato.** Solicitações são persistidas e podem reutilizar um telefone existente sem expor seu cadastro ou alterar seu nome. A criação de contato não estabelece sessão de acesso. Abrir WhatsApp não equivale a enviar mensagem; a aplicação não afirma entrega.

**Proteção HTTP.** Mutações verificam Origin, autenticação e propriedade. Limites de requisições e tentativas ficam no banco. JSON tem limite de 150 KB; upload tem limite durante leitura do stream. Cabeçalhos encaminhados só são usados com `TRUST_PROXY=true`, que exige proxy confiável sobrescrevendo o cabeçalho. Sem isso, o limite por IP é conservador e compartilhado.

**Dados públicos.** DTO explícito exclui endereço privado, dados pessoais e campos privados. Compartilhamentos retornam apenas `items`. Identificadores públicos aleatórios e imprevisíveis. Imóveis não publicados não aparecem em buscas, detalhes públicos ou seleções compartilhadas.

**Pré-visualização.** Cards interceptam o clique primário e usam dialog nativo sobre a listagem ainda montada. History API mantém URL individual, voltar/avançar e restauração de filtros/rolagem. Ctrl/Cmd+clique e URL direta abrem a página própria com renderização no servidor. Dialog oferece foco contido, Escape e restauração de foco.

**Campos.** Modelos relacionais para definições, opções e valores JSON tipados. O backend valida tipo, obrigatoriedade e opções. Campos públicos habilitados como filtro geram consultas no PostgreSQL. Campo com valores não pode mudar de tipo nem perder opções utilizadas; exclusão arquiva para preservar histórico. Campos estruturais permanecem fixos. Categorias e situações têm chaves estrangeiras.

**Mídia.** Sharp decodifica, restringe dimensões, remove metadados e reencoda JPEG/PNG/WebP/AVIF em WebP. SVG e conteúdo inválido são rejeitados. Nomes aleatórios, até 8 MB por envio e 40 megapixels. Galeria de até 40 imagens; a primeira é a capa. Imagens só podem ser vinculadas ao próprio imóvel ou quando livres. Arquivos removidos de um imóvel existente são excluídos após salvar. Uploads cancelados podem ficar órfãos e devem ser removidos por manutenção; não apagar pastas indiscriminadamente.

**Editor.** Conteúdo JSON validado, sem HTML arbitrário. Preview exige sessão administrativa e aceita mensagens somente do iframe/pai na mesma origem. Rascunho e publicação ficam separados; controle de revisão detecta edição concorrente. Regiões editáveis, painel lateral, preview desktop/mobile, salvar rascunho, publicar e descartar.

## Integrações externas

- PostgreSQL externo com backups e TLS para produção.
- Twilio Programmable Messaging para entrega de OTP; credenciais em variáveis privadas.
- Armazenamento S3 compatível ou volume persistente no servidor. Vercel precisa S3; disco efêmero não serve para uploads persistentes.
- Domínio HTTPS e `SITE_URL` correspondente à origem pública.

Nenhuma integração paga foi contratada, nenhuma mensagem real foi enviada e nenhum projeto externo foi publicado nesta implementação local.

## Conteúdo

Não foram inventados anúncios, CRECI, depoimentos, endereço profissional ou foto da Mari. O seed contém configurações iniciais e opções de taxonomia, sem imóveis. O banner reaproveita a paisagem gerada anteriormente e a identifica como ilustrativa. A marca tipográfica é provisória e configurável. Dados pessoais só aparecem em telas autorizadas.

As referências web fornecidas não puderam ser consultadas pelas ferramentas de pesquisa nesta sessão. A implementação segue o briefing, sem copiar layout ou anúncios das referências.

## Operação

O CRM atualiza a listagem a cada 15 segundos; mutações ficam disponíveis no banco imediatamente. Busca pública tem paginação de 12 imóveis. Listas administrativas trazem até 300 registros por busca; para catálogos maiores, acrescentar paginação administrativa. A migração é PostgreSQL; não se faz cópia bruta do diretório PGlite para um servidor PostgreSQL externo.

Execute periodicamente `npm run maintenance` para remover sessões expiradas, códigos antigos e contadores de limite vencidos. Mantenha backups do banco e do storage. O texto de privacidade deve ser completado com identificação do controlador, canal e política de retenção aprovados pela responsável antes da publicação real.
