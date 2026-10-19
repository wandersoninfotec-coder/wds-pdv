Documento de Transferência — Facilit NFC-e

Data: Terça-feira, 06/Outubro/2026
Status: 🎉 Sistema fiscal completo + TEF CONECTANDO NO SERVIDOR SiTef! Agente respondendo, PinPad OK, servidor SiTef respondendo. Próximo passo: aguardar carregamento de tabelas e testar transação real.
1. Projeto e objetivo final

    ERP legado VB6 + MySQL 4.1 (WDS Comercial).

    Serviço PHP intermediário.

    Facilit App (React Native/Expo) — pronto.

    Facilit (React + Vite, sem Electron) — PDV desktop.

    ERP 2.0 — futuro.

    Objetivo: emitir NFC-e (modelo 65) via componente TecnoSpeed v6.0 + TEF CliSiTef.

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

    Certificado: self-signed, expirado (2019) — aceitar no navegador 1x.

    Debug/teste: curl.exe -k "https://127.0.0.1:8443/agente/clisitef/state"

    Instalação: C:\AgenteClisitef\

    Logs: C:\AgenteClisitef\logs\

Credenciais SiTef (obtidas com suporte Getcard)
Campo	Valor
IP SiTef	177.72.161.156
Porta	4096 (padrão)
Loja	00000000
Terminal	00000065 ← CRÍTICO: foi o que faltava
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
│   │   ├── DashboardPage.jsx       ; + <TesteTefButton /> temporário
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
│   │   ├── InutilizarModal.jsx/.css
│   │   ├── TefModal.jsx/.css       ; ✅ NOVO
│   │   └── TesteTefButton.jsx      ; ✅ NOVO (temporário)
│   └── services/
│       ├── pagamentoService.js
│       ├── impressaoService.js
│       ├── notaService.js
│       ├── diagnosticoService.js
│       ├── pedidoService.js        ; ✅ + cancelarMesa
│       ├── jobService.js
│       └── tefService.js           ; ✅ NOVO

text

C:\WDS Comercial\Scripts\
├── reprocessar_contingencia.bat
└── reprocessar_rejeitadas.bat

4. O que já está pronto/validado
Endpoints NFC-e (ativos)

finalizarVenda, nfcePreparar, nfceEmitir, nfceStatusSefaz, nfceReprocessarContingencia, nfceDadosImpressao, nfceListar, nfceCancelar, nfceInutilizar, nfceDiagnostico, diagnosticoProdutos, nfceReprocessarRejeitadas, jobStatus, vendaCancelar.
Endpoints TEF (NOVOS)

    POST /app/verificarTef → retorna { usa_tef: bool }

    POST /app/tefParametros → retorna { sitef_ip, store_id, terminal_id, agent_url, ... }

Frontend — NFC-e/fiscal

    Dashboard → Notas Fiscais / Diagnóstico / Automações

    AlertaContingencia no topo

    Cancelar mesa com estorno de estoque

    Preço editável se produtos.vista = 0

Frontend — TEF (novo, em teste)

    tefService.js — encapsula chamadas HTTPS ao agente (8443)

    TefModal.jsx — UI completa (mensagens, coleta, QR PIX, cancelar)

    TesteTefButton.jsx — botão flutuante temporário no Dashboard

TEF — fluxo validado até aqui
Etapa	Status
Agente HTTP local (8443)	✅
/state retorna serviceState: 1	✅
startTransaction retorna clisitefStatus: 10000	✅
continueTransaction — loop funcionando	✅
"Servidor Conectado" (conexão SiTef OK)	✅
"ATUALIZANDO TABELAS" (em progresso)	🔄
TEF — causa raiz do bug inicial resolvido

terminalId errado. Estava 142345 (peguei da screenshot do PDV antigo). Correto conforme Getcard: 00000065.
5. Tabelas TEF — schemas confirmados
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

