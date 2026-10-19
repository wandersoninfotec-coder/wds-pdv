📋 TRANSFERÊNCIA — Facilit NFC-e (v30)

Data: 09/Outubro/2026 (noite)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando, cancelando, PinPad boas-vindas. Tela de Caixa parcialmente pronta. EXECUTÁVEL ELECTRON GERADO (FacilitPDV-0.0.0.exe) — portable, com ConfigPage de primeiro acesso, multi-cliente via localStorage. Correções finais pendentes: HashRouter + logo path.

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef, múltiplos terminais em rede.

ARQUITETURA DE REDE (v26)

    Servidor (192.168.100.67): backend — PHP + MySQL + TecnoSpeed + jobs. SEM frontend, PinPad ou impressora.

    Cada terminal: Electron com frontend buildado. Fala com backend via HTTP e CliSiTef via HTTPS local. Imprime via webContents.print().

    CliSiTef: roda em CADA terminal. NÃO centraliza.

    terminalId TEF: ÚNICO por terminal.

    Configuração por terminal: ConfigPage salva IP/porta/caminho no localStorage. NÃO precisa rebuildar por cliente.

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

    🔴 HOMOLOGAÇÃO: PIX está em MODO SIMULAÇÃO — não gera QR Code, PinPad mostra "Simulação OK".

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

models/NfceFiscal.php         ; ✅ criarDestinatario (fix 598/215) + sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente + blocoFormasPagamento
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ login (permissões caixa) + nfceEmitir (cpf_nfce) + dadosEmpresa (fantasia) + caixaListar + gravarVendasTef + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

electron/
├── main.cjs                    ; ✅ CommonJS (require) — certificado self-signed ignorado, printCupom IPC
└── preload.cjs                 ; ✅ contextBridge: electronAPI.printCupom

src/
├── main.jsx                    ; ✅ SEM StrictMode
├── App.jsx                     ; ✅ gate de config (verificarConfig), rotas, PrivateRoute — ⚠️ trocar para HashRouter
├── pages/
│   ├── ConfigPage.jsx          ; ✅ configuração inicial + edição
│   ├── DashboardPage.jsx       ; ✅ botão Caixa + PinPad boas-vindas
│   ├── CaixaPage.jsx           ; ✅ grid funcional + permissões
│   ├── NotasPage.jsx           ; ✅
│   ├── HistoricoPage.jsx       ; ✅
│   └── ...
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ TEF + cancelamento + CPF avulso
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar'
│   ├── RelogioHeader.jsx       ; ✅
│   ├── TesteTefButton.jsx      ; ⚠️ temporário
│   └── ...
├── hooks/usePermissoes.js      ; ✅ 11 permissões de caixa
└── services/
    ├── api.js                  ; ✅ interceptor lê baseURL do localStorage a cada request
    ├── configService.js        ; ✅ salva/carrega @app:config
    ├── pagamentoService.js     ; ✅ finalizarEEmitir com cpf_nfce
    ├── tefService.js           ; ✅ mostrarMensagemPinpad + centralizarPinpad + montarBoasVindas + cancelarVendasTef
    └── caixaService.js         ; ✅ listar

package.json                    ; ✅ main: electron/main.cjs + scripts electron:dev/build + bloco build (portable)

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO 🎉

    NFC-e com cliente cadastrado, CPF avulso, sem CPF: AUTORIZADA.

    cStat 598 e 215 resolvidos.

    Cancelamento, inutilização, contingência, rejeitadas, diagnóstico.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).

    Tela de resultado; cmds 21/22/23/29/42 tratados.

    Gravando em vendas_tef / vendas_tef_comprovante / nfce_tef.

PinPad Boas-Vindas

    "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    persistente='Y' — sobrevive à sessão e à transação.

CPF na Nota — 100% FUNCIONAL

    CPF avulso + cliente cadastrado + sem CPF.

