📋 TRANSFERÊNCIA — Facilit NFC-e (v39)

Data: 15/Outubro/2026 (quinta-feira, noite)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando/cancelando. Impressão 2 vias. Executável Electron com ícone. Multi-empresa OK. Tema em 6 modais. Controle de Caixa completo. PDV Unificado: S → Mesas + Venda Direta (9999); N → PDV Full-Screen (0). Nova tela PdvFullScreen com F-keys, qtd prévia e auto-renovação. Busca EXATA por código de barras + parser de balança (estrutura pronta, aguardando layout real).

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).
    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).
    Facilit App: React Native/Expo — pronto.
    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.
    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef, múltiplos terminais em rede.

ARQUITETURA DE REDE

    Servidor (192.168.100.67): backend — PHP + MySQL + TecnoSpeed + jobs. SEM frontend, PinPad ou impressora.
    Cada terminal: Electron com frontend buildado. CliSiTef local + impressora local.
    Configuração por terminal: ConfigPage salva IP/porta/caminho/empresa no localStorage.
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
models/Produto.php            ; ✅ listarConsulta + buscarExato + buscarPorBalança (NOVO v39)
controllers/appController.php ; ✅ login (usaControleMesas com in_array) + nfceEmitir + dadosEmpresa
                              ; ✅ caixaListar + caixaInfo + caixaAbrir + caixaFechar + caixaGarantirLoteAberto + caixaCalcularSaldoFechamento + caixaCriarLote + caixaFecharLote + caixaObterUltimoValorFechamento + caixaValidarLoteAberto
                              ; ✅ finalizarVenda + vendaAbrir (0=balcão, 9999=venda direta, >0=mesa)
                              ; ✅ produtoBuscarExato + produtoBuscarBalança (NOVO v39)
                              ; ✅ gravarVendasTef + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

build/icon.ico                ; ✅ 256x256 multi-size
electron/main.cjs + preload.cjs ; ✅ CommonJS + ignore-certificate-errors + printCupom IPC

src/
├── main.jsx                  ; ✅ SEM StrictMode
├── App.jsx                   ; ✅ gate config + rotas + /pdv + /venda-direta — ⚠️ HashRouter PENDENTE
├── config/index.js           ; ✅ getEmpresa() + EMPRESA_PADRAO (fallback)
├── context/AuthContext.jsx   ; ✅
├── pages/
│   ├── ConfigPage, LoginPage, DashboardPage  ; ✅
│   ├── PdvPage.jsx           ; ✅ roteador por usaControleMesas
│   ├── PdvBalcaoPage.jsx     ; ✅ PdvFullScreen + auto-renovação
│   ├── VendaDiretaPage.jsx   ; ✅ MesaDetalhesModal2 (9999)
│   ├── CaixaPage, MesasPage (guard), NotasPage, HistoricoPage  ; ✅
│   └── ...
├── components/
│   ├── MesaDetalhesModal2.jsx     ; ✅ tema
│   ├── PdvFullScreen.jsx          ; ✅ NOVO v38/v39 — full-screen, F-keys, qtd prévia, bipe exato/balança
│   ├── PdvFullScreen.css          ; ✅
│   ├── FinalizarVendaModal.jsx    ; ✅ TEF + CPF + tema
│   ├── TefModal.jsx               ; ✅ modo venda/cancelar + impressão 2 vias + tema
│   ├── SuccessModal, DetalhesPedidoModal, MesaDetalhesModal  ; ✅ tema
│   ├── CaixaAberturaModal, CaixaFechamentoModal  ; ✅
│   └── ...
└── services/
    ├── api.js, configService.js, sessionService.js  ; ✅
    ├── pagamentoService.js, tefService.js (getEmpresa)  ; ✅
    ├── caixaService.js         ; ✅ + podeVender
    ├── mesaService.js          ; ✅ + abrirVendaBalcao(mesaComanda)
    ├── produtoService.js       ; ✅ + buscarExato + buscarPorBalança (NOVO v39)
    └── ...

package.json                  ; ✅ main: electron/main.cjs + electron:dev/build + portable

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO 🎉

    NFC-e com cliente cadastrado, CPF avulso, sem CPF: AUTORIZADA.
    cStat 598 e 215 resolvidos.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).
    Gravando em vendas_tef / vendas_tef_comprovante / nfce_tef.

