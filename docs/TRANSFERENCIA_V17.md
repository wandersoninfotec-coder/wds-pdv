Documento de Transferência — Facilit NFC-e

Data: Terça-feira, 06/Outubro/2026
Status: 🎉 Sistema fiscal completo + TEF 100% FUNCIONAL em homologação! Autorização de teste OK, mapeamento de campos OK, endpoints de gravação escritos. Falta integração no fechamento + NFC-e lendo vendas_tef.
1. Projeto e objetivo final

    ERP legado VB6 + MySQL 4.1 (WDS Comercial).

    Serviço PHP intermediário.

    Facilit App (React Native/Expo) — pronto.

    Facilit (React + Vite, sem Electron) — PDV desktop.

    ERP 2.0 — futuro.

    Objetivo: emitir NFC-e (modelo 65) via componente TecnoSpeed v6.0 + TEF CliSiTef integrado.

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

    Porta: 8443 (Apache ficou na 443).

    URL base: https://127.0.0.1:8443/agente/clisitef

    Versão: 1.0.0.16.r1.

    serviceState: 1 = pronto.

    Certificado: self-signed expirado (2019) — aceitar 1x no navegador.

    Debug: curl.exe -k "https://127.0.0.1:8443/agente/clisitef/state"

    Instalação: C:\AgenteClisitef\

    Logs: C:\AgenteClisitef\logs\

Credenciais SiTef
Campo	Valor
IP SiTef	177.72.161.156
Porta	4096
Loja	00000000
Terminal	00000065 ← CRÍTICO
CNPJ adquirente	01425787000104
Pastas TecnoSpeed

    C:\WDS Comercial\Templates\vm60\, Esquemas\vm60\

    nfceServidoresHom.ini, nfceServidoresProd.ini

    C:\WDS Comercial\certificado\cliente.pfx (senha: 123)

    Gerados: C:\WDS Comercial\NFCeGerada\ano\mes\dia\

    Logs dos jobs: C:\WDS Comercial\NFCeGerada\Log\

Credenciais NFC-e

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
│   ├── NfceFiscal.php              ; ✅ (verificar se lê vendas_tef)
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
│   │   ├── DashboardPage.jsx       ; + <TesteTefButton /> temporário
│   │   ├── NotasPage.jsx/.css
│   │   ├── DiagnosticoPage.jsx/.css
│   │   └── JobsPage.jsx/.css
│   ├── components/
│   │   ├── AlertaContingencia.jsx/.css
│   │   ├── MesaDetalhesModal2.jsx/.css
│   │   ├── FinalizarVendaModal.jsx ; ⚠️ INTEGRAR TEF
│   │   ├── SuccessModal.jsx/.css
│   │   ├── BotaoImprimirCupom.jsx
│   │   ├── NotaDetalhesModal.jsx/.css
│   │   ├── CancelarNotaModal.jsx/.css
│   │   ├── InutilizarModal.jsx/.css
│   │   ├── TefModal.jsx/.css       ; ✅ FUNCIONANDO
│   │   └── TesteTefButton.jsx      ; temporário (remover após integração)
│   └── services/
│       ├── pagamentoService.js
│       ├── impressaoService.js
│       ├── notaService.js
│       ├── diagnosticoService.js
│       ├── pedidoService.js        ; + cancelarMesa
│       ├── jobService.js
│       └── tefService.js           ; ✅ + gravarVendasTef/Comprovante

text

C:\WDS Comercial\Scripts\
├── reprocessar_contingencia.bat
└── reprocessar_rejeitadas.bat

4. O que já está pronto/validado
Endpoints NFC-e (ativos)

