📋 TRANSFERÊNCIA — Facilit NFC-e (v33)

Data: 14/Outubro/2026 (quarta-feira)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando, cancelando, PinPad boas-vindas. Impressão 2 vias. Executável Electron com ícone. Multi-empresa RESOLVIDO (getEmpresa lê do localStorage). Tema aplicado em 6 modais. Próximo: testar capturas via parâmetros + corrigir HashRouter/logo antes de recompilar.

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef, múltiplos terminais em rede.

ARQUITETURA DE REDE

    Servidor (192.168.100.67): backend — PHP + MySQL + TecnoSpeed + jobs. SEM frontend, PinPad ou impressora.

    Cada terminal: Electron com frontend buildado. CliSiTef local + impressora local.

    Configuração por terminal: ConfigPage salva IP/porta/caminho/empresa no localStorage. NÃO precisa rebuildar por cliente.

    Impressão TEF: Electron silencioso (webContents.print); navegador usa iframe fallback.

2. Stack / ferramentas

Backend

    PHP 7.1.9, Apache 2.4.27/XAMPP, MySQL 4.1 (latin1), TecnoSpeed v6.0 (COM NFCex.spdNFCeX).

    Timezone America/Cuiaba. Logs: php_error_log + app_mesas_api\logs\nfce_fiscal.log.

Frontend / Terminal

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20 + qrcode.react.

    Electron 41.7.1 + electron-builder 26.15.3.

    Pasta: D:\ANDROID\wds-pdv. Dev server: http://192.168.100.67:3000.

