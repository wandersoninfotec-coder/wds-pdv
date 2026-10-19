📋 RESUMO DE TRANSFERÊNCIA — Facilit NFC-e (v19)

Data: 06/Outubro/2026
Status: Fiscal 100% + TEF funcional em homologação. Integração no FinalizarVendaModal aplicada. Bug ativo: comando 29 do SiTef não tratado no TefModal — SiTef abre menu "tipo de cartão" após passar cartão, mesmo com functionId correto.
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

    TecnoSpeed v6.0 via COM. ProgID: NFCex.spdNFCeX (com e minúsculo).

    Timezone: America/Cuiaba (UTC-4).

Frontend

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Pasta: D:\ANDROID\wds-pdv.

TEF — Agente CliSiTef

    Porta 8443 (Apache ficou na 443).

    URL base: https://127.0.0.1:8443/agente/clisitef.

    Versão: 1.0.0.16.r1. serviceState: 1 = pronto.

    Certificado self-signed expirado (2019) — aceitar 1x no navegador.

    Debug: curl.exe -k "https://127.0.0.1:8443/agente/clisitef/state".

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

    Logs: C:\WDS Comercial\NFCeGerada\Log\

Referência técnica

    Especificação CliSiTef v258 (PDF, 140 páginas) — analisada em detalhe.

3. Estrutura de arquivos

Backend — C:\xampp\htdocs\app_mesas_api\
text

models/NfceFiscal.php         ; ✅ ATUALIZADO: sincronizarTefParaNfce + aplicarCartaoEmFormapgto
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ INTEGRADO COM TEF (7 bugs corrigidos)
│   ├── MesaDetalhesModal2.jsx
│   ├── TefModal.jsx           ; ⚠️ FALTA tratar comando 29 — bug ativo
│   ├── TesteTefButton.jsx     ; ⚠️ temporário — remover
│   └── ... (outros componentes fiscal)
└── services/
    ├── tefService.js          ; ✅ duplicata de formaParaFunctionId REMOVIDA
    └── ...

4. O que já está pronto/funcional

Fiscal (100%)

    Endpoints: finalizarVenda, nfcePreparar, nfceEmitir, nfceStatusSefaz, nfceReprocessarContingencia, nfceDadosImpressao, nfceListar, nfceCancelar, nfceInutilizar, nfceDiagnostico, diagnosticoProdutos, nfceReprocessarRejeitadas, jobStatus, vendaCancelar.

    Cancelar mesa com estorno de estoque.

    Preço editável se produtos.vista = 0.

TEF (fluxo homologado)

    Agente HTTP local (8443) ✅ | Conexão SiTef ✅ | Autorização R$ 0,01 em Crédito ✅

    Endpoints backend: POST /app/verificarTef, /app/tefParametros, /app/gravarVendasTef, /app/gravarVendasTefComprovante.

    helper limparComprovante() (espelha fRetCaracteresComprovante VB6).

Integração FinalizarVendaModal (aplicada)

    FORMAS_TEF = [4, 5, 117] — códigos ERP (crédito/débito/PIX).

    TefModal abre automaticamente para essas formas quando usa_tef.

    Multi-cartão: ordemTef incremental; TefModal grava vendas_tef + comprovante.

    Pagamento TEF não pode ser removido do array (bloqueio com p.tef).

    TefModal renderizado como sibling do fv-overlay (evita clipping).

NfceFiscal.php (atualizado)

    sincronizarTefParaNfce($empresa, $numeroNfce, $venda) chamado após criarFormasPagamento().

    Lê vendas_tef (não cancelados) e faz INSERT em nfce_tef.

    colunasExistentes() faz SHOW COLUMNS dinamicamente.

