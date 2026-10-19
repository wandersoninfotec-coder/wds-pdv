Documento de Transferência — Facilit NFC-e

Data: Segunda-feira, 05/Outubro/2026
Status: 🎉 Sistema completo + cancelamento de mesa com estorno de estoque. Falta: agendamento no Windows + rotina de configuração para produção + TEF.
1. Projeto e objetivo final

    ERP legado VB6 + MySQL 4.1 (WDS Comercial).

    Serviço PHP intermediário.

    Facilit App (React Native/Expo) — pronto.

    Facilit (React + Vite, sem Electron) — PDV desktop.

    ERP 2.0 — futuro.

    Objetivo: emitir NFC-e (modelo 65) via componente TecnoSpeed v6.0. Depois: TEF Sitef.

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
│   │   ├── MesaDetalhesModal2.jsx/.css  ; ✅ + botão Cancelar Mesa + campo preço
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
POST /app/vendaCancelar	✅ NOVO (com estorno de estoque)
Métodos em NfceTransmissor

    detectarStatusSefaz() — cStat 107/108/109

    transmitir() — normal + contingência

    transmitirXmlAssinado()

    cancelar() — cStat do <retEvento> + sanitiza justificativa

    inutilizar() — trata cStat 241 e 563; cStat do <retInutNFe>

    reprocessarRejeitadas() — retransmite mês + inutiliza anteriores

    reprocessarContingencia()

    salvarXmlAutorizado()

    sanitizarTexto(), agruparFaixas(), obterCodigoUf()

Métodos em Vendas

    addVenda(), addItem(), listar(), codigoNovaVenda()

    processarEstoque($empresa, $venda, $ref, $vendedor, $item, $requisicao, $origemEstorno)

        $requisicao=0 → SAÍDA (baixa) — origem PEDIDO_MESA_APP

        $requisicao=1 → ENTRADA (estorno) — origem CANCELAMENTO_MESA_APP

    estornarEstoqueVenda($empresa, $venda, $vendedor) — NOVO: percorre itens não cancelados e estorna

    gravaKardex() — insere em kardex_produtos

Frontend

    Dashboard → botões: Notas Fiscais / Diagnóstico / Automações

    NotasPage — lista, filtros, data BR, ações por status

    DiagnosticoPage — 4 categorias

    JobsPage — 3 cards + histórico

    AlertaContingencia no topo do PDV

    MesaDetalhesModal2:

        ✅ Botão "❌ Cancelar Mesa" (funciona com mesa vazia ou com itens)

        ✅ Mini-modal de quantidade com campo de preço editável

        Preço editável apenas se produtos.vista = 0

        Produto sem preço mostra "⚠️ Definir preço"

Cancelar Mesa — fluxo completo

    Botão "❌ Cancelar Mesa" → ConfirmModal

    pedidoService.cancelarMesa(venda, usuario) → POST /app/vendaCancelar

    Backend:

        beginTransaction + FOR UPDATE

        estornarEstoqueVenda → processarEstoque(..., 1, 'CANCELAMENTO_MESA_APP')

        UPDATE vendas_item SET cancelado = 1

        UPDATE vendas SET status = 2

        commit

    Frontend: toast de sucesso + fecha modal

Kardex — comportamento esperado
text

venda X → PEDIDO_MESA_APP       | SAIDA   | baixa
venda X → CANCELAMENTO_MESA_APP | ENTRADA | estorno

5. Tabelas-chave

    dfe_ncm_nbs_ibs_cbs → NCM → cst_ibs_cbs + cclass_trib (vigência)

    tab_tipooperacao_rtc → alíquotas por CST_IBS_CBS + cclasstrib

    tab_cfop → CST/CSOSN por cfop_codigo + cfop_indice + empresa

    kardex_produtos → histórico de movimentação (krd_origem_movimento, krd_tipo_movimento, krd_numero_movimento)

    Relação produtos ↔ tab_cfop: produtos.cfop = "5.102-1" → split por -

    Typos do schema:

        terminino_vigencia_ncm_nbs_ibs_cbs (com "no")

        dfe_gibsuf.pibsuf, dfe_gibsmun.pibsmun (minúsculo); vIBSUF (maiúsculo)

6. Status da SEFAZ
cStat	Significado
107	Serviço em Operação → online
108	Paralisado Momentaneamente → contingência
109	Paralisado sem Previsão → contingência
7. Rejeições comuns mapeadas
cStat	Causa	Como resolver
215	Produto sem NCM	Cadastrar NCM no produto
391	Falta dados do cartão (TEF)	Só resolve com TEF
865	Total pagamentos < total nota	Revisar venda
241	Faixa já usada na SEFAZ	Marca localmente como autorizada
563	Faixa já inutilizada	Marca localmente como inutilizada
8. Mapa tab_nfce.status_nfce
Código	Label
0	Digitada
1	Validada
2	Processando
3	Autorizado
4	Rejeitado
5	Denegada
6	Cancelada
7	Inutilizada
8	Contingência
9. Lógica de classificação fiscal (prioridade)

    Produto (produtos.CST_IBS_CBS + cclastrib)

    NCM (dfe_ncm_nbs_ibs_cbs → tab_tipooperacao_rtc)

    Padrão da empresa

10. Pegadinhas conhecidas

    🔴 Case PDO — pibsuf, pibsmun (minúsculo); vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 PHP 7.1.9 — catch (Throwable $t), sem fn(), sem trailing comma.

    🔴 json_encode falha silenciosamente → JSON_PARTIAL_OUTPUT_ON_ERROR.

    🔴 CancelarNF retorna cStat da raiz (128) — real está em <retEvento>.

    🔴 InutilizarNF idem — cStat real em <retInutNFe> (102).

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 cStat 241 e 563 são sucesso disfarçado — tratar como OK.

    🔴 $custo_movimentado no processarEstoque — precisa ser calculado FORA do if/else (bug corrigido).

    🔴 Estorno de estoque ANTES de marcar item como cancelado — senão o SELECT não acha (filtra cancelado=0).

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

    vendas.numero_nfe = 0 — regra para não emitir NFC-e se já tem NF-e.

    Timezone do Apache: America/Cuiaba (UTC-4).

    .bat sobrescreve log quando roda 2x no mesmo dia → sufixo de hora resolve.

    Preço editável só se produtos.vista = 0 — evita fraude em produto com preço cadastrado.

11. Roadmap
Prioridade	Item	Status
🟡 1	Rotina de configuração para produção (setup inicial nos clientes)	Planejado
🟡 2	Configurar Task Scheduler (aula pendente)	Em andamento
🟡 3	Integração Diagnóstico ↔ Rejeições	Planejado
🟢 4	E-mail (PHPMailer + XML + PDF)	Pendente
🟢 5	Empacotar Electron + IPC	Pendente
🟢 6	Fix do vendedor (codigoFuncionario)	Pendente
⚪	TEF Sitef	Depois
12. Instruções para a IA no novo chat

    Sistema 100% funcional.

    Próximo tema: rotina de configuração para produção (setup inicial nos clientes) — usuário vai especificar o escopo.

    Não refatorar classes validadas sem motivo.

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

    Se precisar, pedir para colar: NfceTransmissor.php, appController.php, Vendas.php, MesaDetalhesModal2.jsx, pedidoService.js, JobsPage.jsx, NotasPage.jsx.

Fim do documento.
Última atualização: 05/Outubro/2026 — v14.0