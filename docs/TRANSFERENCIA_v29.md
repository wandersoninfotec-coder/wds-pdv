📋 TRANSFERÊNCIA — Facilit NFC-e (v29)

Data: 09/Outubro/2026 (tarde)
Status: 🎉 NFC-e 100% EMITINDO em homologação — cliente cadastrado, CPF avulso e sem CPF. TEF gravando, cancelando, PinPad com boas-vindas. Tela de Caixa (CaixaPage) em construção — grid funcional, botões com gate de permissão. PIX QR Code bloqueado por simulação de homologação. Arquitetura de rede definida.

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

    terminalId TEF: ÚNICO por terminal.

    Instalador único NSIS: Electron + frontend + CliSiTef + config.

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

src/
├── main.jsx                    ; ✅ SEM StrictMode
├── App.jsx                     ; ✅ rota /caixa
├── pages/
│   ├── DashboardPage.jsx       ; ✅ botão Caixa + useEffect PinPad boas-vindas
│   ├── CaixaPage.jsx           ; ✅ grid funcional, botões com permissão
│   ├── CaixaPage.css           ; ✅ padrão full-width (compatível NotasPage)
│   ├── NotasPage.jsx           ; ✅ (duplicata RelogioHeader corrigida)
│   └── ...
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ TEF + cancelamento TEF + input CPF avulso
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar'
│   ├── RelogioHeader.jsx       ; ✅ (compartilhado)
│   ├── TesteTefButton.jsx      ; ⚠️ temporário
│   └── ...
├── hooks/
│   └── usePermissoes.js        ; ✅ expõe 11 permissões de caixa (padrão: nega)
└── services/
    ├── pagamentoService.js     ; ✅ finalizarEEmitir com cpf_nfce
    ├── tefService.js           ; ✅ mostrarMensagemPinpad + centralizarPinpad + montarBoasVindas + cancelarVendasTef
    ├── caixaService.js         ; ✅ listar
    └── ...

4. O que está pronto/funcional

Fiscal — 100% EMITINDO EM HOMOLOGAÇÃO 🎉

    NFC-e com cliente cadastrado, CPF avulso e sem CPF: AUTORIZADA ✅

    cStat 598 (xNome homologação) — resolvido.

    cStat 215 (enderDest mal formado) — resolvido.

    Cancelamento, inutilização, contingência, rejeitadas, diagnóstico.

    <card> no XML via JOIN nfce_tef × vendas_tef.

TEF

    Crédito, Débito, PIX (simulação), Parcelado, Cancelamento (functionId 200 + CNC).

    Tela de resultado; cmds 21/22/23/29/42 tratados.

    Gravando em vendas_tef / vendas_tef_comprovante / nfce_tef.

PinPad Boas-Vindas (NOVO v29)

    ✅ No mount do Dashboard, envia "BEM-VINDO / <FANTASIA>" centralizado em 2 linhas de 16 chars.

    ✅ persistente='Y' — sobrevive à sessão e à transação.

    ✅ Bug do useEffect (faltavam imports tefService/api) — resolvido.

CPF na Nota — 100% FUNCIONAL 🎉

    ✅ CPF avulso: input com máscara + DV, envio via cpf_nfce.

    ✅ Cliente cadastrado: clienteTemDoc=S, persiste, xNome do cadastro.

    ✅ Backend valida: total ≥ 1000 sem CPF → erro.

Tela de Caixa (NOVO v29)

    ✅ CaixaPage.jsx com grid de movimentos do dia.

    ✅ Endpoint caixaListar (backend) — LEFT JOIN tab_formapagamento + INNER JOIN usuarios.

    ✅ Filtro por Caixa + Data.

    ✅ Rodapé com Qtde / Entradas / Saídas / Saldo.

    ✅ Botões de ação com gate de permissão (lancar/estornar/excluir/liberar/fechar/resumo).

    ✅ usePermissoes.js expandido — expõe 11 permissões de caixa (padrão: nega tudo se backend não mandar).

    ✅ Login retorna permissões de caixa via tab_modulos_perfil_acao.

    ✅ Layout full-width (compatível com NotasPage/HistoricoPage).

PIX QR Code

    ⏸ BLOQUEADO por homologação (simulação SiTef). Código preparado para produção (qrcode.react — opcional).

StrictMode

    ✅ Removido de main.jsx — resolveu duplicação de TefModal e 409 em finalizarVenda.