Impressão Comprovante TEF

    imprimirTexto blindado. Electron silencioso + iframe fallback.
    Via estabelecimento: auto. Via cliente: checkbox (default marcado).

PinPad Boas-Vindas

    "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars. persistente='Y'.

CPF na Nota

    CPF avulso + cliente cadastrado + sem CPF. Validação front + backend.

Tela de Caixa

    Grid + filtros + rodapé + banner + modais abrir/fechar.
    Controle AUTO (herança de saldo) + MANUAL (fechar ontem antes) + Guard em Mesas.

Executável Electron

    FacilitPDV-0.0.0.exe (portable). Ícone personalizado. ConfigPage no primeiro boot.

Tema Aplicado em 6 Modais

    CSS variables --tema-cor / --tema-cor-suave. Fallback :root.

Multi-empresa

    getEmpresa() lê do localStorage, fallback EMPRESA_PADRAO.
    14 services + LoginPage migrados.

PDV Unificado

    param_sistema.usa_controle_mesas: char(1) 'S'/'N'.
    Login retorna usaControleMesas corretamente (via in_array).
    Dashboard: S → Mesas + Venda Direta; N → PDV.
    Venda Direta (S): abre MesaDetalhesModal2 com mesa_comanda = 9999.
    PDV (N): abre PdvFullScreen com mesa_comanda = 0.
    Backend vendaAbrir aceita 0, 9999, ou mesa normal.

Nova Tela PdvFullScreen

    Full-screen (position: fixed; inset: 0).
    Header com tema + qtd itens + total.
    Campo QTD prévio (default 1, reset após adicionar).
    Campo busca autofocus com Enter adiciona.
    Lista de itens com qtd, descrição, unitário, total, remover.
    Footer com F1 Ajuda, F4 Remover, F10 Cancelar, F9 Finalizar.
    Atalhos: F1 Ajuda, F2 Qtd, F3 Busca, F4 Remove último, F9 Finaliza, F10 Cancela, F12 Sai, Esc limpa.
    Modal de ajuda com tabela de atalhos.
    Auto-renovação após venda (SuccessModal.onClose → abrirNovaVenda).

BUSCA CÓDIGO DE BARRAS + BALANÇA — NOVO v39 🎉

    Backend Produto::buscarExato($empresa, $codigo): match EXATO em codigobarra OU referencia.
    Backend Produto::buscarPorBalança($empresa, $codigoBarras, $layout): parser configurável.
      Layout default: prefixo 2 + tamPrefixo 1 + tamCodigo 6 + tamValor 5 + temDV true + tipo 'peso'.
      Aceita tipo 'peso' (gramas → kg × preço) ou 'valor' (centavos → total, calcula qtd).
    Endpoints: /app/produtoBuscarExato, /app/produtoBuscarBalança.
    Frontend produtoService: buscarExato, buscarPorBalança.
    PdvFullScreen useEffect detecta:
      13 dígitos começando com 2 → tenta balança.
      8+ dígitos → busca exata (código de barras).
      Outros → busca fuzzy por nome (LIKE).
    Feedback visual + limpa campo após bipe bem-sucedido.
    Testado: busca por código de barras funcionando.

5. Decisões de arquitetura

    🔴 forma_pagto em vendas_tef; forma_pgto em nfce_tef.
    🔴 vendas_tef.tipo = char(1), sempre '1'.
    PK vendas_tef = (empresa, venda, parcela, codigo, ordem). Sem ON DUPLICATE em MySQL 4.1.
    CPF avulso NÃO persiste — viaja no payload do nfceEmitir.
    🔴 HOMOLOGAÇÃO: xNome destinatário = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL".
    🔴 NFC-e sem cadastro: anular TODOS os 9 campos de endereço.
    Cancelamento TEF preserva NSU original. catch (Throwable) em prepararTudo/nfceEmitir.
    🔴 SEM React.StrictMode no PDV.
    🔴 Electron main process usa CommonJS (.cjs).
    🔴 Electron: BrowserRouter quebra em file:// — precisa HashRouter. PENDENTE.
    🔴 Logo com src="/logo.png" quebra em file:// — usar ./logo.png ou import. PENDENTE.
    🔴 imprimirTexto NUNCA propaga erro. Fallback impressão: iframe.
    🔴 CSS variables NÃO cascateiam para irmãos.
    🔴 Empresa sempre via getEmpresa().
    Permissões de caixa: negar por padrão.
    Padrão de página: dash-header + mesas-header-right + RelogioHeader. Container full-width.
    Caixa AUTO: herança de saldo. MANUAL: operador decide + fecha ontem antes.
    Guard de Mesas é fail-open.
    🔴 PDV: 1 botão no Dashboard roteia por usa_controle_mesas.
    🔴 Venda Direta (S) = 9999. PDV puro (N) = 0.
    🔴 PdvFullScreen é tela nova com F-keys e qtd prévia.
    🔴 Busca por código: exata quando 8+ dígitos; balança quando 13 dígitos com prefixo 2; fuzzy senão.
    🔴 SuccessModal fecha → chama onRenovarVenda() e mantém no PDV.
    🔴 Impressão não-fiscal + escolha NFC-e/dinheiro: pendente.

