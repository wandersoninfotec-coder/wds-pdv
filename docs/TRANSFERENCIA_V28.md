📋 TRANSFERÊNCIA — Facilit NFC-e (v28)

Data: 09/Outubro/2026 (manhã)
Status: 🎉 NFC-e 100% EMITINDO em homologação — com cliente cadastrado, CPF avulso e sem CPF. cStat 598 e 215 resolvidos. TEF gravando, cancelando e mostrando boas-vindas no PinPad. Arquitetura de rede definida. Próximo: empacotar Electron + voucher.

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef, múltiplos terminais em rede.

ARQUITETURA DE REDE (v26)

    Servidor (192.168.100.67): backend — PHP + MySQL + TecnoSpeed + jobs. SEM frontend, PinPad ou impressora.

    Cada terminal: Electron com frontend buildado. Fala com backend via HTTP e CliSiTef via HTTPS local. Imprime localmente via webContents.print().

    CliSiTef: roda em CADA terminal (PinPad físico local). NÃO centraliza.

    terminalId TEF: ÚNICO por terminal (não repetir 00000065).

    Instalador único NSIS: Electron + frontend + CliSiTef + config (IP servidor).

2. Stack / ferramentas

Backend

    PHP 7.1.9, Apache 2.4.27/XAMPP, MySQL 4.1 (latin1), TecnoSpeed v6.0 (COM NFCex.spdNFCeX).

    Timezone America/Cuiaba. Logs: php_error_log + app_mesas_api\logs\nfce_fiscal.log.

Frontend / Terminal

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20 + Electron.

    Pasta: D:\ANDROID\wds-pdv. Dev server: http://192.168.100.67:3000.

