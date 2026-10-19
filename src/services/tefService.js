// src/services/tefService.js
import { getEmpresa } from '../config';
import api from './api';

const AGENT_BASE = 'https://127.0.0.1:8443/agente/clisitef';

/**
 * Helper: chama o agente local (HTTPS + self-signed).
 * O usuário precisa aceitar o certificado 1x no navegador.
 */
async function agentFetch(endpoint, { method = 'POST', body = null, params = null } = {}) {
  let url = `${AGENT_BASE}${endpoint}`;
  if (params) {
    const qs = new URLSearchParams(params).toString();
    url += `?${qs}`;
  }

  const options = {
    method,
    headers: { 'Accept': 'application/json' },
  };

  if (body) {
    // O agente espera form-urlencoded (não JSON)
    options.headers['Content-Type'] = 'application/x-www-form-urlencoded';
    options.body = new URLSearchParams(body).toString();
  }

  const response = await fetch(url, options);
  if (!response.ok) {
    throw new Error(`Agente CliSiTef retornou HTTP ${response.status}`);
  }

  const data = await response.json();
  return data;
}

export const tefService = {
  // ============================================================
  // PARÂMETROS DO BACKEND
  // ============================================================

  /**
   * Verifica se a empresa usa TEF.
   */
  verificarAtivo: async () => {
    const r = await api.post('/app/verificarTef', { empresa: getEmpresa() });
    return r.data;
  },

  /**
   * Busca parâmetros TEF (sitef_ip, store_id, terminal_id, agent_url).
   */
  buscarParametros: async () => {
    const r = await api.post('/app/tefParametros', { empresa: getEmpresa() });
    return r.data;
  },

  // ============================================================
  // AGENTE LOCAL
  // ============================================================

  /**
   * Estado do agente.
   */
  estado: () => agentFetch('/state', { method: 'GET' }),

  /**
   * Inicia uma transação TEF.
   */
  startTransaction: ({ sitefIp, storeId, terminalId, functionId, trnAmount, taxInvoiceNumber, taxInvoiceDate, taxInvoiceTime, cashierOperator, trnAdditionalParameters = '', trnInitParameters = '' }) => {
    return agentFetch('/startTransaction', {
      method: 'POST',
      body: {
        sitefIp,
        storeId,
        terminalId,
        functionId,
        trnAmount: String(trnAmount),
        taxInvoiceNumber: String(taxInvoiceNumber),
        taxInvoiceDate: String(taxInvoiceDate),
        taxInvoiceTime: String(taxInvoiceTime),
        cashierOperator,
        trnAdditionalParameters,
        trnInitParameters,
      },
    });

    
  },

  /**
   * Continua uma transação TEF.
   */
    continueTransaction: ({ sessionId, data = '', continuar = 0 }) => {
      console.log('[TEF] continueTransaction →', { sessionId, data, continuar });
      return agentFetch('/continueTransaction', {
          method: 'POST',
          body: { sessionId, data, continue: String(continuar) },
      });
  },

 
   /**
   * Mostra mensagem persistente no PinPad (sobrevive à sessão e à transação).
   */
  mostrarMensagemPinpad: async (mensagem, persistente = true) => {
    const params = await tefService.buscarParametros();
    if (!params?.sucesso) throw new Error('param_tef não configurado');

    const sess = await agentFetch('/session', {
      method: 'POST',
      body: {
        sitefIp: params.sitef_ip,
        storeId: params.store_id,
        terminalId: params.terminal_id,
        sessionParameters: '',
      },
    });

    if (sess.serviceStatus !== 0) {
      throw new Error(`Sessão: ${sess.serviceStatus} — ${sess.serviceMessage}`);
    }

    try {
      return await agentFetch('/pinpad/setDisplayMessage', {
        method: 'POST',
        body: {
          sessionId: sess.sessionId,
          displayMessage: String(mensagem || '').substring(0, 80),
          persistent: persistente ? 'Y' : 'N',
        },
      });
    } finally {
      try { await agentFetch('/session', { method: 'DELETE' }); } catch (_) {}
    }
  },

  /**
   * Centraliza cada linha na largura do PinPad (16 chars).
   */
  centralizarPinpad: (texto, largura = 16) => {
    return String(texto || '')
      .split('\n')
      .map((linha) => {
        const t = String(linha).trim();
        if (t.length >= largura) return t.substring(0, largura);
        const sobra = largura - t.length;
        const esq = Math.floor(sobra / 2);
        const dir = sobra - esq;
        return ' '.repeat(esq) + t + ' '.repeat(dir);
      })
      .join('\n');
  },

  /**
   * Boas-vindas centralizada em 2 linhas de 16 chars.
   * Ex:
   *      BEM-VINDO
   *    PADARIA ZE
   */
  montarBoasVindas: (nomeEmpresa, largura = 16) => {
    const nome = String(nomeEmpresa || 'PDV').toUpperCase().trim();

    // Palavras do nome
    const palavras = nome.split(/\s+/).filter(Boolean);

    // Tenta montar "BEM-VINDO A" + nome em 2 linhas
    let linha1 = 'BEM-VINDO';
    let linha2 = '';

    if (palavras.length === 1) {
      // Nome de uma palavra — corta em até 2 linhas de 16
      const p = palavras[0];
      if (p.length <= largura) {
        linha2 = p;
      } else {
        linha2 = p.substring(0, largura);
        // descarta o resto — cabeçalho do PDV, não precisa nome completo
      }
    } else {
      // Junta as palavras do nome até caber em 1 linha de 16
      let acumulado = '';
      for (const w of palavras) {
        const tentativa = acumulado ? `${acumulado} ${w}` : w;
        if (tentativa.length <= largura) {
          acumulado = tentativa;
        } else {
          break;
        }
      }
      linha2 = acumulado || palavras[0].substring(0, largura);
    }

    return tefService.centralizarPinpad(`${linha1}\n${linha2}`, largura);
  },

  /**
   * Finaliza uma transação TEF.
   */
  finishTransaction: ({ sessionId, confirm = 1, taxInvoiceNumber, taxInvoiceDate, taxInvoiceTime }) => {
    return agentFetch('/finishTransaction', {
      method: 'POST',
      body: {
        sessionId,
        confirm: String(confirm),
        taxInvoiceNumber: String(taxInvoiceNumber),
        taxInvoiceDate: String(taxInvoiceDate),
        taxInvoiceTime: String(taxInvoiceTime),
      },
    });
  },

  // ============================================================
  // HELPERS
  // ============================================================

  /**
   * Mapeia código do botão (tela) → functionId do SiTef.
   */
 // src/services/tefService.js (CORRIGIDO)
  // em tefService.js
  formaParaFunctionId: (codigoErp) => {
    const mapa = {
      4: 3,     // Crédito
      5: 2,     // Débito
      6: 5,     // ✅ Cartão Benefício (Alimentação/Refeição)
      117: 122, // PIX
    };
    return mapa[Number(codigoErp)] || null;
  },

  /**
   * Parâmetros adicionais (trnAdditionalParameters) por forma de pagamento.
   * Retorna a string que vai em `trnAdditionalParameters`.
   */
  parametrosAdicionais: (codigoErp) => {
    const cod = Number(codigoErp);

    // CRÉDITO → bloqueia Crediário e Consulta Parcelamento no menu do SiTef
    // (códigos 44 = Crédito Parcelado CDC, 74 = Consulta)
    if (cod === 4) {
      return '[44;74;]';
    }

    // DÉBITO → bloqueia pré-datado / parcelado / CDC
    if (cod === 5) {
      return '[17;18;19;]';
    }

    // PIX
    if (cod === 117) {
      return '{DevolveStringQRCode=1}{CarteirasDigitaisHabilitadas=60110024}{CarteirasDigitaisPriorizadasMenuFixo=60110024}';
    }

    return '';
  },

  /**
   * Monta data/hora fiscal no formato do agente.
   * taxInvoiceDate: AAAAMMDD | taxInvoiceTime: HHMMSS
   */
  dataHoraFiscal: () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, '0');
    return {
      data: `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`,
      hora: `${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}`,
    };
  },

  // ============================================================
  // GRAVAÇÃO NO BACKEND
  // ============================================================

  /**
   * Grava transação TEF em vendas_tef (banco).
   */
  gravarVendasTef: async (dadosTef, venda, ordem = 1) => {
    const r = await api.post('/app/gravarVendasTef', {
      empresa: getEmpresa(),
      venda,
      parcela: 0,
      ordem,
      codigo: dadosTef.nsu || dadosTef.cupomFiscal,
      forma_pgto: dadosTef.formaPagto,
      credenciadora: dadosTef.credenciadora,
      bandeira: dadosTef.bandeira,
      codigo_transacao: dadosTef.codigoTransacao,
      valor: Number(dadosTef.valorPago),
      troco: 0,
      tipo: dadosTef.tipo === 'D' ? 'D' : (dadosTef.formaPagto === 117 ? 'P' : 'C'),
      nsu: dadosTef.nsu,
      data_c: dadosTef.dataCartao,
      hora_c: dadosTef.horaCartao,
      tipo_finan: dadosTef.tipoFinan,
      modalidade: dadosTef.modalidade,
      rede_adquirente: dadosTef.bandeiraNome,
      qtd_parcelas: parseInt(dadosTef.qtdParcelas || 1, 10),
      cancelado: 0,
      id_terminal: dadosTef.idTerminal || '00000065',
      codigo_controle: dadosTef.cupomFiscal,
    });
    return r.data;
  },

  /**
   * Grava comprovante TEF em vendas_tef_comprovante.
   */
  gravarVendasTefComprovante: async (dadosTef, venda, ordem = 1) => {
    const r = await api.post('/app/gravarVendasTefComprovante', {
      empresa: getEmpresa(),
      venda,
      parcela: 0,
      ordem,
      codigo: dadosTef.nsu || dadosTef.cupomFiscal,
      via_completa: dadosTef.cupomEstabelecimento || '',
      via_cliente: dadosTef.cupomCliente || '',
      via_estabelecimento: dadosTef.cupomEstabelecimento || '',
    });
    return r.data;
  },

    /**
   * Cancela uma transação TEF gravada no banco (marca cancelado=1).
   */
  cancelarVendasTef: async ({ venda, ordem, motivo }) => {
    const r = await api.post('/app/cancelarVendasTef', {
      empresa: getEmpresa(),
      venda,
      ordem,
      motivo: motivo || 'Cancelamento via PDV',
    });
    return r.data;
  },

  /**
   * Monta a string de ParamAdic (trnAdditionalParameters) para
   * cancelamento TEF (função 200). Baseado no dump CNC do ERP legado.
   */
  montarParametrosCancelamento: (tefOriginal, valorOriginal) => {
    const limpa = (s) => String(s || '').replace(/\D/g, '');

    const dataC = limpa(tefOriginal.dataCartao);   // "22/06/2026" → "22062026"
    const horaC = limpa(tefOriginal.horaCartao);   // "16:02:10"   → "160210"
    const valorCentavos = Math.round(Number(valorOriginal) * 100);

    const mapaFormaLabel = {
      3:  'Credito',
      4:  'Debito',
      10: 'Alimentacao',
      11: 'Refeicao',
      17: 'Pix',
    };
    const formaLabel = mapaFormaLabel[Number(tefOriginal.formaPagto)] || 'Cartao';
    const codigoOriginal = tefOriginal.nsu || tefOriginal.codigoTransacao || '';

    return [
      '000-000 = CNC',
      '001-000 = ' + String(venda),                    // ← ver dúvida abaixo
      '003-000 = ' + valorCentavos,
      '004-000 = 0',
      '010-000 = ' + formaLabel,
      '012-000 = ' + codigoOriginal,
      '022-000 = ' + dataC,
      '023-000 = ' + horaC,
      '999-999 = 0',
    ].join('\r\n');
  },

};