6. Problemas atuais e pendências

🔴 PENDENTE CRÍTICO — HashRouter + logo antes de recompilar

    App.jsx: BrowserRouter → HashRouter.
    Logo: mover para src/assets/logo.png e importar (ou ./logo.png em todos).
    rmdir /S /Q release && npm run electron:build.

🟡 Balança — aguardando 4 dados

    Formato do código (exemplo real de 13 dígitos).
    É peso (gramas) ou valor (centavos)?
    Onde está o código do produto (posição e se é referencia ou codigobarra)?
    Tem dígito verificador no final?
    Ou o arquivo .ini completo.

🟡 Próximas funcionalidades — PDV

    Impressão: NFC-e vs. cupom não-fiscal (parâmetro por empresa).
    Escolha no dinheiro: emitir NFC-e ou imprimir cupom não-fiscal.
    Ajustes finos do layout PdvFullScreen.

🟡 Tela de Caixa — extensões

    Backend: caixaResumo, caixaEstornar, caixaExcluir, caixaLiberar.
    Frontend: painel Resumo por Forma.
    Novo Lançamento (entrada/saída) — aguardando VB6.

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (40 e 80 chars).
    tefService.js — montarParametrosCancelamento com '001-000 = 884' hardcoded.
    NfceFiscal.php — aplicarCartaoEmFormapgto usa $t['forma_pgto'].
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

Prioridade 1 — HashRouter + logo + recompilar

    App.jsx: BrowserRouter → HashRouter.
    Logo: src/assets/logo.png + import (ou ./logo.png).
    rmdir /S /Q release && npm run electron:build.

Prioridade 2 — Balança (aguardando dados)

    Enviar .ini + exemplo de código + tipo (peso/valor) + posição do código do produto.
    Ajustar buscarPorBalança.

Prioridade 3 — Impressão NFC-e vs cupom não-fiscal.

Prioridade 4 — Extensões da Caixa (Resumo, Estorno, Exclusão).

Prioridade 5 — Limpar duplicatas tefService.

Prioridade 6 — Voucher.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).
    🔴 Typo: terminino_vigencia_ncm_nbs_ibs_cbs.
    🔴 cStat real em <retEvento>/<retInutNFe>. 241, 563 = sucesso disfarçado.
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
    Timezone: America/Cuiaba (UTC-4). PDO retorna string — sempre Number().
    Nunca concatenar PDOStatement em log.
    ❗ PHP 7: Error NÃO é capturado por catch(Exception). Sempre Throwable.
    ❗ React StrictMode NÃO funciona em PDV.
    ❗ Não duplicar imports (Vite quebra).
    🔴 PHP: comparar char(1) 'S'/'N' com == 1 SEMPRE falha. Usar in_array.
    ❗ Ctrl+S é obrigatório após editar; colar no chat NÃO salva em disco.
    ❗ Cache do Vite: Ctrl+Shift+R; se persistir, rmdir node_modules\.vite + restart.

Electron

    🔴 package.json "type": "module" → main process DEVE ser .cjs.
    🔴 React Router em Electron: SEMPRE HashRouter.
    🔴 Assets em file://: caminhos absolutos NÃO funcionam.
    🔴 vite.config.js base: './'.
    🔴 ignore-certificate-errors + disable-features BlockInsecurePrivateNetworkRequests.
    🔴 EPERM em rename: .exe aberto ou antivírus.
    🔴 Electron build: portable (não NSIS). Ícone: .ico 256x256 multi-size.

