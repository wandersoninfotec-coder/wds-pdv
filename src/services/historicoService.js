// src/services/historicoService.js
import api from './api';
import { getEmpresa } from '../config';

export const historicoService = {
  listar: async (periodo = 'hoje', status = 'todas', mesa = null) => {
    try {
      const body = {
        empresa: getEmpresa(),
        periodo,
        status,
      };

      // ✅ Só envia o filtro de mesa se estiver preenchido
      if (mesa) {
        body.mesa = mesa;
      }

      const response = await api.post('/app/historicoListar', body);
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar histórico:', error);
      throw error;
    }
  },

  detalhes: async (venda) => {
    try {
      const response = await api.post('/app/historicoDetalhes', {
        empresa: getEmpresa(),
        venda,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao carregar detalhes:', error);
      throw error;
    }
  },
};