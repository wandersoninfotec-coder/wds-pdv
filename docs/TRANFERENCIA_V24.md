📋 TRANSFERÊNCIA — Facilit NFC-e (v24)

Data: 08/Outubro/2026 (manhã)
Status: 🎉 NFC-e 100% EMITINDO em homologação. TEF gravando em vendas_tef/vendas_tef_comprovante, sincronizando em nfce_tef, <card> saindo no XML. CANCELAMENTO TEF funcionando (função 200, string CNC). cStat 391 resolvido na v23. Próxima tarefa: CPF do cliente (obrigatório > R$ 1000).

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

    Endpoints disponíveis: /state, /session, /startTransaction, /continueTransaction, /finishTransaction, /getVersion, /pinpad/*.

    NÃO existe endpoint /cancelTransaction. Cancelamento entra via startTransaction com functionId=200 + ParamAdic CNC.

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

models/NfceFiscal.php         ; ✅ sincronizarTefParaNfce + buscarCartaoTef + cnpjEmitente + blocoFormasPagamento (JOIN para <card>)
models/NfceGeradorTxt.php     ; ✅
models/NfceTransmissor.php    ; ✅
models/Vendas.php             ; ✅ + estornarEstoqueVenda
models/Produto.php            ; ✅
controllers/appController.php ; ✅ gravarVendasTef + gravarVendasTefComprovante + limparComprovante + cancelarVendasTef

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── components/
│   ├── FinalizarVendaModal.jsx ; ✅ INTEGRADO COM TEF + cancelamento TEF
│   ├── MesaDetalhesModal2.jsx
│   ├── TefModal.jsx           ; ✅ modo 'venda' | 'cancelar', cmd 21/29, filtro por forma
│   ├── TesteTefButton.jsx     ; ⚠️ temporário — remover depois
│   └── ...
└── services/
    ├── tefService.js          ; ✅ {4:3, 5:2, 6:5, 117:122} + montarParametrosCancelamento + cancelarVendasTef
    └── ...

4. O que está pronto/funcional

Fiscal (100%)

    Endpoints ativos, cancelamento, inutilização, contingência, rejeitadas, diagnóstico.

    Cancelar mesa com estorno de estoque.

    Preço editável se produtos.vista = 0.

    NFC-e EMITINDO com sucesso. cStat 391 resolvido.

TEF — FLUXO COMPLETO VALIDADO 🎉

    Crédito → menu com 3 opções (À Vista / Parcelado Estab / Parcelado Adm) ✅

    Débito → sem menu, auto-seleciona à vista ✅

    PIX → QR Code ✅

    Parcelado → prompt do SiTef + dica "Digite o número de parcelas" ✅

    Tela de resultado → sucesso (verde, com NSU/autorização) ou erro (vermelho) ✅

    Comando 29 (coleta direta) tratado ✅

    Comando 21 (menu) renderizado como botões ✅

    finishTransaction chamado corretamente ✅

CANCELAMENTO TEF — NOVO v24 🎉

    TefModal ganha prop modo='venda' | 'cancelar'.

    modo='cancelar' → functionId=200 + trnAdditionalParameters com string CNC.

    String CNC (montarParametrosCancelamento): campos 000=CNC, 001=venda, 003=valor centavos, 004=0, 010=forma, 012=NSU original, 022=data DDMMAAAA, 023=hora HHMMSS, 999-999=0. Separador \r\n.

    Backend: cancelarVendasTef marca cancelado=1 (preserva NSU original para auditoria — diverge do VB6, que substitui NSU/codigo/codigo_transacao).

    Frontend: botão ✕ em pagamento TEF abre TefModal em modo cancelamento. Só remove do estado se TEF aprovar.

    Retorna 409 se nenhuma linha afetada (evita falso-positivo).

    Testado e funcionando.

Gravação TEF

    gravarVendasTef → INSERT/UPDATE explícito com PK de 5 colunas. Sem ON DUPLICATE.

    gravarVendasTefComprovante → via_cliente (minúsculo).

    vendas_tef.tipo = sempre '1' (não C/D).

    PIX normalizado: se forma_pgto=10, vira 17 (com ===).

nfce_tef + <card>

    sincronizarTefParaNfce → coluna forma_pgto em nfce_tef.

    blocoFormasPagamento → <card> via JOIN nfce_tef × vendas_tef.

    buscarCartaoTef() → helper do JOIN.

    cnpjEmitente() → só dígitos.

    NT 2024.001: CNPJReceb_YA07a + idTermPag_YA07b (>= 01/07/2024).

5. Decisões de arquitetura

    TefModal grava em vendas_tef/vendas_tef_comprovante.

    NfceFiscal lê vendas_tef → escreve nfce_tef → JOIN para <card> no XML.

    🔴 Coluna é forma_pagto em vendas_tef; forma_pgto em nfce_tef. NOMES DIFERENTES.

    vendas_tef.tipo = char(1), sempre '1'.

    vendas_tef.codigo = substr(NSU, 0, 20) (fallback uniqid). nfce_tef.codigo espelha.

    PK vendas_tef = (empresa, venda, parcela, codigo, ordem).

    Formas TEF ERP: 4=Crédito, 5=Débito, 6=Benefício (voucher, pendente), 117=PIX.

    functionIds SiTef: 2=Débito, 3=Crédito, 5=Benefício, 122=PIX, 200=Cancelamento Normal.

    Sem ON DUPLICATE KEY UPDATE (MySQL 4.1 não suporta em prepared).

    Sem <?xml?> antes de assinar. vendas.numero_nfe = 0 anti-duplicidade.

    MySQL 4.1 retorna tudo como string — sempre Number() / (int).

    catch (Throwable $t) sempre; inTransaction() antes de rollBack().

    Nunca concatenar PDOStatement em log.

    Cancelamento TEF: preserva NSU original (diverge do VB6, que sobrescreve) para auditoria. Fiscalmente equivalente — o filtro cancelado=0 já exclui do XML.

    Cancelamento TEF: NÃO altera vendas_tef_comprovante (mantém via_* original).

    data_c/hora_c em vendas_tef: mantido DD/MM/YYYY + HH:MM:SS (consistente com VB6 legado; conversão feita em montarParametrosCancelamento via strip não-dígitos).

6. Problemas atuais e pendências

🎯 PRÓXIMA TAREFA — CPF do cliente (obrigatório > R$ 1000)

Regra fiscal (NT 2024.001, vigente 01/07/2024): CPF opcional em NFC-e em geral, obrigatório quando vPag > R$ 1.000.

Estado atual do frontend: FinalizarVendaModal já tem:

    const LIMITE_CPF_OBRIGATORIO = 1000.0;

    const precisaCpf = deCentavos(totalFinalCent) > LIMITE_CPF_OBRIGATORIO && (!cliente?.cpf || cliente.codigo === 1);

    Aviso amarelo .fv-aviso-cpf quando precisaCpf.

    Bloqueio em handleFinalizar quando precisaCpf.

    Botão "Trocar" abre ClienteModal para selecionar cliente.

Falta:

    Fluxo de informar CPF SEM cadastrar cliente completo (hoje só via ClienteModal).

    Máscara ###.###.###-## + validação de dígito verificador no front.

    Envio do CPF no payload finalizarEEmitir.

    Backend: criarDestinatario em NfceFiscal.php precisa ler o CPF e montar <dest><CPF>...</CPF><xNome>...</xNome><indIEDest>9</indIEDest></dest> em vez de "Consumidor Final (não gera registro)".

    Validação server-side: rejeitar se total > 1000 e CPF vazio.

    Coluna onde gravar: provavelmente vendas.cpf ou vendas.cpf_cnpj (CONFIRMAR SHOW COLUMNS).

    Se cliente já tem CPF cadastrado (via ClienteModal), usar esse automaticamente.

🟡 Pendências menores

    aplicarCartaoEmFormapgto (NfceFiscal.php) — ainda usa $t['forma_pgto'] (deveria ser forma_pagto) e catch(Exception). Early-returna, não bloqueia.

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção.

    Task Scheduler em andamento.

    Tela de acompanhamento TEF (dentro do sistema) — mencionada, ainda não iniciada.

🟢 Roadmap longo

    Voucher (Cartão Alimentação/Refeição) — functionId 5, tPag 10/11, campo 546.

    E-mail (PHPMailer + XML + PDF).

    Empacotar Electron + IPC.

    Fix do vendedor (codigoFuncionario).

    {TipoDocFiscal=1;} em ParamAdic (produção).

7. Próximo passo exato

CPF do cliente — plano de implementação (aguardando arquivos)

    Frontend (FinalizarVendaModal.jsx):

        Adicionar input de CPF (opcional <= R$ 1000, obrigatório > R$ 1000).

        Máscara + validação de dígito verificador.

        Enviar cliente_cpf no payload de finalizarEEmitir.

    Backend (NfceFiscal.php):

        criarDestinatario lê CPF (se válido) e monta <dest> em vez de consumidor final sem registro.

        Validar: total > 1000 e CPF vazio → erro antes de transmitir.

    Schema: confirmar com SHOW COLUMNS FROM vendas e SHOW COLUMNS FROM nfce_dest.

Arquivos necessários para a IA:

    FinalizarVendaModal.jsx (trecho render + handleFinalizar + state cliente).

    NfceFiscal.php (método criarDestinatario + buscarVenda).

    SHOW COLUMNS FROM vendas.

    SHOW COLUMNS FROM clientes.

    Função VB6 equivalente (fBuscarDestinatarioNFCe ou similar) — se existir.

8. Pegadinhas e decisões não óbvias

Fiscal

    🔴 Case PDO: pibsuf/pibsmun (minúsculo), vIBSUF (maiúsculo).

    🔴 Typo schema: terminino_vigencia_ncm_nbs_ibs_cbs.

    🔴 cStat real em <retEvento>/<retInutNFe>.

    🔴 cStat 241 e 563 = sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 $custo_movimentado fora do if/else.

    🔴 Estorno estoque antes de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 — anti-duplicidade.

    🔴 nfce_totais_formapgto NÃO tem colunas de card — <card> vem do JOIN.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    MySQL 4.1 — sem CTE, sem window functions, sem ON DUPLICATE em prepared.

    coluna = coluna em JOIN.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 via PDO retorna string — sempre Number().

    Nunca concatenar PDOStatement em log.

TEF

    🔴 Agente na porta 8443 (não 443).

    🔴 Certificado self-signed expirado — curl.exe -k ou aceitar 1x.

    🔴 terminalId = 00000065.

    🔴 React.StrictMode executa useEffect 2x — useRef guard.

    🔴 1ª conexão do SiTef baixa tabelas — 1-5 min.

    🔴 FORMAS_TEF = ERP codes (4/5/117), NÃO functionIds.

    🔴 TefModal como sibling do fv-overlay.

    🔴 Comando 21 = MENU; 23 = cancelar durante o laço; 29 = coleta direta; 30-38 = prompt.

    🔴 functionIds: 2=Débito, 3=Crédito, 5=Cartão Benefício, 122=PIX, 200=Cancelamento.

    🔴 Cancelamento pós-finishTransaction só via functionId=200 + string CNC (não existe 'rollback' local).

    🔴 finishTransaction({confirm:0}) só funciona DURANTE o laço (antes do confirm=1).

    🔴 Campo 546 = Tipo Voucher (Alimentação/Refeição) — usar para tPag SEFAZ.

    🔴 Firefox 118+ avisa "acesso à rede local" — ignorar.

Pegadinhas de schema

    🔴 vendas_tef: coluna é forma_pagto.

    🔴 nfce_tef: coluna é forma_pgto. NOMES DIFERENTES.

    🔴 vendas_tef_comprovante: coluna é via_cliente (minúsculo).

    🔴 PK vendas_tef tem 5 colunas: empresa, venda, parcela, codigo, ordem.

    🔴 tipo em vendas_tef é char(1), sempre '1'.

    🔴 data_c/hora_c são varchar(15) — aceita qualquer formato, mas VB6 usa DD/MM/YYYY + HH:MM:SS.

9. Instruções para a IA no novo chat

    TEF e NFC-e 100% funcionais em homologação — Crédito, Débito, PIX e CANCELAMENTO validados, nota emitida.

    Próxima tarefa: CPF do cliente (obrigatório > R$ 1000).

    Pedir antes de codar: FinalizarVendaModal.jsx, NfceFiscal.php (criarDestinatario + buscarVenda), SHOW COLUMNS FROM vendas, SHOW COLUMNS FROM clientes, e se houver, a função VB6 equivalente.

    Não refatorar classes validadas (NfceFiscal, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Sempre SHOW COLUMNS antes de usar colunas desconhecidas.

    Sempre catch (Throwable $t) + inTransaction() antes de rollBack().

    Sempre sanitizarTexto() em justificativas.

    Sempre tratar cStat 241 e 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente.

    Sempre Number() ao comparar códigos MySQL via PDO.

    Nunca concatenar PDOStatement em log.

    Manter português, respostas técnicas com código.

    Se precisar: pedir appController.php, NfceTransmissor.php, Vendas.php, TefModal.jsx, tefService.js, NfceFiscal.php.

10. Histórico de correções acumuladas

v19–v21: ver documentos anteriores.

v22:

    appController.php — gravarVendasTef (PK 5 colunas, sem ON DUPLICATE, tipo='1', PIX 10→17).

    NfceFiscal.php — sincronizarTefParaNfce (forma_pagto, Throwable).

    Descoberta: erro 500 era PK de 5 colunas + coluna forma_pagto.

v23:

    NfceFiscal.php — blocoFormasPagamento reescrito: <card> via JOIN nfce_tef × vendas_tef.

    NfceFiscal.php — buscarCartaoTef(), cnpjEmitente().

    🎉 NFC-e EMITINDO. cStat 391 resolvido.

v24 (hoje):

    TefModal.jsx — prop modo='venda'|'cancelar'; iniciar() ramifica por modo; título dinâmico.

    tefService.js — montarParametrosCancelamento() (string CNC) + cancelarVendasTef().

    appController.php — cancelarVendasTef(): UPDATE cancelado=1, retorna 409 se rowCount=0.

    FinalizarVendaModal.jsx — state tefCancelando; botão ✕ abre TefModal em modo cancelamento; só remove do estado se TEF aprovar.

    Cancelamento TEF funcionando com functionId=200. Testado.

    Decisão: preservar NSU original no cancelamento (diverge do VB6) para auditoria.

    Decisão: manter data_c/hora_c em DD/MM/YYYY + HH:MM:SS (consistente com legado).

Fim do documento.
Contador resetado: mensagem 1 de 15.
Próximo resumo na 15ª mensagem.

Ao abrir o novo chat: atacar CPF do cliente (obrigatório > R$ 1000). 🎯