Tema

    🔴 CSS variables NÃO cascateiam para irmãos. Fallback :root garante legibilidade.
    🔴 Manter cores semânticas. Hover: filter: brightness(0.9).

Multi-empresa

    🔴 Empresa sempre via getEmpresa(). LoginPage precisa enviar empresa no POST.

Controle de Caixa

    🔴 contas.controla_abertura_fechamento: 0=auto, 1=manual. status: 0=inativo, 1=ativo.
    🔴 AUTO herda valor_fechamento do lote anterior. Saldo CUMULATIVO.
    🔴 MANUAL: operador escolhe + precisa fechar ontem antes de abrir hoje.
    🔴 Fórmula: valor_fechamento = valor_abertura + SUM(C) − SUM(D) [estornado=0].
    🔴 PK caixa_lote_abertura = (empresa, codigo, caixa_abertura).
    🔴 Lote ativo = data_fechamento em ('', '0000-00-00'). Fechado = SOMENTE LEITURA.
    🔴 caixa_movimento.codigoloteabertura é FK implícita.
    🔴 caixa_dedicado prevalece sobre caixa_padrao.
    🔴 CAST(codigoloteabertura AS UNSIGNED) + bind INT em MySQL 4.1.
    🔴 MAX(codigo) global por EMPRESA.
    🔴 Filtro datalancamento >= data_abertura E <= data_fechamento.
    🔴 Nunca apagar lotes sem apagar movimentos vinculados.
    🔴 Guard de Mesas é fail-open.

PDV Unificado

    🔴 param_sistema.usa_controle_mesas: char(1) 'S'/'N'.
    🔴 Backend DEVE usar in_array com ['1','S','Y','T','TRUE'] (case-insensitive, trim).
    🔴 S → Mesas + Venda Direta (9999). N → PDV Full-Screen (0).

PdvFullScreen

    🔴 position: fixed; inset: 0 (full-screen).
    🔴 QTD prévia (default 1, reset após adicionar).
    🔴 F1 ajuda, F2 qtd, F3 busca, F4 remove último, F9 finaliza, F10 cancela, F12 sai.
    🔴 Auto-renovação: SuccessModal.onClose → abrirNovaVenda.
    🔴 Busca código: 13 dígitos prefixo 2 = balança; 8+ dígitos = exato; senão fuzzy.

Busca de Produtos

    🔴 buscarExato: WHERE codigobarra = :codigo OR referencia = :codigo (SEM LIKE).
    🔴 buscarPorBalança: configurável via layout (prefixo, tamCodigo, tamValor, temDV, tipo).
    🔴 Layout default: prefixo 2 + cod 6 + valor 5 + DV = 13 dígitos.
    🔴 tipo 'peso': gramas → kg × preço vista. tipo 'valor': centavos → total, calcula qtd.
    🔴 Filtro padrão: status=1, tipo_cadastro='PRODUTO', exporta_app='sim', tipo_item=0, estoque>0 (se controla).

Impressão

    🔴 imprimirTexto NUNCA propaga erro. Fallback navegador: iframe.
    🔴 Electron: webContents.print({silent: true}). CSS: @page { size: 80mm auto; margin: 0; }.

TEF

    🔴 Agente porta 8443; cert self-signed; terminalId único.
    🔴 FORMAS_TEF = ERP codes (4/5/117).
    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.
    🔴 Campo 546 = Tipo Voucher. Campo 121 = Cupom Estabelecimento. Campo 122 = Cupom Cliente.

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
    🔴 param_sistema.usa_controle_mesas: char(1) 'S'/'N'.
    🔴 caixa_lote_abertura PK composta + codigo sequencial por caixa.
    🔴 contas.controla_abertura_fechamento (auto/manual) + status (ativo/inativo).
    🔴 caixa_movimento.codigoloteabertura liga movimento ao lote.
    🔴 produtos: referencia, codigobarra, reforiginal, ref_fabricante, exporta_app, tipo_cadastro, tipo_item, status.

