Documento de Transferência — Facilit NFC-e

Data: Segunda-feira, 05/Outubro/2026
Status: 🎉 Sistema completo + TEF em início. Agente CliSiTef validado (porta 8443). Schemas mapeados. Próximo passo: implementar fluxo TEF.
1. Projeto e objetivo final

    ERP legado VB6 + MySQL 4.1 (WDS Comercial).

    Serviço PHP intermediário.

    Facilit App (React Native/Expo) — pronto.

    Facilit (React + Vite, sem Electron) — PDV desktop.

    ERP 2.0 — futuro.

    Objetivo: emitir NFC-e (modelo 65) via componente TecnoSpeed v6.0. Agora: TEF CliSiTef.

2. Stack/ferramentas
Backend

    PHP 7.1.9 (sem fn(), typed properties, trailing comma).

    Apache 2.4.27 Win32, XAMPP. Roda como LocalSystem.

    MySQL 4.1 legado (charset latin1).

    Componente NFC-e TecnoSpeed v6.0 via COM.

    ProgID: NFCex.spdNFCeX (com e minúsculo).

    php_com_dotnet habilitado.

    Timezone: America/Cuiaba (UTC-4).

    Log PHP: C:\xampp\php\logs\php_error_log.

Frontend

    React 19 + Vite 8 + react-router-dom 7 + zustand 5 + axios 1.20.

    Pasta: D:\ANDROID\wds-pdv.

    Sem Electron ainda.

TEF — Agente CliSiTef

    Agente rodando na porta 8443 (não 443).

    Processo: agenteCliSiTef.exe (2 instâncias: serviço + console).

    Versão: 1.0.0.16.r1.

    URL base: https://127.0.0.1:8443/agente/clisitef

    serviceState: 1 = pronto pra receber transação.

    Certificado: self-signed, expirado em 08/11/2019 (ignorar, é local).

    Como testar: curl.exe -k --tlsv1.0 "https://127.0.0.1:8443/agente/clisitef/state"

Pastas TecnoSpeed

    C:\WDS Comercial\Templates\vm60\, Esquemas\vm60\

    nfceServidoresHom.ini, nfceServidoresProd.ini

    C:\WDS Comercial\certificado\cliente.pfx (senha: 123)

    Gerados: C:\WDS Comercial\NFCeGerada\ano\mes\dia\

    Logs dos jobs: C:\WDS Comercial\NFCeGerada\Log\

Credenciais

    Software House: CNPJ 14234584000174, token 6f8547fdd9dff39473e2cb42a7568907

    Emitente: CNPJ 58717761000149, UF MT, Ambiente=2

Config fiscal (param_nfce)
text

pnfce_versao                   = 4.00
pnfce_versao_esquema           = pl_010d
pnfce_validaesquema_antesenvio = nao
pnfce_serie                    = 1
pnfce_ambiente                 = 2
pnfce_inutilizar_auto          = S
pnfce_inutilizar_dia           = 1

3. Estrutura de arquivos
text

app_mesas_api/
├── controllers/appController.php
├── core/Core.php
├── models/
│   ├── NfceFiscal.php              ; ✅
│   ├── NfceGeradorTxt.php          ; ✅
│   ├── NfceTransmissor.php         ; ✅
│   ├── Vendas.php                  ; ✅ + estornarEstoqueVenda
│   └── Produto.php                 ; ✅
└── logs/

text

D:\ANDROID\wds-pdv\
├── src/
│   ├── App.jsx                     ; rotas /notas, /diagnostico, /jobs
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── NotasPage.jsx/.css
│   │   ├── DiagnosticoPage.jsx/.css
│   │   └── JobsPage.jsx/.css
│   ├── components/
│   │   ├── AlertaContingencia.jsx/.css
│   │   ├── MesaDetalhesModal2.jsx/.css
│   │   ├── FinalizarVendaModal.jsx
│   │   ├── SuccessModal.jsx/.css
│   │   ├── BotaoImprimirCupom.jsx
│   │   ├── NotaDetalhesModal.jsx/.css
│   │   ├── CancelarNotaModal.jsx/.css
│   │   └── InutilizarModal.jsx/.css
│   └── services/
│       ├── pagamentoService.js
│       ├── impressaoService.js
│       ├── notaService.js
│       ├── diagnosticoService.js
│       ├── pedidoService.js        ; ✅ + cancelarMesa
│       └── jobService.js

text

C:\WDS Comercial\Scripts\
├── reprocessar_contingencia.bat
└── reprocessar_rejeitadas.bat

