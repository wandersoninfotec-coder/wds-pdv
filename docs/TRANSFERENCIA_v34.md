📋 TRANSFERÊNCIA — Facilit NFC-e (v34)

Data: 14/Outubro/2026 (quarta-feira, noite)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando, cancelando, PinPad boas-vindas. Impressão 2 vias. Executável Electron com ícone. Multi-empresa RESOLVIDO. Tema em 6 modais. CONTROLE DE CAIXA implementado (abrir/fechar manual + automático) — 3 ajustes finais aplicados (herança de saldo auto, sugestão manual, bloqueio de virar dia). PENDENTE: testar os 2 modos após os patches finais.

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
controllers/appController.php ; ✅ login + nfceEmitir (cpf_nfce) + dadosEmpresa (fantasia)
                              ; ✅ caixaListar + caixaInfo + caixaAbrir + caixaFechar
                              ; ✅ caixaGarantirLoteAberto + caixaCalcularSaldoFechamento + caixaCriarLote + caixaFecharLote (helpers privados)
                              ; ✅ finalizarVenda (chama caixaGarantirLoteAberto)
                              ; ✅ gravarVendasTef + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

build/icon.ico                ; ✅ 256x256 multi-size

electron/
├── main.cjs                  ; ✅ ignore-certificate-errors + printCupom IPC
└── preload.cjs               ; ✅ contextBridge: electronAPI.printCupom

src/
├── main.jsx                  ; ✅ SEM StrictMode
├── App.jsx                   ; ✅ gate config + rotas — ⚠️ HashRouter PENDENTE
├── config/index.js           ; ✅ getEmpresa() + EMPRESA_PADRAO (fallback)
├── pages/
│   ├── ConfigPage.jsx        ; ✅
│   ├── LoginPage.jsx         ; ✅ + getEmpresa() no payload
│   ├── DashboardPage.jsx     ; ✅ botão Caixa + PinPad boas-vindas
│   ├── CaixaPage.jsx         ; ✅ grid + filtros + banner de status + botões abrir/fechar
│   ├── NotasPage.jsx         ; ✅
│   ├── HistoricoPage.jsx     ; ✅
│   └── ...
├── components/
│   ├── MesaDetalhesModal.jsx      ; ✅ tema
│   ├── MesaDetalhesModal2.jsx     ; ✅ tema + mini-modal qtd
│   ├── FinalizarVendaModal.jsx    ; ✅ tema + CPF avulso + TEF + cancelamento
│   ├── TefModal.jsx               ; ✅ modo 'venda' | 'cancelar' + impressão 2 vias + tema
│   ├── SuccessModal.jsx           ; ✅ tema
│   ├── DetalhesPedidoModal.jsx    ; ✅ tema
│   ├── CaixaAberturaModal.jsx     ; ✅ NOVO — abre caixa com valor sugerido
│   ├── CaixaFechamentoModal.jsx   ; ✅ NOVO — fecha caixa com valor calculado
│   ├── RelogioHeader.jsx          ; ✅
│   └── ...
├── hooks/usePermissoes.js    ; ✅ 11 permissões de caixa
└── services/
    ├── api.js                ; ✅ interceptor lê baseURL do localStorage
    ├── configService.js      ; ✅ salva/carrega @app:config
    ├── pagamentoService.js   ; ✅ finalizarEEmitir + getEmpresa()
    ├── tefService.js         ; ✅ getEmpresa() (⚠️ mostrarMensagemPinpad DUPLICADO)
    ├── caixaService.js       ; ✅ listar + caixaInfo + caixaAbrir + caixaFechar
    └── ... (14 services migrados para getEmpresa)

package.json                  ; ✅ main: electron/main.cjs + scripts electron:dev/build + portable

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO 🎉

    NFC-e com cliente cadastrado, CPF avulso, sem CPF: AUTORIZADA.

    cStat 598 e 215 resolvidos.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).

    Gravando em vendas_tef / vendas_tef_comprovante / nfce_tef.

Impressão Comprovante TEF

    imprimirTexto blindado. Caminho Electron silencioso + iframe fallback.

    Via estabelecimento: auto. Via cliente: checkbox (default marcado).

PinPad Boas-Vindas

    "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    persistente='Y' — sobrevive à sessão e à transação.

CPF na Nota

    CPF avulso + cliente cadastrado + sem CPF. Validação front + backend.

Tela de Caixa

    Grid de movimentos + filtros + rodapé + banner de status.

    Botões Abrir/Fechar Caixa com gate de permissão.

    Modais CaixaAberturaModal e CaixaFechamentoModal.

