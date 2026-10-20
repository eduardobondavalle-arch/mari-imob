# Decisões de implementação

O usuário aprovou o contexto revisado e solicitou construir o site. As escolhas de rotina foram resolvidas com o briefing e a inspeção, sem reabrir as decisões já aceitas.

| Decisão | Implementação e motivo |
| --- | --- |
| Stack | Next.js 16.3.5, React 19, TypeScript; SSR para busca/detalhe e pré-renderização institucional |
| Estilos | CSS com camadas, tokens e regras responsivas; reduz dependências e permite comparação direta com a referência |
| Marca | Arquivos oficiais encontrados no site Adim e preservados; nenhuma marca recreada |
| Fotos | Cenas geradas por IA, explicitamente ilustrativas; evita usar ofertas de outras empresas |
| Contato | WhatsApp publicado pela Adim, com email alternativo; mensagem preparada localmente |
| Serviços atuais | Links para portal do cliente, documentos, blog e carreira existentes; dependem de continuidade na futura migração |
| Privacidade | Encaminhamento para política oficial atual; não produzir texto jurídico fictício |
| Dados | 14 registros fictícios, sendo um indisponível; interface assíncrona única |
| Localização | Cidade/bairro somente; sem endereço exato ou mapa falso |
| Paginação | 6 imóveis, com ordenação antes de paginar; página é corrigida para o último intervalo válido |
| Similares | Disponíveis, publicados e distintos do atual; mesma cidade ou tipo, priorizados por cidade, tipo, quartos e proximidade de aluguel |
| Modo público | Prévia demonstrativa publicada na Vercel, conforme solicitação do usuário; ativar o catálogo real depende de API, conteúdo e migração |

## Estrutura

```text
src/app                 rotas, metadados, estados e estilos
src/components          navegação, busca, cards, galeria e contato
src/config/site.ts      informações institucionais verificadas
src/domain/property.ts  contratos de dados
src/data                fixtures, regras e composição do repositório
src/lib                 URL, custos, ambiente e mensagens
tests/unit              regras de domínio e integração futura
tests/e2e               fluxos desktop/mobile
public                  marca e imagens locais
docs                    evidências, decisões e passagem para API
```

Componentes recebem registros serializáveis. Não conhecem o array de fixtures nem credenciais. Apenas a composição do repositório importa `server-only`; regras puras podem ser testadas sem navegador.

## Pendências externas

1. API: contrato, autenticação, campos, atualização, disponibilidade, mídia e política de localização.
2. Conteúdo final: revisão empresarial dos canais, serviços e compatibilidade da política oficial com o novo fluxo.
3. Publicação definitiva: domínio oficial e continuidade dos serviços já existentes; a hospedagem da prévia já está configurada na Vercel.
4. Migração: inventariar URLs antigas e mapear redirecionamentos por identificador, incluindo `/aluguel/...` e `/imovel/<slug>/<id>`.

Essas pendências não impedem a navegação completa da demonstração local ou da prévia publicada. Nenhuma chamada de API externa de imóveis foi implementada.