4. O que já está pronto/validado
Endpoints ativos
Endpoint	Status
POST /app/finalizarVenda	✅
POST /app/nfcePreparar	✅
POST /app/nfceEmitir	✅
POST /app/nfceStatusSefaz	✅
POST /app/nfceReprocessarContingencia	✅
POST /app/nfceDadosImpressao	✅
POST /app/nfceListar	✅
POST /app/nfceCancelar	✅
POST /app/nfceInutilizar	✅
POST /app/nfceDiagnostico	✅
POST /app/diagnosticoProdutos	✅
POST /app/nfceReprocessarRejeitadas	✅
POST /app/jobStatus	✅
POST /app/vendaCancelar	✅
Métodos em NfceTransmissor

    detectarStatusSefaz() — cStat 107/108/109

    transmitir() — normal + contingência

    transmitirXmlAssinado()

    cancelar() — cStat do <retEvento> + sanitiza justificativa

    inutilizar() — trata cStat 241 e 563; cStat do <retInutNFe>

    reprocessarRejeitadas()

    reprocessarContingencia()

    salvarXmlAutorizado()

    sanitizarTexto(), agruparFaixas(), obterCodigoUf()

Métodos em Vendas

    addVenda(), addItem(), listar(), codigoNovaVenda()

    processarEstoque($empresa, $venda, $ref, $vendedor, $item, $requisicao, $origemEstorno)

    estornarEstoqueVenda($empresa, $venda, $vendedor)

    gravaKardex()

Frontend

    Dashboard → Notas Fiscais / Diagnóstico / Automações

    NotasPage — lista, filtros, data BR, ações por status

    DiagnosticoPage — 4 categorias

    JobsPage — 3 cards + histórico

    AlertaContingencia no topo do PDV

    MesaDetalhesModal2:

        ✅ Botão "❌ Cancelar Mesa" (com estorno de estoque)

        ✅ Mini-modal quantidade com campo de preço editável (só se vista = 0)

5. TEF — Schemas mapeados
Tabelas existentes
text

nfce_tef, nfe_tef, param_tef, rede_adquirente_tef,
vendas_tef, vendas_tef_comprovante

vendas_tef — estrutura
sql

PK: (empresa, venda, parcela, codigo, ordem)
Colunas: empresa, venda, parcela, codigo, forma_pgto (int),
         credenciadora (varchar 14), bandeira_cartao (char 2),
         codigo_transacao (varchar 40), valor, troco,
         tipo (char 1), NSU (varchar 40), data_c (varchar 15),
         hora_c (varchar 15), tipo_finan (char 2), modalidade (char 2),
         rede_adquirente (varchar 100), ordem (int), qtd_parcelas (int),
         cancelado (int), id_terminal (varchar 20),
         codigo_controle (varchar 30), pedido_vinculado (int),
         nf_vinculado (int)

vendas_tef_comprovante — estrutura
sql

PK: (empresa, venda, parcela, codigo, ordem)
Colunas: empresa, venda, parcela, codigo,
         via_completa, via_Cliente, via_estabelecimento (TEXT)

nfce_tef — estrutura
sql

PK: (empresa, nfce, codigo, forma_pagto)
Colunas: empresa, nfce (int), codigo (varchar 20), forma_pgto (int),
         credenciadora, bandeira_cartao, codigo_transacao,
         valor, troco, tipo

Populada pelo NfceFiscal.php a partir de vendas_tef (a confirmar).
param_tef — estrutura atual
sql

empresa (PK), gerenciador, log, max_cartoes, troco_maximo,
via_reduzida (char 1), multiplos_cartoes (char 1),
confirmar_comprovante (char 1), qrcode (int),
suporta_desconto (char 1), suporta_saque (char 1),
suporta_reajuste_valor (char 1),
printer_modelo, printer_porta, pagina_codigo,
params_string (varchar 30), colunas, espaco_linhas,
linha_entre_cupons, cnpj_adquirente_pix (varchar 18)

⚠️ Falta: sitef_ip, store_id, terminal_id. Sugerido:
sql

ALTER TABLE param_tef 
  ADD COLUMN sitef_ip VARCHAR(50) DEFAULT '127.0.0.1',
  ADD COLUMN store_id VARCHAR(20) DEFAULT '00000000',
  ADD COLUMN terminal_id VARCHAR(20) DEFAULT 'REST0001';

6. TEF — Mapeamento forma_pagto (CRÍTICO)
ERP (código)	SiTef (functionId)	Descrição
4	3	Crédito
5	4	Débito
117	17	PIX Dinâmico

Confirma: o functionId do SiTef é esse segundo valor? A documentação (tabela "Códigos de Funções") não foi localizada no anexo, precisa confirmar.
7. TEF — Endpoints do agente (doc oficial)

