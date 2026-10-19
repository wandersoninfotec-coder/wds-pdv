📋 TRANSFERÊNCIA — Facilit NFC-e (v20)

Data: 06/Outubro/2026 (fim do dia)
Status: 🎉 TEF 100% FUNCIONAL em homologação! Menu de crédito agora renderizado corretamente. Pendência do dia: corrigir erro 500 em /app/gravarVendasTef.
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

    Log: C:\xampp\php\logs\php_error_log.

Frontend

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Pasta: D:\ANDROID\wds-pdv.

    Servidor dev rodando em: http://192.168.100.67:3000.

TEF — Agente CliSiTef

    Porta 8443 (Apache ficou na 443).

    URL base: https://127.0.0.1:8443/agente/clisitef.

    Versão: 1.0.0.16.r1. serviceState: 1 = pronto.

    Certificado self-signed expirado — aceitar 1x no navegador.

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

    Especificação CliSiTef v258 (PDF, 140 páginas).

    Sample oficial agenteCliSiTef.js (jQuery/AJAX).

3. Estrutura de arquivos

Backend — C:\xampp\htdocs\app_mesas_api\
text

models/NfceFiscal.php         ; ✅ sincronizarTefParaNfce + aplicarCartaoEmFormapgto
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ⚠️ método gravarVendasTef com erro 500

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ INTEGRADO COM TEF
│   ├── MesaDetalhesModal2.jsx
│   ├── TefModal.jsx           ; ✅ MENU (cmd 21) E COMANDO 29 CORRIGIDOS
│   ├── TesteTefButton.jsx     ; ⚠️ temporário — remover depois
│   └── ...
└── services/
    ├── tefService.js          ; ✅ functionId correto {4:3, 5:2, 117:122}
    └── ...

4. O que está pronto/funcional

Fiscal (100%)

    Endpoints: finalizarVenda, nfcePreparar, nfceEmitir, nfceStatusSefaz, nfceReprocessarContingencia, nfceDadosImpressao, nfceListar, nfceCancelar, nfceInutilizar, nfceDiagnostico, diagnosticoProdutos, nfceReprocessarRejeitadas, jobStatus, vendaCancelar.

    Cancelar mesa com estorno de estoque.

    Preço editável se produtos.vista = 0.

TEF (FLUXO COMPLETO EM HOMOLOGAÇÃO) 🎉

    Agente HTTP local (8443) ✅

    Conexão SiTef ✅

    startTransaction → clisitefStatus: 10000 ✅

    Loop continueTransaction completo ✅

    PinPad lendo cartão ✅

    Menu de parcelamento (comando 21) renderizado com botões ✅ (corrigido hoje)

    Comando 29 (coleta direta — CPF/CNPJ) tratado ✅ (corrigido hoje)

    Autorização aprovada ✅

    finishTransaction ✅

Integração FinalizarVendaModal

    FORMAS_TEF = [4, 5, 117] — códigos ERP.

    TefModal abre automaticamente para essas formas quando usa_tef.

    Multi-cartão: ordemTef incremental.

    Pagamento TEF não pode ser removido (bloqueio com p.tef).

    TefModal renderizado como sibling do fv-overlay.

tefService.js

    formaParaFunctionId: {4: 3, 5: 2, 117: 122} — conforme manual CliSiTef p.21 (Função 2=Débito, 3=Crédito).

    Duplicata da função removida.

NfceFiscal.php

    sincronizarTefParaNfce($empresa, $numeroNfce, $venda) chamado após criarFormasPagamento().

    Lê vendas_tef (não cancelados) → grava em nfce_tef.

    colunasExistentes() faz SHOW COLUMNS dinâmico.

5. Decisões de arquitetura

    TefModal grava em vendas_tef/vendas_tef_comprovante — FinalizarVendaModal só passa venda e ordem.

    NfceFiscal lê vendas_tef → escreve nfce_tef.

    Formas TEF ERP: 4 = Crédito, 5 = Débito, 117 = PIX.

    vendas_tef.forma_pgto guarda código tPag SEFAZ (3, 4, 17), não ERP. Conversão em FORMA_TELA_PARA_BD.

    ordem em vendas_tef = sequencial do cartão (multi-cartão).

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 = anti-duplicidade.

    MySQL 4.1 retorna tudo como string — Number()/(int) antes de comparar.

    Menu de parcelamento do crédito é inevitável via SiTef — renderizar como botões (não como input).

6. Problemas atuais e pendências
🔴 ATIVO — Erro 500 em POST /app/gravarVendasTef

Sintoma:
text

POST http://192.168.100.67/app_mesas_api/app/gravarVendasTef
[HTTP/1.1 500 Internal Server Error 6ms]
[TEF] Erro ao gravar no banco: AxiosError: Request failed with status code 500

