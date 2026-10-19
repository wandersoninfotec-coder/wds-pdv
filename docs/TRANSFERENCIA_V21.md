📋 TRANSFERÊNCIA — Facilit NFC-e (v21)

Data: 07/Outubro/2026 (manhã)
Status: 🎉 TEF 100% funcional em homologação — Crédito, Débito e PIX validados. Menu de crédito ajustado (3 opções), tela de resultado implementada. Pendências: erro 500 em gravarVendasTef + implementar Cartão Alimentação/Refeição (voucher).
1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite, pasta D:\ANDROID\wds-pdv — sem Electron ainda.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef integrado no PDV.

2. Stack / ferramentas

Backend

    PHP 7.1.9 (sem fn(), typed properties, trailing comma).

    Apache 2.4.27 / XAMPP (LocalSystem).

    MySQL 4.1 (charset latin1).

    TecnoSpeed v6.0 via COM. ProgID: NFCex.spdNFCeX.

    Timezone: America/Cuiaba (UTC-4).

    Log: C:\xampp\php\logs\php_error_log.

Frontend

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Pasta: D:\ANDROID\wds-pdv.

    Dev server: http://192.168.100.67:3000.

TEF — Agente CliSiTef

    Porta 8443 (Apache ficou na 443).

    URL base: https://127.0.0.1:8443/agente/clisitef.

    Versão: 1.0.0.16.r1. serviceState: 1 = pronto.

    Certificado self-signed expirado — aceitar 1x no navegador.

    Instalação: C:\AgenteClisitef\ | Logs: C:\AgenteClisitef\logs\.

Credenciais SiTef

    IP: 177.72.161.156 | Porta: 4096

    Loja: 00000000 | Terminal: 00000065

    CNPJ adquirente: 01425787000104

Credenciais NFC-e

    Software House: CNPJ 14234584000174, token 6f8547fdd9dff39473e2cb42a7568907

    Emitente: CNPJ 58717761000149, UF MT, Ambiente=2 (homologação)

Pastas TecnoSpeed

    C:\WDS Comercial\Templates\vm60\, Esquemas\vm60\

    C:\WDS Comercial\certificado\cliente.pfx (senha: 123)

    Gerados: C:\WDS Comercial\NFCeGerada\ano\mes\dia\

Referência técnica

    Especificação CliSiTef v258 (PDF, 140 páginas).

    Sample oficial agenteCliSiTef.js.

3. Estrutura de arquivos

Backend — C:\xampp\htdocs\app_mesas_api\
text

models/NfceFiscal.php         ; ✅ sincronizarTefParaNfce + aplicarCartaoEmFormapgto
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ⚠️ gravarVendasTef com erro 500

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ INTEGRADO COM TEF
│   ├── MesaDetalhesModal2.jsx
│   ├── TefModal.jsx           ; ✅ cmd 21, 29, resultado, filtro por forma
│   ├── TesteTefButton.jsx     ; ⚠️ temporário — remover depois
│   └── ...
└── services/
    ├── tefService.js          ; ✅ {4:3, 5:2, 117:122}
    └── ...

4. O que está pronto/funcional

Fiscal (100%)

    Endpoints ativos, cancelamento, inutilização, contingência, rejeitadas, diagnóstico.

    Cancelar mesa com estorno de estoque.

    Preço editável se produtos.vista = 0.

TEF — FLUXO COMPLETO VALIDADO 🎉

    Crédito → menu com 3 opções (À Vista / Parcelado Estab / Parcelado Adm) ✅

    Débito → sem menu, auto-seleciona à vista ✅

    PIX → QR Code ✅

    Parcelado → prompt do SiTef + dica "Digite o número de parcelas" ✅

    Tela de resultado → sucesso (verde, com NSU/autorização) ou erro (vermelho) ✅

    Comando 29 (coleta direta) tratado ✅

    Comando 21 (menu) renderizado como botões ✅

    finishTransaction chamado corretamente ✅

Integração FinalizarVendaModal

    FORMAS_TEF = [4, 5, 117] — códigos ERP.

    TefModal abre automaticamente quando usa_tef.

    Multi-cartão: ordemTef incremental.

    Pagamento TEF não pode ser removido (bloqueio com p.tef).

    TefModal renderizado como sibling do fv-overlay.