Base: https://127.0.0.1:8443/agente/clisitef
Endpoint	Método	Função
/state	GET	Estado do agente
/session	POST/GET/DELETE	Criar/consultar/descartar sessão
/startTransaction	POST	Iniciar transação
/continueTransaction	POST	Continuar (loop)
/finishTransaction	POST	Confirmar/estornar
/getVersion	POST	Versão CliSiTef
/pinpad/open, /close, /isPresent, /readYesNo, /setDisplayMessage	POST	Operações PinPad
Parâmetros principais startTransaction

    sitefIp, storeId, terminalId

    functionId (código da forma)

    trnAmount (valor, 2 casas)

    taxInvoiceNumber, taxInvoiceDate (AAAAMMDD), taxInvoiceTime (HHMMSS)

    cashierOperator (nome do operador)

    trnAdditionalParameters, trnInitParameters

Comandos de retorno (continueTransaction)

    0 → dado da transação (acumular)

    1-4, 15 → exibir mensagem (título)

    11-14, 16 → apagar display

    20 → Sim/Não

    21, 30-35, 38 → coleta de dados

    22 → aguardar ENTER

    23 → botão Cancelar

    29 → parâmetros PinPad (CPF, timeout, TUICSS)

    50 → QR Code PIX (fieldId 584)

    51, 52 → continuar

Fluxo TEF
text

startTransaction → clisitefStatus=10000?
   ↓ sim
continueTransaction (loop)  → trata commandId
   ↓ cliSitefStatus=0 (sucesso) ou outro
finishTransaction(confirm=1|0)

8. Status da SEFAZ
cStat	Significado
107	Serviço em Operação → online
108	Paralisado Momentaneamente → contingência
109	Paralisado sem Previsão → contingência
9. Rejeições comuns mapeadas
cStat	Causa	Como resolver
215	Produto sem NCM	Cadastrar NCM
391	Falta dados do cartão	Resolve com TEF
865	Total pagamentos < total nota	Revisar venda
241	Faixa já usada na SEFAZ	Marcar localmente autorizada
563	Faixa já inutilizada	Marcar localmente inutilizada
10. Mapa tab_nfce.status_nfce
0	1	2	3	4	5	6	7	8
Digitada	Validada	Processando	Autorizado	Rejeitado	Denegada	Cancelada	Inutilizada	Contingência
11. Pegadinhas conhecidas

    🔴 Case PDO — pibsuf, pibsmun (minúsculo); vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 PHP 7.1.9 — catch (Throwable $t), sem fn(), sem trailing comma.

    🔴 json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    🔴 CancelarNF/InutilizarNF — cStat real em <retEvento> / <retInutNFe>.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 cStat 241 e 563 são sucesso disfarçado.

    🔴 $custo_movimentado calculado FORA do if/else no processarEstoque.

    🔴 Estorno de estoque ANTES de marcar item cancelado.

    ProgID NFCex.spdNFCeX (com e minúsculo).

    Componente NÃO lê .ini — tudo via COM.

    ConverterLoteParaXml recebe CAMINHO.

    NÃO adicionar <?xml?> antes de assinar.

    Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    IBSCBSTot obrigatório mesmo zerado.

    StatusDoServico (não StatusServico).

    Projeto é React + Vite — sem Electron ainda.

    MySQL 4.1 — sem CTE, window functions.

    coluna = coluna em JOIN — nunca AND coluna solto.

    vendas.numero_nfe = 0 — regra anti-duplicidade NFC-e/NF-e.

    Timezone: America/Cuiaba (UTC-4).

    .bat sobrescreve log se rodar 2x no mesmo dia.

    Preço editável só se produtos.vista = 0.

    🔴 Agente CliSiTef na porta 8443 (Apache ficou em 443).

    🔴 Certificado self-signed expirado — usar curl.exe -k ou aceitar no navegador.

    🔴 CORS bloqueia HTTPS do agente → precisa aceitar certificado 1x no browser.

12. Roadmap
Prioridade	Item	Status
🔴 1	TEF — implementar fluxo completo	Em início
🟡 2	Rotina de configuração para produção	Planejado
🟡 3	Configurar Task Scheduler	Em andamento
🟢 4	E-mail (PHPMailer + XML + PDF)	Pendente
🟢 5	Empacotar Electron + IPC	Pendente
🟢 6	Fix do vendedor (codigoFuncionario)	Pendente
13. Próximo passo — TEF (ordem sugerida)
13.1 Ajustar param_tef (ALTER TABLE)
sql

