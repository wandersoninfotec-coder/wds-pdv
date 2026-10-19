📋 RESUMO DE TRANSFERÊNCIA — Facilit NFC-e (v18)

Data: 06/Outubro/2026
Status: Sistema fiscal completo + TEF funcional em homologação. Integração no FinalizarVendaModal aplicada. Pendência ativa: menu intermediário do SiTef pedindo tipo de cartão em Crédito/Débito.
1. Projeto e objetivo final

    ERP legado: VB6 + MySQL 4.1 (WDS Comercial, banco controlfacil).

    Serviço PHP intermediário: app_mesas_api (PHP 7.1.9).

    Facilit App: React Native/Expo — pronto.

    Facilit (PDV desktop): React + Vite, pasta D:\ANDROID\wds-pdv — sem Electron ainda.

    ERP 2.0: futuro.

    Objetivo: emitir NFC-e (modelo 65) via TecnoSpeed v6.0 (COM) + TEF CliSiTef integrado no PDV.

2. Stack / ferramentas

Backend

    PHP 7.1.9 (sem fn(), typed properties, trailing comma).

    Apache 2.4.27 Win32 / XAMPP (roda como LocalSystem).

    MySQL 4.1 legado (charset latin1).

    Componente TecnoSpeed v6.0 via COM. ProgID: NFCex.spdNFCeX (com e minúsculo).

    php_com_dotnet habilitado.

    Timezone: America/Cuiaba (UTC-4).

    Log PHP: C:\xampp\php\logs\php_error_log.

Frontend

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Pasta: D:\ANDROID\wds-pdv.

TEF — Agente CliSiTef

    Porta 8443 (Apache ficou na 443).

    URL base: https://127.0.0.1:8443/agente/clisitef.

    Versão: 1.0.0.16.r1. serviceState: 1 = pronto.

    Certificado self-signed expirado (2019) — aceitar 1x no navegador.

    Debug: curl.exe -k "https://127.0.0.1:8443/agente/clisitef/state".

    Instalação: C:\AgenteClisitef\ | Logs: C:\AgenteClisitef\logs\.

Credenciais SiTef

    IP: 177.72.161.156 | Porta: 4096

    Loja: 00000000 | Terminal: 00000065 ← CRÍTICO

    CNPJ adquirente: 01425787000104

Credenciais NFC-e

    Software House: CNPJ 14234584000174, token 6f8547fdd9dff39473e2cb42a7568907

    Emitente: CNPJ 58717761000149, UF MT, Ambiente=2 (homologação)

Pastas TecnoSpeed

    C:\WDS Comercial\Templates\vm60\, Esquemas\vm60\

    nfceServidoresHom.ini, nfceServidoresProd.ini

    C:\WDS Comercial\certificado\cliente.pfx (senha: 123)

    Gerados: C:\WDS Comercial\NFCeGerada\ano\mes\dia\

    Logs dos jobs: C:\WDS Comercial\NFCeGerada\Log\

3. Estrutura de arquivos

Backend — C:\xampp\htdocs\app_mesas_api\
text

app_mesas_api/
├── controllers/appController.php
├── core/Core.php
├── models/
│   ├── NfceFiscal.php          ; ✅ ATUALIZADO nesta sessão (sincronizarTefParaNfce + aplicarCartaoEmFormapgto)
│   ├── NfceGeradorTxt.php      ; ✅
│   ├── NfceTransmissor.php     ; ✅
│   ├── Vendas.php              ; ✅ + estornarEstoqueVenda
│   └── Produto.php             ; ✅
└── logs/nfce_fiscal.log

Frontend — D:\ANDROID\wds-pdv\
text

src/
├── App.jsx                     ; rotas /notas, /diagnostico, /jobs
├── pages/{Dashboard,Notas,Diagnostico,Jobs}Page.jsx
├── components/
│   ├── AlertaContingencia.jsx/.css
│   ├── MesaDetalhesModal2.jsx/.css
│   ├── FinalizarVendaModal.jsx ; ✅ INTEGRADO COM TEF nesta sessão
│   ├── SuccessModal.jsx/.css
│   ├── BotaoImprimirCupom.jsx
│   ├── NotaDetalhesModal.jsx/.css
│   ├── CancelarNotaModal.jsx/.css
│   ├── InutilizarModal.jsx/.css
│   ├── TefModal.jsx/.css       ; ✅ FUNCIONANDO
│   └── TesteTefButton.jsx      ; ⚠️ temporário — remover após validar
└── services/
    ├── pagamentoService.js
    ├── impressaoService.js
    ├── notaService.js
    ├── diagnosticoService.js
    ├── pedidoService.js
    ├── jobService.js
    └── tefService.js           ; ✅ duplicata de formaParaFunctionId REMOVIDA

