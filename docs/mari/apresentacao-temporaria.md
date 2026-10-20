# Apresentação temporária para avaliação

## Demonstração completa

Para avaliar todos os módulos, execute `npm run share:stop` e depois `npm run share:full` (após `npm run build`). A primeira execução cria um PostgreSQL separado na porta 54330, em `.data/presentation/postgres`, e copia somente os imóveis publicados, seus campos públicos, configurações publicadas e imagens para `.data/presentation/uploads`. Não copia interessados, solicitações, sessões, senhas ou endereços privados do banco original. Inclui um interessado explicitamente fictício para apresentar o CRM.

O site público e os links compartilhados abrem diretamente, sem a janela adicional de autenticação do navegador. O painel continua protegido pela tela `/admin/login`, usando as credenciais de demonstração de `.data/presentation/credentials.json`. Não compartilhe o arquivo inteiro, pois contém também o segredo de sessões. A senha é gerada aleatoriamente, nunca `Admin`, e o banco guarda somente o hash.

Imóveis, fotos, tags, campos, CRM, favoritos, recuperação da seleção e editor funcionam com gravação persistente nessa cópia. Alterações não afetam o localhost original. O aviso no site pede dados fictícios e informa que o SMS é simulado; o código aparece na tela e não é enviado a um telefone. Links compartilhados mostram somente o título e os imóveis da seleção, sem nome, telefone, comentários ou compromissos do interessado.

Reiniciar preserva os testes já feitos e gera outro endereço de túnel. `npm run share:stop` encerra o link e os processos iniciados por ele. O computador e a internet precisam permanecer ligados; o banco da demonstração inicia automaticamente. O modo completo não é uma configuração de produção.

## Apresentação somente do catálogo

O link compartilha o catálogo atual deste computador por HTTPS, usando um Quick Tunnel do Cloudflare. É uma apresentação, não a hospedagem definitiva. O computador, a internet e o banco local precisam continuar ligados. Ao encerrar o túnel, o link deixa de funcionar; iniciar novamente gera outro endereço.

A prévia usa uma instância otimizada (`next start`) na porta local 3002, separada do desenvolvimento na porta 3000. Um gateway na porta local 3001 admite somente navegação pública, fotos e consultas ao catálogo. O túnel aponta para esse gateway.

O aviso no site identifica os imóveis ilustrativos. A prévia não permite cadastro, login, Minha Seleção, solicitações de contato, upload, edição, acesso ao CRM ou recuperação de telefone por código. Botões de cadastro mostram uma explicação antes de solicitar dados pessoais. Os links externos de WhatsApp continuam abrindo o aplicativo, sem enviar mensagens automaticamente.

Cookies e cabeçalhos de autenticação não são repassados ao site. O gateway também bloqueia métodos de escrita, endpoints de desenvolvimento, mapas de código, WebSockets e URLs de imagens externas. Respostas têm `noindex`; `robots.txt` impede indexação. Isso não equivale a controle de acesso: qualquer pessoa com o link pode ver o catálogo público.

## Iniciar

1. Mantenha `npm run dev` ativo para disponibilizar o banco local.
2. Execute `npm run build` quando alterar o site.
3. Execute `npm run share:preview`.
4. Copie o endereço HTTPS impresso no terminal. Ele também fica em `.cache/share-preview.json`.

O executável oficial do Cloudflare fica em `.cache/tools/cloudflared.exe`, ignorado pelo Git. Foi usado `cloudflared 2026.10.1`, SHA256 `4d2490e74082c5d48dbfedaf92576fa5bd1702379ab88eb7faa0cfbe8dc891b6`, obtido no release oficial. Se precisar reinstalar, baixe o executável Windows amd64 de https://github.com/cloudflare/cloudflared/releases e confira o checksum publicado.

Não execute duas apresentações ao mesmo tempo. As portas 3001 e 3002 devem estar livres. A opção `PRESENTATION_MODE=true` é aplicada somente ao processo da apresentação, sem alterar `.env.local` ou o comportamento do desenvolvimento.

## Encerrar

Execute `npm run share:stop` na pasta do projeto. O comando verifica se o PID registrado ainda corresponde ao executável do túnel deste projeto antes de encerrá-lo. O localhost de desenvolvimento permanece ativo.

Referência: https://developers.cloudflare.com/tunnel/get-started/quick-tunnels/
