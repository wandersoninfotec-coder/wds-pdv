// src/services/jobService.js
import api from './api';
import { getEmpresa } from '../config';

export const jobService = {
  status: async (dias = 7) => {
    const response = await api.post('/app/jobStatus', {
      empresa: getEmpresa(),
      dias,
    });
    return response.data;
  },

  dispararContingencia: async (limite = 100) => {
    const response = await api.post('/app/nfceReprocessarContingencia', {
      empresa: getEmpresa(),
      limite,
    });
    return response.data;
  },

  dispararRejeitadas: async (forcarInutilizacao = false, limiteFaixas = 30) => {
    const response = await api.post('/app/nfceReprocessarRejeitadas', {
      empresa: getEmpresa(),
      forcar_inutilizacao: forcarInutilizacao,
      limite_faixas: limiteFaixas,
    });
    return response.data;
  },
};