ALTER TABLE param_tef 
  ADD COLUMN sitef_ip VARCHAR(50) DEFAULT '127.0.0.1',
  ADD COLUMN store_id VARCHAR(20) DEFAULT '00000000',
  ADD COLUMN terminal_id VARCHAR(20) DEFAULT 'REST0001';

13.2 Backend — endpoints novos

a) POST /app/verificarTef → retorna { usa_tef: bool }
php

$sql = "SELECT usa_tef FROM param_sistema WHERE empresa = :emp";
// retorna true se 'S'

b) POST /app/tefParametros → retorna { sitef_ip, store_id, terminal_id, max_cartoes, ... }

c) POST /app/gravarVendasTef → INSERT em vendas_tef
php

// Espelha fGravarVendasTef do VB6
// Se ordem já existe → UPDATE cancelado=1; senão INSERT

d) POST /app/gravarVendasTefComprovante → INSERT em vendas_tef_comprovante
13.3 Frontend — arquivos novos

    tefService.js — encapsula chamadas HTTPS ao agente:

        getState()

        startTransaction({ functionId, trnAmount, ... })

        continueTransaction({ sessionId, data, continue })

        finishTransaction({ sessionId, confirm })

        sessionCreate(), sessionGet(), sessionDelete()

        Tratamento de certificado (fetch com mode: 'no-cors' ou aceitar 1x)

    TefModal.jsx — UI completa:

        Exibe mensagens (comandos 1-4, 15, 20-22)

        Campo de coleta (comandos 21, 30-35, 38)

        Botão Cancelar (comando 23)

        QR Code PIX (comando 50 — reusa qrcode.js)

        Loop continueTransaction até clisitefStatus != 10000

        Finaliza com finishTransaction

    Integração no FinalizarVendaModal.jsx:

        Ao adicionar forma Crédito/Débito/PIX → abre TefModal

        Ao sucesso → chama /app/gravarVendasTef + /app/gravarVendasTefComprovante

        Adiciona forma com os dados TEF (credenciadora, bandeira, NSU, autorização)

13.4 Fluxo completo
text

[FinalizarVendaModal]
   │
   ├─ Dinheiro → adiciona forma direto
   │
   └─ Crédito/Débito/PIX → [TefModal] → agente 8443
                              ↓
                           Retorna { NSU, bandeira, credenciadora, ... }
                              ↓
                           POST /app/gravarVendasTef
                           POST /app/gravarVendasTefComprovante
                              ↓
                           Adiciona forma com dados TEF
   ↓
[Confirmar Pagamento] → finalizarEEmitir → NFC-e
   ↓
[NfceFiscal] lê vendas_tef → popula nfce_tef → resolve cStat 391

13.5 Teste inicial

    R$ 0,01 em Débito em homologação

    Confirma que vendas_tef recebe os dados corretos

    Confirma que nfce_tef é populado

    NFC-e autoriza sem cStat 391

14. Instruções para a IA no novo chat

    Sistema 100% funcional exceto o TEF (em início).

    Próximo tema: implementar fluxo TEF CliSiTef.

    Não refatorar classes validadas sem motivo.

    Agente já rodando na porta 8443 (validado).

    Schemas mapeados (ver seção 5).

Regras:

    Não usar sintaxe PHP 7.2+.

    NÃO reintroduzir <?xml?>.

    SEMPRE SHOW COLUMNS antes de usar colunas.

    SEMPRE catch (Throwable $t).

    SEMPRE sanitizarTexto() em justificativas.

    SEMPRE ler cStat do <retEvento> / <retInutNFe>.

    SEMPRE tratar cStat 241 e 563 como sucesso.

    SEMPRE estornar estoque antes de marcar item cancelado.

    Manter português, respostas técnicas com código.

    Se precisar, pedir para colar: NfceTransmissor.php, appController.php, Vendas.php, MesaDetalhesModal2.jsx, pedidoService.js, agenteCliSiTef.js, qrcode.js.

15. Arquivos-chave recebidos nesta sessão

    agenteCliSiTef.js — sample oficial (jQuery/AJAX) que mostra o fluxo completo

    qrcode.js — biblioteca QR Code (reusar para PIX)

    AgenteCliSiTef - Especificação Técnica - v1.09.pdf — doc completa dos endpoints

    fGravarVendasTef (VB6) — INSERT/UPDATE em vendas_tef

    fGravarVendasTefComprovante (VB6) — INSERT em vendas_tef_comprovante

    fValidarNFCe (VB6) — referência de validação

    fTransmitirNFCe (VB6) — referência de transmissão

Fim do documento.
Última atualização: 05/Outubro/2026 — v15.0