6. Mapeamento forma_pgto (CRÍTICO)
ERP	SiTef (functionId)	Descrição
4	3	Crédito
5	4	Débito
117	17	PIX Dinâmico
7. Endpoints do Agente CliSiTef

Base: https://127.0.0.1:8443/agente/clisitef
Endpoint	Método	Função
/state	GET	Estado do agente
/session	POST/GET/DELETE	Sessão
/startTransaction	POST	Iniciar transação
/continueTransaction	POST	Loop
/finishTransaction	POST	Confirmar/estornar
/getVersion	POST	Versão CliSiTef
/pinpad/*	POST	Operações PinPad
Comandos retornados (continueTransaction)

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

8. Status da SEFAZ
cStat	Significado
107	Serviço em Operação → online
108	Paralisado Momentaneamente → contingência
109	Paralisado sem Previsão → contingência
9. Rejeições comuns NFC-e
cStat	Causa	Solução
215	Produto sem NCM	Cadastrar NCM
391	Falta dados cartão	Resolve com TEF
865	Total pagamentos < total	Revisar venda
241	Faixa já usada	Marcar autorizada localmente
563	Faixa já inutilizada	Marcar inutilizada localmente
10. Mapa tab_nfce.status_nfce
0	1	2	3	4	5	6	7	8
Digitada	Validada	Processando	Autorizado	Rejeitado	Denegada	Cancelada	Inutilizada	Contingência
11. Pegadinhas conhecidas

    🔴 Case PDO — pibsuf, pibsmun (minúsculo); vIBSUF (maiúsculo).

    🔴 Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no").

    🔴 PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    🔴 json_encode falha silenciosa → JSON_PARTIAL_OUTPUT_ON_ERROR.

    🔴 CancelarNF/InutilizarNF — cStat real em <retEvento> / <retInutNFe>.

    🔴 Justificativa com acento → sanitizarTexto().

    🔴 cStat 241 e 563 são sucesso disfarçado.

    🔴 $custo_movimentado calculado FORA do if/else.

    🔴 Estorno estoque ANTES de marcar item cancelado.

    ProgID NFCex.spdNFCeX (com e minúsculo).

    Componente NÃO lê .ini — tudo via COM.

    ConverterLoteParaXml recebe CAMINHO.

    NÃO adicionar <?xml?> antes de assinar.

    Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

    IBSCBSTot obrigatório mesmo zerado.

    StatusDoServico (não StatusServico).

    Projeto é React + Vite — sem Electron.

    MySQL 4.1 — sem CTE, window functions.

    coluna = coluna em JOIN — nunca AND coluna solto.

    vendas.numero_nfe = 0 — anti-duplicidade NFC-e/NF-e.

    Timezone: America/Cuiaba (UTC-4).

    .bat sobrescreve log se rodar 2x/dia.

    Preço editável só se produtos.vista = 0.

    🔴 Agente na porta 8443 (Apache ficou na 443).

    🔴 Certificado self-signed expirado — usar curl.exe -k.

    🔴 terminalId do SiTef precisa ser 00000065 (não o da screenshot).

    🔴 React.StrictMode executa useEffect 2x — usar useRef guard.

    🔴 Comando 22 (ENTER) — precisa window.addEventListener pra avançar.

    🔴 1ª conexão do SiTef baixa tabelas — leva ~1-5 min.

12. Roadmap
Prioridade	Item	Status
🔴 1	Terminar fluxo TEF (aguardar tabelas + testar cartão)	Em progresso
🟡 2	Backend: /app/gravarVendasTef + comprovante	Pendente
🟡 3	Integração TEF no FinalizarVendaModal	Pendente
🟡 4	Ajustar NfceFiscal pra ler vendas_tef → nfce_tef	Pendente
🟢 5	Rotina de configuração para produção	Planejado
🟢 6	Configurar Task Scheduler (aula)	Em andamento
🟢 7	E-mail (PHPMailer + XML + PDF)	Pendente
🟢 8	Empacotar Electron + IPC	Pendente
🟢 9	Fix do vendedor (codigoFuncionario)	Pendente
13. Próximos passos — TEF
13.1 Aplicar fix do comando 22 (se não aplicou)

No TefModal.jsx, no processarComando:
javascript

if (cmd === 22) {
  setMensagem(data.data + '\n\n(Pressione ENTER)');
  const handler = (e) => {
    if (e.key === 'Enter') {
      window.removeEventListener('keydown', handler);
      continuar('');
    }
  };
  window.addEventListener('keydown', handler);
  return;
}

13.2 Testar pelo PDV React

    Confirma param_tef:

sql

SELECT sitef_ip, store_id, terminal_id FROM param_tef WHERE empresa = 1;
-- Esperado: 177.72.161.156 | 00000000 | 00000065

    Abre o PDV → Dashboard → ▶️ Executar TEF

    R$ 0,01 + Débito

    Aguarda o modal mostrar "APROXIME O CARTAO" (pode levar ~1-5min na 1ª vez)

    Passa o cartão de teste + senha

    Esperado: JSON com NSU, bandeira, autorização

13.3 Se travar em "OBTENDO REGISTRO"
powershell

curl.exe -k "https://127.0.0.1:8443/agente/clisitef/finishTransaction" -X POST -d "sessionId=<sid>&confirm=0&taxInvoiceNumber=9999&taxInvoiceDate=20261006&taxInvoiceTime=100000"

Reinicia o serviço do agente (services.msc).
13.4 Após validar TEF

a) Backend:

    POST /app/gravarVendasTef — espelha fGravarVendasTef do VB6

    POST /app/gravarVendasTefComprovante — espelha fGravarVendasTefComprovante

b) Frontend:

    Integrar TefModal no FinalizarVendaModal

    Quando forma = Crédito/Débito/PIX → abre TEF antes de adicionar

c) NFC-e:

    Confirmar se NfceFiscal.php lê vendas_tef → popula nfce_tef

    Se não → implementar

13.5 Remover teste

Depois que tudo funcionar, remover:

    TesteTefButton.jsx

    <TesteTefButton /> do DashboardPage.jsx

14. Instruções para a IA no novo chat

    Sistema fiscal 100% funcional.

    TEF em progresso: conexão SiTef OK, aguardando tabelas + teste de cartão.

    Não refatorar classes validadas.

    TerminalId correto é 00000065 (não confundir com 142345 do PDV antigo).

Regras:

    Não usar sintaxe PHP 7.2+.

    NÃO reintroduzir <?xml?>.

    SEMPRE SHOW COLUMNS antes de usar colunas.

    SEMPRE catch (Throwable $t).

    SEMPRE sanitizarTexto() em justificativas.

    SEMPRE ler cStat do <retEvento> / <retInutNFe>.

    SEMPRE tratar cStat 241 e 563 como sucesso.

    SEMPRE estornar estoque antes de marcar item cancelado.

    SEMPRE usar curl.exe -k pro agente (certificado self-signed).

    Manter português, respostas técnicas com código.

    Se precisar, pedir para colar: NfceTransmissor.php, appController.php, Vendas.php, MesaDetalhesModal2.jsx, pedidoService.js, tefService.js, TefModal.jsx, TesteTefButton.jsx.

15. Arquivos-chave recebidos nesta sessão

    agenteCliSiTef.js — sample oficial (jQuery/AJAX)

    qrcode.js — biblioteca QR Code

    AgenteCliSiTef - Especificação Técnica - v1.09.pdf — doc completa

    fGravarVendasTef / fGravarVendasTefComprovante (VB6) — referências

    Screenshot: PDV CliSiTef antigo (177.72.161.156, 00000000, 142345)

Fim do documento.
Última atualização: 06/Outubro/2026 — v16.0