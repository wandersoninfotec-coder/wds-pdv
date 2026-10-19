// src/services/clienteService.js
import api from './api';
import { getEmpresa } from '../config';

export const clienteService = {
  listar: async (texto = '') => {
    try {
      const response = await api.post('/app/clientesListar', {
        empresa: getEmpresa(),
        texto: texto.trim(),
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao listar clientes:', error);
      throw error;
    }
  },

  cadastrar: async (cliente) => {
    try {
      const response = await api.post('/app/clienteCadastrar', {
        empresa: getEmpresa(),
        ...cliente,
      });
      return response.data;
    } catch (error) {
      const msg =
        error.response?.data?.erro || error.message || 'Erro ao cadastrar';
      const err = new Error(msg);
      err.clienteExistente = error.response?.data?.cliente_existente;
      throw err;
    }
  },

  // ✅ Busca municípios por nome (autocomplete)
  buscarMunicipios: async (texto, uf = '') => {
    try {
      const response = await api.post('/app/municipiosBuscar', {
        texto: texto.trim(),
        uf: uf.trim(),
      });
      return Array.isArray(response.data) ? response.data : [];
    } catch (error) {
      console.error('Erro ao buscar municípios:', error);
      return [];
    }
  },

  // ✅ Busca CEP via ViaCEP (API pública e gratuita)
  buscarCep: async (cep) => {
    const numeros = String(cep).replace(/\D/g, '');
    if (numeros.length !== 8) return null;

    try {
      const response = await fetch(`https://viacep.com.br/ws/${numeros}/json/`);
      if (!response.ok) return null;

      const data = await response.json();
      if (data.erro) return null;

      return {
        cep: data.cep,
        logradouro: data.logradouro,
        complemento: data.complemento,
        bairro: data.bairro,
        localidade: data.localidade,
        uf: data.uf,
        ibge: data.ibge,
      };
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      return null;
    }
  },

  getConsumidorFinal: () => ({
    codigo: 1,
    razao: 'CONSUMIDOR FINAL',
    fantasia: 'Consumidor Final',
    cpf: '',
    tipo: 1,
    tipo_label: 'Física',
  }),
};