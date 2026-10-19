📋 TRANSFERÊNCIA — Facilit NFC-e (v31)

Data: 13/Outubro/2026 (terça-feira)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando, cancelando, PinPad boas-vindas. Impressão de comprovante TEF funcionando — 2 vias (estabelecimento auto + cliente com checkbox). Executável Electron gerado com ícone. Multi-cliente via ConfigPage. Pendências: compilar e testar as 2 vias no .exe; fechar tela de Caixa; voucher.

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef, múltiplos terminais em rede.

ARQUITETURA DE REDE

    Servidor (192.168.100.67): backend — PHP + MySQL + TecnoSpeed + jobs. SEM frontend, PinPad ou impressora.

    Cada terminal: Electron com frontend buildado. Fala com backend via HTTP e CliSiTef via HTTPS local. Imprime via webContents.print().

    CliSiTef: roda em CADA terminal. NÃO centraliza.

    terminalId TEF: ÚNICO por terminal.

    Configuração por terminal: ConfigPage salva IP/porta/caminho no localStorage. NÃO precisa rebuildar por cliente.

    Impressão TEF: no Electron é silenciosa (webContents.print); no navegador usa iframe fallback (não bloqueado por popup blocker).

2. Stack / ferramentas

Backend

    PHP 7.1.9, Apache 2.4.27/XAMPP, MySQL 4.1 (latin1), TecnoSpeed v6.0 (COM NFCex.spdNFCeX).

    Timezone America/Cuiaba. Logs: php_error_log + app_mesas_api\logs\nfce_fiscal.log.

Frontend / Terminal

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Electron 41.7.1 + electron-builder 26.15.3 + concurrently + wait-on + cross-env.

    Pasta: D:\ANDROID\wds-pdv. Dev server: http://192.168.100.67:3000.