finalizarVenda, nfcePreparar, nfceEmitir, nfceStatusSefaz, nfceReprocessarContingencia, nfceDadosImpressao, nfceListar, nfceCancelar, nfceInutilizar, nfceDiagnostico, diagnosticoProdutos, nfceReprocessarRejeitadas, jobStatus, vendaCancelar.
Endpoints TEF

    POST /app/verificarTef → { usa_tef }

    POST /app/tefParametros → { sitef_ip, store_id, terminal_id, agent_url, ... }

    POST /app/gravarVendasTef → INSERT em vendas_tef (cancelando anteriores na mesma ordem)

    POST /app/gravarVendasTefComprovante → INSERT/UPDATE em vendas_tef_comprovante

    Helper limparComprovante() (espelha fRetCaracteresComprovante VB6)

Frontend — Fiscal

    Dashboard → Notas Fiscais / Diagnóstico / Automações

    AlertaContingencia no topo do PDV

    Cancelar mesa com estorno de estoque

    Preço editável se produtos.vista = 0

Frontend — TEF ✅

    tefService.js — encapsula HTTPS ao agente (8443)

    TefModal.jsx — UI completa (mensagens, coleta, QR PIX, cancelar, aguardar ENTER)

    TesteTefButton.jsx — botão flutuante temporário no Dashboard

    gravarVendasTef / gravarVendasTefComprovante no tefService

TEF — fluxo validado END-TO-END ✅
Etapa	Status
Agente HTTP local (8443)	✅
Conexão com servidor SiTef	✅
startTransaction → clisitefStatus: 10000	✅
continueTransaction — loop de comandos	✅
PinPad lendo cartão (chip)	✅
Autorização TEF	✅ Transacao Simulada Aprovada
Mapeamento dos campos	✅
Exemplo de retorno REAL (Crédito R$ 0,01)
json

{
  "clisitefStatus": 0,
  "nsu": "060015",
  "autorizacao": "516292",
  "bandeira": "01",
  "bandeiraNome": "MASTERCARD",
  "credenciadora": "01425787000104",
  "dataCartao": "06/10/2026",
  "horaCartao": "11:46:01",
  "codigoTransacao": "999060015",
  "tipoFinan": "01",
  "tipo": "C",
  "modalidade": "T.E.F.",
  "valorPago": "0.01",
  "estabelecimento": "000000000000006",
  "idTerminal": "00000065",
  "formaPagto": 4
}

5. Tabelas TEF — schemas
vendas_tef
text

PK: (empresa, venda, parcela, codigo, ordem)
Colunas: empresa, venda, parcela, codigo, forma_pgto (int),
         credenciadora (varchar 14), bandeira_cartao (char 2),
         codigo_transacao (varchar 40), valor, troco, tipo (char 1),
         NSU (varchar 40), data_c (varchar 15), hora_c (varchar 15),
         tipo_finan (char 2), modalidade (char 2),
         rede_adquirente (varchar 100), ordem (int), qtd_parcelas (int),
         cancelado (int), id_terminal (varchar 20),
         codigo_controle (varchar 30), pedido_vinculado (int),
         nf_vinculado (int)

vendas_tef_comprovante
text

PK: (empresa, venda, parcela, codigo, ordem)
Colunas: empresa, venda, parcela, codigo,
         via_completa, via_Cliente, via_estabelecimento (TEXT)

nfce_tef
text

PK: (empresa, nfce, codigo, forma_pgto)
Colunas: empresa, nfce, codigo, forma_pgto, credenciadora,
         bandeira_cartao, codigo_transacao, valor, troco, tipo

param_tef (ALTER aplicado)
text

Adicionadas: sitef_ip (varchar 50), store_id (varchar 20), terminal_id (varchar 20)

