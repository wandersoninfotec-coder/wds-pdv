import api from './api';
import { getEmpresa } from '../config';


export const caixaService = {
  listar: async ({ caixa = '1', data } = {}) => {
    const r = await api.post('/app/caixaListar', {
      empresa: getEmpresa(),
      caixa,
      data: data || new Date().toISOString().slice(0, 10),
    });
    return r.data;
  },
    caixaInfo: async (caixa = '1') => {
    const r = await api.post('/app/caixaInfo', {
      empresa: getEmpresa(),
      caixa,
    });
    return r.data;
  },

  caixaAbrir: async ({ caixa = '1', usuario, valorAbertura = 0, historico = 'Abertura via PDV' }) => {
    const r = await api.post('/app/caixaAbrir', {
      empresa: getEmpresa(),
      caixa,
      usuario,
      valorAbertura,
      historico,
    });
    return r.data;
  },

  caixaFechar: async ({ caixa = '1', usuario, valorFechamento, historico = 'Fechamento via PDV' }) => {
    const payload = {
      empresa: getEmpresa(),
      caixa,
      usuario,
      historico,
    };
    if (valorFechamento !== undefined && valorFechamento !== null) {
      payload.valorFechamento = valorFechamento;
    }
    const r = await api.post('/app/caixaFechar', payload);
    return r.data;
  },

    /**
   * Verifica se o caixa pode receber venda.
   * Retorna { pode: true } ou { pode: false, motivo, precisaAbrir, precisaFecharOntem, info }.
   */
  podeVender: async (caixa = '1') => {
    const r = await caixaService.caixaInfo(caixa);
    if (!r.sucesso) {
      return { pode: false, motivo: r.erro || 'Erro ao consultar caixa' };
    }

    // Modo AUTO: sempre pode
    if (!r.controlaManual) {
      return { pode: true, info: r };
    }

    // Modo MANUAL: precisa lote aberto E ser de hoje
    if (!r.loteAtivo) {
      return { pode: false, motivo: 'caixa_fechado', precisaAbrir: true, info: r };
    }

    if (!r.loteAtivo.ehDeHoje) {
      return { pode: false, motivo: 'aberto_ontem', precisaFecharOntem: true, info: r };
    }

    return { pode: true, info: r };
  },
};