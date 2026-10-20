# Mari Corretora de Imóveis

Aplicação local com site imobiliário, catálogo persistente, área do cliente, CRM e editor visual. Next.js 16.3.8, React 19, TypeScript, Prisma 7, PostgreSQL e Zod. O catálogo inicia vazio; cadastre imóveis reais pelo painel.

## Executar no Windows

Node.js 22.12+ (verificado com Node 24). No PowerShell, use `npm.cmd` para evitar conflito com políticas de execução.

```powershell
npm.cmd ci
npm.cmd run setup:env
npm.cmd run dev
```

`npm run dev` inicia o banco local quando necessário, aplica migrations pendentes, verifica a inicialização e abre o Next.js. Mantenha o terminal aberto. Para controlar cada serviço separadamente:

```powershell
npm.cmd run db:local
# Em outro terminal:
npm.cmd run dev:web
```

Site: **http://127.0.0.1:3000**. Administração: **http://127.0.0.1:3000/admin**.

Credenciais iniciais **somente de desenvolvimento**: `mari@admin.com.br` / `Admin`. Troque a senha em **Configurações → Segurança do acesso**. O seed não redefine uma senha já alterada. A senha fica armazenada com hash e não é incluída no frontend.

Dados e uploads locais ficam em `.data/` e sobrevivem ao reinício. Preserve essa pasta. `.env.local` e dados privados não devem ser versionados. `setup:env` gera segredo aleatório e preserva variáveis existentes. Se copiou `.env.example` manualmente, substitua o valor ilustrativo de `AUTH_SECRET` por um segredo aleatório.

## Fluxo de uso

1. Em **Imóveis**, cadastre título, finalidade, localização, valores, fotos e descrição; salve como **Publicado**.
2. Ative a estrela para mostrar o imóvel nos destaques da página inicial.
3. Em **Configurações**, gerencie tags, categorias, situações e campos adicionais. Campos públicos habilitados como filtros aparecem na busca automaticamente.
4. No site, o clique em um imóvel abre uma pré-visualização. Fechar restaura a busca e a rolagem; o anúncio também possui URL própria.
5. O visitante toca no coração, informa primeiro nome/telefone e cria a seleção. Um telefone já cadastrado exige verificação antes do acesso.
6. Em **Interessados**, consulte seleções e solicitações de contato. O painel atualiza a cada 15 segundos.
7. Em **Editor do site**, passe o mouse sobre uma região, clique em editar e ajuste o painel lateral. **Salvar rascunho** mantém o site público intacto; **Publicar alterações** aplica o conteúdo.

## Verificação por telefone

Em `APP_ENV=development` e `OTP_PROVIDER=development`, o código é mostrado na tela com a identificação **Simulador de desenvolvimento**. Não há SMS real. O código é aleatório, expira e não pode ser reutilizado. Produção exige `OTP_PROVIDER=twilio` com as variáveis correspondentes. As credenciais não são retornadas ao navegador.

## Produção

Consulte [arquitetura e decisões](docs/arquitetura-mari.md) e [.env.example](.env.example).

- Configure `APP_ENV=production`, `SITE_URL=https://seu-dominio`, segredo aleatório e PostgreSQL externo em `DATABASE_URL`.
- Configure Twilio e número remetente autorizado. A integração precisa ser validada com a conta real.
- Na Vercel, configure `STORAGE_PROVIDER=supabase`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` e `SUPABASE_STORAGE_BUCKET`. Também é possível usar S3 compatível ou um volume persistente em servidor próprio.
- Rode migrations e seed com `INITIAL_ADMIN_PASSWORD` forte. A troca inicial é obrigatória para liberar o painel em produção.
- Execute `npm.cmd run build` e `npm.cmd start` em uma hospedagem Node compatível, com proxy HTTPS, backups e rotina de manutenção.
- Em hospedagem serverless, use storage externo e PostgreSQL gerenciado. A configuração local PGlite não deve ser usada em produção.
- Substitua a paisagem ilustrativa, informe logo/foto/CRECI oficiais e valide a política de privacidade com os dados da responsável.

O diretório `.vercel/` herdado pertence ao projeto anterior. **Não publique usando esse vínculo**; associe o projeto correto da Mari antes de qualquer implantação. Nenhuma publicação externa foi realizada aqui.

## Verificações

```powershell
npm.cmd run typecheck
npm.cmd run lint
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Os E2E exigem servidor e banco locais abertos e Chrome instalado. Exercitam cadastro pelo painel, upload, filtros reais, modal/rolagem, seleção, recuperação OTP, privacidade, CRM e publicação de conteúdo em desktop/mobile. Criam registros temporários identificados como teste e os removem ao terminar. Usam as credenciais locais iniciais; se a senha mudou, forneça `TEST_ADMIN_EMAIL` e `TEST_ADMIN_PASSWORD` no ambiente. Não rode esses testes contra produção.

Capturas atuais: `docs/mari/`. O catálogo demonstrativo e os documentos anteriores permanecem como histórico, sem participar do catálogo público da Mari.
