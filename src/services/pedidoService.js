import api from './api';
import { API_CONFIG, getEmpresa } from '../config';

export const pedidoService = {
  /**
   * Lista os itens de uma venda
   */
  listarItens: async (venda) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.itemListar, {
        empresa: getEmpresa(),
        venda: venda,
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar itens:', error);
      throw error;
    }
  },

    /**
   * Lista grupos/categorias de produtos
   */
  listarGrupos: async () => {
    try {
      const response = await api.post(API_CONFIG.endpoints.gruposListar, {
        empresa: getEmpresa(),
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar grupos:', error);
      return [];
    }
  },

  // Adicionar Item
  adicionarItem: async (item) => {
    try {
      const response = await api.post('/app/itemAdicionarSeguro', {
        empresa: getEmpresa(),
        venda: item.venda,
        referencia: item.referencia,
        descricao: item.descricao,
        quantidade: item.quantidade,
        preco: item.preco,
        total_liquido: item.preco * item.quantidade,
        total_bruto: item.preco * item.quantidade,
        vendedor: item.vendedor || 1,
        observacao: item.observacao || '',
      });
      return response.data;
    } catch (error) {
      // 409 = venda fechada pelo PDV
      if (error.response?.status === 409) {
        const erro = new Error('VENDA_FECHADA');
        erro.tipo = 'VENDA_FECHADA';
        erro.mensagem = error.response.data?.erro || 'Venda foi fechada no PDV';
        throw erro;
      }
      // 404 = venda não existe
      if (error.response?.status === 404) {
        const erro = new Error('VENDA_NAO_ENCONTRADA');
        erro.tipo = 'VENDA_NAO_ENCONTRADA';
        throw erro;
      }
      throw error;
    }
  },

  paramVendas: async () => {
    const r = await api.post('/app/paramVendas', { empresa: getEmpresa() });
    return r.data;
  },

  reconciliarPrecos: async (venda, referencia) => {
    const r = await api.post('/app/reconciliarPrecos', {
      empresa: getEmpresa(),
      venda,
      referencia,
    });
    return r.data;
  },

  // Adiciona este método dentro do objeto pedidoService
  cancelarMesa: async (venda, usuario = 1) => {
    const response = await api.post('/app/vendaCancelar', {
      empresa: getEmpresa(),
      venda,
      usuario,
    });
    return response.data;
  },

  /**
   * Remove/cancela um item
   */
    removerItem: async (venda, item, referencia = null) => {
    try {
      const itemId = (item && typeof item === 'object')
        ? (item.item || item.id)
        : item;
      const ref = referencia
        || (item && typeof item === 'object' ? item.referencia : null);

      const response = await api.post(API_CONFIG.endpoints.itemCancelar, {
        empresa: getEmpresa(),
        venda: venda,
        item: itemId,
      });

      // Recalcula preços do produto após remoção (promoção por quantidade)
      if (ref) {
        try {
          await api.post('/app/reconciliarPrecos', {
            empresa: getEmpresa(),
            venda: venda,
            referencia: ref,
          });
        } catch (e) {
          console.warn('[pedidoService] Reconciliação falhou:', e.message);
        }
      }

      return response.data;
    } catch (error) {
      console.error('Erro ao remover item:', error);
      throw error;
    }
  },


};