Executável Electron

    FacilitPDV-0.0.0.exe (portable) em release/.

    Ícone personalizado (build/icon.ico).

    ConfigPage no primeiro boot.

Tema Aplicado em 6 Modais

    CSS variables --tema-cor / --tema-cor-suave. Fallback :root.

    Modais: MesaDetalhesModal, MesaDetalhesModal2 (+ mini-modal qtd), FinalizarVendaModal, DetalhesPedidoModal, TefModal, SuccessModal.

    Cores semânticas preservadas (vermelho/amarelo/verde/cinza).

Multi-empresa

    src/config/index.js: getEmpresa() (lê localStorage, fallback EMPRESA_PADRAO).

    14 services + LoginPage migrados de EMPRESA_PADRAO → getEmpresa().

    Só o config/index.js mantém EMPRESA_PADRAO (fallback).

CONTROLE DE CAIXA — NOVO v34 🎉

    Backend:
      caixaInfo — status do caixa + lote ativo + sugestão + flag precisaFecharOntem.
      caixaAbrir — abre manualmente, bloqueia se já aberto hoje ou se lote de ontem pendente.
      caixaFechar — fecha lote ativo, calcula valor se não informado.
      caixaGarantirLoteAberto — chamado pelo finalizarVenda:
        - AUTO: fecha lote de ontem + abre novo com valor_fechamento herdado.
        - MANUAL: lança exceção ("feche o caixa antes") se não tiver lote de hoje.
      Fórmula confirmada com ERP: valor_fechamento = valor_abertura + entradas − saídas.

    Frontend:
      CaixaPage com banner de status (aberto/fechado) + botões Abrir/Fechar.
      CaixaAberturaModal (valor sugerido pelo último fechamento).
      CaixaFechamentoModal (valor calculado exibido, ajustável).
      Botão "Fechar Caixa (pendente de ontem)" pisca em vermelho quando precisa fechar antes de abrir hoje.

    Regras implementadas:
      AUTO: saldo_abertura = saldo_fechamento do dia anterior (herdado).
      MANUAL: operador escolhe valor (sugerido pelo último fechamento) + precisa fechar ontem antes de abrir hoje.

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

    🔴 CSS variables NÃO cascateiam para irmãos — modais filhos injetam vars.

    🔴 Empresa sempre via getEmpresa() — nunca EMPRESA_PADRAO hardcoded.

    Permissões de caixa: negar por padrão.

    Padrão de página: dash-header + mesas-header-right + RelogioHeader. Container full-width.

    🔴 Caixa modo AUTO: herança de saldo (abertura = fechamento anterior).
    🔴 Caixa modo MANUAL: operador decide + bloqueia virar dia sem fechar ontem.
    🔴 `contas.controla_abertura_fechamento`: 0=auto, 1=manual. `status`: 0=inativo, 1=ativo.
    🔴 `caixa_dedicado` em tab_formapagamento prevalece sobre caixa padrão.

6. Problemas atuais e pendências

🎯 TESTE PENDENTE — Validar modo AUTO e MANUAL após os patches finais

    Modo AUTO: mudar conta 1 para controla = 0, fazer venda, verificar herança de saldo.
    Modo MANUAL: voltar controla = 1, fechar ontem, abrir hoje, verificar sugestão de valor.

🔴 PENDENTE CRÍTICO — HashRouter + logo antes de recompilar

    App.jsx: BrowserRouter → HashRouter.
    Logo: mover para src/assets/logo.png e importar (ou ./logo.png em todos).
    rmdir /S /Q release && npm run electron:build.

🟡 Tela de Caixa — extensões

    Backend falta: caixaResumo (Resumo por Forma), caixaEstornar, caixaExcluir, caixaLiberar.
    Frontend falta: painel lateral Resumo por Forma.

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (40 e 80 chars).
    tefService.js — montarParametrosCancelamento com '001-000 = 884' hardcoded.
    NfceFiscal.php — aplicarCartaoEmFormapgto usa $t['forma_pgto'] (deveria ser forma_pagto).
    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.
    gravarVendasTefComprovante — via_completa salva errado.

🟡 Config Electron

    Remover bloco extraResources do package.json.
    EPERM em rename: fechar .exe + taskkill + rmdir release + exclusão no antivírus.

🟢 Roadmap longo

    Voucher (Cartão Alimentação/Refeição).
    E-mail (PHPMailer + XML + PDF).
    Fix do vendedor (codigoFuncionario).
    {TipoDocFiscal=1;} em ParamAdic (produção).
    CPF avulso em PRODUÇÃO: se bate com cadastro, usar razao.
    Tela de acompanhamento TEF.
    Backup automático MySQL + Tailscale/Cloudflare Tunnel.

