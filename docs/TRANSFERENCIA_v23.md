📋 TRANSFERÊNCIA — Facilit NFC-e (v23)

Data: 07/Outubro/2026 (tarde/noite)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando em vendas_tef/vendas_tef_comprovante, sincronizando em nfce_tef, e <card> saindo corretamente no XML. cStat 391 resolvido nesta sessão. Pendência: implementar Cartão Alimentação/Refeição (voucher).

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

models/NfceFiscal.php         ; ✅ sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente + blocoFormasPagamento reescrito
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ gravarVendasTef + gravarVendasTefComprovante + limparComprovante reescritos

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

Gravação TEF — RESOLVIDO v23 🎉

    gravarVendasTef → INSERT/UPDATE explícito com PK de 5 colunas (empresa, venda, parcela, codigo, ordem). Sem ON DUPLICATE (MySQL 4.1 não suporta em prepared). ✅

    gravarVendasTefComprovante → mesmo tratamento, coluna via_cliente (minúsculo). ✅

    limparComprovante → normaliza CRLF, remove caracteres de controle. ✅

    vendas_tef.tipo = sempre '1' (não C/D). ✅

    PIX normalizado: se forma_pgto=10, vira 17 (com ===). ✅

nfce_tef + <card> — RESOLVIDO v23 🎉

    sincronizarTefParaNfce → coluna é forma_pgto em nfce_tef (não forma_pagto). ✅

    blocoFormasPagamento → monta <card> via JOIN nfce_tef × vendas_tef. ✅

    buscarCartaoTef() → helper que faz o JOIN (tpIntegra, CNPJ, tBand, cAut, idTerminal). ✅

    cnpjEmitente() → retorna CNPJ do emitente só com dígitos (helper soNumeros). ✅

    NT 2024.001 atendida: CNPJReceb_YA07a + idTermPag_YA07b (>= 01/07/2024). ✅

    NFC-e EMITINDO COM SUCESSO. cStat 391 resolvido. ✅

5. Decisões de arquitetura

    TefModal grava em vendas_tef/vendas_tef_comprovante.

    NfceFiscal lê vendas_tef → escreve nfce_tef → JOIN para montar <card> no XML.

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef. NOMES DIFERENTES.

    vendas_tef.tipo = char(1), sempre '1'.

    vendas_tef.codigo = substr(NSU, 0, 20) (fallback uniqid). nfce_tef.codigo espelha esse valor para o JOIN casar.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Sem ON DUPLICATE KEY UPDATE — MySQL 4.1 não suporta em prepared statement.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 = anti-duplicidade.

    MySQL 4.1 retorna tudo como string — sempre Number() / (int).

    catch (Throwable $t) sempre; inTransaction() antes de rollBack().

    Nunca concatenar PDOStatement em log (usar ->queryString). Causa de erro mascarado.

    Menu de crédito filtrado no frontend (3 opções fixas).

    Débito auto-seleciona à vista (sem interação).

    Tela de resultado antes de chamar onSucesso (UX).

6. Problemas atuais e pendências

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

    Backend: nada a alterar — NfceFiscal já usa vendas_tef.forma_pagto.

    CliSiTef.ini: habilitar código 20 (Cartão Refeição Eletrônico) em TransacoesAdicionaisHabilitadas.

    ERP: criar forma de pagamento "Cartão Alimentação" com codigoFormaErp = 6.

Tabela tPag SEFAZ:
Código	Descrição
10	Vale Alimentação
11	Vale Refeição
12	Vale Presente
13	Vale Combustível

🟡 Pendências menores

    aplicarCartaoEmFormapgto (NfceFiscal.php) — ainda usa $t['forma_pgto'] (deveria ser forma_pagto) e catch(Exception). Early-returna, não bloqueia, mas corrigir.

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção.

    Task Scheduler em andamento.

🟢 Roadmap longo

    E-mail (PHPMailer + XML + PDF).

    Empacotar Electron + IPC.

    Fix do vendedor (codigoFuncionario).

    Passar {TipoDocFiscal=1;} no ParamAdic (produção — manual p.108).

7. Próximo passo exato

Prioridade 1 — Implementar Cartão Alimentação

Seguir os 5 passos da seção 6 (voucher).

Prioridade 2 — Limpar resíduos

Remover TesteTefButton.jsx, corrigir aplicarCartaoEmFormapgto (forma_pagto + Throwable).

Prioridade 3 — Teste end-to-end voucher

