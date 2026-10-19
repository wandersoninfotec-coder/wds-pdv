// src/services/authService.js
import api from './api';
import { API_CONFIG } from '../config';
import { sessionService } from './sessionService';

export const authService = {
  login: async (usuario, senha, empresa = 1) => {
    try {
      const response = await api.post(API_CONFIG.endpoints.login, {
        usuario,
        senha,
        empresa,
      });

      const { sucesso, token, usuario: userData } = response.data;

      if (sucesso && token) {
        await sessionService.salvarSessao(token, userData);
        return { success: true, token, user: userData };
      }

      return { success: false, error: 'Resposta inválida do servidor' };
    } catch (error) {
      let mensagem = 'Erro ao fazer login';
      if (error.response?.data?.erro) mensagem = error.response.data.erro;
      else if (error.message) mensagem = error.message;
      return { success: false, error: mensagem };
    }
  },

  logout: async () => {
    await sessionService.limparSessao();
  },

  getCurrentUser: async () => {
    const sessao = await sessionService.carregarSessao();
    return sessao ? sessao.user : null;
  },
};