Tela de Caixa

    Grid de movimentos (LEFT JOIN tab_formapagamento + INNER JOIN usuarios).

    Filtro Caixa + Data. Rodapé Qtde/Entradas/Saídas/Saldo.

    Botões com gate de permissão (lancar/estornar/excluir/liberar/fechar/resumo).

    Layout full-width (compatível NotasPage/HistoricoPage).

EXECUTÁVEL ELECTRON — GERADO v30 🎉

    FacilitPDV-0.0.0.exe (portable, ~100-150 MB) em release/.

    main.cjs: ignore-certificate-errors + disable-features BlockInsecurePrivateNetworkRequests (TEF funciona).

    preload.cjs: expõe window.electronAPI.printCupom(html).

    ConfigPage funciona como tela de primeiro acesso (gate de estaConfigurado no App.jsx).

    localStorage multi-cliente: cada terminal guarda seu próprio IP.

    Interceptor api.js lê baseURL do localStorage a cada requisição — trocar IP na ConfigPage já surte efeito.

    Flags: vite.config.js com base: './'.

5. Decisões de arquitetura

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Sem ON DUPLICATE em MySQL 4.1; SELECT+UPDATE/INSERT.

    CPF avulso NÃO persiste em banco — viaja só no payload do nfceEmitir.

    🔴 HOMOLOGAÇÃO: xNome destinatário = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL". xProd = "NOTA FISCAL...".

    🔴 NFC-e sem cadastro: anular TODOS os 9 campos de endereço (incluindo dest_pais/dest_xPais).

    Cancelamento TEF preserva NSU original.

    catch (Throwable) obrigatório em prepararTudo/nfceEmitir.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 anti-duplicidade.

    MySQL 4.1 retorna string — sempre Number()/(int).

    🔴 SEM React.StrictMode no PDV.

    🔴 Electron main process usa CommonJS (.cjs), NÃO ESM. `require` + `module.exports`.

    🔴 Electron: `<BrowserRouter>` quebra em `file://` — precisa `<HashRouter>`. PENDENTE aplicar.

    🔴 Logo: `<img src="/logo.png">` quebra em file:// — usar `./logo.png` ou import. PENDENTE aplicar.

    ARQUITETURA DE REDE: servidor backend/fiscal; terminais Electron + CliSiTef + impressora local.

    🔴 Permissões de caixa: negar por padrão no usePermissoes (segurança).

    Padrão de página: `dash-header` + `mesas-header-right` (importar RelogioHeader). Container full-width.

6. Problemas atuais e pendências

🔴 CRÍTICO — Corrigir HashRouter e logo (do teste do .exe)

    Tela branca após ConfigPage: BrowserRouter quebra em file://. Trocar para HashRouter em App.jsx:
      import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
      <HashRouter><AuthProvider><AppRoutes /></AuthProvider></HashRouter>

    Logo quebrada: <img src="/logo.png" /> → src absoluto falha em file://. Opções:
      A) Mover para src/assets/logo.png e importar: import logoUrl from '../assets/logo.png'; <img src={logoUrl} />
      B) Substituir por ./logo.png em todos os arquivos que usam (ConfigPage, Dashboard, Notas, Caixa, Historico, Mesas, Login, Relatorio).

    Ambos precisam estar aplicados antes de rebuildar.

🟡 Build Electron — avisos e correções

    EPERM: rename win-unpacked.tmp falhou: arquivo travado por .exe aberto ou antivírus.
      Fix: fechar Facilit PDV.exe + taskkill /F /IM "Facilit PDV.exe" /IM electron.exe /IM node.exe
      + rmdir /S /Q release + npm run electron:build.
      Adicionar D:\ANDROID\wds-pdv\release como exclusão no antivírus (recomendado).

    Aviso file source doesn't exist from=...\config — remover bloco extraResources do package.json.

    Aviso default Electron icon — cosmético. Criar build/icon.ico (256x256) para substituir.

