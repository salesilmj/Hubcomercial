# Hub Comercial · ILMJ B2B 2026

Duas páginas numa só construção (`index.html`):

- **Quadro de propostas**: kanban das empresas da aba **PIPELINE 2026** da planilha *COMERCIAL | B2B - ILMJ*, com ficha do cliente e histórico.
- **Cockpit comercial**: painel com New Sales, Upsell e "Pipeline do quadro".

## De onde vêm os dados

| Parte | Fonte |
|---|---|
| Cartões e fichas | Aba PIPELINE 2026, via conector do Google Drive |
| New Sales | Aba DADOS GERAIS |
| Upsell | Abas DADOS GERAIS UPSELL e Upsell |
| Pipeline do quadro | O próprio quadro, ao vivo |

A página roda como **Artifact do Claude** (claude.ai) e usa as capacidades `db` (banco compartilhado), `assets` (logos) e `mcp` (Google Drive · `download_file_content`). Aberta fora do Claude, ela mostra o aviso de que não conseguiu se conectar ao armazenamento.

## Estrutura

- `index.html`: página publicada, completa.
- `src/sync-core.js`: leitura da planilha (`sheetBuild`, `cardSummary`, `cockpitBuild`). O mesmo código está embutido no `index.html`.
- `src/cockpit.*`: partes do cockpit usadas para montar o `index.html`.
- `tools/mock-claude.js`: simulação de `window.claude` para testar a página no navegador.

## Regras da sincronização

- Uma empresa por cartão. Cada linha da planilha vira uma entrada na ficha (ids `sh-AAAAMMDD-n`).
- Um cartão só muda de etapa quando o STATUS muda na planilha. Movimentos manuais são preservados.
- Entradas criadas à mão nunca são apagadas. Empresas removidas do quadro não voltam.
- Sincroniza ao abrir (se a última leitura tiver mais de 10 min e o acesso ao Drive já tiver sido permitido) ou pelo botão.
- Leitura pelo conector do Google Drive confirmada em produção em 13/11/2026.

## Dados

Este repositório é **público** e guarda só o código. Os dados dos clientes ficam no banco do artifact e na planilha, nunca aqui.