5. Decisões de arquitetura

    TefModal é quem grava em vendas_tef/vendas_tef_comprovante — FinalizarVendaModal só passa venda e ordem.

    NfceFiscal lê vendas_tef → escreve nfce_tef.

    Formas TEF no ERP: 4 = Crédito, 5 = Débito, 117 = PIX.

    vendas_tef.forma_pgto guarda código tPag SEFAZ (3, 4, 17), não ERP. Conversão via FORMA_TELA_PARA_BD no TefModal.

    ordem em vendas_tef = sequencial do cartão (multi-cartão).

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 = anti-duplicidade.

    MySQL 4.1 retorna tudo como string — sempre Number()/(int) antes de comparar.

6. Problemas atuais e pendências
🔴 ATIVO — Menu "tipo de cartão" aparece após passar cartão

Sintoma:

    Testado com cartão puro crédito e functionId=3 correto → ainda aparece.

    ParamAdic com blacklist ([16;17;18;19;]) aplicado → ainda aparece.

    Menu vem depois da leitura do chip, não antes.

Causa-raiz identificada (análise do sample oficial agenteCliSiTef.js):
O sample trata o comando 29 explicitamente:
js

case 29:
  if (data.fieldId == 2967) continua("7");        // tipo = CPF
  if (data.fieldId == 2968) continua("11");       // min
  if (data.fieldId == 2969) continua("11");       // max
  if (data.fieldId == 2970) continua("0");        // timeout
  if (data.fieldId == 512)  continua("009016");
  if (data.fieldId == 2606) continua("0");
  if (data.fieldId == 2607) continua("0");
  if (data.fieldId == 2609) continua("<hash>");
  break;

Manual CliSiTef v258, seção 5.3.1 (p.33):

    Comando 29 = coleta direta, sem intervenção do operador. Exemplos: "formas de pagamento que algumas transações requerem para identificar qual o tipo de pagamento".

O TefModal.jsx NÃO trata o comando 29 — cai no fallback continuar(''). O SiTef recebe vazio e abre menu pro operador.

Correção pendente (não aplicada): adicionar if (cmd === 29) no processarComando do TefModal.jsx com os fieldId do sample.
🟡 Pendências menores

    Confirmar logs [TEF-RAW] cmd=29 fieldId=XXXX no console do browser para fechar diagnóstico.

    Testar venda real end-to-end após fix do cmd 29.

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração produção (setup clientes).

    Task Scheduler em andamento.

🟢 Roadmap longo

    E-mail (PHPMailer + XML + PDF).

    Empacotar Electron + IPC.

    Fix do vendedor (codigoFuncionario).

7. Próximo passo exato
7.1 — Log diagnóstico (opcional, mas recomendado)

No TefModal.processarComando, adicionar no início:
js

console.log('[TEF-RAW] cmd=%s fieldId=%s buffer=%s min=%s max=%s',
  data.commandId, data.fieldId, JSON.stringify(data.data),
  data.fieldMinLength, data.fieldMaxLength);

Reproduzir fluxo de Crédito. Confirmar que aparece cmd=29 fieldId=XXXX antes da caixinha.
7.2 — Fix comando 29 no TefModal.jsx

Adicionar antes do fallback continuar(''), logo após o bloco if (cmd === 23):
js

// Comando 29 = coleta direta (sem intervenção do operador)
if (cmd === 29) {
  let resposta = '';
  if (data.fieldId === 2967) resposta = '7';        // tipo = CPF
  else if (data.fieldId === 2968) resposta = '11';  // min
  else if (data.fieldId === 2969) resposta = '11';  // max
  else if (data.fieldId === 2970) resposta = '0';   // timeout infinito
  else if (data.fieldId === 512)  resposta = '009016';
  else if (data.fieldId === 2606) resposta = '0';
  else if (data.fieldId === 2607) resposta = '0';
  else if (data.fieldId === 2609) resposta = '';    // semente hash default

  console.log('[TEF-CMD29] fieldId=%s resposta=%s', data.fieldId, resposta);
  continuar(resposta);
  return;
}

7.3 — Após fix

    Testar Crédito e Débito.

    Menu deve sumir → NFC-e autoriza sem cStat 391.

    Confirmar vendas_tef e nfce_tef gravados.