Contexto: o TEF completa o fluxo todo (finishTransaction OK, vendas_tef deveria ser gravado), mas o endpoint PHP estoura 500. Não bloqueia o TEF — só não grava no banco. Sem isso, NFC-e vai retornar cStat 391 (falta dados cartão).

O que precisamos para resolver:

    Corpo da resposta 500 (F12 → Network → gravarVendasTef → aba Response).

    C:\xampp\php\logs\php_error_log (últimas ~30 linhas após reproduzir).

    Método gravarVendasTef do appController.php (código completo).

Hipóteses prováveis:
Causa	Sinal no log
Coluna inexistente no INSERT	"Unknown column 'X'"
PK duplicada — TefModal chamando 2x (React StrictMode)	"Duplicate entry"
codigo (PK) = NSU vazio → NULL	"Column 'codigo' cannot be null"
Tipo de dado errado (bandeira_cartao CHAR(2) recebendo >2 chars)	"Data too long"
Função PHP 7.2+ usada sem querer	"Call to undefined function"
🟡 Pendências menores

    Confirmar gravação em vendas_tef + nfce_tef após fix do 500.

    Teste end-to-end de venda real (item → TEF → NFC-e autorizada sem cStat 391).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção (setup clientes).

    Task Scheduler em andamento.

🟢 Roadmap longo

    E-mail (PHPMailer + XML + PDF).

    Empacotar Electron + IPC.

    Fix do vendedor (codigoFuncionario).

    Passar {TipoDocFiscal=1;} no ParamAdic do TefModal (produção — manual CliSiTef p.108).

7. Próximo passo exato
7.1 — Coletar as 3 informações do erro 500

Rodar uma venda de R$ 0,01 em Crédito e capturar:

    (a) Response body da requisição gravarVendasTef no DevTools

    (b) C:\xampp\php\logs\php_error_log (últimas ~30 linhas)

    (c) Conteúdo do método gravarVendasTef em appController.php

7.2 — Colar no chat novo

Com esses 3 itens, identificar a linha exata do 500 e aplicar o patch.
7.3 — Testar depois

    Confirmar que vendas_tef recebe o registro

    Chamar nfceEmitir e verificar se sai sem cStat 391

8. Pegadinhas e decisões não óbvias
Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 $custo_movimentado calculado fora do if/else.

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

    🔴 React.StrictMode executa useEffect 2x — usar useRef guard.

    🔴 Comando 22 (ENTER) — window.addEventListener.

    🔴 1ª conexão do SiTef baixa tabelas — 1-5 min.

    🔴 URL do agente é HTTPS porta 8443.

    🔴 FORMAS_TEF = ERP codes (4/5/117), NÃO functionIds.

    🔴 TefModal como sibling do fv-overlay, não child.

    🔴 Pagamento TEF já gravado não pode ser removido sem cancelar venda.

    🔴 Mapeamento functionId: Função 2 = Débito, 3 = Crédito (manual p.21). {4:3, 5:2, 117:122}.

    🔴 Comando 21 = MENU (não coleta). Buffer = "1:A Vista;2:Parcelado;3:...". Renderizar como botões, não input.

    🔴 Comando 29 = coleta direta (sem interação). FieldIds: 2967=CPF tipo, 2968=min, 2969=max, 2970=timeout.

    🔴 Menu de parcelamento é inevitável para crédito — não dá pra bloquear via ParamAdic.

    🔴 {TipoDocFiscal=1;} para NFC-e (produção) — manual p.108.

    🔴 Firefox 118+ avisa "acesso à rede local" ao chamar 127.0.0.1 de origem HTTP — ignorar, não bloqueia.

9. Instruções para a IA no novo chat

    TEF 100% funcional em homologação — fluxo completo validado (R$ 0,01 Crédito aprovado).

    Pendência única: erro 500 em /app/gravarVendasTef. Coletar Response + log + código antes de qualquer alteração.

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

10. Histórico de correções desta sessão

Session v19 → v20:

    ✅ FinalizarVendaModal.jsx — 7 bugs corrigidos (FORMAS_TEF [4,5,117], coerce Number(), TefModal sibling, bloqueio remoção pagamento TEF, disabled durante TEF, useRef anti-stale).

    ✅ tefService.js — duplicata de formaParaFunctionId removida.

    ✅ tefService.js — formaParaFunctionId corrigido para {4: 3, 5: 2, 117: 122} (manual CliSiTef p.21).

    ✅ NfceFiscal.php — sincronizarTefParaNfce + aplicarCartaoEmFormapgto + colunasExistentes.

    ✅ TefModal.jsx — comando 29 (coleta direta) tratado com fieldIds 2967/2968/2969/2970/512/2606/2607/2609.

    ✅ TefModal.jsx — comando 21 (menu) tratado como botões reais (parse de "1:xxx;2:yyy").

Fim do documento.