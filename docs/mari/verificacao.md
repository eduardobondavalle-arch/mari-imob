# Verificação da implementação

Verificado localmente em 18/10/2026, Windows, Node 24, Next.js 16.3.8 e PostgreSQL via PGlite com persistência no disco.

- TypeScript: aprovado.
- Testes unitários: 28 aprovados, incluindo telefone, validação de conteúdo/campos, tokens e senhas.
- Playwright: quatro testes aprovados em desktop e mobile, com jornadas completas.
- Axe: nenhuma violação WCAG 2 A/AA detectada na página inicial nos dois tamanhos testados.
- Build otimizado: aprovado.
- Auditoria npm de dependências de produção: zero vulnerabilidades conhecidas no momento da consulta. A auditoria completa ainda relata cinco ocorrências transitivas de desenvolvimento na cadeia `eslint-config-next → fast-glob → micromatch → braces`; a sugestão automática envolve downgrade incompatível e não foi aplicada.
- Banco reiniciado e registros iniciais preservados. O comando `npm run dev` agora inicializa o banco local, aplica migrations e faz seed idempotente antes de iniciar Next.js.

## Jornadas verificadas

1. Login administrativo e cadastro de imóvel pela interface, com foto real de teste enviada ao servidor.
2. Publicação, foto WebP recuperável, filtro personalizado booleano consultando o banco.
3. Modal de imóvel com URL própria, fechamento restaurando URL e posição de rolagem.
4. Criação da seleção por nome/telefone, persistência após recarga e vínculo no CRM.
5. Compartilhamento sem nome, telefone ou endereço privado.
6. Recusa de alteração da seleção por outro visitante e bloqueio de consulta administrativa sem sessão.
7. Telefone existente exige OTP; código errado é rejeitado; código válido recupera a seleção, revoga sessões anteriores e não pode ser reutilizado.
8. Solicitação de contato persistida e associada ao interessado/imóvel.
9. Origem externa bloqueada nas mutações e upload de SVG rejeitado.
10. Editor com prévia ao vivo, rascunho sem alteração pública e publicação refletida na página inicial.

Os anúncios e contatos criados pelos testes concluídos foram removidos. Os demais registros presentes no workspace foram preservados. O seed principal não cria imóveis. Capturas deste diretório com anúncios de teste não representam ofertas reais.

## Limites

Entrega de códigos por Twilio, storage S3, domínio HTTPS e PostgreSQL de produção dependem das credenciais e infraestrutura da responsável; não foram exercitados contra serviços reais. Não houve envio de mensagens nem implantação externa. A política de privacidade e dados profissionais precisam de validação da responsável antes da publicação.