5. Decisões de arquitetura

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef. NOMES DIFERENTES.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Sem ON DUPLICATE em MySQL 4.1; SELECT+UPDATE/INSERT.

    CPF avulso NÃO persiste em banco — viaja só no payload do nfceEmitir.

    🔴 HOMOLOGAÇÃO: xNome destinatário = "NF-E EMITIDA EM AMBIENTE DE HOMOLOGACAO - SEM VALOR FISCAL". xProd = "NOTA FISCAL...". TEXTOs DIFERENTES.

    🔴 NFC-e sem cadastro: anular TODOS os 9 campos de endereço (incluindo dest_pais/dest_xPais).

    Cancelamento TEF preserva NSU original.

    catch (Throwable) obrigatório em prepararTudo/nfceEmitir.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 anti-duplicidade.

    MySQL 4.1 retorna string — sempre Number()/(int).

    🔴 SEM React.StrictMode no PDV.

    PinPad largura 16x2. mostrarMensagemPinpad idempotente.

    ARQUITETURA DE REDE: servidor backend/fiscal; terminais Electron + CliSiTef + impressora local.

    🔴 Permissões de caixa: negar por padrão no usePermissoes (segurança).

    Padrão de página: `dash-header` + `mesas-header-right` (importar RelogioHeader). Container full-width, sem max-width, sem padding — blocos internos carregam padding próprio.

6. Problemas atuais e pendências

🟡 Tela de Caixa — backend e frontend parcialmente prontos

    Backend falta:
      caixaResumo (Resumo por Forma de Pagamento — SELECT pendente)
      caixaSaldoAbertura (Saldo Abertura/Débito/Crédito/Atual — SELECT pendente)
      caixaLancar (novo lançamento manual)
      caixaEstornar
      caixaExcluir
      caixaLiberar
      caixaFechar (fechamento de caixa)

    Frontend falta:
      CaixaLancamentoModal.jsx
      CaixaFechamentoModal.jsx
      Painel lateral "Resumo por Forma de Pagamento"

    Precisa (envio pendente):
      SELECT do Resumo por Forma de Pagamento
      SELECT do Saldo de Abertura
      SHOW COLUMNS FROM caixa_movimento
      SHOW TABLES LIKE '%formapag%' (confirmar nome correto)

🟡 Pendências menores

    tefService.js — mostrarMensagemPinpad DUPLICADO (versões 40 e 80 chars). Apagar a antiga (40).

    tefService.js — montarParametrosCancelamento usa '001-000 = 884' hardcoded. Trocar por String(venda).

    NfceFiscal.php — aplicarCartaoEmFormapgto usa $t['forma_pgto'] (deveria ser forma_pagto) e catch(Exception).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    TefModal.jsx — captura defensiva QR Code em cmd===0 com /^000201/.

    TefModal.jsx — migrar para qrcode.react local (opcional).

🟢 Roadmap longo

    Empacotar Electron (main.js + preload + electron-builder + NSIS).

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

    CPF avulso em PRODUÇÃO: se bate com cadastro, usar razao do cliente.

    Tela de acompanhamento TEF.

7. Próximo passo exato

Prioridade 1 — Fechar tela de Caixa

    Enviar SELECT do Resumo por Forma de Pagamento + Saldo de Abertura + SHOW COLUMNS caixa_movimento.

    Backend: criar caixaResumo + caixaSaldoAbertura + caixaLancar + caixaEstornar + caixaExcluir + caixaFechar.

    Frontend: modais de lançamento e fechamento + painel lateral de resumo.

Prioridade 2 — Limpar duplicatas no tefService

    Apagar mostrarMensagemPinpad de 40 chars. Trocar '884' por String(venda) em montarParametrosCancelamento.

Prioridade 3 — Empacotar Electron

    Criar electron/main.js (com webContents.print()); ajustar vite.config.js (base: './'); configurar electron-builder; NSIS único.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo schema: terminino_vigencia_ncm_nbs_ibs_cbs.

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 cStat 598 = homologação com xNome destinatário diferente do padrão.

    🔴 cStat 215 = schema XML inválido (geralmente <enderDest> mal formado).

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

    ❗ React StrictMode NÃO funciona em PDV. Sempre remover.

    ❗ Não duplicar imports (Vite quebra: "already been declared").

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

    🔴 Centralização manual via padding.

