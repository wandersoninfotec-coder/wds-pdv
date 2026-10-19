📋 TRANSFERÊNCIA — Facilit NFC-e (v27)

Data: 09/Outubro/2026 (manhã)
Status: 🎉 NFC-e 100% EMITINDO. TEF gravando, cancelando e mostrando boas-vindas no PinPad. CPF na nota: avulso OK, cliente cadastrado com 2 bugs pendentes. PIX QR Code: bloqueado por ambiente de HOMOLOGAÇÃO do SiTef (modo simulação). StrictMode removido. Arquitetura de rede definida (servidor backend / terminais Electron+CliSiTef).

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef integrado, múltiplos terminais em rede.

ARQUITETURA DE REDE (v26/v27)

    Servidor (192.168.100.67): backend — PHP + MySQL 4.1 + TecnoSpeed + NfceTransmissor + jobs. SEM frontend, PinPad ou impressora.

    Cada terminal: Electron com frontend buildado. Fala com backend via HTTP e CliSiTef via HTTPS local (127.0.0.1:8443). Imprime localmente via webContents.print().

    CliSiTef: roda em CADA terminal (PinPad físico local). NÃO centraliza.

    terminalId TEF: ÚNICO por terminal (não repetir 00000065).

    Instalador único NSIS: Electron + frontend + CliSiTef + config (IP servidor).

2. Stack / ferramentas

Backend

    PHP 7.1.9, Apache 2.4.27/XAMPP, MySQL 4.1 (latin1), TecnoSpeed v6.0 (COM `NFCex.spdNFCeX`).

    Timezone America/Cuiaba. Log: C:\xampp\php\logs\php_error_log + app_mesas_api\logs\nfce_fiscal.log.

Frontend / Terminal

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20 + Electron.

    Pasta: D:\ANDROID\wds-pdv. Dev server: http://192.168.100.67:3000.