Cadastrar forma no ERP, configurar CliSiTef.ini, testar crédito/débito/PIX/voucher.

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

    🔴 nfce_totais_formapgto NÃO tem colunas de card — <card> SEFAZ vem de JOIN nfce_tef × vendas_tef.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    MySQL 4.1 — sem CTE, sem window functions, sem ON DUPLICATE em prepared.

    coluna = coluna em JOIN — nunca AND coluna solto.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna tudo como string — sempre Number().

    Nunca concatenar PDOStatement em log — quebra em Error não capturado por catch(Exception). Sintoma: "ERRO GERAL: There is no active transaction" mascarando erro real.

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

Pegadinhas de schema (descobertas na v22/v23)

    🔴 vendas_tef: coluna é forma_pagto.

    🔴 nfce_tef: coluna é forma_pgto. NOMES DIFERENTES.

    🔴 vendas_tef_comprovante: coluna é via_cliente (minúsculo).

    🔴 PK vendas_tef tem 5 colunas: empresa, venda, parcela, codigo, ordem.

    🔴 PK vendas_tef_comprovante tem as mesmas 5 colunas.

    🔴 tipo em vendas_tef é char(1), sempre '1' (não C/D).

9. Instruções para a IA no novo chat

    TEF e NFC-e 100% funcionais em homologação — Crédito, Débito e PIX validados e nota emitida com sucesso.

    Pendência 1: implementar Cartão Alimentação/Refeição (plano definido na seção 6).

    Pendência 2: corrigir aplicarCartaoEmFormapgto (forma_pagto + Throwable). Não bloqueia.

    Não refatorar classes validadas (NfceFiscal, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable $t) + inTransaction() antes de rollBack().

    Sempre sanitizarTexto() em justificativas.

    Sempre ler cStat de <retEvento>/<retInutNFe>.

    Sempre tratar cStat 241 e 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Nunca concatenar PDOStatement em log.

    Sempre tratar comandos 21 (menu), 22 (ENTER), 23 (cancel), 29 (coleta direta), 42 (menu identificado) no TefModal.

    Manter português, respostas técnicas com código.

    Se precisar: pedir appController.php, NfceTransmissor.php, Vendas.php, TefModal.jsx, tefService.js, NfceFiscal.php.

10. Histórico de correções acumuladas

v19:

    FinalizarVendaModal.jsx — 7 bugs (FORMAS_TEF, coerce, sibling, bloqueio remoção TEF, disabled, useRef).

    tefService.js — duplicata removida.

    NfceFiscal.php — sincronizarTefParaNfce.

v20:

    tefService.js — formaParaFunctionId corrigido {4:3, 5:2, 117:122}.

    TefModal.jsx — comando 29 (coleta direta) tratado.

    TefModal.jsx — comando 21 (menu) renderizado como botões.

v21:

    TefModal.jsx — filtro de menu: crédito = 3 opções, débito = auto-à-vista.

    TefModal.jsx — prompt do SiTef visível nos comandos 30-38 + dica de parcelas.

    TefModal.jsx — tela de resultado (sucesso/erro) antes de fechar.

    tefService.js — parametrosAdicionais refinado por forma.

v22:

    appController.php — gravarVendasTef: PK 5 colunas, INSERT/UPDATE explícito (sem ON DUPLICATE), codigo com fallback NSU, tipo='1'.

    appController.php — gravarVendasTefComprovante: via_cliente (minúsculo), mesmo tratamento de PK.

    appController.php — limparComprovante: normaliza CRLF, remove control chars.

    appController.php — gravarVendasTef: PIX normalizado 10→17 com ===.

    NfceFiscal.php — sincronizarTefParaNfce: forma_pagto (era forma_pgto), Throwable, removidas concatenações de PDOStatement.

    Descoberta: erro 500 inicial era PK de 5 colunas + coluna forma_pagto.

v23 (hoje):

    NfceFiscal.php — blocoFormasPagamento reescrito: <card> via JOIN nfce_tef × vendas_tef.

    NfceFiscal.php — buscarCartaoTef() criado (JOIN com vendas_tef para pegar id_terminal).

    NfceFiscal.php — cnpjEmitente() criado (só dígitos, para CNPJReceb).

    NfceFiscal.php — sincronizarTefParaNfce limpo (logs de debug removidos, mantido só o essencial).

    appController.php — tipo em vendas_tef forçado para '1' (não C/D).

    🎉 NFC-e EMITINDO com sucesso. cStat 391 resolvido. <card> saindo no XML.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: seguir com a implementação do Cartão Alimentação/Refeição (voucher) — seção 6. 🎯