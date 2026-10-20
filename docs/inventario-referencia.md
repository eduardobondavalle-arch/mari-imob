# Inventário da referência

Inspeção: 18/09/2026. Chrome automatizado, viewport desktop 1440 × 1000 e mobile 390 × 844. Evidências em `docs/referencia/`; os scripts apenas navegam e inspecionam páginas públicas, sem enviar formulários.

## Observado

| Página/fluxo | Evidência e comportamento |
| --- | --- |
| [Início CRI](https://www.imobiliariacri.com.br/) | Cabeçalho claro com marca à esquerda, busca curta, menus e contato. Hero panorâmico com sobreposição azul-escura, título condensado, CTA laranja e bloco claro de busca. Cards, faixa institucional e rodapé escuro. `inicio-desktop.png` e `inicio-mobile.png`. |
| [Busca CRI](https://www.imobiliariacri.com.br/buscar?city=balneario-camboriu) | Filtros na lateral esquerda, grade de três colunas no desktop, contagem/ordenação, quartos/suítes/vagas, faixa de valor, tipo, características, condomínio e área. Conteúdo carregado no navegador, embora a extração textual anterior mostrasse somente carregamento. `busca-desktop.png` e `busca-mobile.png`. |
| [Detalhe CRI](https://www.imobiliariacri.com.br/imovel/apartamento-a-venda-com-3-suites-no-shard-tower-em-itapema-IM02038) | Título, fotos, resumo de características, valor/contato lateral, comodidades, descrição, conteúdo de empreendimento e similares. Acesso funcionou no navegador. `detalhe-desktop.png` e `detalhe-mobile.png`. |
| [Institucional CRI](https://www.imobiliariacri.com.br/sobre-nos) | Manifesto, blocos de valores, história e ecossistema. `sobre-desktop.png` e `sobre-mobile.png`. |
| [Contato CRI](https://www.imobiliariacri.com.br/contato) | Composição editorial, formulário e unidades. Nenhum envio executado. `contato-desktop.png` e `contato-mobile.png`. |
| Menus | Hover desktop e abertura efetiva do menu mobile; grupos por cidades, características e conteúdo. Capturas `menu-desktop.png`/`menu-mobile.png` e registro `interacoes.json`. |
| [Institucional Adim](https://www.adimalugueis.com.br/sobre) | Conteúdo institucional, logo laranja no cabeçalho, versão branca no rodapé e links de serviços atuais. `adim-desktop.png`, `adim-mobile.png` e `adim.json`. |

## Tokens observados

Estilos computados registrados em `inicio.json` e `busca.json`:

| Token | Valor observado | Uso nesta entrega |
| --- | --- | --- |
| Azul-escuro de títulos | `rgb(0, 0, 52)` → `#000034` | Texto, hero e faixas |
| CTA laranja | `rgb(253, 86, 15)` → `#fd560f` | Ações principais |
| Link laranja escuro | `rgb(204, 68, 22)` → `#cc4416` | Rótulos em fundo claro |
| Botão roxo | `rgb(34, 0, 182)` → `#2200b6` | Ações secundárias fortes |
| Fundo de cards | `rgb(241, 241, 241)` → `#f1f1f1` | Superfícies de apoio; cards finais brancos |
| Texto secundário | `rgb(106, 106, 106)` → `#6a6a6a` | Parágrafos |
| Tipografia | Proxima Nova no corpo; Montserrat em componentes/títulos | Montserrat aberta e local; Oswald para a composição condensada do hero |
| Cards | Raio de 12 px | Preservado |

O rodapé `#0b102b`, branco quente e ajustes de contraste são adaptações documentadas, não medições afirmadas como exatas. Proxima Nova não foi copiada; não foi fornecida licença. Nenhum código da CRI foi incorporado ao aplicativo.

## Adaptado para a Adim

- Jornadas de compra/lançamento foram substituídas por locação anual e proprietários.
- Marca, contatos, fatos institucionais e política vêm da Adim. Imagens são próprias e ilustrativas.
- Hero mantém composição central e contraste escuro; busca inclui cidade, tipo e texto diretamente.
- Cards mantêm hierarquia imagem/localização/características/preço, com aluguel mensal e identificação de demonstração.
- Busca usa três colunas em desktop amplo e adapta para duas/uma; filtros mobile em diálogo acessível com aplicar/cancelar.
- Não foram reproduzidos alertas de preço, financiamento, ofertas exclusivas, formulário de vendas, mascote ou estatísticas comerciais da referência.
- Galeria em mosaico e lightbox; custos separados; contato contextual; não há mapa fictício.
- Espaços vazios vistos nas capturas da referência não foram reproduzidos. Podem corresponder a conteúdo carregado posteriormente.

## Inferido ou não verificado

- Não foram verificados contratos de API, comportamento de backend, entrega de leads ou persistência da CRI.
- Não foi afirmado que todas as combinações dos filtros da CRI funcionam: foram inspecionados os controles visíveis e resultados da URL pública.
- Estados vazios/erros completos da referência não foram induzidos de forma confiável. Os estados do novo site são implementações próprias e testáveis, sem alegação de reprodução exata.
- Não foram medidos tempos de carregamento de campo nem Core Web Vitals da referência.