6. Mapeamento forma_pgto TEF
ERP	SiTef (functionId)	Descrição	tipo (D/C/P)
4	3	Crédito	C
5	4	Débito	D
117	17	PIX Dinâmico	P
7. Mapeamento TipoCampo SiTef → Dados NFC-e (CRÍTICO)
Campo	TipoCampo	Exemplo
NSU SiTef	133	060015
NSU Host	134	999060015
Autorização	136	516292
Bandeira (nome)	156	MASTERCARD
Estabelecimento	157	000000000000006
CNPJ adquirente	950	01425787000104
Data/Hora cartão	105	20261006114601
Cupom estabelecimento	121	multiline
Cupom cliente	122	multiline
Tipo financiamento	101	Cartao de Credito a Vista
Modalidade TEF	102	T.E.F.
4 últimos dígitos	1190 ou 2022	5349
Mapa bandeira → código
javascript

{
  'MASTERCARD': '01',
  'VISA':       '02',
  'ELO':        '03',
  'AMEX':       '04',
  'HIPERCARD':  '05',
  'DINERS':     '06',
}

8. Endpoints do Agente CliSiTef

Base: https://127.0.0.1:8443/agente/clisitef
Endpoint	Método	Função
/state	GET	Estado do agente
/session	POST/GET/DELETE	Sessão
/startTransaction	POST	Iniciar
/continueTransaction	POST	Loop
/finishTransaction	POST	Confirmar/estornar
/getVersion	POST	Versão CliSiTef
/pinpad/*	POST	Operações PinPad
Comandos continueTransaction

    0 — dado (acumular)

    1-4, 15 — mensagem título

    11-14, 16 — apagar display

    20 — Sim/Não

    21, 30-38 — coleta

    22 — aguardar ENTER

    23 — botão Cancelar

    29 — parâmetros PinPad

    50 — QR Code PIX (fieldId 584)

    51, 52 — continuar

9. Status da SEFAZ / cStat
cStat	Significado
107	Serviço em Operação
108	Paralisado Momentaneamente
109	Paralisado sem Previsão
215	Schema XML
391	Falta dados cartão (resolve com TEF)
865	Total pagamentos < total
241	Faixa já usada na SEFAZ
563	Faixa já inutilizada
10. Mapa tab_nfce.status_nfce
0	1	2	3	4	5	6	7	8
Digitada	Validada	Processando	Autorizado	Rejeitado	Denegada	Cancelada	Inutilizada	Contingência
11. Pegadinhas conhecidas
Fiscal

    🔴 Case PDO — pibsuf, pibsmun (minúsculo); vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 CancelarNF/InutilizarNF — cStat real em <retEvento> / <retInutNFe>.

    🔴 cStat 241 e 563 são sucesso disfarçado.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 $custo_movimentado calculado FORA do if/else.

    🔴 Estorno estoque ANTES de marcar item cancelado.

    🔴 NÃO adicionar <?xml?> antes de assinar.

    🔴 Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    🔴 IBSCBSTot obrigatório mesmo zerado.

    🔴 vendas.numero_nfe = 0 — anti-duplicidade NFC-e/NF-e.

Técnicas gerais

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    MySQL 4.1 — sem CTE, window functions.

    coluna = coluna em JOIN — nunca AND coluna solto.

    Timezone: America/Cuiaba (UTC-4).

TEF

    🔴 Agente na porta 8443 (Apache ficou na 443).

    🔴 Certificado self-signed expirado — curl.exe -k ou aceitar 1x no navegador.

    🔴 terminalId = 00000065 (não 142345).

    🔴 React.StrictMode executa useEffect 2x — usar useRef guard.

    🔴 Comando 22 (ENTER) — precisa window.addEventListener.

    🔴 1ª conexão do SiTef baixa tabelas — ~1-5 min.

    🔴 Não gravar comprovante com quebra de linha literal — limparComprovante().

    🔴 URL do agente é HTTPS com porta 8443 (não 443).

12. Roadmap
Prioridade	Item	Status
🔴 1	Integração TEF no FinalizarVendaModal	Próximo
🔴 2	Testar gravarVendasTef + comprovante (com venda real)	Próximo
🔴 3	Confirmar se NfceFiscal.php lê vendas_tef → nfce_tef	A verificar
🟡 4	Remover TesteTefButton após validar	Pendente
🟡 5	Rotina de configuração para produção (setup clientes)	Planejado
🟡 6	Configurar Task Scheduler (aula)	Em andamento
🟢 7	E-mail (PHPMailer + XML + PDF)	Pendente
🟢 8	Empacotar Electron + IPC	Pendente
🟢 9	Fix do vendedor (codigoFuncionario)	Pendente
13. Próximos passos
13.1 Verificar se NfceFiscal.php já lê vendas_tef
powershell

Select-String -Path "C:\xampp\htdocs\app_mesas_api\models\NfceFiscal.php" -Pattern "vendas_tef|nfce_tef"

    Se retornar linhas → já lê. Só garantir que grava nfce_tef

    Se não retornar → implementar leitura de vendas_tef e insert em nfce_tef

13.2 Integração no FinalizarVendaModal

Fluxo desejado:
text

[Usuário clica em Crédito/Débito/PIX]
   ↓
Verifica se usa_tef (param_sistema)
   ↓ SIM
Abre TefModal com { valor, codigoFormaErp, operador, venda: mesa.venda, ordem }
   ↓
TefModal:
  - Executa TEF
  - Chama /app/gravarVendasTef + comprovante (via prop `venda`)
  - Chama onSucesso(dadosTef)
   ↓
FinalizarVendaModal:
  - Adiciona forma em `pagamentos` com dados TEF
   ↓
[Confirmar Pagamento] → finalizarEEmitir → NFC-e (que lê vendas_tef)

Multi-cartão: se o operador adicionar 2 cartões, o ordem incrementa (1, 2, 3...).
13.3 Após integrar

    Testar venda completa via FinalizarVendaModal

    Confirmar que vendas_tef recebe os dados

    Confirmar que nfce_tef recebe os dados

    Confirmar que NFC-e autoriza sem cStat 391

13.4 Remover teste

    TesteTefButton.jsx (arquivo)

    <TesteTefButton /> no DashboardPage.jsx

14. Instruções para a IA no novo chat

    Sistema fiscal 100% funcional.

    TEF 100% funcional em homologação (testado R$ 0,01 em Crédito).

    Próximo passo: integração no FinalizarVendaModal + confirmar NfceFiscal → nfce_tef.

    Não refatorar classes validadas.

Regras:

    Não usar sintaxe PHP 7.2+.

    NÃO reintroduzir <?xml?>.

    SEMPRE SHOW COLUMNS antes de usar colunas.

    SEMPRE catch (Throwable $t).

    SEMPRE sanitizarTexto() em justificativas.

    SEMPRE ler cStat do <retEvento> / <retInutNFe>.

    SEMPRE tratar cStat 241 e 563 como sucesso.

    SEMPRE estornar estoque antes de marcar item cancelado.

    SEMPRE curl.exe -k pro agente (certificado self-signed).

    Manter português, respostas técnicas com código.

    Se precisar, pedir para colar: NfceTransmissor.php, appController.php, Vendas.php, NfceFiscal.php, FinalizarVendaModal.jsx, TefModal.jsx, tefService.js, MesaDetalhesModal2.jsx.

15. Arquivos-chave recebidos nesta sessão

    agenteCliSiTef.js — sample oficial (jQuery/AJAX)

    qrcode.js — biblioteca QR Code

    AgenteCliSiTef - Especificação Técnica - v1.09.pdf

    fGravarVendasTef / fGravarVendasTefComprovante (VB6)

    Screenshot: PDV CliSiTef antigo

Fim do documento.
Última atualização: 06/Outubro/2026 — v17.0

Contador resetado: mensagem 1 de 10. Próximo resumo na 10ª.

Próximo passo prático: me manda o FinalizarVendaModal.jsx atual e o resultado do Select-String no NfceFiscal.php. Com isso eu escrevo a integração completa. 🎯
