// src/services/diagnosticoService.js
import api from './api';
import { getEmpresa } from '../config';

export const diagnosticoService = {
  produtos: async (diasAtras = 90) => {
    const response = await api.post('/app/diagnosticoProdutos', {
      empresa: getEmpresa(),
      dias_atras: diasAtras,
    });
    return response.data;
  },
};