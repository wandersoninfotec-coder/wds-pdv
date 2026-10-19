import api from './api';
import { API_CONFIG, getEmpresa } from '../config';

export const produtoService = {
  // Lista produtos (com busca opcional)
  listar: async (busca = '') => {
    const response = await api.post(API_CONFIG.endpoints.produtosListar, {
      empresa: getEmpresa(),
      texto: busca
    });
    return response.data;
  },
  
  buscarExato: async (codigo) => {
    const r = await api.post('/app/produtoBuscarExato', {
      empresa: getEmpresa(),
      codigo,
    });
    return r.data;
  },

  buscarPorBalança: async (codigo, layout = null) => {
    const payload = { empresa: getEmpresa(), codigo };
    if (layout) payload.layout = layout;
    const r = await api.post('/app/produtoBuscarBalança', payload);
    return r.data;
  },

  // Lista grupos/categorias
  listarGrupos: async () => {
    const response = await api.post(API_CONFIG.endpoints.gruposListar, {
      empresa: getEmpresa()
    });
    return response.data;
  }
};