🟡 Tela de Caixa — backend e frontend parcialmente prontos

    Backend falta:
      caixaResumo (Resumo por Forma de Pagamento — SELECT pendente)
      caixaSaldoAbertura (Saldo Abertura/Débito/Crédito/Atual — SELECT pendente)
      caixaLancar, caixaEstornar, caixaExcluir, caixaLiberar, caixaFechar

    Frontend falta:
      CaixaLancamentoModal.jsx
      CaixaFechamentoModal.jsx
      Painel lateral "Resumo por Forma de Pagamento"

    Precisa (envio pendente):
      SELECT do Resumo por Forma de Pagamento
      SELECT do Saldo de Abertura
      SHOW COLUMNS FROM caixa_movimento
      SHOW TABLES LIKE '%formapag%'

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (versões 40 e 80 chars). Apagar a versão de 40.

    tefService.js — montarParametrosCancelamento com '001-000 = 884' hardcoded. Trocar por String(venda).

    NfceFiscal.php — aplicarCartaoEmFormapgto usa $t['forma_pgto'] (deveria ser forma_pagto).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    TefModal.jsx — captura defensiva QR Code em cmd===0 com /^000201/.

    TefModal.jsx — migrar para qrcode.react local (opcional, quando produção).

🟢 Roadmap longo

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

    CPF avulso em PRODUÇÃO: se bate com cadastro, usar razao do cliente.

    Tela de acompanhamento TEF.

    Impressão DANFCE via window.electronAPI.printCupom(html) — ainda não plugada.

7. Próximo passo exato

Prioridade 1 — Corrigir build do Electron (HashRouter + logo)

    Em App.jsx: trocar BrowserRouter → HashRouter.
    Em todos os <img src="/logo.png">: trocar para ./logo.png ou import.
    Rebuild: npm run electron:build.
    Se EPERM: fechar Facilit PDV.exe + taskkill + rmdir release.

Prioridade 2 — Fechar tela de Caixa

    Enviar SELECTs (Resumo por Forma, Saldo Abertura, SHOW COLUMNS caixa_movimento).
    Backend: caixaResumo + caixaSaldoAbertura + caixaLancar + caixaEstornar + caixaExcluir + caixaFechar.
    Frontend: modais + painel lateral.

Prioridade 3 — Limpar duplicatas tefService + aplicar '884' → String(venda).

Prioridade 4 — Voucher.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).
    🔴 Typo schema: terminino_vigencia_ncm_nbs_ibs_cbs.
    🔴 cStat real em <retEvento>/<retInutNFe>.
    🔴 cStat 241 e 563 = sucesso disfarçado.
    🔴 cStat 598 = homologação com xNome destinatário diferente do padrão.
    🔴 cStat 215 = schema XML inválido (enderDest mal formado).
    🔴 Justificativa com acento → sanitizarTexto().
    🔴 Estorno estoque antes de marcar item cancelado.
    🔴 NÃO adicionar <?xml?> antes de assinar.
    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.
    🔴 IBSCBSTot obrigatório mesmo zerado.
    🔴 vendas.numero_nfe = 0 anti-duplicidade.
    🔴 nfce_totais_formapgto NÃO tem colunas de card.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable), sem sintaxe moderna.
    MySQL 4.1 — sem CTE, sem window, sem ON DUPLICATE em prepared.
    Timezone: America/Cuiaba (UTC-4).
    MySQL 4.1 via PDO retorna string — sempre Number().
    Nunca concatenar PDOStatement em log.
    ❗ PHP 7: Error NÃO é capturado por catch(Exception). Sempre Throwable.
    ❗ React StrictMode NÃO funciona em PDV.
    ❗ Não duplicar imports (Vite quebra).