tefService.js

    formaParaFunctionId: {4: 3, 5: 2, 117: 122} — manual CliSiTef p.21.

    parametrosAdicionais para PIX e crédito/débito.

NfceFiscal.php

    sincronizarTefParaNfce() chamado após criarFormasPagamento().

    Lê vendas_tef (não cancelados) → grava nfce_tef.

    colunasExistentes() com SHOW COLUMNS dinâmico.

5. Decisões de arquitetura

    TefModal grava em vendas_tef/vendas_tef_comprovante.

    NfceFiscal lê vendas_tef → escreve nfce_tef.

    Formas TEF ERP: 4 = Crédito, 5 = Débito, 117 = PIX.

    vendas_tef.forma_pgto guarda código tPag SEFAZ (3, 4, 17).

    ordem em vendas_tef = sequencial multi-cartão.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 = anti-duplicidade.

    MySQL 4.1 retorna tudo como string — sempre Number().

    Menu de crédito filtrado no frontend (3 opções fixas).

    Débito auto-seleciona à vista (sem interação).

    Tela de resultado antes de chamar onSucesso (UX).

6. Problemas atuais e pendências
🔴 ATIVO — Erro 500 em POST /app/gravarVendasTef

Sintoma:
text

POST http://192.168.100.67/app_mesas_api/app/gravarVendasTef
[HTTP/1.1 500 Internal Server Error 6ms]

Contexto: o TEF completa, mas o backend estoura 500. Não bloqueia o TEF — só não grava. Sem isso, NFC-e retorna cStat 391.

O que precisamos:

    Response body da requisição (F12 → Network → gravarVendasTef → Response).

    C:\xampp\php\logs\php_error_log (últimas ~30 linhas).

    Método gravarVendasTef do appController.php (código completo).

Hipóteses: coluna inexistente no INSERT, PK duplicada (React StrictMode), codigo nulo, tipo de dado errado, função PHP 7.2+.
🟡 NOVO — Implementar Cartão Alimentação/Refeição (voucher)

Plano definido nesta sessão:

    Frontend (tefService.js) — adicionar functionId: 5 (Cartão Benefício):

js

formaParaFunctionId: (codigoErp) => {
  const mapa = {
    4: 3,     // Crédito
    5: 2,     // Débito
    6: 5,     // ✅ Cartão Benefício (Alimentação/Refeição)
    117: 122, // PIX
  };
  return mapa[Number(codigoErp)] || null;
},

    Frontend (TefModal.jsx) — capturar campo 546 (Tipo Voucher) e mapear para tPag SEFAZ:

js

const tipoVoucher = pegar(546);
let tPagSefaz = null;
if (tipoVoucher === '01') tPagSefaz = 10;      // Vale Alimentação
else if (tipoVoucher === '02') tPagSefaz = 11; // Vale Refeição

if (tPagSefaz) dadosTef.formaPagto = tPagSefaz;

    Backend: nada a alterar — NfceFiscal já usa vendas_tef.forma_pgto.

    CliSiTef.ini: habilitar código 20 (Cartão Refeição Eletrônico) em TransacoesAdicionaisHabilitadas.

    ERP: criar forma de pagamento "Cartão Alimentação" com codigoFormaErp = 6.

Tabela tPag SEFAZ:
Código	Descrição
10	Vale Alimentação
11	Vale Refeição
12	Vale Presente
13	Vale Combustível
🟡 Pendências menores

    Confirmar gravação em vendas_tef + nfce_tef após fix do 500.

    Teste end-to-end (item → TEF → NFC-e sem cStat 391).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção.

    Task Scheduler em andamento.

🟢 Roadmap longo

    E-mail (PHPMailer + XML + PDF).

    Empacotar Electron + IPC.

    Fix do vendedor (codigoFuncionario).

    Passar {TipoDocFiscal=1;} no ParamAdic (produção — manual p.108).

7. Próximo passo exato
Prioridade 1 — Resolver erro 500 em gravarVendasTef

Coletar os 3 itens da seção 6 e identificar a linha do erro. Provável divergência de schema no INSERT.
Prioridade 2 — Implementar Cartão Alimentação

