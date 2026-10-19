// src/services/notaService.js
import api from './api';
import { getEmpresa } from '../config';

export const notaService = {
  /**
   * Lista NFC-e emitidas no período.
   */
  listar: async ({ dataIni, dataFim, status = null, limit = 200 } = {}) => {
    const response = await api.post('/app/nfceListar', {
      empresa: getEmpresa(),
      data_ini: dataIni,
      data_fim: dataFim,
      status,
      limit,
    });
    return response.data;
  },

  /**
   * Busca detalhes completos de uma NFC-e (mesmo endpoint do cupom).
   */
  detalhes: async (numeroNfce) => {
    const response = await api.post('/app/nfceDadosImpressao', {
      empresa: getEmpresa(),
      numero_nfce: numeroNfce,
    });
    return response.data;
  },

  /**
   * Diagnóstico de rejeição (cStat → dica).
   */
  diagnostico: async (numeroNfce) => {
    const response = await api.post('/app/nfceDiagnostico', {
      empresa: getEmpresa(),
      numero_nfce: numeroNfce,
    });
    return response.data;
  },

  /**
   * Cancela uma NFC-e autorizada.
   */
  cancelar: async (numeroNfce, justificativa, usuario) => {
    const response = await api.post('/app/nfceCancelar', {
      empresa: getEmpresa(),
      numero_nfce: numeroNfce,
      justificativa,
      usuario,
    });
    return response.data;
  },

  /**
   * Inutiliza uma faixa de numeração.
   */
  inutilizar: async ({ numeroIni, numeroFim, serie = 1, justificativa }) => {
    const response = await api.post('/app/nfceInutilizar', {
      empresa: getEmpresa(),
      numero_ini: numeroIni,
      numero_fim: numeroFim,
      serie,
      justificativa,
    });
    return response.data;
  },
};