4. O que já está pronto/funcional

Fiscal (100%)

    Endpoints ativos: finalizarVenda, nfcePreparar, nfceEmitir, nfceStatusSefaz, nfceReprocessarContingencia, nfceDadosImpressao, nfceListar, nfceCancelar, nfceInutilizar, nfceDiagnostico, diagnosticoProdutos, nfceReprocessarRejeitadas, jobStatus, vendaCancelar.

    Dashboard → Notas Fiscais / Diagnóstico / Automações.

    AlertaContingencia no topo do PDV.

    Cancelar mesa com estorno de estoque.

    Preço editável se produtos.vista = 0.

TEF (fluxo validado end-to-end)

    Agente HTTP local (8443) ✅ | Conexão SiTef ✅ | startTransaction → clisitefStatus: 10000 ✅

    continueTransaction loop de comandos ✅ | PinPad lendo chip ✅ | Autorização ✅ (Transação Simulada Aprovada).

    Endpoints: POST /app/verificarTef, /app/tefParametros, /app/gravarVendasTef, /app/gravarVendasTefComprovante.

    helper limparComprovante() (espelha fRetCaracteresComprovante VB6).

Integração no FinalizarVendaModal (APLICADA nesta sessão)

    TefModal abre automaticamente para formas ERP 4/5/117 quando usa_tef.

    Multi-cartão com ordemTef incremental.

    TefModal grava em vendas_tef/vendas_tef_comprovante no sucesso.

    pagamentos[] guarda tef: dadosTef e ordem.

    Pagamento TEF não pode ser removido do array (bloqueio).

NfceFiscal.php (ATUALIZADO nesta sessão)

    Novo método sincronizarTefParaNfce($empresa, $numeroNfce, $venda) chamado logo após criarFormasPagamento().

    Lê vendas_tef (não cancelados) e faz INSERT em nfce_tef.

    Método auxiliar colunasExistentes() faz SHOW COLUMNS para não quebrar em schema incompleto.

5. Decisões de arquitetura/design já tomadas

    TefModal é quem grava em vendas_tef — FinalizarVendaModal só passa venda e ordem como props.

    NfceFiscal lê vendas_tef → escreve nfce_tef (não o contrário).

    Formas TEF no ERP: 4 = Crédito, 5 = Débito, 117 = PIX.

    Forma gravada em vendas_tef.forma_pgto é o código tPag SEFAZ (3, 4, 17), não o ERP (4, 5, 117). Conversão feita no TefModal via FORMA_TELA_PARA_BD.

    ordem em vendas_tef = sequencial do cartão (multi-cartão).

    Sem <?xml?> antes de assinar no NfceTransmissor.

    vendas.numero_nfe = 0 como anti-duplicidade NFC-e/NF-e.

6. Problemas atuais e pendências
🔴 ATIVO — Menu intermediário do SiTef pedindo tipo de cartão

    Sintoma: em Crédito/Débito, após passar o cartão, abre caixinha "digite o tipo de cartão" (1/2/3...). Usuário digita 1 e prossegue.

    Causa suspeita (não confirmada): formaParaFunctionId no tefService.js está com mapeamento possivelmente invertido:

        Atual: {4: 2, 5: 3, 117: 122}

        Hipótese: correto seria {4: 3, 5: 2, 117: 122} (Função 3 = Crédito, Função 2 = Débito na documentação oficial CliSiTef).

        NÃO APLICAR AINDA — usuário quer discutir antes.

    Alternativa considerada: restringir menu via trnAdditionalParameters (ex: [16;] bloqueia Débito à Vista).

    Retomar discussão: validar códigos de functionId na especificação técnica CliSiTef v1.09 antes de alterar.

🟡 Pendências menores

    Verificar resultado final dos INSERT em nfce_tef (schema confirmado: empresa, nfce, codigo, forma_pgto, credenciadora, bandeira_cartao, codigo_transacao, valor, troco, tipo).

    Teste end-to-end de venda real com Crédito → confirmar que NFC-e não retorna cStat 391.

    Remover TesteTefButton.jsx + chamada no DashboardPage.jsx.

    Rotina de configuração para produção (setup clientes).

    Task Scheduler em andamento.

🟢 Roadmap longo

    E-mail (PHPMailer + XML + PDF).

    Empacotar Electron + IPC.

    Fix do vendedor (codigoFuncionario).

7. Próximo passo exato