TEF — Agente CliSiTef (em cada terminal)

    Porta 8443, URL https://127.0.0.1:8443/agente/clisitef.

    Versão 1.0.0.16.r1. Cert self-signed expirado — aceitar 1x por terminal.

    Endpoints: /state, /session, /startTransaction, /continueTransaction, /finishTransaction, /getVersion, /pinpad/*.

    🔴 AMBIENTE HOMOLOGAÇÃO: PIX está em MODO SIMULAÇÃO. Não gera QR Code, não passa pela adquirente. PinPad mostra "Simulação OK".

    PinPad: 16 caracteres por linha, 2 linhas úteis.

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

models/NfceFiscal.php         ; ✅ criarEmitente + criarDestinatario + sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente + blocoFormasPagamento
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ finalizarVenda + nfceEmitir (cpf_nfce) + dadosEmpresa (com fantasia) + gravarVendasTef + gravarVendasTefComprovante + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── main.jsx                    ; ✅ SEM StrictMode (removido v27)
├── pages/
│   └── DashboardPage.jsx       ; ✅ useEffect PinPad boas-vindas
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ TEF + cancelamento TEF + input CPF avulso
│   ├── MesaDetalhesModal2.jsx
│   ├── ClienteModal.jsx        ; ⚠️ verificar se devolve `codigo` e `cpf`
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar'
│   ├── TesteTefButton.jsx      ; ⚠️ temporário
│   └── ...
└── services/
    ├── pagamentoService.js     ; ✅ finalizarEEmitir com cpf_nfce
    ├── tefService.js           ; ✅ mostrarMensagemPinpad + centralizarPinpad + montarBoasVindas (16 chars) + cancelarVendasTef + montarParametrosCancelamento
    └── ...

4. O que está pronto/funcional

Fiscal

    Endpoints ativos, cancelamento, inutilização, contingência, rejeitadas, diagnóstico.

    NFC-e EMITINDO com sucesso. cStat 391 resolvido. <card> no XML via JOIN nfce_tef × vendas_tef.

TEF

    Crédito (menu 3 opções), Débito (auto à vista), PIX (simulação), Parcelado (prompt SiTef).

    Tela de resultado; cmds 21/22/23/29/42 tratados.

    Cancelamento pós-aprovação via functionId=200 + ParamAdic CNC. ✅ Funcionando.

Gravação TEF

    vendas_tef / vendas_tef_comprovante — gravando (PK 5 colunas, sem ON DUPLICATE).

    tipo = '1'; PIX normalizado (10→17).

    nfce_tef — gravando com forma_pgto.

    cancelarVendasTef — backend marca cancelado=1; retorna 409 se rowCount=0.

PinPad Boas-Vindas (NOVO v27)

    ✅ Ao abrir o Dashboard, envia "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    ✅ persistente='Y' — sobrevive à destruição da sessão e à transação TEF.

    ✅ Testado: mensagem aparece e persiste mesmo após passar cartão.

    ✅ Largura confirmada: 16 caracteres por linha.

    ✅ Centralização implementada com padding de espaços.

CPF na Nota

    ✅ CPF avulso: input no FinalizarVendaModal com máscara + DV; envio via cpf_nfce.

    ✅ Backend valida: total ≥ 1000 sem CPF → erro antes de gravar.

    ✅ criarDestinatario prioriza cliente cadastrado → CPF avulso → sem <dest>.

    ✅ Testes 1500 (s/ CPF) e 1501 (com CPF avulso) emitiram OK.

    ⚠️ Teste 1502 — cliente cadastrado NÃO persistiu em vendas.cliente (clienteTemDoc=N).

    ⚠️ carregarCliente referencia c.cnpj — coluna não existe em clientes (só cpf).

StrictMode (NOVO v27)

    ✅ Removido <React.StrictMode> de main.jsx — resolveu duplicação de TefModal, gravando TEF duas vezes e 409 em finalizarVenda.

PIX QR Code (NOVO v27)

    ⏸ BLOQUEADO por homologação. SiTef em modo simulação não gera QR nem devolve via HTTP.

    PinPad mostra "Simulação OK" no final.

    Código preparado para produção (migração para qrcode.react pendente — opcional).

    Handler defensivo com /^000201/ no cmd===0 (BR Code EMV) pendente.

5. Decisões de arquitetura

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef. NOMES DIFERENTES.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    codigo em vendas_tef = string da venda.

    Sem ON DUPLICATE em MySQL 4.1; SELECT+UPDATE/INSERT.

    CPF avulso NÃO persiste em banco — viaja só no payload do nfceEmitir.

    Validação CPF: front (máscara + DV) + backend (total ≥ 1000 sem CPF → erro).

    Cliente com cpf (11) → CPF; com cpf (14) → CNPJ (normalizar no carregarCliente).

    Cancelamento TEF preserva NSU original.

    data_c/hora_c em vendas_tef: DD/MM/YYYY + HH:MM:SS (VB6).

    catch (Throwable) obrigatório em prepararTudo/nfceEmitir.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 anti-duplicidade.

    MySQL 4.1 retorna string — sempre Number()/(int).

    🔴 SEM StrictMode no PDV — TEF interage com hardware e efeitos duplos quebram.

    PinPad largura 16 chars x 2 linhas. centralizarPinpad() preenche com espaços.

    mostrarMensagemPinpad é idempotente — cria sessão, envia, destrói. A mensagem persiste.

    ARQUITETURA DE REDE: servidor backend/fiscal; terminais Electron + CliSiTef + impressora local.

6. Problemas atuais e pendências

🎯 PRÓXIMA TAREFA 1 — Finalizar CPF na nota (2 bugs)

Bug 1 — cliente cadastrado não persiste em vendas.cliente

    Sintoma: venda 1502 salvou cliente=1 apesar de selecionado.

    Diagnóstico pendente:
      SELECT venda, cliente, total, status FROM vendas WHERE empresa=1 AND venda=1502;
      SHOW COLUMNS FROM clientes;
      F12 → Network → finalizarVenda → Payload → campo cliente;
      console.log em handleSelecionarCliente.

Bug 2 — carregarCliente referencia c.cnpj inexistente

    Schema de clientes só tem coluna cpf.

    Fix A preparado: substituir método por versão que só lê cpf e normaliza:
    $doc = $this->soNumeros($row['cpf'] ?? '');
    $row['cpf']  = (strlen($doc) === 11) ? $doc : '';
    $row['cnpj'] = (strlen($doc) === 14) ? $doc : '';

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (versões 40 e 80 chars). Apagar a antiga (40).

    tefService.js — montarParametrosCancelamento usa '001-000 = 884' hardcoded. Trocar por String(venda) (receber venda como 3º argumento).

    TefModal.jsx — adicionar captura defensiva de QR Code em cmd===0 com /^000201/ (para produção).

    TefModal.jsx — migrar de api.qrserver.com para qrcode.react local (opcional, para produção).

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

7. Próximo passo exato

Prioridade 1 — Corrigir carregarCliente (Fix A)

    Em NfceFiscal.php, substituir método por versão que só lê cpf e normaliza por tamanho.

Prioridade 2 — Diagnosticar persistência de cliente (venda 1502)

    Rodar queries + verificar payload F12 + verificar objeto no console do React.

Prioridade 3 — Limpar duplicatas no tefService

    Apagar mostrarMensagemPinpad de 40 chars. Trocar '884' por venda em montarParametrosCancelamento.

Prioridade 4 — Empacotar Electron

    Criar electron/main.js (com webContents.print()); ajustar vite.config.js (base: './'); configurar electron-builder; NSIS único.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo schema: terminino_vigencia_ncm_nbs_ibs_cbs.

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 Estorno estoque antes de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 anti-duplicidade.

    🔴 nfce_totais_formapgto NÃO tem colunas de card — <card> via JOIN.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable), sem sintaxe moderna.

    MySQL 4.1 — sem CTE, sem window functions, sem ON DUPLICATE em prepared.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna string — sempre Number().

    Nunca concatenar PDOStatement em log.

    ❗ PHP 7: Error NÃO é capturado por catch(Exception). Sempre Throwable.

    ❗ React StrictMode NÃO funciona em PDV — quebra fluxo TEF (montagem dupla). Sempre remover.

TEF

    🔴 Agente porta 8443 (não 443); cert self-signed; terminalId único por máquina.

    🔴 React.StrictMode executa useEffect 2× — useRef guard NÃO funciona em dev. Melhor remover StrictMode.

    🔴 1ª conexão SiTef baixa tabelas — 1-5 min.

    🔴 FORMAS_TEF = ERP codes (4/5/117), NÃO functionIds.

    🔴 TefModal como sibling do fv-overlay.

    🔴 Comandos 21=menu; 23=cancelar durante laço; 29=coleta direta; 30-38=prompt.

    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.

    🔴 Cancelamento pós-finishTransaction só via 200 + string CNC.

    🔴 finishTransaction({confirm:0}) só funciona DURANTE o laço.

    🔴 Campo 546 = Tipo Voucher.

PinPad

    🔴 Largura: 16 chars por linha, 2 linhas úteis.

    🔴 persistente='Y' sobrevive à sessão e à transação — chamar UMA vez no mount do Dashboard.

    🔴 Centralização manual via padding de espaços (o firmware não centraliza).

    🔴 Setor de teste: enviar 30 chars e ver onde corta para confirmar largura real (16 confirmado).

PIX (homologação)

    🔴 Em homologação SiTef, PIX está em MODO SIMULAÇÃO — não gera QR Code, não passa pela adquirente.

    🔴 PinPad mostra "Simulação OK" no final da transação.

    🔴 QR Code só funciona em PRODUÇÃO com adquirente real.

    🔴 Código já preparado para produção: migração para qrcode.react + captura defensiva por /^000201/ pendente.

Pegadinhas de schema

    🔴 vendas_tef: coluna forma_pagto.

    🔴 nfce_tef: coluna forma_pgto. NOMES DIFERENTES.

    🔴 vendas_tef_comprovante: coluna via_cliente (minúsculo).

    🔴 PK vendas_tef tem 5 colunas: empresa, venda, parcela, codigo, ordem.

    🔴 tipo em vendas_tef é char(1), sempre '1'.

    🔴 clientes tem APENAS coluna cpf (armazena CPF 11 ou CNPJ 14, controlado por tipo).

    🔴 data_c/hora_c são varchar(15) — VB6 usa DD/MM/YYYY + HH:MM:SS.

9. Instruções para a IA no novo chat

    NFC-e e TEF 100% funcionais. PinPad com boas-vindas. CPF avulso OK; cliente cadastrado com 2 bugs.

    PIX QR Code bloqueado por homologação (simulação). Código preparado para produção.

    StrictMode removido (crítico). Não reintroduzir.

    Ordem: (1) carregarCliente só cpf; (2) diagnosticar venda 1502; (3) limpar duplicatas tefService; (4) empacotar Electron; (5) voucher.

    Pedir antes de codar: SHOW COLUMNS FROM clientes; SELECT da venda 1502; Payload do finalizarVenda; objeto cliente no console.

    Não refatorar classes validadas (NfceFiscal exceto carregarCliente, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Nunca reintroduzir React.StrictMode.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable) — nunca Exception sozinho.

    Sempre inTransaction() antes de rollBack().

    Sempre sanitizarTexto() em justificativas.

    Sempre tratar cStat 241 e 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Nunca concatenar PDOStatement em log.

    Manter português, respostas técnicas com código.

    Se precisar: pedir appController.php, NfceFiscal.php, NfceTransmissor.php, Vendas.php, TefModal.jsx, tefService.js, pagamentoService.js, FinalizarVendaModal.jsx, ClienteModal.jsx, DashboardPage.jsx.

10. Histórico de correções acumuladas

v19-v25: ver documentos anteriores.

v26: arquitetura de rede definida (servidor backend / terminais Electron+CliSiTef).

v27 (hoje):

    main.jsx — REMOVIDO <React.StrictMode> (resolvia duplicação de TefModal e 409 em finalizarVenda).

    tefService.js — mostrarMensagemPinpad (cria sessão, envia, destrói; persistente sobrevive).

    tefService.js — centralizarPinpad (padding de espaços, largura 16).

    tefService.js — montarBoasVindas (2 linhas centralizadas).

    DashboardPage.jsx — useEffect chama boas-vindas PinPad no mount.

    appController.php — dadosEmpresa retorna fantasia (fallback para razao).

    Testado: PinPad mostra "BEM-VINDO / HOMOLOGACAO" centralizado e persiste após passar cartão.

    PIX QR Code: identificado modo simulação em homologação (não é bug). Código preparado para produção.

    Pendências: mostrarMensagemPinpad duplicado; '884' hardcoded em montarParametrosCancelamento; carregarCliente com c.cnpj inexistente; venda 1502 cliente não persistiu.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) corrigir carregarCliente (só cpf); (2) diagnosticar venda 1502; (3) limpar duplicatas tefService; (4) empacotar Electron; (5) voucher. 🎯