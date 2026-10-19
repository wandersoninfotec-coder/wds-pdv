// src/services/relatorioService.js
import api from './api';
import { getEmpresa } from '../config';

export const relatorioService = {
  vendas: async (periodo = 'hoje') => {
    try {
      const response = await api.post('/app/relatoriosVendas', {
        empresa: getEmpresa(),
        periodo,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
      throw error;
    }
  },
};