TEF — Agente CliSiTef (em cada terminal)

    Porta 8443, URL https://127.0.0.1:8443/agente/clisitef.

    Versão 1.0.0.16.r1. Cert self-signed — aceitar 1x por terminal.

    Endpoints: /state, /session, /startTransaction, /continueTransaction, /finishTransaction, /getVersion, /pinpad/*.

    🔴 HOMOLOGAÇÃO: PIX está em MODO SIMULAÇÃO — não gera QR Code.

    PinPad: 16 chars/linha, 2 linhas úteis.

Credenciais SiTef

    IP 177.72.161.156:4096 | Loja 00000000 | Terminal único por máquina.

    CNPJ adquirente 01425787000104.

Credenciais NFC-e

    SH CNPJ 14234584000174, token 6f8547fdd9dff39473e2cb42a7568907.

    Emitente CNPJ 58717761000149, UF MT, Ambiente=2 (homologação).

Pastas TecnoSpeed

    C:\WDS Comercial\Templates\vm60\, Esquemas\vm60\, certificado\cliente.pfx (senha 123), NFCeGerada\ano\mes\dia\, Log\.

3. Estrutura de arquivos

Backend — C:\xampp\htdocs\app_mesas_api\
text

models/NfceFiscal.php         ; ✅ criarDestinatario (fix 598/215) + sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente + blocoFormasPagamento
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ login (permissões caixa) + nfceEmitir (cpf_nfce) + dadosEmpresa (fantasia) + caixaListar + gravarVendasTef + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

build/
└── icon.ico                    ; ✅ 256x256 multi-size (ícone do .exe)

electron/
├── main.cjs                    ; ✅ ignore-certificate-errors + disable-features + printCupom IPC
└── preload.cjs                 ; ✅ contextBridge: electronAPI.printCupom

src/
├── main.jsx                    ; ✅ SEM StrictMode
├── App.jsx                     ; ✅ gate config + rotas + PrivateRoute — ⚠️ trocar BrowserRouter → HashRouter
├── pages/
│   ├── ConfigPage.jsx          ; ✅ primeiro acesso + edição
│   ├── DashboardPage.jsx       ; ✅ botão Caixa + PinPad boas-vindas
│   ├── CaixaPage.jsx           ; ✅ grid funcional + permissões
│   ├── NotasPage.jsx           ; ✅
│   ├── HistoricoPage.jsx       ; ✅
│   └── ...
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ TEF + cancelamento + CPF avulso
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar' + impressão 2 vias + imprimirTexto blindado
│   ├── RelogioHeader.jsx       ; ✅
│   ├── TesteTefButton.jsx      ; ⚠️ temporário
│   └── ...
├── hooks/usePermissoes.js      ; ✅ 11 permissões de caixa
└── services/
    ├── api.js                  ; ✅ interceptor lê baseURL do localStorage
    ├── configService.js        ; ✅ salva/carrega @app:config
    ├── pagamentoService.js     ; ✅ finalizarEEmitir com cpf_nfce
    ├── tefService.js           ; ✅ mostrarMensagemPinpad + centralizarPinpad + montarBoasVindas + cancelarVendasTef (⚠️ mostrarMensagemPinpad DUPLICADO)
    └── caixaService.js         ; ✅ listar

package.json                    ; ✅ main: electron/main.cjs + scripts electron:dev/build + build portable

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO 🎉

    NFC-e com cliente cadastrado, CPF avulso, sem CPF: AUTORIZADA.

    cStat 598 e 215 resolvidos.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).

    Gravando em vendas_tef / vendas_tef_comprovante / nfce_tef.

Impressão de Comprovante TEF — NOVO v31 🎉

    imprimirTexto() blindado — try/catch externo + if(w) + try/catch no print. NUNCA bloqueia a venda.

    Caminho 1 (Electron): window.electronAPI.printCupom(html) → silencioso.

    Caminho 2 (Navegador dev): iframe invisível → abre diálogo de impressão SEM ser bloqueado por popup blocker.

    Via estabelecimento: impressa automaticamente ao aprovar (em encerrar()).

    Via cliente: checkbox "Imprimir via do cliente" na tela de resultado (default marcado). Impressa ao clicar OK.

    Confirmado com [TEF-DEBUG]: estab.len=651, cliente.len=651 (SiTef devolve as 2 vias em homologação).

    A venda registra normalmente mesmo se a impressão falhar.

PinPad Boas-Vindas

    "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    persistente='Y' — sobrevive à sessão e à transação.

CPF na Nota — 100% FUNCIONAL

    CPF avulso + cliente cadastrado + sem CPF.

Tela de Caixa

    Grid de movimentos + filtros + rodapé. Botões com gate de permissão.

    Layout full-width (compatível NotasPage/HistoricoPage).

Executável Electron — GERADO 🎉

    FacilitPDV-0.0.0.exe (portable) em release/.

    Ícone personalizado em build/icon.ico (256x256 multi-size).

    main.cjs: ignore-certificate-errors + disable-features BlockInsecurePrivateNetworkRequests.

    preload.cjs expõe window.electronAPI.printCupom(html).

    ConfigPage funciona como tela de primeiro acesso (gate estaConfigurado no App.jsx).

    localStorage multi-cliente: cada terminal guarda seu próprio IP.

5. Decisões de arquitetura

    🔴 forma_pagto em vendas_tef; forma_pgto em nfce_tef. DIFERENTES.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Sem ON DUPLICATE em MySQL 4.1; SELECT+UPDATE/INSERT.

    CPF avulso NÃO persiste — viaja no payload do nfceEmitir.

    🔴 HOMOLOGAÇÃO: xNome destinatário = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL". xProd = "NOTA FISCAL...".

    🔴 NFC-e sem cadastro: anular TODOS os 9 campos de endereço (incl. dest_pais/dest_xPais).

    Cancelamento TEF preserva NSU original.

    catch (Throwable) obrigatório em prepararTudo/nfceEmitir.

    🔴 SEM React.StrictMode no PDV.

    🔴 Electron main process usa CommonJS (.cjs). NÃO trocar para ESM.

    🔴 Electron: BrowserRouter quebra em file:// — precisa HashRouter. PENDENTE aplicar em App.jsx.

    🔴 Logo com src="/logo.png" quebra em file:// — usar ./logo.png ou import. PENDENTE aplicar.

    🔴 imprimirTexto NUNCA deve propagar erro — try/catch externo obrigatório.

    🔴 Fallback de impressão no navegador: iframe, NÃO window.open (popup blocker bloqueia).

    Permissões de caixa: negar por padrão no usePermissoes.

    Padrão de página: dash-header + mesas-header-right + RelogioHeader. Container full-width.

6. Problemas atuais e pendências

🔴 PENDENTE CRÍTICO — Corrigir HashRouter e logo antes de recompilar

    Tela branca após ConfigPage: BrowserRouter quebra em file://. Trocar para HashRouter em App.jsx:
      import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
      <HashRouter><AuthProvider><AppRoutes /></AuthProvider></HashRouter>

    Logo quebrada: <img src="/logo.png" /> → src absoluto falha em file://. Opções:
      A) Mover para src/assets/logo.png e importar
      B) Substituir por ./logo.png

    Ambos precisam estar aplicados ANTES do próximo build do .exe.

🟡 Testar 2 vias compiladas

    Impressão das 2 vias funcionou no navegador (via iframe).

    Falta testar no .exe (deve ser silenciosa, sem abrir diálogo).

    Confirmar que window.electronAPI está disponível no build.

🟡 Tela de Caixa — backend e frontend parcialmente prontos

    Backend falta: caixaResumo, caixaSaldoAbertura, caixaLancar, caixaEstornar, caixaExcluir, caixaLiberar, caixaFechar.

    Frontend falta: CaixaLancamentoModal, CaixaFechamentoModal, painel lateral "Resumo por Forma".

    Enviar: SELECT do Resumo por Forma, SELECT do Saldo Abertura, SHOW COLUMNS caixa_movimento, SHOW TABLES LIKE '%formapag%'.

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (40 e 80 chars). Apagar versão de 40.

    tefService.js — montarParametrosCancelamento com '001-000 = 884' hardcoded. Trocar por String(venda).

    NfceFiscal.php — aplicarCartaoEmFormapgto usa $t['forma_pgto'] (deveria ser forma_pagto).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    TefModal.jsx — captura defensiva QR Code em cmd===0 com /^000201/ (produção).

    TefModal.jsx — migrar de api.qrserver.com para qrcode.react local.

    tefService.gravarVendasTefComprovante — via_completa salva errado (recebe estabelecimento). Corrigir: concat estab + cliente.

🟡 Config Electron — pendências menores

    Remover bloco extraResources do package.json (aviso cosmético "config folder doesn't exist").

    EPERM em rename: fechar .exe + taskkill + rmdir release + adicionar release/ como exclusão no antivírus.

🟢 Roadmap longo

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

    CPF avulso em PRODUÇÃO: se bate com cadastro, usar razao do cliente.

    Tela de acompanhamento TEF.

    Backup automático MySQL + Tailscale/Cloudflare Tunnel (Fase 1 — plano definido).

7. Próximo passo exato

Prioridade 1 — Corrigir HashRouter + logo + recompilar

    App.jsx: trocar BrowserRouter → HashRouter.

    Logo: mover para src/assets/logo.png e importar (ou trocar para ./logo.png em todos).

    rmdir /S /Q release && npm run electron:build.

    Testar .exe: config → login → dashboard → TEF (2 vias).

Prioridade 2 — Fechar tela de Caixa

    Enviar SELECTs pendentes.

    Backend: caixaResumo + caixaSaldoAbertura + modais.

Prioridade 3 — Limpar duplicatas tefService + aplicar '884' → String(venda).

Prioridade 4 — Voucher.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo: terminino_vigencia_ncm_nbs_ibs_cbs.

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241, 563 = sucesso disfarçado.

    🔴 cStat 598 = homologação com xNome destinatário fora do padrão.

    🔴 cStat 215 = schema XML inválido (enderDest mal formado).

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 Estorno estoque antes de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 anti-duplicidade.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable), sem sintaxe moderna.

    MySQL 4.1 — sem CTE, sem window, sem ON DUPLICATE em prepared.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna string — sempre Number().

    Nunca concatenar PDOStatement em log.

    ❗ PHP 7: Error NÃO é capturado por catch(Exception). Sempre Throwable.

    ❗ React StrictMode NÃO funciona em PDV.

    ❗ Não duplicar imports (Vite quebra).

Electron

    🔴 package.json "type": "module" → main process DEVE ser .cjs.

    🔴 React Router em Electron: SEMPRE HashRouter.

    🔴 Assets em file://: caminhos absolutos NÃO funcionam. Usar ./ ou import.

    🔴 vite.config.js base: './'.

    🔴 ignore-certificate-errors + disable-features BlockInsecurePrivateNetworkRequests (TEF).

    🔴 EPERM em rename: .exe aberto ou antivírus. Adicionar release/ como exclusão.

    🔴 Electron build: portable (não NSIS).

    🔴 Ícone: .ico 256x256 multi-size em build/icon.ico.

Impressão (NOVO v31)

    🔴 imprimirTexto NUNCA pode propagar erro — a venda depende disso.

    🔴 Fallback navegador: iframe (window.open é bloqueado por popup blocker).

    🔴 Electron: webContents.print({silent: true}) — precisa de window.electronAPI.printCupom exposto no preload.

    🔴 Preload caminho no main.cjs: 'preload.cjs' (não 'preload.js').

    🔴 CSS: @page { size: 80mm auto; margin: 0; } — térmica 80mm.

    🔴 Se quiser impressora específica: deviceName no webContents.print.

TEF

    🔴 Agente porta 8443; cert self-signed; terminalId único.

    🔴 FORMAS_TEF = ERP codes (4/5/117).

    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.

    🔴 Cancelamento pós-finishTransaction só via 200 + string CNC.

    🔴 Campo 546 = Tipo Voucher.

    🔴 Campo 121 = Cupom Estabelecimento. Campo 122 = Cupom Cliente.

PinPad

    🔴 Largura 16x2. persistente='Y' sobrevive.

PIX (homologação)

    🔴 MODO SIMULAÇÃO — não gera QR Code.

Pegadinhas de schema

    🔴 vendas_tef: forma_pagto. nfce_tef: forma_pgto.

    🔴 vendas_tef_comprovante: via_cliente (minúsculo).

    🔴 PK vendas_tef: (empresa, venda, parcela, codigo, ordem).

    🔴 clientes tem APENAS coluna cpf (CPF 11 ou CNPJ 14).

    🔴 data_c/hora_c varchar(15), DD/MM/YYYY + HH:MM:SS.

    🔴 Rotinas de permissão caixa: caixamovimento, caixamovimento_novolacto, caixamovimento_estornarlacto, caixamovimento_excluirlacto, caixamovimento_liberar, caixamovimento_mostrarsaldos, caixamovimento_manutabertura, caixamovimento_manutcentrocusto, caixacadastroconta, caixaabertura, relcaixa.

9. Instruções para a IA no novo chat

    NFC-e 100% emitindo em homologação. TEF gravando, cancelando, PinPad boas-vindas.

    Impressão de comprovante TEF funcionando (2 vias) — testar no .exe.

    Executável Electron gerado com ícone. Correções PENDENTES: HashRouter + logo antes de recompilar.

    Tela de Caixa parcialmente pronta. PIX QR bloqueado por homologação.

    StrictMode removido. Electron main.cjs em CommonJS.

    Ordem: (1) HashRouter + logo + recompilar; (2) fechar Tela de Caixa; (3) limpar tefService; (4) voucher.

    Pedir antes de codar: SELECTs do Caixa (Resumo por Forma, Saldo Abertura), SHOW COLUMNS caixa_movimento.

    Não refatorar classes validadas (NfceFiscal exceto criarDestinatario/carregarCliente, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Nunca reintroduzir React.StrictMode.

    Nunca trocar HashRouter por BrowserRouter (Electron).

    Nunca trocar .cjs por .js no main process.

    Nunca usar window.open como fallback de impressão (usar iframe).

    Nunca deixar imprimirTexto propagar erro (a venda depende disso).

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable) — nunca Exception sozinho.

    Sempre inTransaction() antes de rollBack().

    Sempre sanitizarTexto() em justificativas.

    Sempre tratar cStat 241, 563 como sucesso; 598 e 215 mapeados.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Nunca concatenar PDOStatement em log.

    Verificar imports duplicados antes de salvar (.jsx).

    Manter português, respostas técnicas com código.

10. Histórico de correções acumuladas

v19-v29: ver documentos anteriores.

v30: Electron buildado (portable). Bug "require is not defined" resolvido com .cjs. EPERM resolvido. ConfigPage como primeiro acesso.

v31 (hoje):

    Ícone personalizado: build/icon.ico 256x256 multi-size (erro "Icon must be at least 256x256" resolvido).

    TefModal.jsx — imprimirTexto() blindado com try/catch (nunca bloqueia venda).

    TefModal.jsx — auto-impressão da via estabelecimento em encerrar().

    TefModal.jsx — checkbox "Imprimir via do cliente" na tela de resultado (default marcado).

    TefModal.jsx — handleFecharResultado virou async e imprime via cliente se marcado.

    TefModal.jsx — fallback de impressão migrado de window.open para iframe (popup blocker não bloqueia).

    Bug confirmado e resolvido: window.open bloqueado em dev estava estourando "can't access property document, w is null" — corrigido com if (w) check + try/catch.

    [TEF-DEBUG] confirmou: estab.len=651, cliente.len=651 — SiTef devolve as 2 vias em homologação.

    ✅ Impressão das 2 vias funcionando no navegador (via iframe).

    PENDENTE: testar no .exe compilado (deve ser silenciosa).

    PENDENTE: aplicar HashRouter + corrigir logo antes do próximo build.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) aplicar HashRouter + logo + recompilar; (2) fechar tela de Caixa; (3) limpar tefService; (4) voucher. 🎯