8. Pegadinhas e decisões não óbvias
Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 $custo_movimentado fora do if/else.

    🔴 Estorno estoque antes de marcar cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 — anti-duplicidade.

    🔴 nfce_totais_formapgto NÃO tem colunas de cartão — <card> SEFAZ vem de nfce_tef.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    MySQL 4.1 — sem CTE, sem window functions.

    coluna = coluna em JOIN — nunca AND coluna solto.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna tudo como string.

TEF

    🔴 Agente na porta 8443 (não 443).

    🔴 Certificado self-signed expirado — curl.exe -k ou aceitar 1x.

    🔴 terminalId = 00000065 (não 142345).

    🔴 React.StrictMode executa useEffect 2x — usar useRef guard.

    🔴 Comando 22 (ENTER) — window.addEventListener.

    🔴 1ª conexão do SiTef baixa tabelas — 1-5 min.

    🔴 URL do agente é HTTPS porta 8443.

    🔴 FORMAS_TEF no frontend = ERP codes (4/5/117), NÃO functionIds.

    🔴 TefModal como sibling do fv-overlay, não child.

    🔴 Pagamento TEF já gravado não pode ser removido sem cancelar venda.

    🔴 Comando 29 (coleta direta) NÃO estava sendo tratado no TefModal — bug ativo.

    🔴 Mapeamento functionId oficial (manual p.21): Função 2 = Débito, 3 = Crédito. Atual: {4:3, 5:2, 117:122}.

    🔴 ParamAdic [...] = blacklist de menus; {...} = funcionalidades.

    🔴 Cartão múltiplo pode disparar menu pós-chip — mas cartão puro também estava disparando, confirmando bug do cmd 29.

    🔴 {TipoDocFiscal=1;} no ParamAdic é o correto para NFC-e (manual p.108) — passar em produção.

9. Instruções para a IA no novo chat

    Fiscal 100% funcional; TEF homologado (R$ 0,01 aprovado em Crédito).

    Integração TEF no FinalizarVendaModal aplicada e funcional.

    Bug ativo: menu "tipo de cartão" pós-chip. Causa-raiz: TefModal.jsx não trata comando 29. Fix pronto na seção 7.2 — aplicar e testar.

    Não refatorar classes validadas (NfceFiscal, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable $t).

    Sempre sanitizarTexto() em justificativas.

    Sempre ler cStat de <retEvento>/<retInutNFe>.

    Sempre tratar cStat 241 e 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente (certificado self-signed).

    Sempre Number() ao comparar códigos MySQL via PDO.

    Sempre tratar comandos 21 (menu), 22 (ENTER), 23 (cancel), 29 (coleta direta), 42 (menu identificado) no TefModal.

    Manter português, respostas técnicas com código.

    Se precisar: pedir NfceTransmissor.php, appController.php, Vendas.php, NfceFiscal.php, TefModal.jsx, tefService.js.

Arquivos-chave da sessão v19:

    agenteCliSiTef.js — sample oficial (jQuery/AJAX) — chave para o bug do cmd 29.

    Especificação CliSiTef v258 — PDF analisado.

    fGravarVendasTef / fGravarVendasTefComprovante (VB6).

    SHOW COLUMNS de nfce_totais_formapgto (6 colunas, sem card).

    SHOW COLUMNS de nfce_tef (10 colunas).

    Screenshot PDV CliSiTef antigo.

Histórico de fixes aplicados na sessão v19:

    FinalizarVendaModal.jsx — 7 bugs corrigidos (FORMAS_TEF correto [4,5,117], coerce Number(), TefModal como sibling, bloqueio remoção pagamento TEF, disabled durante TEF, useRef anti-stale).

    tefService.js — duplicata de formaParaFunctionId removida.

    NfceFiscal.php — sincronizarTefParaNfce + aplicarCartaoEmFormapgto + colunasExistentes.

Fim do documento.