7. Próximo passo exato

Prioridade 1 — Testar os 2 modos de caixa

    AUTO: UPDATE contas SET controla_abertura_fechamento = 0 WHERE empresa=1 AND conta='1'; Fazer venda.
    MANUAL: UPDATE contas SET controla_abertura_fechamento = 1; Fechar ontem, abrir hoje.

Prioridade 2 — HashRouter + logo + recompilar

    App.jsx: BrowserRouter → HashRouter.
    Logo: src/assets/logo.png + import (ou ./logo.png).
    rmdir /S /Q release && npm run electron:build.

Prioridade 3 — Extensões da Caixa (Resumo, Estorno, Exclusão).

Prioridade 4 — Limpar duplicatas tefService.

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

Multi-empresa

    🔴 Empresa sempre via getEmpresa().
    🔴 LoginPage precisa enviar empresa no POST /app/login.
    🔴 Backend usa $dados->empresa ?? 1 — não precisa mudar.

Controle de Caixa (NOVO v34)

    🔴 contas.controla_abertura_fechamento: 0=auto, 1=manual.
    🔴 contas.status: 0=inativo, 1=ativo. Inativo bloqueia movimentação.
    🔴 AUTO: herda valor_fechamento do lote anterior como valor_abertura.
    🔴 MANUAL: operador escolhe valor + precisa fechar ontem antes de abrir hoje.
    🔴 Fórmula: valor_fechamento = valor_abertura + SUM(C) − SUM(D) [estornado=0].
    🔴 PK caixa_lote_abertura = (empresa, codigo, caixa_abertura) — codigo é sequencial POR caixa.
    🔴 lote ativo = data_fechamento em ('', '0000-00-00').
    🔴 codigoloteabertura no caixa_movimento é FK implícita.
    🔴 caixa_dedicado em tab_formapagamento prevalece sobre caixa_padrao.

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
    🔴 caixa_lote_abertura PK composta + codigo sequencial por caixa.
    🔴 contas.controla_abertura_fechamento (auto/manual) + status (ativo/inativo).
    🔴 caixa_movimento.codigoloteabertura liga movimento ao lote.

9. Instruções para a IA no novo chat

    NFC-e 100% emitindo em homologação. TEF gravando, cancelando, PinPad boas-vindas.

    Impressão 2 vias funcionando. Executável Electron com ícone.

    Tema aplicado em 6 modais. Multi-empresa resolvido.

    CONTROLE DE CAIXA implementado — pendente validar modo AUTO e MANUAL após patches.

    Correções PENDENTES antes do próximo build: HashRouter + logo.

    Ordem: (1) testar 2 modos de caixa; (2) HashRouter + logo + recompilar; (3) extensões Caixa; (4) limpar tefService; (5) voucher.

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

v19-v32: ver documentos anteriores.

v33: multi-empresa (getEmpresa + 14 services migrados + LoginPage).

v34 (hoje):

    Backend: caixaInfo, caixaAbrir, caixaFechar em appController.php.

    Backend: caixaGarantirLoteAberto (chamado por finalizarVenda) — modo AUTO herda saldo, MANUAL bloqueia.

    Backend: caixaCalcularSaldoFechamento (valor_abertura + entradas − saídas).

    Backend: caixaCriarLote + caixaFecharLote (helpers privados).

    Backend: finalizarVenda — bloco 8.2 substituído por caixaGarantirLoteAberto.

    Frontend: CaixaAberturaModal.jsx + .css (com valor sugerido).

    Frontend: CaixaFechamentoModal.jsx + .css (com valor calculado + histórico).

    Frontend: CaixaPage.jsx — banner de status + botões Abrir/Fechar + regra precisaFecharOntem (botão pulsante vermelho).

    Frontend: caixaService.js — 4 métodos (listar + caixaInfo + caixaAbrir + caixaFechar).

    Backend caixaInfo ajustado: incluir ehDeHoje, sugestaoValorAbertura, precisaFecharOntem.

    Backend caixaAbrir ajustado: mensagens específicas (ja_aberto_hoje vs precisa_fechar_ontem).

    PENDENTE: testar modo AUTO (herança de saldo) e modo MANUAL (fechar ontem → abrir hoje).

    PENDENTE: HashRouter + logo antes de recompilar .exe.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) testar 2 modos de caixa; (2) aplicar HashRouter + logo + recompilar; (3) extensões Caixa (Resumo/Estorno/Exclusão); (4) limpar tefService; (5) voucher. 🎯