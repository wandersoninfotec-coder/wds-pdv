// src/services/pagamentoService.js
import api from './api';
import { getEmpresa } from '../config';

const FORMAS_PADRAO = [
  { codigo: 1,   nome: 'Dinheiro', icone: '💵', precisa_valor: true  },
  { codigo: 4,   nome: 'Crédito',  icone: '💳', precisa_valor: false },
  { codigo: 5,   nome: 'Débito',   icone: '💳', precisa_valor: false },
  { codigo: 117, nome: 'PIX',      icone: '📱', precisa_valor: false },
];
export const pagamentoService = {
  listarFormas: async () => FORMAS_PADRAO,

  finalizarVenda: async ({ venda, usuario, formas, valorDesconto, cliente, origem = 'FACILIT' }) => {
    try {
      const response = await api.post('/app/finalizarVenda', {
        empresa: getEmpresa(),
        venda,
        usuario,
        cliente,
        valor_desconto: valorDesconto,
        origem,
        formas: formas.map((f) => ({
          codigo: f.codigo,
          valor: f.valor,
          valor_recebido: f.valorRecebido ?? f.valor,
        })),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao finalizar venda:', error);
      throw error;
    }
  },

    // ✅ NOVO — emite a NFC-e
  emitirNfce: async (venda, tipoOperacao = 'FACILIT', cpfNfce = '') => {
    try {
      const response = await api.post('/app/nfceEmitir', {
        empresa: getEmpresa(),
        venda,
        tipo_operacao: tipoOperacao,
        cpf_nfce: cpfNfce || '',       // ✅ NOVO — CPF avulso (só dígitos)
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao emitir NFC-e:', error);
      throw error;
    }
  },

  // ✅ NOVO — fecha venda + emite NFC-e em sequência
  finalizarEEmitir: async (params) => {
    const resultadoVenda = await pagamentoService.finalizarVenda(params);
    if (!resultadoVenda?.sucesso) {
      throw new Error(resultadoVenda?.erro || 'Falha ao finalizar venda');
    }

    // ✅ Propaga — se NFC-e falha, o atendente vê o erro
    const nfce = await pagamentoService.emitirNfce(
      params.venda,
      params.origem ?? 'FACILIT',
      params.cpf_nfce || ''
    );
    return { venda: resultadoVenda, nfce };
  },

  // ✅ Consulta status da SEFAZ
  statusSefaz: async () => {
    try {
      const response = await api.post('/app/nfceStatusSefaz', {
        empresa: getEmpresa(),
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao consultar status SEFAZ:', error);
      return { sucesso: false, online: false, mensagem: error.message };
    }
  },

  // ✅ Reprocessa contingências manualmente
  reprocessarContingencia: async (limite = 20) => {
    try {
      const response = await api.post('/app/nfceReprocessarContingencia', {
        empresa: getEmpresa(),
        limite,
      });
      return response.data;
    } catch (error) {
      console.error('Erro ao reprocessar contingência:', error);
      throw error;
    }
  },
};