Seguir os 5 passos da seção 6 (voucher).
Prioridade 3 — Teste end-to-end

Após fix do 500: emitir NFC-e completa e verificar cStat.
8. Pegadinhas e decisões não óbvias
Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 $custo_movimentado fora do if/else.

    🔴 Estorno estoque antes de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 — anti-duplicidade.

    🔴 nfce_totais_formapgto NÃO tem colunas de card — <card> SEFAZ vem de nfce_tef.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    MySQL 4.1 — sem CTE, sem window functions.

    coluna = coluna em JOIN — nunca AND coluna solto.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna tudo como string — sempre Number().

TEF

    🔴 Agente na porta 8443 (não 443).

    🔴 Certificado self-signed expirado — curl.exe -k ou aceitar 1x.

    🔴 terminalId = 00000065 (não 142345).

    🔴 React.StrictMode executa useEffect 2x — useRef guard.

    🔴 1ª conexão do SiTef baixa tabelas — 1-5 min.

    🔴 URL do agente é HTTPS porta 8443.

    🔴 FORMAS_TEF = ERP codes (4/5/117), NÃO functionIds.

    🔴 TefModal como sibling do fv-overlay, não child.

    🔴 Pagamento TEF já gravado não pode ser removido.

    🔴 Mapeamento functionId: Função 2 = Débito, 3 = Crédito, 5 = Cartão Benefício (manual p.21).

    🔴 Comando 21 = MENU (não coleta). Buffer = "1:A Vista;2:Parcelado;...".

    🔴 Comando 29 = coleta direta (sem interação). FieldIds: 2967=CPF tipo, 2968=min, 2969=max, 2970=timeout.

    🔴 Menu de parcelamento é inevitável — renderizar como botões.

    🔴 Filtro de menu por codigoFormaErp: crédito = ['1','2','3'], débito = auto-à-vista.

    🔴 Prompt do SiTef vem em data.data nos comandos 30-38 — mostrar + adicionar dica.

    🔴 Campo 546 = Tipo Voucher (Alimentação/Refeição) — usar para tPag SEFAZ.

    🔴 {TipoDocFiscal=1;} para NFC-e (produção) — manual p.108.

    🔴 Firefox 118+ avisa "acesso à rede local" — ignorar.

9. Instruções para a IA no novo chat

    TEF 100% funcional em homologação — Crédito, Débito e PIX validados, tela de resultado implementada.

    Pendência 1: erro 500 em /app/gravarVendasTef. Coletar Response + log + código antes de alterar.

    Pendência 2: implementar Cartão Alimentação/Refeição (plano definido na seção 6).

    Não refatorar classes validadas (NfceFiscal, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable $t).

    Sempre sanitizarTexto() em justificativas.

    Sempre ler cStat de <retEvento>/<retInutNFe>.

    Sempre tratar cStat 241 e 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Sempre tratar comandos 21 (menu), 22 (ENTER), 23 (cancel), 29 (coleta direta), 42 (menu identificado) no TefModal.

    Manter português, respostas técnicas com código.

    Se precisar: pedir appController.php, NfceTransmissor.php, Vendas.php, TefModal.jsx, tefService.js.

10. Histórico de correções acumuladas

v19:

    FinalizarVendaModal.jsx — 7 bugs (FORMAS_TEF, coerce, sibling, bloqueio remoção TEF, disabled, useRef).

    tefService.js — duplicata removida.

    NfceFiscal.php — sincronizarTefParaNfce.

v20:

    tefService.js — formaParaFunctionId corrigido {4:3, 5:2, 117:122}.

    TefModal.jsx — comando 29 (coleta direta) tratado.

    TefModal.jsx — comando 21 (menu) renderizado como botões.

v21 (hoje):

    TefModal.jsx — filtro de menu: crédito = 3 opções, débito = auto-à-vista.

    TefModal.jsx — prompt do SiTef visível nos comandos 30-38 + dica de parcelas.

    TefModal.jsx — tela de resultado (sucesso/erro) antes de fechar.

    tefService.js — parametrosAdicionais refinado por forma.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: coletar os 3 itens do erro 500 (gravarVendasTef) e seguir com a implementação do Cartão Alimentação. 🎯
