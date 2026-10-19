// src/services/api.js
import axios from 'axios';
import { sessionService } from './sessionService';

const api = axios.create({
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Interceptor de request: aplica baseURL + token
api.interceptors.request.use(
  async (config) => {
    try {
      const configJson = localStorage.getItem('@app:config');
      if (configJson) {
        const cfg = JSON.parse(configJson);
        if (cfg.baseURL) config.baseURL = cfg.baseURL;
      }
    } catch (e) {}

    try {
      const token = localStorage.getItem('@app:token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch (e) {}

    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor de response
api.interceptors.response.use(
  (response) => {
    // Renova sessão se faltar < 3 dias
    sessionService
      .carregarSessao()
      .then((sessao) => {
        if (sessao && sessao.faltaMs < 3 * 24 * 60 * 60 * 1000) {
          sessionService.renovarSessao().catch(() => {});
        }
      })
      .catch(() => {});

    // Limpa HTML de erros do PHP
    if (typeof response.data === 'string') {
      const limpo = response.data
        .replace(/<br\s*\/?>/gi, '')
        .replace(/<b>.*?<\/b>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/Notice:.*?\n/gi, '')
        .replace(/Warning:.*?\n/gi, '')
        .trim();

      if (/^\d+$/.test(limpo)) {
        response.data = parseInt(limpo);
      } else {
        try {
          response.data = JSON.parse(limpo);
        } catch {
          response.data = limpo;
        }
      }
    }
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      console.log('🔴 Token inválido. Limpando sessão...');
      await sessionService.limparSessao();
    }
    return Promise.reject(error);
  }
);

export default api;