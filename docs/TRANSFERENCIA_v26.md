📋 TRANSFERÊNCIA — Facilit NFC-e (v26)

Data: 08/Outubro/2026 (noite)
Status: 🎉 NFC-e 100% EMITINDO. TEF gravando e cancelando. CPF na nota: avulso OK, cliente cadastrado com 2 bugs pendentes. Decisão de arquitetura tomada: servidor só backend; cada terminal roda Electron + CliSiTef + impressora.

1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite + Electron, pasta D:\ANDROID\wds-pdv.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef integrado no PDV, com múltiplos terminais em rede.

ARQUITETURA DE REDE DEFINIDA (v26)

    Servidor centralizado (192.168.100.67): APENAS backend — PHP + MySQL 4.1 + TecnoSpeed + NfceTransmissor + jobs. SEM frontend, SEM PinPad, SEM impressora.

    Cada terminal: Electron com frontend buildado. Fala com backend via HTTP (https://192.168.100.67/app_mesas_api/) e com TEF via HTTPS local (https://127.0.0.1:8443). Imprime DANFCE localmente.

    CliSiTef: roda em CADA terminal (porta 8443 local). Cada terminal tem seu próprio PinPad físico. NÃO centraliza.

    Impressora: física por terminal. Impressão via webContents.print() do Electron (silenciosa), não via navegador.

    terminalId TEF: ÚNICO por terminal (não pode repetir 00000065 em todos). Guardar em localStorage ou em param_tef indexado por IP/máquina.

    Instalação nos terminais: criar instalador único (NSIS) que empacota Electron + frontend + CliSiTef + config (IP do servidor). Técnico roda 1 .exe por terminal.

    Motivo: CliSiTef precisa acessar PinPad via USB/serial local; impressora é física local. Backend/fiscal podem centralizar; físico não.

2. Stack / ferramentas

Backend

    PHP 7.1.9 (sem fn(), typed properties, trailing comma).

    Apache 2.4.27 / XAMPP (LocalSystem).

    MySQL 4.1 (charset latin1).

    TecnoSpeed v6.0 via COM. ProgID: NFCex.spdNFCeX.

    Timezone: America/Cuiaba (UTC-4).

    Log: C:\xampp\php\logs\php_error_log. Log fiscal: app_mesas_api\logs\nfce_fiscal.log.

Frontend / Terminal

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Electron (main process) + electron-builder para empacotar.

    Pasta: D:\ANDROID\wds-pdv.

    Dev server: http://192.168.100.67:3000.

TEF — Agente CliSiTef (em cada terminal)

    Porta 8443 (Apache ficou na 443).

    URL base: https://127.0.0.1:8443/agente/clisitef.

    Versão: 1.0.0.16.r1. serviceState: 1 = pronto.

    Certificado self-signed expirado — aceitar 1x no navegador de cada terminal.

    Instalação: C:\AgenteClisitef\ | Logs: C:\AgenteClisitef\logs\.

    Endpoints: /state, /session, /startTransaction, /continueTransaction, /finishTransaction, /getVersion, /pinpad/*.

Credenciais SiTef

    IP: 177.72.161.156 | Porta: 4096

    Loja: 00000000 | Terminal: único por máquina (não fixar 00000065 em todos)

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

Backend — C:\xampp\htdocs\app_mesas_api\ (SERVIDOR)
text

models/NfceFiscal.php         ; ✅ criarEmitente + criarDestinatario + sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente + blocoFormasPagamento
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ finalizarVenda + nfceEmitir (cpf_nfce) + gravarVendasTef + gravarVendasTefComprovante + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\ (CADA TERMINAL)
text

src/
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ TEF + cancelamento TEF + input CPF avulso
│   ├── MesaDetalhesModal2.jsx
│   ├── ClienteModal.jsx        ; ⚠️ verificar se devolve `codigo` e `cpf`
│   ├── TefModal.jsx            ; ✅ modo 'venda' | 'cancelar'
│   ├── TesteTefButton.jsx      ; ⚠️ temporário — remover
│   └── ...
└── services/
    ├── pagamentoService.js     ; ✅ finalizarEEmitir com cpf_nfce
    ├── tefService.js           ; ✅ {4:3, 5:2, 6:5, 117:122} + montarParametrosCancelamento + cancelarVendasTef
    └── ...

electron/
├── main.js                     ; ⏳ a criar — processo principal
└── preload.js                  ; ⏳ a criar — bridge segura

4. O que está pronto/funcional

Fiscal

    Endpoints ativos, cancelamento, inutilização, contingência, rejeitadas, diagnóstico.

    Cancelar mesa com estorno de estoque; preço editável se produtos.vista = 0.

    NFC-e EMITINDO com sucesso. cStat 391 resolvido. <card> no XML via JOIN nfce_tef × vendas_tef.

TEF

    Crédito (menu 3 opções), Débito (auto à vista), PIX (QR), Parcelado (prompt SiTef).

    Tela de resultado; cmds 21/22/23/29/42 tratados; finishTransaction OK.

    Cancelamento pós-aprovação via functionId=200 + ParamAdic CNC. ✅ Funcionando.

Gravação TEF

    vendas_tef / vendas_tef_comprovante — gravando (PK 5 colunas, sem ON DUPLICATE).

    tipo = '1'; PIX normalizado (10→17).

    nfce_tef — gravando com forma_pgto.

    cancelarVendasTef — backend marca cancelado=1; retorna 409 se rowCount=0.

CPF na Nota

    ✅ CPF avulso: input no FinalizarVendaModal com máscara + DV; envio via cpf_nfce.

    ✅ Backend valida: total ≥ 1000 sem CPF → erro antes de gravar.

    ✅ criarDestinatario prioriza cliente cadastrado → CPF avulso → sem <dest>.

    ✅ Testes 1500 (s/ CPF) e 1501 (com CPF avulso) emitiram OK.

    ⚠️ Teste 1502 — cliente cadastrado NÃO persistiu em vendas.cliente (clienteTemDoc=N).

    ⚠️ carregarCliente referencia c.cnpj — coluna não existe em clientes (só cpf).

5. Decisões de arquitetura

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef. NOMES DIFERENTES.

    🔴 vendas_tef.tipo = char(1), sempre '1'.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    codigo em vendas_tef = string da venda (não NSU).

    Sem ON DUPLICATE em MySQL 4.1; usar SELECT+UPDATE/INSERT.

    CPF avulso NÃO persiste em banco — viaja só no payload do nfceEmitir.

    Validação CPF: front (máscara + DV) + backend (total ≥ 1000 sem CPF → erro).

    Cliente com cpf (11) → CPF; com cpf (14) → CNPJ. Normalizar no carregarCliente (schema só tem cpf).

    Cancelamento TEF preserva NSU original (diverge do VB6, que sobrescreve).

    data_c/hora_c em vendas_tef: DD/MM/YYYY + HH:MM:SS (VB6 legado).

    catch (Throwable) obrigatório em prepararTudo/nfceEmitir — nunca Exception sozinho.

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 anti-duplicidade.

    MySQL 4.1 retorna string — sempre Number()/(int).

    ARQUITETURA DE REDE (v26): servidor centraliza backend/fiscal; terminais rodam Electron + CliSiTef + impressora local. TEF NÃO centraliza.

6. Problemas atuais e pendências

🎯 PRÓXIMA TAREFA 1 — Finalizar CPF na nota (2 bugs)

Bug 1 — cliente cadastrado não persiste em vendas.cliente

    Sintoma: venda 1502 salvou cliente=1 apesar de cliente selecionado.

    Diagnóstico pendente:
      SELECT venda, cliente, total, status FROM vendas WHERE empresa=1 AND venda=1502;
      SHOW COLUMNS FROM clientes;
      F12 → Network → finalizarVenda → Payload → campo cliente;
      console.log em handleSelecionarCliente (ver objeto).

Bug 2 — carregarCliente referencia c.cnpj inexistente

    Schema de clientes só tem coluna cpf.

    Fix A preparado: substituir método por versão que só lê cpf e normaliza:
    $doc = $this->soNumeros($row['cpf'] ?? '');
    $row['cpf']  = (strlen($doc) === 11) ? $doc : '';
    $row['cnpj'] = (strlen($doc) === 14) ? $doc : '';

🎯 PRÓXIMA TAREFA 2 — Empacotar Electron para rede

    Criar electron/main.js com webContents.print() para impressão silenciosa.

    Ajustar vite.config.js: base: './'.

    Configurar electron-builder no package.json (target nsis + portable).

    Instalador único: Electron + frontend + CliSiTef + config (IP do servidor).

    Cada terminal recebe terminalId TEF único (localStorage ou param_tef por IP).

🟡 Pendências menores

    aplicarCartaoEmFormapgto (NfceFiscal.php) — ainda usa $t['forma_pgto'] (deveria ser forma_pagto) e catch(Exception).

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção.

    Task Scheduler em andamento.

    Tela de acompanhamento TEF.

🟢 Roadmap longo

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Electron + IPC.

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

7. Próximo passo exato

Prioridade 1 — Corrigir carregarCliente

    Substituir método em NfceFiscal.php: remover c.cnpj do SELECT; normalizar cpf por tamanho.

Prioridade 2 — Diagnosticar persistência de cliente (venda 1502)

    Rodar queries + verificar payload F12 + verificar objeto no console do React.

Prioridade 3 — Empacotar Electron

    Criar electron/main.js (com webContents.print()); ajustar vite.config.js; configurar electron-builder.

    Instalador NSIS que empacota Electron + CliSiTef + config.

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

    🔴 nfce_totais_formapgto NÃO tem colunas de card — <card> vem do JOIN.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable), sem sintaxe moderna.

    MySQL 4.1 — sem CTE, sem window functions, sem ON DUPLICATE em prepared.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna string — sempre Number().

    Nunca concatenar PDOStatement em log.

    ❗ PHP 7: Error NÃO é capturado por catch(Exception). Sempre Throwable.

TEF

    🔴 Agente na porta 8443 (não 443); cert self-signed; terminalId único por máquina.

    🔴 React.StrictMode executa useEffect 2× — useRef guard.

    🔴 1ª conexão SiTef baixa tabelas — 1-5 min.

    🔴 FORMAS_TEF = ERP codes (4/5/117), NÃO functionIds.

    🔴 TefModal como sibling do fv-overlay.

    🔴 Comandos 21=menu; 23=cancelar durante laço; 29=coleta direta; 30-38=prompt.

    🔴 functionIds: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento.

    🔴 Cancelamento pós-finishTransaction só via 200 + string CNC.

    🔴 finishTransaction({confirm:0}) só funciona DURANTE o laço.

    🔴 Campo 546 = Tipo Voucher.

Arquitetura de rede (NOVO v26)

    🔴 CliSiTef NÃO centraliza — precisa acessar PinPad local (USB/serial).

    🔴 Impressora é física local — imprimir pelo Electron do terminal, não pelo servidor.

    🔴 terminalId TEF precisa ser único por terminal (não repetir 00000065).

    🔴 Servidor centraliza só backend/fiscal. Nada de frontend, PinPad ou impressora.

    🔴 Firewall do Windows precisa liberar porta 3000 (ou a que usar) para HTTP.

    🔴 Cada terminal aceita o cert self-signed do CliSiTef 1x (não é automático).

    🔴 Não usar window.print() do navegador para cupom térmico — usar webContents.print() do Electron.

Pegadinhas de schema

    🔴 vendas_tef: coluna forma_pagto.

    🔴 nfce_tef: coluna forma_pgto. NOMES DIFERENTES.

    🔴 vendas_tef_comprovante: coluna via_cliente (minúsculo).

    🔴 PK vendas_tef tem 5 colunas: empresa, venda, parcela, codigo, ordem.

    🔴 tipo em vendas_tef é char(1), sempre '1'.

    🔴 clientes tem APENAS coluna cpf (armazena CPF 11 ou CNPJ 14, controlado por tipo).

    🔴 data_c/hora_c são varchar(15) — VB6 usa DD/MM/YYYY + HH:MM:SS.

9. Instruções para a IA no novo chat

    NFC-e e TEF 100% funcionais. CPF avulso OK; cliente cadastrado com 2 bugs (persistência + carregarCliente com cnpj inexistente).

    Arquitetura de rede definida (v26): servidor só backend; cada terminal roda Electron + CliSiTef + impressora.

    Ordem de trabalho: (1) Fix carregarCliente; (2) diagnosticar venda 1502; (3) empacotar Electron.

    Pedir antes de codar: SHOW COLUMNS FROM clientes; SELECT da venda 1502; Payload do finalizarVenda; objeto cliente no console do React.

    Não refatorar classes validadas (NfceFiscal exceto carregarCliente, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

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

    Se precisar: pedir appController.php, NfceFiscal.php, NfceTransmissor.php, Vendas.php, TefModal.jsx, tefService.js, pagamentoService.js, FinalizarVendaModal.jsx, ClienteModal.jsx.

10. Histórico de correções acumuladas

v19-v21: ver documentos anteriores.

v22: gravarVendasTef (PK 5 colunas, tipo='1', PIX 10→17); sincronizarTefParaNfce.

v23: blocoFormasPagamento com <card> via JOIN; buscarCartaoTef(); cnpjEmitente(). NFC-e emitindo.

v24: cancelamento TEF via functionId=200; TefModal modo='cancelar'; montarParametrosCancelamento (CNC); cancelarVendasTef.

v25:

    Input CPF avulso no FinalizarVendaModal (máscara + DV).

    pagamentoService.js — finalizarEEmitir propaga cpf_nfce.

    appController.php — nfceEmitir lê cpf_nfce.

    NfceFiscal.php — prepararTudo recebe cpfNfceAvulso; valida total ≥ 1000; criarDestinatario prioriza cliente → CPF avulso.

    Restaurado criarEmitente (sumiu em substituição anterior).

    catch (Throwable) aplicado em prepararTudo e nfceEmitir.

    🎉 NFC-e emitindo com sucesso nos testes 1500, 1501 e 1502.

    Pendência: carregarCliente referencia c.cnpj inexistente; cliente não persistiu em vendas.cliente.

v26 (hoje):

    Decisão de arquitetura de rede: servidor centraliza backend/fiscal; cada terminal roda Electron + CliSiTef + impressora local.

    Confirmado que CliSiTef NÃO pode centralizar (PinPad é físico local).

    Confirmado que impressão precisa ser local via Electron (webContents.print()).

    terminalId TEF único por terminal (não repetir 00000065).

    Instalador único NSIS planejado: Electron + frontend + CliSiTef + config.

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: corrigir carregarCliente (só cpf) e diagnosticar venda 1502. Depois empacotar Electron. Depois voucher. 🎯