PIX (homologação)

    🔴 MODO SIMULAÇÃO — não gera QR Code.

    🔴 QR Code só funciona em PRODUÇÃO.

Pegadinhas de schema

    🔴 vendas_tef: coluna forma_pagto.

    🔴 nfce_tef: coluna forma_pgto. NOMES DIFERENTES.

    🔴 vendas_tef_comprovante: coluna via_cliente (minúsculo).

    🔴 PK vendas_tef: (empresa, venda, parcela, codigo, ordem).

    🔴 tipo em vendas_tef é char(1), sempre '1'.

    🔴 clientes tem APENAS coluna cpf (armazena CPF 11 ou CNPJ 14).

    🔴 data_c/hora_c são varchar(15) — VB6 usa DD/MM/YYYY + HH:MM:SS.

    🔴 tab_modulos_perfil_acao rotinas caixa: caixamovimento, caixamovimento_novolacto, caixamovimento_estornarlacto, caixamovimento_excluirlacto, caixamovimento_liberar, caixamovimento_mostrarsaldos, caixamovimento_manutabertura, caixamovimento_manutcentrocusto, caixacadastroconta, caixaabertura, relcaixa.

Padrão de página (facilit)

    🔴 Header = <header className="dash-header"> + <div className="dash-header-left"> + <div className="mesas-header-right">.

    🔴 Importar RelogioHeader sempre que usar.

    🔴 Container = full-width (sem max-width, sem padding). Blocos internos carregam padding próprio.

    🔴 Botão voltar = mesas-header-back (padrão) ou notas-btn-voltar (NotasPage).

9. Instruções para a IA no novo chat

    NFC-e 100% EMITINDO em homologação — cliente cadastrado, CPF avulso, sem CPF. cStat 598 e 215 resolvidos.

    TEF gravando, cancelando, PinPad boas-vindas (2 linhas 16 chars).

    Tela de Caixa parcialmente pronta — falta resumo por forma, saldo abertura, modais.

    PIX QR Code bloqueado por homologação (simulação).

    StrictMode removido (crítico). Não reintroduzir.

    Ordem: (1) fechar tela de Caixa; (2) limpar duplicatas tefService; (3) empacotar Electron; (4) voucher.

    Pedir antes de codar: SELECTs do Caixa (Resumo por Forma, Saldo Abertura), SHOW COLUMNS FROM caixa_movimento.

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

    Verificar imports duplicados antes de salvar (.jsx).

    Manter português, respostas técnicas com código.

    Se precisar: pedir appController.php, NfceFiscal.php, NfceTransmissor.php, Vendas.php, TefModal.jsx, tefService.js, pagamentoService.js, FinalizarVendaModal.jsx, ClienteModal.jsx, DashboardPage.jsx, CaixaPage.jsx.

10. Histórico de correções acumuladas

v19-v28: ver documentos anteriores.

v29 (hoje):

    DashboardPage.jsx — useEffect PinPad boas-vindas (bug: faltavam imports tefService e api).

    tefService.js — mostrarMensagemPinpad + centralizarPinpad + montarBoasVindas (16 chars).

    main.jsx — REMOVIDO React.StrictMode (resolveu duplicação de TefModal e 409).

    NfceFiscal.php — criarDestinatario: em homologação força xNome padrão SEFAZ (resolve cStat 598); anula TODOS os 9 campos de endereço quando sem cadastro (resolve cStat 215).

    🎉 CPF na nota 100% funcionando (cliente cadastrado, CPF avulso, sem CPF).

    App.jsx — rota /caixa adicionada.

    DashboardPage.jsx — botão Caixa com gate de permissão.

    usePermissoes.js — expandido para 11 permissões de caixa (padrão: nega tudo).

    appController.php — login: mapa de permissões caixa (tab_modulos_perfil_acao).

    appController.php — caixaListar (LEFT JOIN tab_formapagamento + INNER JOIN usuarios).

    caixaService.js — listar.

    CaixaPage.jsx + CaixaPage.css — grid + filtros + rodapé + botões (padrão full-width).

    NotasPage.jsx — duplicata de import RelogioHeader corrigida.

    caixaService.js — backend pronto, falta resumo + saldo + modais.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: (1) fechar tela de Caixa (backend resumo/saldo + modais); (2) limpar duplicatas tefService; (3) empacotar Electron; (4) voucher. 🎯