Discutir o problema do menu SiTef — retomar a partir daqui. Antes de qualquer alteração de código:

    Confirmar na especificação técnica CliSiTef v1.09 os functionIds oficiais para Crédito à Vista e Débito à Vista.

    Verificar se a pergunta de "tipo de cartão" é disparada pelo SiTef por functionId errado (2↔3 invertidos) ou por menu de produto que precisa ser suprimido via ParamAdic.

    Decidir entre:

        (a) Corrigir o mapeamento 4→3 e 5→2 em tefService.js.

        (b) Manter mapeamento atual e usar trnAdditionalParameters para filtrar menus.

Após resolver: testar venda de R$ 0,01 em Crédito e Débito, conferir vendas_tef + nfce_tef gravados corretamente.
8. Pegadinhas e decisões não óbvias
Fiscal

    🔴 Case PDO — pibsuf, pibsmun (minúsculo); vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 CancelarNF/InutilizarNF — cStat real em <retEvento> / <retInutNFe>.

    🔴 cStat 241 (faixa já usada) e 563 (faixa já inutilizada) são sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 $custo_movimentado calculado FORA do if/else.

    🔴 Estorno estoque ANTES de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 — anti-duplicidade.

    🔴 nfce_totais_formapgto NÃO tem colunas de cartão (tot_fp_tpIntegra, tot_fp_CNPJ etc.) — o <card> da SEFAZ é montado pelo TecnoSpeed lendo nfce_tef.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    MySQL 4.1 — sem CTE, sem window functions.

    coluna = coluna em JOIN — nunca AND coluna solto.

    Timezone: America/Cuiaba (UTC-4).

    MySQL 4.1 retorna tudo como string via PDO — sempre Number() / (int) antes de comparar.

TEF

    🔴 Agente na porta 8443 (Apache ficou na 443).

    🔴 Certificado self-signed expirado — curl.exe -k ou aceitar 1x no navegador.

    🔴 terminalId = 00000065 (não 142345).

    🔴 React.StrictMode executa useEffect 2x — usar useRef guard (feito no TefModal).

    🔴 Comando 22 (ENTER) — precisa window.addEventListener.

    🔴 1ª conexão do SiTef baixa tabelas — ~1-5 min.

    🔴 Não gravar comprovante com quebra de linha literal — limparComprovante().

    🔴 URL do agente é HTTPS porta 8443 (não 443).

    🔴 FORMAS_TEF no frontend são códigos do ERP (4/5/117), NÃO functionIds do SiTef (2/3/122).

    🔴 TefModal deve ser sibling do fv-overlay, não child (evita clipping).

    🔴 Pagamento TEF já gravado em vendas_tef não pode ser removido sem cancelar a venda.

    🔴 Em TefModal, useRef (iniciadoRef, tefAbertoRef) previne 2ª execução.

9. Instruções para a IA no novo chat

    Sistema fiscal 100% funcional; TEF validado em homologação (R$ 0,01 aprovado em Crédito).

    Integração TEF no FinalizarVendaModal aplicada e funcional. NfceFiscal.php sincroniza vendas_tef → nfce_tef.

    Pendência ativa: menu intermediário do SiTef pedindo tipo de cartão. Discutir antes de alterar código.

    Não refatorar classes validadas (NfceFiscal, NfceTransmissor, Vendas).

    Nunca reintroduzir <?xml?> antes de assinar.

    Sempre SHOW COLUMNS antes de usar colunas em tabelas desconhecidas.

    Sempre catch (Throwable $t).

    Sempre sanitizarTexto() em justificativas.

    Sempre ler cStat de <retEvento> / <retInutNFe>.

    Sempre tratar cStat 241 e 563 como sucesso.

    Sempre estornar estoque antes de marcar item cancelado.

    Sempre curl.exe -k no agente (certificado self-signed).

    Sempre Number() ao comparar códigos vindos do MySQL via PDO.

    Manter português, respostas técnicas com código.

    Se precisar: pedir NfceTransmissor.php, appController.php, Vendas.php, NfceFiscal.php, TefModal.jsx, tefService.js.

Arquivos-chave recebidos na sessão:

    Especificação Técnica Agente CliSiTef v1.09 PDF.

    agenteCliSiTef.js (sample oficial jQuery/AJAX).

    qrcode.js.

    fGravarVendasTef / fGravarVendasTefComprovante (VB6).

    Screenshot PDV CliSiTef antigo.

    SHOW COLUMNS de nfce_totais_formapgto (6 colunas, sem card).

    SHOW COLUMNS de nfce_tef (10 colunas).

Fim do documento.