TEF — Agente CliSiTef (em cada terminal)

    Porta 8443, URL https://127.0.0.1:8443/agente/clisitef.

    Versão 1.0.0.16.r1. Cert self-signed — aceitar 1x por terminal.

    Endpoints: /state, /session, /startTransaction, /continueTransaction, /finishTransaction, /getVersion, /pinpad/*.

    🔴 HOMOLOGAÇÃO: PIX está em MODO SIMULAÇÃO — não gera QR Code, PinPad mostra "Simulação OK". Só funciona em produção.

    PinPad: 16 chars/linha, 2 linhas úteis.

Credenciais SiTef

    IP 177.72.161.156:4096 | Loja 00000000 | Terminal único por máquina.

    CNPJ adquirente 01425787000104.

Credenciais NFC-e

    SH CNPJ 14234584000174, token 6f8547fdd9dff39473e2cb42a7568907.

    Emitente CNPJ 58717761000149, UF MT, Ambiente=2 (homologação).

Pastas TecnoSpeed

    C:\WDS Comercial\Templates\vm60\, Esquemas\vm60\, certificado\cliente.pfx (senha 123), NFCeGerada\ano\mes\dia\.

3. Estrutura de arquivos

Backend — C:\xampp\htdocs\app_mesas_api\
text

models/NfceFiscal.php         ; ✅ criarEmitente + criarDestinatario (com fix 598/215) + sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ finalizarVenda + nfceEmitir + dadosEmpresa (fantasia) + gravarVendasTef + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── main.jsx                    ; ✅ SEM StrictMode
├── pages/DashboardPage.jsx     ; ✅ useEffect PinPad boas-vindas
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ TEF + cancelamento TEF + input CPF avulso
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar'
│   ├── TesteTefButton.jsx      ; ⚠️ temporário
│   └── ...
└── services/
    ├── pagamentoService.js     ; ✅ finalizarEEmitir com cpf_nfce
    ├── tefService.js           ; ✅ mostrarMensagemPinpad + centralizarPinpad + montarBoasVindas + cancelarVendasTef
    └── ...

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO

    NFC-e com cliente cadastrado (venda 1508 Wanderson): AUTORIZADA ✅

    NFC-e com CPF avulso (vendas 1500, 1501, 1510): AUTORIZADA ✅

    NFC-e sem CPF (< R$ 1000): AUTORIZADA ✅

    Cancelamento, inutilização, contingência, rejeitadas, diagnóstico ativos.

    <card> no XML via JOIN nfce_tef × vendas_tef.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).

    Tela de resultado; cmds 21/22/23/29/42 tratados.

    Cancelamento TEF: grava `cancelado=1`; preserva NSU original.

Gravação TEF

    vendas_tef / vendas_tef_comprovante — gravando (PK 5 colunas).

    nfce_tef — gravando com forma_pgto.

PinPad Boas-Vindas

    ✅ No mount do Dashboard, envia "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    ✅ persistente='Y' — sobrevive à sessão e à transação.

StrictMode

    ✅ Removido de main.jsx — resolveu duplicação de TefModal e 409 em finalizarVenda.

CPF na Nota — RESOLVIDO v28 🎉

    ✅ CPF avulso: input com máscara + DV, envio via cpf_nfce.

    ✅ Cliente cadastrado: clienteTemDoc=S, persiste em vendas.cliente, xNome do cadastro.

    ✅ Backend valida: total ≥ 1000 sem CPF → erro antes de gravar.

    ✅ cStat 598 (xNome em homologação) — resolvido: força "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" quando ambiente=2, tanto para cliente cadastrado quanto para CPF avulso.

    ✅ cStat 215 (schema XML <enderDest>) — resolvido: quando não tem cadastro, anula TODOS os campos de endereço (dest_xLgr, dest_nro, dest_xBairro, dest_cMun, dest_xMun, dest_uf, dest_cep, dest_pais, dest_xPais). TecnoSpeed omite <enderDest> inteiro.

    ✅ CPF avulso + cliente cadastrado em homologação: emitindo.

    ✅ Log confirmou: vendas 6119, 6120, 6121, 6123 autorizadas.

PIX QR Code

    ⏸ BLOQUEADO por homologação (simulação). Código preparado para produção (qrcode.react local — opcional).

5. Decisões de arquitetura

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef. NOMES DIFERENTES.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Sem ON DUPLICATE em MySQL 4.1; SELECT+UPDATE/INSERT.

    CPF avulso NÃO persiste em banco — viaja só no payload do nfceEmitir.

    Validação CPF: front (máscara + DV) + backend (total ≥ 1000 sem CPF → erro).

    Cliente com cpf (11) → CPF; com cpf (14) → CNPJ (normalizar no carregarCliente).

    🔴 HOMOLOGAÇÃO: xNome do destinatário é SEMPRE o texto padrão SEFAZ (não usar nome real do cliente/empresa).

    🔴 HOMOLOGAÇÃO: xProd usa "NOTA FISCAL EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL". xNome do destinatário usa "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" (note: NF-E, não NOTA FISCAL).

    🔴 NFC-e sem cadastro: anular TODOS os 9 campos de endereço (incluindo dest_pais/dest_xPais) → TecnoSpeed omite <enderDest>.

    data_c/hora_c em vendas_tef: DD/MM/YYYY + HH:MM:SS (VB6).

    catch (Throwable) obrigatório em prepararTudo/nfceEmitir.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 anti-duplicidade.

    MySQL 4.1 retorna string — sempre Number()/(int).

    🔴 SEM React.StrictMode no PDV — quebra fluxo TEF (montagem dupla).

    PinPad largura 16x2. mostrarMensagemPinpad é idempotente.

    ARQUITETURA DE REDE: servidor backend/fiscal; terminais Electron + CliSiTef + impressora local.

6. Problemas atuais e pendências

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (versões 40 e 80 chars). Apagar a antiga (40).

    tefService.js — montarParametrosCancelamento usa '001-000 = 884' hardcoded. Trocar por String(venda) (receber venda como 3º argumento).

    TefModal.jsx — captura defensiva de QR Code em cmd===0 com /^000201/ (para produção).

    TefModal.jsx — migrar de api.qrserver.com para qrcode.react local (opcional).

    NfceFiscal.php — aplicarCartaoEmFormapgto ainda usa $t['forma_pgto'] (deveria ser forma_pagto) e catch(Exception). Early-returna, não bloqueia.

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção.

    Task Scheduler em andamento.

    Tela de acompanhamento TEF.

🟢 Roadmap longo

    Empacotar Electron (main.js + preload + electron-builder + NSIS com CliSiTef).

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

    CPF avulso em PRODUÇÃO: se bate com cadastro, usar razao do cliente.

7. Próximo passo exato

Prioridade 1 — Limpar duplicatas no tefService

    Apagar mostrarMensagemPinpad de 40 chars. Trocar '884' por String(venda) em montarParametrosCancelamento.

Prioridade 2 — Empacotar Electron

    Criar electron/main.js (com webContents.print() para impressão silenciosa).

    Ajustar vite.config.js: base: './'.

    Configurar electron-builder no package.json (target nsis + portable).

    Instalador NSIS único: Electron + frontend + CliSiTef + config.

Prioridade 3 — Voucher

    Frontend: adicionar 6: 5 em formaParaFunctionId; capturar campo 546 no TefModal.

    ERP: criar forma "Cartão Alimentação" com codigoFormaErp=6.

    CliSiTef.ini: habilitar código 20.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo schema: terminino_vigencia_ncm_nbs_ibs_cbs.

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 cStat 598 = homologação com xNome de destinatário diferente do padrão.

    🔴 cStat 215 = falha de schema (geralmente <enderDest> mal formado por campos vazios).

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 Estorno estoque antes de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 anti-duplicidade.

    🔴 nfce_totais_formapgto NÃO tem colunas de card — <card> via JOIN.

    🔴 HOMOLOGAÇÃO: xProd e xNome destinatário têm textos DIFERENTES ("NOTA FISCAL..." vs "NF-E...").

    🔴 NFC-e sem cadastro: anular dest_pais/dest_xPais TAMBÉM — senão TecnoSpeed gera <enderDest> com campos vazios.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable), sem sintaxe moderna.

    MySQL 4.1 — sem CTE, sem window functions, sem ON DUPLICATE em prepared.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna string — sempre Number().

    Nunca concatenar PDOStatement em log.

    ❗ PHP 7: Error NÃO é capturado por catch(Exception). Sempre Throwable.

    ❗ React StrictMode NÃO funciona em PDV — quebra fluxo TEF. Sempre remover.

TEF

    🔴 Agente porta 8443; cert self-signed; terminalId único por máquina.

    🔴 FORMAS_TEF = ERP codes (4/5/117), NÃO functionIds.

    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.

    🔴 Cancelamento pós-finishTransaction só via 200 + string CNC.

    🔴 Campo 546 = Tipo Voucher.

    🔴 TefModal como sibling do fv-overlay.

PinPad

    🔴 Largura: 16 chars x 2 linhas.

    🔴 persistente='Y' sobrevive à sessão e à transação.

    🔴 Centralização manual via padding (firmware não centraliza).

PIX (homologação)

    🔴 Em homologação SiTef, PIX está em MODO SIMULAÇÃO — não gera QR Code.

    🔴 QR Code só funciona em PRODUÇÃO.

Pegadinhas de schema

    🔴 vendas_tef: coluna forma_pagto.

    🔴 nfce_tef: coluna forma_pgto. NOMES DIFERENTES.

    🔴 vendas_tef_comprovante: coluna via_cliente (minúsculo).

    🔴 PK vendas_tef: (empresa, venda, parcela, codigo, ordem).

    🔴 tipo em vendas_tef é char(1), sempre '1'.

    🔴 clientes tem APENAS coluna cpf (armazena CPF 11 ou CNPJ 14, controlado por tipo).

    🔴 data_c/hora_c são varchar(15) — VB6 usa DD/MM/YYYY + HH:MM:SS.

9. Instruções para a IA no novo chat

    NFC-e 100% EMITINDO em homologação — com cliente cadastrado, CPF avulso e sem CPF. cStat 598 e 215 resolvidos.

    TEF gravando, cancelando e mostrando boas-vindas no PinPad.

    PIX QR Code bloqueado por homologação (simulação). Código preparado para produção.

    StrictMode removido (crítico). Não reintroduzir.

    Ordem: (1) limpar duplicatas tefService; (2) empacotar Electron; (3) voucher.

    Pedir antes de codar: arquivos específicos da tarefa.

    Não refatorar classes validadas (NfceFiscal exceto criarDestinatario/carregarCliente, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Nunca reintroduzir React.StrictMode.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable) — nunca Exception sozinho.

    Sempre inTransaction() antes de rollBack().

    Sempre sanitizarTexto() em justificativas.

    Sempre tratar cStat 241, 563 como sucesso; 598 e 215 mapeados.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Nunca concatenar PDOStatement em log.

    Manter português, respostas técnicas com código.

10. Histórico de correções acumuladas

v19-v27: ver documentos anteriores.

v28 (hoje):

    NfceFiscal.php — criarDestinatario reescrito:
      - Em homologação, força xNome = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL" (resolveu cStat 598).
      - Quando não tem cadastro, anula TODOS os 9 campos de endereço (incluindo dest_pais/dest_xPais), fazendo TecnoSpeed omitir <enderDest> (resolveu cStat 215).
      - Mantém endereço quando cliente cadastrado.

    Testado: vendas com cliente cadastrado (1508), CPF avulso (1510) e sem CPF (1509) autorizaram.

    Bug do cliente cadastrado não persistindo em vendas.cliente foi resolvido (log clienteTemDoc=S).

    Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: limpar duplicatas tefService, empacotar Electron, e implementar voucher. 🎯