9. Instruções para a IA no novo chat

    NFC-e 100% emitindo em homologação. TEF gravando/cancelando. Impressão 2 vias.
    Executável Electron com ícone. Tema aplicado em 6 modais. Multi-empresa resolvido.
    Controle de Caixa 100% funcional + Guard em Mesas.
    PDV Unificado: S → Mesas + Venda Direta (9999); N → PDV Full-Screen (0).
    Nova tela PdvFullScreen: F-keys, qtd prévia, auto-renovação.
    Busca EXATA por código de barras + parser de balança (aguardando layout real).
    Ordem: (1) HashRouter + logo + recompilar; (2) balança (enviar .ini); (3) impressão NFC-e vs cupom; (4) extensões Caixa; (5) limpar tefService; (6) voucher.
    Não refatorar classes validadas (NfceFiscal exceto criarDestinatario/carregarCliente, NfceTransmissor, Vendas).
    Nunca reintroduzir <?xml?> antes de assinar.
    Nunca reintroduzir React.StrictMode.
    Nunca trocar HashRouter por BrowserRouter (Electron).
    Nunca trocar .cjs por .js no main process.
    Nunca usar window.open como fallback de impressão.
    Nunca deixar imprimirTexto propagar erro.
    Nunca usar EMPRESA_PADRAO hardcoded — sempre getEmpresa().
    Nunca injetar CSS var só em um modal.
    Nunca apagar caixa_lote_abertura sem apagar caixa_movimento vinculado.
    Nunca comparar char(1) 'S'/'N' com == 1 em PHP — usar in_array.
    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.
    Sempre catch (Throwable).
    Sempre inTransaction() antes de rollBack().
    Sempre sanitizarTexto() em justificativas.
    Sempre tratar cStat 241, 563 como sucesso.
    Sempre estornar estoque antes de marcar item cancelado.
    Sempre curl.exe -k no agente.
    Sempre Number() ao comparar códigos MySQL via PDO.
    Sempre CAST(coluna AS UNSIGNED) + bind INT em MySQL 4.1.
    Nunca concatenar PDOStatement em log.
    Verificar imports duplicados antes de salvar (.jsx).
    Lembrar: Ctrl+S é obrigatório; colar no chat NÃO salva em disco.
    Manter português, respostas técnicas com código.

10. Histórico de correções acumuladas

v19-v37: ver documentos anteriores.

v38: usa_controle_mesas fix (in_array); VendaDiretaPage; PdvFullScreen (tela nova); PdvBalcaoPage usando PdvFullScreen.

v39 (hoje):

    models/Produto.php — buscarExato($empresa, $codigo) com = em codigobarra OR referencia (SEM LIKE).
    models/Produto.php — buscarPorBalança($empresa, $codigoBarras, $layout) configurável.
      Defaults: prefixo 2, tamPrefixo 1, tamCodigo 6, tamValor 5, temDV true, tipo 'peso'.
      tipo 'peso': valor em gramas → kg × preço vista.
      tipo 'valor': valor em centavos → total; calcula qtd = total / preço vista.

    appController.php — produtoBuscarExato + produtoBuscarBalança (endpoints + rotas).

    produtoService.js — buscarExato + buscarPorBalança.

    PdvFullScreen.jsx:
      useEffect de busca agora detecta automaticamente:
        13 dígitos com prefixo 2 → balança primeiro.
        8+ dígitos → busca exata.
        Outros → busca fuzzy (nome/grupo/código).
      handleBuscaEnter ignora se input parece código (efeito já processou).
      Feedback visual + limpa busca após bipe bem-sucedido.

    PdvFullScreen:
      position: fixed; inset: 0 (full-screen sem scroll externo).
      QTD prévia (default 1) + botão resetar após adicionar.
      Atalhos F1 (ajuda), F2 (qtd), F3 (busca), F4 (remove último), F9 (finaliza), F10 (cancela venda), F12 (sai), Esc (limpa busca).
      Modal de ajuda com tabela de atalhos.
      SuccessModal.onClose → abrirNovaVenda() — mantém no PDV.

    Testado: busca por código de barras + PDV full-screen + auto-renovação após venda. Funcionando.

    PENDENTE: HashRouter + logo antes de recompilar .exe.
    PENDENTE: layout real de balança (aguardando .ini).
    PENDENTE: impressão NFC-e vs cupom não-fiscal.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) HashRouter + logo + recompilar; (2) balança (enviar .ini); (3) impressão NFC-e vs cupom; (4) extensões Caixa; (5) limpar tefService; (6) voucher. 🎯