Electron (NOVO v30)

    🔴 package.json tem "type": "module" → main process DEVE ser .cjs (CommonJS).
    🔴 React Router em Electron: SEMPRE HashRouter (BrowserRouter quebra em file://).
    🔴 Assets em file://: caminhos absolutos (/logo.png) NÃO funcionam. Usar ./logo.png ou import.
    🔴 vite.config.js base: './' — obrigatório.
    🔴 ignore-certificate-errors + disable-features BlockInsecurePrivateNetworkRequests — para TEF funcionar.
    🔴 EPERM em rename: arquivo travado por .exe aberto ou antivírus. Adicionar release/ como exclusão.
    🔴 Electron build: usar portable (não NSIS) para distribuição simplificada.

TEF

    🔴 Agente porta 8443; cert self-signed; terminalId único.
    🔴 FORMAS_TEF = ERP codes (4/5/117).
    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.
    🔴 Cancelamento pós-finishTransaction só via 200 + string CNC.
    🔴 Campo 546 = Tipo Voucher.

PinPad

    🔴 Largura 16x2. persistente='Y' sobrevive.

PIX (homologação)

    🔴 MODO SIMULAÇÃO — não gera QR Code. Só produção.

Pegadinhas de schema

    🔴 vendas_tef: forma_pagto. nfce_tef: forma_pgto. DIFERENTES.
    🔴 vendas_tef_comprovante: via_cliente (minúsculo).
    🔴 PK vendas_tef: (empresa, venda, parcela, codigo, ordem).
    🔴 clientes tem APENAS coluna cpf (CPF 11 ou CNPJ 14).
    🔴 data_c/hora_c varchar(15), DD/MM/YYYY + HH:MM:SS.
    🔴 tab_modulos_perfil_acao rotinas: caixamovimento, caixamovimento_novolacto, caixamovimento_estornarlacto, caixamovimento_excluirlacto, caixamovimento_liberar, caixamovimento_mostrarsaldos, caixamovimento_manutabertura, caixamovimento_manutcentrocusto, caixacadastroconta, caixaabertura, relcaixa.

9. Instruções para a IA no novo chat

    NFC-e 100% emitindo em homologação. TEF gravando, cancelando, PinPad boas-vindas.

    EXECUTÁVEL ELECTRON gerado (portable). Correções pendentes: HashRouter + logo em src/assets.

    Tela de Caixa parcialmente pronta. PIX QR bloqueado por homologação.

    StrictMode removido (crítico). Electron main.cjs em CommonJS (não mudar para ESM).

    Ordem: (1) HashRouter + logo + rebuild .exe; (2) fechar Tela de Caixa; (3) limpar tefService; (4) voucher.

    Pedir antes de codar: SELECTs do Caixa (Resumo por Forma, Saldo Abertura), SHOW COLUMNS caixa_movimento.

    Não refatorar classes validadas (NfceFiscal exceto criarDestinatario/carregarCliente, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Nunca reintroduzir React.StrictMode.

    Nunca trocar HashRouter por BrowserRouter (Electron).

    Nunca trocar .cjs por .js no main process (quebra com type:module).

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

v30 (hoje):

    Criado electron/main.cjs (CommonJS) — window + IPC print + ignore-certificate-errors + disable-features.

    Criado electron/preload.cjs — contextBridge expõe electronAPI.

    Criado vite.config.js com base: './'.

    package.json: main: electron/main.cjs + scripts electron:dev/build + bloco build (portable).

    Empacotamento concluído: FacilitPDV-0.0.0.exe em release/.

    Bug 1 (crítico): "require is not defined in ES module scope" — resolvido renomeando main.js → main.cjs e preload.js → preload.cjs.

    Bug 2 (EPERM: rename win-unpacked.tmp) — resolvido fechando .exe + taskkill + rmdir release.

    Confirmado: ConfigPage aparece no primeiro boot (multi-cliente funciona via localStorage).

    Config confirmada: api.js lê baseURL do localStorage a cada requisição (interceptor) — não precisa rebuildar por cliente.

    PENDENTE: HashRouter (tela branca após salvar config) + logo (caminho absoluto em file://).

    PENDENTE: remover extraResources do package.json (aviso cosmético).

    PENDENTE: build/icon.ico para substituir ícone padrão do Electron.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) aplicar HashRouter em App.jsx + corrigir logo (src/assets/logo.png ou ./logo.png) + rebuild; (2) fechar Tela de Caixa; (3) limpar tefService; (4) voucher. 🎯