TEF — Agente CliSiTef

    Porta 8443, URL https://127.0.0.1:8443/agente/clisitef.

    Versão 1.0.0.16.r1. Cert self-signed — aceitar 1x por terminal.

    Endpoints: /state, /session, /startTransaction, /continueTransaction, /finishTransaction, /getVersion, /pinpad/*.

    🔴 HOMOLOGAÇÃO: PIX em MODO SIMULAÇÃO — não gera QR Code.

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
controllers/appController.php ; ✅ login + nfceEmitir (cpf_nfce) + dadosEmpresa (fantasia) + caixaListar + gravarVendasTef + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

build/
└── icon.ico                    ; ✅ 256x256 multi-size

electron/
├── main.cjs                    ; ✅ ignore-certificate-errors + printCupom IPC
└── preload.cjs                 ; ✅ contextBridge: electronAPI.printCupom

src/
├── main.jsx                    ; ✅ SEM StrictMode
├── App.jsx                     ; ✅ gate config + rotas — ⚠️ HashRouter PENDENTE
├── config/
│   └── index.js                ; ✅ getEmpresa() + EMPRESA_PADRAO (fallback)
├── pages/
│   ├── ConfigPage.jsx          ; ✅
│   ├── LoginPage.jsx           ; ✅ + getEmpresa() no payload de login
│   ├── DashboardPage.jsx       ; ✅ botão Caixa + PinPad boas-vindas
│   ├── CaixaPage.jsx           ; ✅ grid + permissões
│   ├── NotasPage.jsx           ; ✅
│   ├── HistoricoPage.jsx       ; ✅
│   └── ...
├── components/
│   ├── MesaDetalhesModal.jsx   ; ✅ tema
│   ├── MesaDetalhesModal2.jsx  ; ✅ tema + mini-modal qtd também
│   ├── FinalizarVendaModal.jsx ; ✅ tema + CPF avulso + TEF + cancelamento
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar' + impressão 2 vias + tema
│   ├── SuccessModal.jsx        ; ✅ tema
│   ├── DetalhesPedidoModal.jsx ; ✅ tema
│   ├── RelogioHeader.jsx       ; ✅
│   └── ...
├── hooks/usePermissoes.js      ; ✅ 11 permissões de caixa
└── services/
    ├── api.js                  ; ✅ interceptor lê baseURL do localStorage
    ├── configService.js        ; ✅ salva/carrega @app:config
    ├── pagamentoService.js     ; ✅ finalizarEEmitir + getEmpresa()
    ├── tefService.js           ; ✅ getEmpresa() (⚠️ mostrarMensagemPinpad DUPLICADO)
    ├── caixaService.js         ; ✅ getEmpresa()
    └── ... (14 services migrados para getEmpresa)

package.json                    ; ✅ main: electron/main.cjs + scripts electron:dev/build + portable

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO 🎉

    NFC-e com cliente cadastrado, CPF avulso, sem CPF: AUTORIZADA.

    cStat 598 e 215 resolvidos.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).

    Gravando em vendas_tef / vendas_tef_comprovante / nfce_tef.

Impressão Comprovante TEF

    imprimirTexto blindado (nunca bloqueia a venda).

    Caminho 1: Electron silencioso. Caminho 2: iframe fallback.

    Via estabelecimento: auto. Via cliente: checkbox (default marcado).

PinPad Boas-Vindas

    "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    persistente='Y' — sobrevive à sessão e à transação.

CPF na Nota

    CPF avulso + cliente cadastrado + sem CPF.

    Validação front (máscara + DV) e backend (total ≥ 1000).

Tela de Caixa

    Grid + filtros + rodapé. Botões com gate de permissão.

Executável Electron

    FacilitPDV-0.0.0.exe (portable) em release/.

    Ícone personalizado (build/icon.ico).

    ConfigPage no primeiro boot.

Tema Aplicado em 6 Modais

    CSS variables (--tema-cor, --tema-cor-suave) injetadas no container.

    Fallback :root garante legibilidade.

    Modais: MesaDetalhesModal, MesaDetalhesModal2 (+ mini-modal qtd), FinalizarVendaModal, DetalhesPedidoModal, TefModal, SuccessModal.

    Cores semânticas preservadas (vermelho/amarelo/verde/cinza).

MULTI-EMPRESA — RESOLVIDO v33 🎉

    src/config/index.js: adicionado getEmpresa() (lê localStorage, fallback EMPRESA_PADRAO).

    14 services migrados de EMPRESA_PADRAO → getEmpresa() (~40 usos).

    LoginPage: agora envia empresa: getEmpresa() no payload.

    Só src/config/index.js mantém EMPRESA_PADRAO (é o fallback).

    Agora trocar empresa em /config reflete em todos os endpoints.

5. Decisões de arquitetura

    🔴 forma_pagto em vendas_tef; forma_pgto em nfce_tef. DIFERENTES.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Sem ON DUPLICATE em MySQL 4.1.

    CPF avulso NÃO persiste — viaja no payload do nfceEmitir.

    🔴 HOMOLOGAÇÃO: xNome destinatário = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL".

    🔴 NFC-e sem cadastro: anular TODOS os 9 campos de endereço.

    Cancelamento TEF preserva NSU original.

    catch (Throwable) em prepararTudo/nfceEmitir.

    🔴 SEM React.StrictMode no PDV.

    🔴 Electron main process usa CommonJS (.cjs).

    🔴 Electron: BrowserRouter quebra em file:// — precisa HashRouter. PENDENTE.

    🔴 Logo com src="/logo.png" quebra em file:// — usar ./logo.png ou import. PENDENTE.

    🔴 imprimirTexto NUNCA propaga erro.

    🔴 Fallback impressão no navegador: iframe (NÃO window.open).

    🔴 CSS variables NÃO cascateiam para irmãos — modais filhos injetam vars também.

    🔴 Empresa sempre via getEmpresa() — nunca EMPRESA_PADRAO hardcoded.

    Permissões de caixa: negar por padrão.

    Padrão de página: dash-header + mesas-header-right + RelogioHeader. Container full-width.

6. Problemas atuais e pendências

🎯 PRÓXIMO TESTE — Captura de parâmetros específicos

    Validar capturas via parâmetros (cores, ícones, ramo) nos modais e telas.

🔴 PENDENTE CRÍTICO — HashRouter + logo antes de recompilar

    App.jsx: BrowserRouter → HashRouter.

    Logo: mover para src/assets/logo.png e importar (ou ./logo.png em todos).

    rmdir /S /Q release && npm run electron:build.

🟡 Tela de Caixa — backend parcial

    Falta: caixaResumo, caixaSaldoAbertura, caixaLancar, caixaEstornar, caixaExcluir, caixaLiberar, caixaFechar.

    Frontend falta: CaixaLancamentoModal, CaixaFechamentoModal, painel lateral Resumo por Forma.

    Enviar SELECTs: Resumo por Forma, Saldo Abertura, SHOW COLUMNS caixa_movimento.

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (40 e 80 chars).

    tefService.js — montarParametrosCancelamento com '001-000 = 884' hardcoded → String(venda).

    NfceFiscal.php — aplicarCartaoEmFormapgto usa $t['forma_pgto'] (deveria ser forma_pagto).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    gravarVendasTefComprovante — via_completa salva errado.

    Verificar duplicação de setLoading(true) no handleFinalizar do FinalizarVendaModal.

🟡 Config Electron

    Remover bloco extraResources do package.json (aviso cosmético).

    EPERM em rename: fechar .exe + taskkill + rmdir release + adicionar release/ como exclusão no antivírus.

🟢 Roadmap longo

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

    CPF avulso em PRODUÇÃO: se bate com cadastro, usar razao.

    Tela de acompanhamento TEF.

    Backup automático MySQL + Tailscale/Cloudflare Tunnel (Fase 1 — plano definido).

7. Próximo passo exato

Prioridade 1 — Validar capturas de parâmetros

    Testar cores/ícones/ramo passando parâmetros específicos.

    Reportar elemento que não esteja pegando o tema.

Prioridade 2 — HashRouter + logo + recompilar

    App.jsx: BrowserRouter → HashRouter.

    Logo: mover para src/assets/logo.png e importar (ou ./logo.png).

    rmdir /S /Q release && npm run electron:build.

Prioridade 3 — Fechar tela de Caixa

    Enviar SELECTs pendentes.

    Backend: caixaResumo + caixaSaldoAbertura + modais.

Prioridade 4 — Limpar duplicatas tefService + aplicar '884' → String(venda).

Prioridade 5 — Voucher.

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

    🔴 Assets em file://: caminhos absolutos NÃO funcionam.

    🔴 vite.config.js base: './'.

    🔴 ignore-certificate-errors + disable-features BlockInsecurePrivateNetworkRequests.

    🔴 EPERM em rename: .exe aberto ou antivírus.

    🔴 Electron build: portable (não NSIS).

    🔴 Ícone: .ico 256x256 multi-size.

Tema

    🔴 CSS variables NÃO cascateiam para irmãos.

    🔴 Fallback :root garante legibilidade.

    🔴 Manter cores semânticas.

    🔴 Hover: filter: brightness(0.9).

Multi-empresa (NOVO v33)

    🔴 Empresa sempre via getEmpresa() — nunca EMPRESA_PADRAO hardcoded.

    🔴 LoginPage precisa enviar empresa no POST /app/login (backend usa ?? 1).

    🔴 ConfigPage salva { empresa: N } no localStorage (@app:config).

    🔴 Backend já usa $dados->empresa ?? 1 em todos endpoints — não precisa mudar.

    🔴 Só o config/index.js mantém EMPRESA_PADRAO como fallback.

Impressão

    🔴 imprimirTexto NUNCA propaga erro.

    🔴 Fallback navegador: iframe.

    🔴 Electron: webContents.print({silent: true}).

    🔴 CSS: @page { size: 80mm auto; margin: 0; }.

TEF

    🔴 Agente porta 8443; cert self-signed; terminalId único.

    🔴 FORMAS_TEF = ERP codes (4/5/117).

    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.

    🔴 Campo 546 = Tipo Voucher.

    🔴 Campo 121 = Cupom Estabelecimento. Campo 122 = Cupom Cliente.

PinPad

    🔴 Largura 16x2. persistente='Y'.

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

    Impressão 2 vias funcionando. Executável Electron com ícone.

    TEMA aplicado em 6 modais. MULTI-EMPRESA resolvido (getEmpresa).

    Correções PENDENTES antes do próximo build: HashRouter + logo.

    Usuário vai testar captura de parâmetros — aguardar feedback.

    Ordem: (1) validar captura de parâmetros; (2) HashRouter + logo + recompilar; (3) fechar Caixa; (4) limpar tefService; (5) voucher.

    Não refatorar classes validadas (NfceFiscal exceto criarDestinatario/carregarCliente, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Nunca reintroduzir React.StrictMode.

    Nunca trocar HashRouter por BrowserRouter (Electron).

    Nunca trocar .cjs por .js no main process.

    Nunca usar window.open como fallback de impressão.

    Nunca deixar imprimirTexto propagar erro.

    Nunca usar EMPRESA_PADRAO hardcoded — sempre getEmpresa().

    Nunca injetar CSS var só em um modal — irmãos precisam injetar as próprias.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable).

    Sempre inTransaction() antes de rollBack().

    Sempre sanitizarTexto() em justificativas.

    Sempre tratar cStat 241, 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Nunca concatenar PDOStatement em log.

    Verificar imports duplicados antes de salvar (.jsx).

    Manter português, respostas técnicas com código.

10. Histórico de correções acumuladas

v19-v31: ver documentos anteriores.

v32: tema unificado em 6 modais (CSS variables --tema-cor, --tema-cor-suave).

v33 (hoje):

    src/config/index.js: adicionado getEmpresa() — lê empresa do localStorage (@app:config), fallback EMPRESA_PADRAO.

    14 services migrados: EMPRESA_PADRAO → getEmpresa() (~40 usos).

    LoginPage.jsx: agora envia empresa: getEmpresa() no POST /app/login (backend usa ?? 1 como default — por isso sempre logava na 1).

    Verificação pós-migração: só src/config/index.js mantém EMPRESA_PADRAO (fallback).

    Bug identificado e corrigido: o login não enviava empresa e o backend caía no default 1, por isso a empresa 2 só mostrava o nome (vindo do dadosEmpresa), mas todos os outros endpoints batiam na 1.

    Testado: trocar empresa em /config agora reflete em todos os endpoints.

    PENDENTE: HashRouter + logo antes de recompilar .exe.

    PENDENTE: testar captura de parâmetros (cores/ícones/ramo) nos modais.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) validar captura de parâmetros; (2) aplicar HashRouter + logo + recompilar; (3) fechar tela de Caixa; (4) limpar tefService; (5) voucher. 🎯