// src/components/TefModal.jsx
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { tefService } from '../services/tefService';
import { QRCodeSVG } from 'qrcode.react';
import './TefModal.css';
import { useTema } from '../hooks/useTema';

/**
 * Props:
 *   - valor: number (ex: 170.00)
 *   - codigoFormaErp: 4 | 5 | 117
 *   - operador: string (nome do operador)
 *   - numeroVenda: number | string
 *   - parametros: { sitef_ip, store_id, terminal_id }
 *   - onSucesso: (dadosTef) => void
 *   - onCancelar: () => void
 *   - onErro: (mensagem) => void
 * 
 * 
 */

 
export default function TefModal({
  valor,
  codigoFormaErp,
  operador,
  numeroVenda,     // ← cupom fiscal (ID do TEF)
  venda,           // ← NOVO: número da venda no ERP
  ordem = 1,       // ← NOVO: sequencial do cartão (multi-cartão)
  parametros,
  modo = 'venda',              // ← NOVO: 'venda' | 'cancelar'
  dadosOriginais = null,       // ← NOVO: dadosTef da transação a cancelar
  onSucesso,
  onErro,
  onCancelar,
}) {
  const tema = useTema(); 
  const [mensagem, setMensagem] = useState('Iniciando transação...');
  const [rodape, setRodape] = useState('');
  const [coleta, setColeta] = useState(null);       // { fieldId, fieldMinLength, fieldMaxLength }
  const [valorColeta, setValorColeta] = useState('');
  const [showSimNao, setShowSimNao] = useState(false);
  const [showCancelar, setShowCancelar] = useState(false);
  const [qrCode, setQrCode] = useState(null);
  const [aguardando, setAguardando] = useState(false);
  const [erro, setErro] = useState(null);
  const [finalizado, setFinalizado] = useState(false);
  const [menu, setMenu] = useState(null); // { opcoes: [{indice, texto}, ...] }
  const [resultado, setResultado] = useState(null); // { sucesso, dados?, erro? }
  const [imprimirViaCliente, setImprimirViaCliente] = useState(true);

  const sessaoRef = useRef({
    sessionId: null,
    continua: 0,
    cupomFiscal: String(Date.now()),
    dataFiscal: '',
    horaFiscal: '',
    ret: [],
  });
  const coletaInputRef = useRef(null);

  const escolherMenu = (indice) => {
    setMenu(null);
    continuar(String(indice));
  };

  // Mapeia código do botão (tela) → forma_pgto gravada em vendas_tef/nfce_tef (tPag SEFAZ)
  const FORMA_TELA_PARA_BD = {
    4:   3,     // Crédito
    5:   4,     // Débito
    117: 17,    // PIX
  };

  function formaParaBd(codigoTela) {
    return FORMA_TELA_PARA_BD[codigoTela] || null;
  }

  // ============================================================
  // INÍCIO
  // ============================================================
  const iniciadoRef = useRef(false);

  useEffect(() => {
    if (iniciadoRef.current) return;   // ✅ bloqueia 2ª execução
    iniciadoRef.current = true;
    iniciar();
  }, []);

   const iniciar = async () => {
    const { data, hora } = tefService.dataHoraFiscal();
    sessaoRef.current.dataFiscal = data;
    sessaoRef.current.horaFiscal = hora;

    let functionId;
    let parametrosAdicionais = '';

    if (modo === 'cancelar') {
      functionId = 200;
      if (typeof tefService.montarParametrosCancelamento === 'function') {
        parametrosAdicionais = tefService.montarParametrosCancelamento(
          dadosOriginais, valor, venda
        );
      } else {
        console.error('[TEF] montarParametrosCancelamento não existe em tefService');
        setErro('Função de cancelamento não implementada em tefService');
        return;
      }
    } else {
      functionId = tefService.formaParaFunctionId(codigoFormaErp);
      parametrosAdicionais = tefService.parametrosAdicionais(codigoFormaErp);
    }

    if (!functionId) {
      setErro('Forma de pagamento não suportada pelo TEF (cod=' + codigoFormaErp + ')');
      return;
    }

    try {
      const resp = await tefService.startTransaction({
        sitefIp: parametros.sitef_ip,
        storeId: parametros.store_id,
        terminalId: parametros.terminal_id,
        functionId,
        trnAmount: Number(valor).toFixed(2),
        taxInvoiceNumber: sessaoRef.current.cupomFiscal,
        taxInvoiceDate: data,
        taxInvoiceTime: hora,
        cashierOperator: operador || 'OPERADOR',
        trnAdditionalParameters: parametrosAdicionais,
      });

      if (resp.serviceStatus !== 0) {
        setErro(`Agente ocupado: ${resp.serviceStatus} — ${resp.serviceMessage}`);
        return;
      }
      if (resp.clisitefStatus !== 10000) {
        setErro(`Retorno ${resp.clisitefStatus} da CliSiTef`);
        return;
      }
      
      sessaoRef.current.sessionId = resp.sessionId;

      console.log('[PIX-DEBUG] startTransaction resp:', JSON.stringify(resp, null, 2));
      console.log('[PIX-DEBUG] trnAdditionalParameters enviado:', parametrosAdicionais);
      continuar('');
    } catch (err) {
      console.error('Erro startTransaction:', err);
      setErro(
        'Não foi possível conectar ao agente TEF (porta 8443).\n\n' +
        'Abra https://127.0.0.1:8443/agente/clisitef/state no navegador e aceite o certificado.\n\n' +
        err.message
      );
    }
  };
  // ============================================================
  // CONTINUE — loop principal
  // ============================================================
  const continuar = useCallback(async (dados = '') => {
    console.log('[TEF] iniciar() chamado');
    setAguardando(true);
    try {
      const resp = await tefService.continueTransaction({
        sessionId: sessaoRef.current.sessionId,
        data: dados,
        continuar: sessaoRef.current.continua,
      });

      if (resp.serviceStatus !== 0) {
        setErro(`Serviço: ${resp.serviceStatus} — ${resp.serviceMessage}`);
        return;
      }

      console.log('[TEF] startTransaction resp:', resp);
      if (resp.clisitefStatus !== 10000) {
        // Finalizou (sucesso ou erro)
        await encerrar(resp.clisitefStatus);
        return;
      }

      // Processa o comando
      processarComando(resp);
    } catch (err) {
      console.error('Erro continueTransaction:', err);
      setErro('Erro na comunicação com o agente: ' + err.message);
    } finally {
      setAguardando(false);
    }
  }, []);

  const processarComando = (data) => {

      // ✅ LOG DE DIAGNÓSTICO
    console.log('[TEF-RAW]',
      'cmd=' + data.commandId,
      'fieldId=' + data.fieldId,
      'buffer=' + JSON.stringify(data.data),
      'min=' + data.fieldMinLength,
      'max=' + data.fieldMaxLength
    );
    // Limpa UI antes de tratar
    setColeta(null);
    setShowSimNao(false);
    setShowCancelar(false);
    setQrCode(null);

    const cmd = data.commandId;

    if (cmd === 0) {
      sessaoRef.current.ret.push({ TipoCampo: data.fieldId, Valor: data.data });

      // ✅ Captura QR Code PIX por padrão BR Code (EMV) — qualquer fieldId
      if (data.data && /^000201/.test(String(data.data)) && String(data.data).length > 80) {
        setQrCode(String(data.data));
      }

      if (data.fieldId === 121) setMensagem('Cupom Estabelecimento:\n' + data.data);
      if (data.fieldId === 122) setMensagem('Cupom Cliente:\n' + data.data);
      continuar('');
      return;
    }

    // Comandos de exibição
    if ([1, 2, 3, 4, 15, 20, 22, 52].includes(cmd)) {
      setMensagem(data.data || '');
    }
    if ([11, 12, 13, 14, 16].includes(cmd)) {
      setMensagem('');
    }

    if ([30, 31, 32, 33, 34, 35, 38].includes(cmd)) {
      // ✅ Mostra o prompt que o SiTef mandou (ex: "Numero de parcelas")
      if (data.data) {
        setMensagem(String(data.data).trim());
      }

      // Heurística: se o prompt fala em parcelas, mostra dica extra
      const texto = String(data.data || '').toLowerCase();
      const dicaParcelas = /parcela/.test(texto)
        ? '\n\nDigite o número de parcelas (ex: 2 para 2x)'
        : '';

      setColeta({
        fieldId: data.fieldId,
        min: data.fieldMinLength,
        max: data.fieldMaxLength,
        dica: dicaParcelas,
      });
      setValorColeta('');
      setTimeout(() => coletaInputRef.current?.focus(), 100);
      return;
    }

    // Comando 20 = Sim/Não
    if (cmd === 20) {
      setShowSimNao(true);
      return;
    }

    // Comando 21 = menu
    if (cmd === 21) {
      const opcoes = String(data.data || '')
        .split(';')
        .map((s) => s.trim())
        .filter(Boolean)
        .map((item) => {
          const idx = item.indexOf(':');
          return {
            indice: idx >= 0 ? item.slice(0, idx).trim() : item,
            texto:  idx >= 0 ? item.slice(idx + 1).trim() : item,
          };
        });

      let opcoesFiltradas = opcoes;

      // ✅ Crédito: mostra só À Vista / Parcelado Estab / Parcelado Adm
      if (codigoFormaErp === 4) {
        opcoesFiltradas = opcoes.filter((o) => ['1', '2', '3'].includes(o.indice));
      }

      // ✅ Débito: força à vista (auto-seleciona o "À Vista" se existir)
      if (codigoFormaErp === 5) {
        const aVista = opcoes.find(
          (o) => /a\s*vista/i.test(o.texto) || o.indice === '1'
        );
        if (aVista) {
          console.log('[TEF-MENU] Débito → auto-selecionando', aVista);
          continuar(aVista.indice);
          return;
        }
      }

      // ✅ Se sobrou só uma opção, auto-seleciona (qualquer forma)
      if (opcoesFiltradas.length === 1) {
        console.log('[TEF-MENU] única opção → auto', opcoesFiltradas[0]);
        continuar(opcoesFiltradas[0].indice);
        return;
      }

      console.log('[TEF-MENU] opções:', opcoesFiltradas);
      setMenu({ opcoes: opcoesFiltradas });
      return;
    }

    // Comando 22 = aguardar Enter
    if (cmd === 22) {
      setMensagem(data.data + '\n\n(Pressione ENTER)');
      return;
    }

    // Comando 23 = botão Cancelar
    if (cmd === 23) {
      setShowCancelar(true);
      setTimeout(() => { sessaoRef.current.continua = 0; continuar(''); }, 500);
      return;
    }

    // Comando 29 = coleta direta (sem intervenção do operador)
    if (cmd === 29) {
      let resposta = '';

      // CPF / CNPJ
      if (data.fieldId === 2967) resposta = '7';        // 7 = CPF
      else if (data.fieldId === 2968) resposta = '11';  // min
      else if (data.fieldId === 2969) resposta = '11';  // max
      else if (data.fieldId === 2970) resposta = '0';   // timeout infinito
      // Estabelecimento / TUI CSS
      else if (data.fieldId === 512)  resposta = '009016';
      else if (data.fieldId === 2606) resposta = '0';
      else if (data.fieldId === 2607) resposta = '0';
      else if (data.fieldId === 2609) resposta = '';    // semente hash (vazio = default)

      console.log('[TEF-CMD29] fieldId=%s resposta=%s', data.fieldId, resposta);
      continuar(resposta);
      return;
    }

    if (cmd === 50) {
      if (data.data && String(data.data).length > 80) {
        setQrCode(String(data.data));
      }
      continuar('');
      return;
    }
    
    if (cmd === 51) {
      setQrCode(null);
      continuar('');
      return;
    }

    // Fallback
    continuar('');
  };

  // ============================================================
  // FINALIZAÇÃO
  // ============================================================
  const encerrar = async (cliStatus) => {
    const confirm = cliStatus === 0 ? 1 : 0;

    try {
      await tefService.finishTransaction({
        sessionId: sessaoRef.current.sessionId,
        confirm,
        taxInvoiceNumber: sessaoRef.current.cupomFiscal,
        taxInvoiceDate: sessaoRef.current.dataFiscal,
        taxInvoiceTime: sessaoRef.current.horaFiscal,
      });
    } catch (err) {
      console.warn('Erro finishTransaction:', err);
    }

    if (cliStatus === 0) {
      const ret = sessaoRef.current.ret;
      const pegar = (tipo) => {
        const item = ret.find((r) => Number(r.TipoCampo) === tipo);
        return item ? String(item.Valor).trim() : '';
      };

      const dhCartao = pegar(105);
      let dataCartao = '', horaCartao = '';
      if (dhCartao.length >= 14) {
        dataCartao = `${dhCartao.slice(6,8)}/${dhCartao.slice(4,6)}/${dhCartao.slice(0,4)}`;
        horaCartao = `${dhCartao.slice(8,10)}:${dhCartao.slice(10,12)}:${dhCartao.slice(12,14)}`;
      }

      const nomeBandeira = pegar(156).toUpperCase();
      const bandeiraMapa = {
        'MASTERCARD': '01', 'VISA': '02', 'ELO': '03',
        'AMEX': '04', 'HIPERCARD': '05', 'DINERS': '06',
      };
      const codigoBandeira = bandeiraMapa[nomeBandeira] || '99';
      const tipoFinan = pegar(101).toLowerCase().includes('debito') ? '02' : '01';

      let tipoTef = 'C';
      if (codigoFormaErp === 5)   tipoTef = 'D';
      if (codigoFormaErp === 117) tipoTef = 'P';

      const dadosTef = {
        clisitefStatus: cliStatus,
        nsu: pegar(133) || pegar(131),
        autorizacao: pegar(136),
        bandeira: codigoBandeira,
        bandeiraNome: nomeBandeira,
        credenciadora: pegar(950),
        dataCartao,
        horaCartao,
        codigoTransacao: pegar(134) || pegar(200),
        tipoFinan,
        tipo: tipoTef,
        modalidade: pegar(102),
        qtdParcelas: pegar(155) || '1',
        valorPago: Number(valor).toFixed(2),
        cupomFiscal: sessaoRef.current.cupomFiscal,
        dataFiscal: sessaoRef.current.dataFiscal,
        horaFiscal: sessaoRef.current.horaFiscal,
        estabelecimento: pegar(157),
        cupomEstabelecimento: pegar(121),
        cupomCliente: pegar(122),
        formaPagto: formaParaBd(codigoFormaErp),
        formaPagtoTela: codigoFormaErp,
        idTerminal: parametros?.terminal_id || '00000065',
        retornoCompleto: ret,
      };


      // Dentro da função 'encerrar', após montar o 'dadosTef'
      const tipoVoucher = pegar(546); // Campo 546 = Tipo do produto Voucher

      // Mapeia o tipo do SiTef para o código tPag da SEFAZ
      let tPagSefaz = null;
      if (tipoVoucher === '01') { // 01 = Alimentação
        tPagSefaz = 10;
      } else if (tipoVoucher === '02') { // 02 = Refeição
        tPagSefaz = 11;
      }

      // Adiciona ao objeto que será gravado no banco
      if (tPagSefaz) {
        dadosTef.formaPagto = tPagSefaz; // Sobrescreve o 'forma_pgto' padrão
      }

      if (venda) {
        try {
          await tefService.gravarVendasTef(dadosTef, venda, ordem);
          await tefService.gravarVendasTefComprovante(dadosTef, venda, ordem);
          console.log('[TEF] Gravado: venda', venda, 'ordem', ordem);
        } catch (err) {
          console.error('[TEF] Erro ao gravar no banco:', err);
        }
      }

      if (modo === 'cancelar') {
        try {
          await tefService.cancelarVendasTef({
            venda,
            ordem,
            motivo: 'Cancelamento via PDV',
          });
        } catch (err) {
          console.error('[TEF] Erro cancelVendasTef:', err);
          setResultado({
            sucesso: false,
            erro: 'TEF cancelou, mas falhou ao gravar no banco: ' + err.message,
          });
          return;
        }
      } else {
        // Fluxo de VENDA: grava em vendas_tef (como hoje)
        if (venda) {
          try {
            await tefService.gravarVendasTef(dadosTef, venda, ordem);
            await tefService.gravarVendasTefComprovante(dadosTef, venda, ordem);
            console.log('[TEF] Gravado: venda', venda, 'ordem', ordem);
          } catch (err) {
            console.error('[TEF] Erro ao gravar no banco:', err);
          }
        }
      }

      // ✅ Auto: imprime via estabelecimento (sempre)
      if (modo === 'venda' && dadosTef.cupomEstabelecimento) {
        await imprimirTexto(dadosTef.cupomEstabelecimento, 'Via Estabelecimento');
      }

      console.log('[TEF-DEBUG]',
        'estab.len=' + (dadosTef.cupomEstabelecimento || '').length,
        'cliente.len=' + (dadosTef.cupomCliente || '').length,
        'checkbox_state=' + imprimirViaCliente
      );

      // ✅ Novo: mostra tela de sucesso, só chama onSucesso quando o user clicar OK
      setResultado({ sucesso: true, dados: dadosTef });
    } else {
      setResultado({ sucesso: false, erro: `Transação não autorizada (${cliStatus})` });
    }
  };

  const handleFecharResultado = async () => {
    const r = resultado;
    setResultado(null);

    // ✅ Imprime via cliente se checkbox marcado
    if (r?.sucesso && imprimirViaCliente && r.dados?.cupomCliente) {
      await imprimirTexto(r.dados.cupomCliente, 'Via Cliente');
    }

    if (!r) return;
    if (r.sucesso) {
      onSucesso?.(r.dados);
    } else {
      onErro?.(r.erro);
    }
  };

  // ============================================================
  // AÇÕES DO USUÁRIO
  // ============================================================
  const confirmarColeta = () => {
    if (!coleta) return;
    const valor = valorColeta.replace(',', '');
    setColeta(null);
    continuar(valor);
  };

  const handleColetaKeyDown = (e) => {
    if (e.key === 'Enter') confirmarColeta();
  };

  const responderSimNao = (valor) => {
    setShowSimNao(false);
    continuar(String(valor));
  };

  const cancelarTransacao = () => {
    sessaoRef.current.continua = -1;
    continuar('');
  };

  const imprimirTexto = async (texto, titulo = 'Comprovante TEF') => {
    try {
      if (!texto || !String(texto).trim()) {
        console.warn('[TEF] Comprovante vazio, ignorando');
        return;
      }

      const safe = String(texto).replace(/[<>&]/g, (c) => (
        { '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]
      ));

      const html = `<!DOCTYPE html>
    <html>
    <head>
    <meta charset="utf-8">
    <title>${titulo}</title>
    <style>
      @page { size: 80mm auto; margin: 0; }
      html, body { margin: 0; padding: 0; }
      body {
        font-family: 'Courier New', 'Lucida Console', monospace;
        font-size: 11px;
        line-height: 1.25;
        padding: 3mm 2mm;
        width: 72mm;
      }
      pre { margin: 0; white-space: pre-wrap; word-wrap: break-word; font-family: inherit; }
    </style>
    </head>
    <body><pre>${safe}</pre></body>
    </html>`;

      // Caminho 1: Electron (silencioso)
      if (window.electronAPI?.printCupom) {
        try {
          const r = await window.electronAPI.printCupom(html);
          if (!r?.success) console.warn('[TEF] Impressão falhou:', r?.failureReason);
        } catch (e) {
          console.error('[TEF] print electron erro:', e);
        }
        return;
      }

      // Caminho 2: fallback navegador (dev)
            // Caminho 2: fallback navegador (dev) — via iframe (não é bloqueado)
      console.warn('[TEF] electronAPI ausente — usando fallback iframe');
      const iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.right = '0';
      iframe.style.bottom = '0';
      iframe.style.width = '0';
      iframe.style.height = '0';
      iframe.style.border = '0';
      iframe.style.visibility = 'hidden';
      document.body.appendChild(iframe);

      const doc = iframe.contentWindow.document;
      doc.open();
      doc.write(html);
      doc.close();

      setTimeout(() => {
        try {
          iframe.contentWindow.focus();
          iframe.contentWindow.print();
        } catch (e) {
          console.warn('[TEF] print falhou:', e);
        }
        setTimeout(() => {
          try { document.body.removeChild(iframe); } catch (e) {}
        }, 3000);
      }, 300);
    } catch (e) {
      console.error('[TEF] imprimirTexto falhou:', e);
      // ⚠️ NÃO propagar — impressão nunca pode bloquear a venda
    }
  };

  // ============================================================
  // RENDER
  // ============================================================
  return (
    <div className="tef-overlay">
      <div className="tef-content" 
      style={{
        '--tema-cor': tema.cor,
        '--tema-cor-suave': tema.corSuave,
      }}>
        <div className="tef-header">
          <div className="tef-titulo">
            {modo === 'cancelar' ? '🔄 Cancelamento TEF' : '💳 Transação TEF'}
          </div>
          <div className="tef-sub">R$ {Number(valor).toFixed(2)}</div>
        </div>

        {erro ? (
          <div className="tef-erro">
            <div className="tef-erro-titulo">❌ Erro</div>
            <div className="tef-erro-msg">{erro}</div>
            <button className="tef-btn tef-btn-cinza" onClick={onCancelar}>
              Fechar
            </button>
          </div>
       ) : resultado ? (
          <div className="tef-resultado">
            {resultado.sucesso ? (
              <>
                <div className="tef-resultado-icone" style={{ fontSize: 48 }}>✅</div>
                <div className="tef-resultado-titulo" style={{ fontSize: 20, fontWeight: 'bold', margin: '12px 0' }}>
                   {modo === 'cancelar' ? 'Cancelamento Aprovado' : 'Transação Aprovada'}
                </div>
                <div className="tef-resultado-info" style={{ textAlign: 'left', padding: 12, background: '#f4f4f4', borderRadius: 8 }}>
                  <div><strong>Valor:</strong> R$ {Number(valor).toFixed(2)}</div>
                  <div><strong>NSU:</strong> {resultado.dados.nsu}</div>
                  <div><strong>Autorização:</strong> {resultado.dados.autorizacao}</div>
                  <div><strong>Bandeira:</strong> {resultado.dados.bandeiraNome}</div>
                  {resultado.dados.qtdParcelas && resultado.dados.qtdParcelas !== '1' && (
                    <div><strong>Parcelas:</strong> {resultado.dados.qtdParcelas}</div>
                  )}
                </div>
                {modo === 'venda' && resultado.dados.cupomCliente && (
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginTop: 16,
                    padding: 10,
                    background: '#f4f4f4',
                    borderRadius: 8,
                    cursor: 'pointer',
                    fontSize: 14,
                  }}>
                    <input
                      type="checkbox"
                      checked={imprimirViaCliente}
                      onChange={(e) => setImprimirViaCliente(e.target.checked)}
                      style={{ width: 18, height: 18 }}
                    />
                    <span>Imprimir via do cliente</span>
                  </label>
                )}
                <button
                  className="tef-btn tef-btn-primario"
                  onClick={handleFecharResultado}
                  style={{ marginTop: 16, width: '100%' }}
                >
                  OK
                </button>
              </>
            ) : (
              <>
                <div className="tef-resultado-icone" style={{ fontSize: 48 }}>❌</div>
                <div className="tef-resultado-titulo" style={{ fontSize: 20, fontWeight: 'bold', margin: '12px 0' }}>
                  Transação Aprovada
                </div>
                <div className="tef-resultado-info" style={{ padding: 12 }}>
                  {resultado.erro}
                </div>
                <button
                  className="tef-btn tef-btn-cinza"
                  onClick={handleFecharResultado}
                  style={{ marginTop: 16, width: '100%' }}
                >
                  Fechar
                </button>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="tef-mensagem">{mensagem}</div> 

            {qrCode && (
              <div className="tef-qrcode-wrap">
                <div className="tef-qrcode-titulo">Escaneie o QR Code PIX:</div>
                <QRCodeSVG value={qrCode} size={220} />
              </div>
            )}

            {coleta && (
              <div className="tef-coleta">
                <input
                  ref={coletaInputRef}
                  type="text"
                  className="tef-input"
                  value={valorColeta}
                  onChange={(e) => setValorColeta(e.target.value)}
                  onKeyDown={handleColetaKeyDown}
                  placeholder={`Entre ${coleta.min} e ${coleta.max} caracteres`}
                  maxLength={coleta.max}
                />
                {coleta.dica && (
                  <div className="tef-coleta-dica" style={{ fontSize: 12, color: '#666', marginTop: 4, whiteSpace: 'pre-line' }}>
                    {coleta.dica}
                  </div>
                )}
                <button className="tef-btn tef-btn-primario" onClick={confirmarColeta}>OK</button>
              </div>
            )}

            {showSimNao && (
              <div className="tef-simnao">
                <button className="tef-btn tef-btn-primario" onClick={() => responderSimNao(0)}>Sim</button>
                <button className="tef-btn tef-btn-cinza" onClick={() => responderSimNao(1)}>Não</button>
              </div>
            )}

            {showCancelar && (
              <div className="tef-cancelar">
                <button className="tef-btn tef-btn-vermelho" onClick={cancelarTransacao}>
                  Cancelar Transação
                </button>
              </div>
            )}

            {menu && (
              <div className="tef-menu">
                {menu.opcoes.map((o) => (
                  <button
                    key={o.indice}
                    className="tef-btn tef-btn-primario"
                    style={{ display: 'block', width: '100%', margin: '4px 0' }}
                    onClick={() => escolherMenu(o.indice)}
                  >
                    {o.texto}
                  </button>
                ))}
              </div>
            )}

            {aguardando && !coleta && !showSimNao && (
              <div className="tef-aguardando">⏳ Aguardando PinPad...</div>
            )}

            <div className="tef-footer">
              <button className="tef-btn tef-btn-cinza" onClick={onCancelar}>
                Cancelar
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}