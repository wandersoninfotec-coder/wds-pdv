Resumo Executivo — Facilit NFC-e

Data: 05/Outubro/2026 | Versão: 14.0-exec
Uso: referência rápida. Detalhes completos em TRANSFERENCIA_v14.md.
🎯 O que é

Sistema de emissão de NFC-e (modelo 65) integrado ao ERP VB6 legado (WDS Comercial). Backend em PHP 7.1.9 + MySQL 4.1 + componente TecnoSpeed v6.0 via COM. Frontend em React 19 + Vite 8 (sem Electron ainda).
📍 Onde as coisas ficam
O quê	Caminho
Backend PHP	C:\xampp\htdocs\app_mesas_api\
Frontend React	D:\ANDROID\wds-pdv\
Scripts .bat	C:\WDS Comercial\Scripts\
XMLs gerados	C:\WDS Comercial\NFCeGerada\ano\mes\dia\
Logs dos jobs	C:\WDS Comercial\NFCeGerada\Log\
Log PHP	C:\xampp\php\logs\php_error_log
Certificado A1	C:\WDS Comercial\certificado\cliente.pfx (senha 123)
Templates TecnoSpeed	C:\WDS Comercial\Templates\vm60\
🔑 Credenciais críticas

    ProgID componente: NFCex.spdNFCeX (o e minúsculo importa)

    Software House: CNPJ 14234584000174, token 6f8547fdd9dff39473e2cb42a7568907

    Emitente: CNPJ 58717761000149, UF MT, Ambiente 2 (homologação)

    Timezone: America/Cuiaba (UTC-4)

🌐 Endpoints principais
Emissão

    POST /app/finalizarVenda — fecha venda

    POST /app/nfceEmitir — prepara + gera TXT + transmite (com fallback contingência)

    POST /app/nfceStatusSefaz — consulta status + pendentes

Notas fiscais

    POST /app/nfceListar — lista

    POST /app/nfceDadosImpressao — dados do cupom

    POST /app/nfceCancelar — cancela autorizada

    POST /app/nfceInutilizar — inutiliza faixa

    POST /app/nfceDiagnostico — cStat → dica

Jobs

    POST /app/nfceReprocessarContingencia — transmite status 8

    POST /app/nfceReprocessarRejeitadas — retransmite mês + inutiliza anteriores

    POST /app/jobStatus — lê logs e resume

Vendas

    POST /app/vendaAbrir — abre mesa

    POST /app/itemAdicionarSeguro — adiciona item (com lock)

    POST /app/vendaCancelar — cancela mesa com estorno de estoque

📊 Status tab_nfce.status_nfce
0	1	2	3	4	5	6	7	8
Digitada	Validada	Processando	Autorizado	Rejeitado	Denegada	Cancelada	Inutilizada	Contingência
⚙️ Arquitetura automático vs manual
Modo	Quem dispara	Quando
Automático	Task Scheduler	Contingência: 2h / Rejeitadas: 06:00
Manual	Painel ⚙️ Automações	Sob demanda
Histórico	Lê logs	Sempre visível
🚨 Pegadinhas que custam caro

    Case PDO — pibsuf, pibsmun (minúsculo); vIBSUF (maiúsculo). Sempre SHOW COLUMNS.

    Typo do schema: terminino_vigencia_ncm_nbs_ibs_cbs (com "no", não "io").

    CancelarNF/InutilizarNF retornam cStat da raiz — o real está em <retEvento> / <retInutNFe>.

    cStat 241 e 563 = sucesso disfarçado (já estava feito na SEFAZ).

    Justificativa com acento → sempre sanitizarTexto().

    Estorno de estoque ANTES de marcar item cancelado (senão o SELECT não acha).

    NÃO adicionar <?xml?> antes de AssinarNota.

    PHP 7.1.9 — catch (Throwable $t), sem sintaxe moderna.

    json_encode falha silencioso → JSON_PARTIAL_OUTPUT_ON_ERROR.

    Alíquotas 2026: IBS UF 0,10% | IBS Mun 0,00% | CBS 0,90%.

🗂️ Classes principais
Classe	Responsabilidade
NfceFiscal	Popula nfce_* e dfe_*
NfceGeradorTxt	Gera TXT TecnoSpeed
NfceTransmissor	Tudo que fala COM (transmitir, cancelar, inutilizar, job)
Vendas	Vendas, itens, estoque, kardex
Produto	Dados fiscais dos produtos
✅ O que está pronto

    ✅ Emissão (1 item, multi-itens, NCM específico)

    ✅ Contingência automática + reprocessamento

    ✅ Alerta no PDV

    ✅ Impressão do cupom (80mm, layout próprio)

    ✅ Tela de notas + cancelamento + inutilização + diagnóstico

    ✅ Job automático (reprocessar rejeitadas + inutilizar)

    ✅ Tela de Automações com histórico

    ✅ Diagnóstico de cadastros (sem NCM, sem CFOP, CFOP inválido)

    ✅ Cancelar mesa com estorno de estoque

    ✅ Editar preço de produto zerado

🚧 Próximos passos

    Rotina de configuração para produção ← próximo tema

    Configurar Task Scheduler (aula pendente)

    Integração Diagnóstico ↔ Rejeições

    E-mail (PHPMailer + XML + PDF)

    Empacotar Electron + IPC (impressão silenciosa)

    TEF Sitef

🎬 Como retomar

    Ler TRANSFERENCIA_v14.md (completo)

    Se algo não bater, pedir para colar os arquivos-chave:

        NfceTransmissor.php, appController.php, Vendas.php

        MesaDetalhesModal2.jsx, pedidoService.js

Fim.
Última atualização: 05/Outubro/2026